import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import { GrammarExampleEntity, GrammarStructureEntity, GrammarTopicEntity } from '~/entities';
import {
  GrammarExampleRepo,
  GrammarStructureRepo,
  GrammarTopicRepo,
  UserGrammarMasteryRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateGrammarExampleDto,
  CreateGrammarStructureDto,
  CreateGrammarTopicDto,
  FilterGrammarStructureDto,
  FilterGrammarTopicDto,
  UpdateGrammarExampleDto,
  UpdateGrammarMasteryDto,
  UpdateGrammarStructureDto,
  UpdateGrammarTopicDto,
} from '../dto';

@Injectable()
export class GrammarService {
  constructor(
    private readonly grammarTopicRepo: GrammarTopicRepo,
    private readonly grammarStructureRepo: GrammarStructureRepo,
    private readonly grammarExampleRepo: GrammarExampleRepo,
    private readonly userGrammarMasteryRepo: UserGrammarMasteryRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private async writeLog(
    user: UserDto,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    dataAfter: Record<string, unknown> = {},
  ) {
    await this.actionLogService.create({
      entityId,
      entityType,
      actionType,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: this.actorName(user),
      description,
      dataBefore: '{}',
      dataAfter: JSON.stringify(dataAfter),
    });
  }

  private toSelectBox(rows: GrammarTopicEntity[]) {
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.title,
      label: item.parent ? `${item.parent.title} · ${item.title}` : item.title,
      slug: item.slug,
      cefrLevel: item.cefrLevel,
      canonicalTopicId: item.canonicalTopicId,
    }));
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const exist = await this.grammarTopicRepo.findOne({ where: { slug } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  async selectBoxTopics() {
    const rows = await this.grammarTopicRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: 'ASC', title: 'ASC' },
      relations: { parent: true },
    });
    return this.toSelectBox(rows);
  }

  async paginationTopics(body: PaginationDto<FilterGrammarTopicDto>) {
    const { skip = 0, take = 20, where = {} as FilterGrammarTopicDto } = body;
    const whereCon: FindOptionsWhere<GrammarTopicEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    if (where.parentId) whereCon.parentId = where.parentId;
    if (where.cefrLevel) whereCon.cefrLevel = where.cefrLevel;
    if (where.canonicalTopicId) whereCon.canonicalTopicId = where.canonicalTopicId;
    const [data, total] = await this.grammarTopicRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { parent: true, canonicalTopic: true },
    });
    return { data: transformKeys(data), total };
  }

  async findTopic(id: string) {
    const item = await this.grammarTopicRepo.findOne({
      where: { id },
      relations: { parent: true, canonicalTopic: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async findTopicBySlug(slug: string) {
    const item = await this.grammarTopicRepo.findOne({
      where: { slug, isDeleted: false },
      relations: {
        parent: true,
        canonicalTopic: true,
        structures: { examples: true },
      },
      order: { structures: { createdAt: 'DESC' } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    const data = transformKeys(item) as any;
    data.structures = (data.structures || [])
      .filter((structure: any) => !structure.isDeleted && structure.status === enumData.CONTENT_REVIEW_STATUS.APPROVED.code)
      .map((structure: any) => ({
        ...structure,
        examples: (structure.examples || []).filter((example: any) => !example.isDeleted),
      }));
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async createTopic(dto: CreateGrammarTopicDto, user: UserDto) {
    await this.assertUniqueSlug(dto.slug.trim());
    const item = await this.grammarTopicRepo.save(
      this.grammarTopicRepo.create({
        id: uuidv4(),
        parentId: dto.parentId,
        title: dto.title.trim(),
        slug: dto.slug.trim(),
        cefrLevel: dto.cefrLevel || enumData.CEFR_LEVEL.A2.code,
        description: dto.description,
        sortOrder: dto.sortOrder || 0,
        canonicalTopicId: dto.canonicalTopicId,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'GrammarTopicEntity', item.id, `Tạo chủ đề ngữ pháp: ${item.title}`);
    return this.findTopic(item.id);
  }

  async updateTopic(id: string, dto: UpdateGrammarTopicDto, user: UserDto) {
    const item = await this.grammarTopicRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    if (dto.slug) await this.assertUniqueSlug(dto.slug.trim(), id);
    Object.assign(item, {
      parentId: dto.parentId,
      title: dto.title.trim(),
      slug: dto.slug.trim(),
      cefrLevel: dto.cefrLevel || item.cefrLevel,
      description: dto.description,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      canonicalTopicId: dto.canonicalTopicId,
      updatedBy: user.id,
    });
    await this.grammarTopicRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'GrammarTopicEntity', id, `Cập nhật chủ đề ngữ pháp: ${item.title}`);
    return this.findTopic(id);
  }

  async deactivateTopic(id: string, user: UserDto) {
    const item = await this.grammarTopicRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.grammarTopicRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'GrammarTopicEntity', id, `Ngưng chủ đề ngữ pháp: ${item.title}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateTopic(id: string, user: UserDto) {
    const item = await this.grammarTopicRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.grammarTopicRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'GrammarTopicEntity', id, `Kích hoạt chủ đề ngữ pháp: ${item.title}`);
    return this.findTopic(id);
  }

  async paginationStructures(body: PaginationDto<FilterGrammarStructureDto>, publicOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterGrammarStructureDto } = body;
    const whereCon: FindOptionsWhere<GrammarStructureEntity> = {
      isDeleted: where.isDeleted ?? false,
      ...(publicOnly ? { status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code } : {}),
    };
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    if (where.grammarTopicId) whereCon.grammarTopicId = where.grammarTopicId;
    if (!publicOnly && where.status) whereCon.status = where.status;
    const [data, total] = await this.grammarStructureRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { grammarTopic: true, examples: true },
    });
    return { data: transformKeys(data), total };
  }

  async findStructure(id: string, approvedOnly = false) {
    const item = await this.grammarStructureRepo.findOne({
      where: { id, ...(approvedOnly ? { isDeleted: false, status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code } : {}) },
      relations: { grammarTopic: true, examples: true },
      order: { examples: { sortOrder: 'ASC', createdAt: 'ASC' } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createStructure(dto: CreateGrammarStructureDto, user: UserDto) {
    const topic = await this.grammarTopicRepo.findOne({ where: { id: dto.grammarTopicId, isDeleted: false } });
    if (!topic) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    const item = await this.grammarStructureRepo.save(
      this.grammarStructureRepo.create({
        id: uuidv4(),
        grammarTopicId: dto.grammarTopicId,
        title: dto.title.trim(),
        formula: dto.formula,
        meaningVi: dto.meaningVi,
        usageContent: dto.usageContent,
        commonMistakes: dto.commonMistakes,
        status: dto.status || enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'GrammarStructureEntity', item.id, `Tạo cấu trúc ngữ pháp: ${item.title}`);
    return this.findStructure(item.id);
  }

  async updateStructure(id: string, dto: UpdateGrammarStructureDto, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    const topic = await this.grammarTopicRepo.findOne({ where: { id: dto.grammarTopicId, isDeleted: false } });
    if (!topic) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    Object.assign(item, {
      grammarTopicId: dto.grammarTopicId,
      title: dto.title.trim(),
      formula: dto.formula,
      meaningVi: dto.meaningVi,
      usageContent: dto.usageContent,
      commonMistakes: dto.commonMistakes,
      status: dto.status || item.status,
      updatedBy: user.id,
    });
    await this.grammarStructureRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'GrammarStructureEntity', id, `Cập nhật cấu trúc ngữ pháp: ${item.title}`);
    return this.findStructure(id);
  }

  async setStructureStatus(id: string, status: string, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    if (
      status === enumData.CONTENT_REVIEW_STATUS.SUBMITTED.code &&
      !([enumData.CONTENT_REVIEW_STATUS.DRAFT.code, enumData.CONTENT_REVIEW_STATUS.CHANGES_REQUESTED.code] as string[]).includes(item.status)
    ) {
      throw new BadRequestException('Chỉ nội dung nháp hoặc cần chỉnh sửa mới được nộp duyệt');
    }
    item.status = status;
    item.updatedBy = user.id;
    await this.grammarStructureRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'GrammarStructureEntity', id, `Đổi trạng thái cấu trúc ngữ pháp: ${status}`);
    return this.findStructure(id);
  }

  async deactivateStructure(id: string, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.grammarStructureRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'GrammarStructureEntity', id, `Ngưng cấu trúc ngữ pháp: ${item.title}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateStructure(id: string, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.grammarStructureRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'GrammarStructureEntity', id, `Kích hoạt cấu trúc ngữ pháp: ${item.title}`);
    return this.findStructure(id);
  }

  async createExample(dto: CreateGrammarExampleDto, user: UserDto) {
    const structure = await this.grammarStructureRepo.findOne({ where: { id: dto.grammarStructureId, isDeleted: false } });
    if (!structure) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    const item = await this.grammarExampleRepo.save(
      this.grammarExampleRepo.create({
        id: uuidv4(),
        grammarStructureId: dto.grammarStructureId,
        sentence: dto.sentence,
        translation: dto.translation,
        explanation: dto.explanation,
        isNegativeExample: dto.isNegativeExample ?? false,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'GrammarExampleEntity', item.id, `Tạo ví dụ ngữ pháp: ${item.sentence}`);
    return this.findExample(item.id);
  }

  async findExample(id: string) {
    const item = await this.grammarExampleRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async updateExample(id: string, dto: UpdateGrammarExampleDto, user: UserDto) {
    const item = await this.grammarExampleRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    const structure = await this.grammarStructureRepo.findOne({ where: { id: dto.grammarStructureId, isDeleted: false } });
    if (!structure) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    Object.assign(item, {
      grammarStructureId: dto.grammarStructureId,
      sentence: dto.sentence,
      translation: dto.translation,
      explanation: dto.explanation,
      isNegativeExample: dto.isNegativeExample ?? item.isNegativeExample,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.grammarExampleRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'GrammarExampleEntity', id, `Cập nhật ví dụ ngữ pháp: ${item.sentence}`);
    return this.findExample(id);
  }

  async deactivateExample(id: string, user: UserDto) {
    const item = await this.grammarExampleRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.grammarExampleRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'GrammarExampleEntity', id, `Ngưng ví dụ ngữ pháp: ${item.sentence}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async updateMastery(userId: string, dto: UpdateGrammarMasteryDto) {
    const structure = await this.grammarStructureRepo.findOne({
      where: {
        id: dto.grammarStructureId,
        isDeleted: false,
        status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
      },
    });
    if (!structure) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    const now = new Date();
    let mastery = await this.userGrammarMasteryRepo.findOne({
      where: { userId, grammarStructureId: dto.grammarStructureId },
    });
    if (!mastery) {
      mastery = this.userGrammarMasteryRepo.create({
        id: uuidv4(),
        userId,
        grammarStructureId: dto.grammarStructureId,
        masteryScore: 0,
        correctCount: 0,
        incorrectCount: 0,
      });
    }
    const currentScore = Number(mastery.masteryScore || 0);
    mastery.masteryScore = dto.isCorrect
      ? Math.min(100, currentScore + 10)
      : Math.max(0, currentScore - 5);
    mastery.correctCount = (mastery.correctCount || 0) + (dto.isCorrect ? 1 : 0);
    mastery.incorrectCount = (mastery.incorrectCount || 0) + (dto.isCorrect ? 0 : 1);
    mastery.lastPracticedAt = now;
    mastery.nextReviewAt = new Date(now.getTime() + (dto.isCorrect ? 3 : 1) * 24 * 60 * 60 * 1000);
    await this.userGrammarMasteryRepo.save(mastery);
    return { message: this.i18n.commonTranslate('update_success'), data: transformKeys(mastery) };
  }
}
