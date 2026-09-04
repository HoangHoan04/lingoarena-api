import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import {
  createdEntityId,
  excelExportTake,
  optionalNumber,
  optionalText,
  requireText,
  runBulkImport,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { GrammarStructureEntity, GrammarTopicEntity } from '~/entities';
import { GrammarStructureRepo, GrammarTopicRepo, UserMasteryRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateGrammarExampleDto,
  CreateGrammarStructureDto,
  CreateGrammarTopicDto,
  FilterGrammarStructureDto,
  FilterGrammarTopicDto,
  GrammarExampleJsonDto,
  UpdateGrammarExampleDto,
  UpdateGrammarMasteryDto,
  UpdateGrammarStructureDto,
  UpdateGrammarTopicDto,
} from '../dto';

type ExampleRow = {
  id: string;
  sentence: string;
  translation: string;
  explanation?: string;
  isNegativeExample: boolean;
  sortOrder: number;
};

@Injectable()
export class GrammarService {
  constructor(
    private readonly grammarTopicRepo: GrammarTopicRepo,
    private readonly grammarStructureRepo: GrammarStructureRepo,
    private readonly userMasteryRepo: UserMasteryRepo,
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

  private normalizeExamples(
    raw?: Record<string, unknown>[] | GrammarExampleJsonDto[] | null,
  ): ExampleRow[] {
    return (raw || [])
      .map((item, index) => {
        const row = item as GrammarExampleJsonDto & { id?: string };
        return {
          id: row.id || uuidv4(),
          sentence: String(row.sentence || '').trim(),
          translation: String(row.translation || '').trim(),
          explanation: row.explanation ? String(row.explanation) : undefined,
          isNegativeExample: Boolean(row.isNegativeExample),
          sortOrder: Number(row.sortOrder ?? index),
        };
      })
      .filter(item => item.sentence && item.translation);
  }

  private toExampleViews(
    structureId: string,
    examples?: Record<string, unknown>[] | ExampleRow[] | null,
  ) {
    return this.normalizeExamples(examples as GrammarExampleJsonDto[]).map(item => ({
      ...item,
      grammarStructureId: structureId,
      isDeleted: false,
    }));
  }

  private withExamples<T extends GrammarStructureEntity>(item: T) {
    return {
      ...item,
      examples: this.toExampleViews(item.id as string, item.examplesJson),
    };
  }

  private toSelectBox(rows: GrammarTopicEntity[]) {
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.title,
      label: item.parent ? `${item.parent.title} · ${item.title}` : item.title,
      slug: item.slug,
      cefrLevel: item.cefrLevel,
    }));
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const exist = await this.grammarTopicRepo.findOne({ where: { slug, isDeleted: false } });
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
    const [data, total] = await this.grammarTopicRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { parent: true, structures: true },
    });
    const transformed = (transformKeys(data) as any[]).map(topic => ({
      ...topic,
      structures: (topic.structures || [])
        .filter((s: any) => !s.isDeleted)
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }));
    return { data: transformed, total };
  }

  async findTopic(id: string) {
    const item = await this.grammarTopicRepo.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async findTopicBySlug(slug: string) {
    const item = await this.grammarTopicRepo.findOne({
      where: { slug, isDeleted: false },
      relations: { parent: true, structures: true },
      order: { structures: { sortOrder: 'ASC' } },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    const data = transformKeys(item) as any;
    data.structures = (data.structures || [])
      .filter((structure: any) => !structure.isDeleted)
      .map((structure: any) => ({
        ...structure,
        examples: this.toExampleViews(structure.id, structure.examplesJson),
      }));
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  @DefTransaction()
  async createTopic(dto: CreateGrammarTopicDto, user: UserDto) {
    await this.assertUniqueSlug(dto.slug.trim());
    const item = await this.grammarTopicRepo.save(
      this.grammarTopicRepo.create({
        id: uuidv4(),
        parentId: dto.parentId,
        title: dto.title.trim(),
        titleEn: dto.titleEn?.trim() || dto.title.trim(),
        slug: dto.slug.trim(),
        cefrLevel: dto.cefrLevel || enumData.CEFR_LEVEL.A2.code,
        description: dto.description,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'GrammarTopicEntity',
      item.id,
      `Tạo chủ đề ngữ pháp: ${item.title}`,
    );
    return this.findTopic(item.id);
  }

  @DefTransaction()
  async updateTopic(id: string, dto: UpdateGrammarTopicDto, user: UserDto) {
    const item = await this.grammarTopicRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    if (dto.slug) await this.assertUniqueSlug(dto.slug.trim(), id);
    Object.assign(item, {
      parentId: dto.parentId,
      title: dto.title.trim(),
      titleEn: dto.titleEn?.trim() || dto.title.trim(),
      slug: dto.slug.trim(),
      cefrLevel: dto.cefrLevel || item.cefrLevel,
      description: dto.description,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.grammarTopicRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'GrammarTopicEntity',
      id,
      `Cập nhật chủ đề ngữ pháp: ${item.title}`,
    );
    return this.findTopic(id);
  }

  @DefTransaction()
  async deactivateTopic(id: string, user: UserDto) {
    const item = await this.grammarTopicRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.grammarTopicRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'GrammarTopicEntity',
      id,
      `Ngưng chủ đề ngữ pháp: ${item.title}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateTopic(id: string, user: UserDto) {
    const item = await this.grammarTopicRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.grammarTopicRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'GrammarTopicEntity',
      id,
      `Kích hoạt chủ đề ngữ pháp: ${item.title}`,
    );
    return this.findTopic(id);
  }

  async paginationStructures(body: PaginationDto<FilterGrammarStructureDto>, _publicOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterGrammarStructureDto } = body;
    const whereCon: FindOptionsWhere<GrammarStructureEntity> = {
      isDeleted: where.isDeleted ?? false,
    };
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    if (where.grammarTopicId) whereCon.grammarTopicId = where.grammarTopicId;
    const [rows, total] = await this.grammarStructureRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { grammarTopic: true },
    });
    return { data: transformKeys(rows.map(item => this.withExamples(item))), total };
  }

  async findStructure(id: string, onlyActive = false) {
    const item = await this.grammarStructureRepo.findOne({
      where: {
        id,
        ...(onlyActive ? { isDeleted: false } : {}),
      },
      relations: { grammarTopic: true },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys(this.withExamples(item)),
    };
  }

  @DefTransaction()
  async createStructure(dto: CreateGrammarStructureDto, user: UserDto) {
    const topic = await this.grammarTopicRepo.findOne({
      where: { id: dto.grammarTopicId, isDeleted: false },
    });
    if (!topic)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    const item = await this.grammarStructureRepo.save(
      this.grammarStructureRepo.create({
        id: uuidv4(),
        grammarTopicId: dto.grammarTopicId,
        title: dto.title.trim(),
        titleEn: dto.titleEn?.trim() || dto.title.trim(),
        formula: dto.formula,
        meaningVi: dto.meaningVi,
        meaningEn: dto.meaningEn,
        usageContent: dto.usageContent,
        commonMistakes: dto.commonMistakes,
        examplesJson: this.normalizeExamples(dto.examplesJson),
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'GrammarStructureEntity',
      item.id,
      `Tạo cấu trúc ngữ pháp: ${item.title}`,
    );
    return this.findStructure(item.id);
  }

  @DefTransaction()
  async updateStructure(id: string, dto: UpdateGrammarStructureDto, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    const topic = await this.grammarTopicRepo.findOne({
      where: { id: dto.grammarTopicId, isDeleted: false },
    });
    if (!topic)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_topic'));
    Object.assign(item, {
      grammarTopicId: dto.grammarTopicId,
      title: dto.title.trim(),
      titleEn: dto.titleEn?.trim() || dto.title.trim(),
      formula: dto.formula,
      meaningVi: dto.meaningVi,
      meaningEn: dto.meaningEn,
      usageContent: dto.usageContent,
      commonMistakes: dto.commonMistakes,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    if (dto.examplesJson) item.examplesJson = this.normalizeExamples(dto.examplesJson);
    await this.grammarStructureRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'GrammarStructureEntity',
      id,
      `Cập nhật cấu trúc ngữ pháp: ${item.title}`,
    );
    return this.findStructure(id);
  }

  @DefTransaction()
  async deactivateStructure(id: string, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.grammarStructureRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'GrammarStructureEntity',
      id,
      `Ngưng cấu trúc ngữ pháp: ${item.title}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateStructure(id: string, user: UserDto) {
    const item = await this.grammarStructureRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.grammarStructureRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'GrammarStructureEntity',
      id,
      `Kích hoạt cấu trúc ngữ pháp: ${item.title}`,
    );
    return this.findStructure(id);
  }

  private async findStructureByExampleId(exampleId: string, structureId?: string) {
    if (structureId) {
      const item = await this.grammarStructureRepo.findOne({
        where: { id: structureId, isDeleted: false },
      });
      if (!item)
        throw new NotFoundException(
          this.i18n.commonTranslate('entity_not_found.grammar_structure'),
        );
      return item;
    }
    const item = await this.grammarStructureRepo
      .createQueryBuilder('structure')
      .where('structure.isDeleted = false')
      .andWhere(`structure."examplesJson" @> :payload::jsonb`, {
        payload: JSON.stringify([{ id: exampleId }]),
      })
      .getOne();
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    return item;
  }

  @DefTransaction()
  async createExample(dto: CreateGrammarExampleDto, user: UserDto) {
    const structure = await this.grammarStructureRepo.findOne({
      where: { id: dto.grammarStructureId, isDeleted: false },
    });
    if (!structure) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    }
    const examples = this.normalizeExamples(structure.examplesJson);
    const example: ExampleRow = {
      id: uuidv4(),
      sentence: dto.sentence,
      translation: dto.translation,
      explanation: dto.explanation,
      isNegativeExample: dto.isNegativeExample ?? false,
      sortOrder: dto.sortOrder ?? examples.length,
    };
    examples.push(example);
    structure.examplesJson = examples;
    structure.updatedBy = user.id;
    await this.grammarStructureRepo.save(structure);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'GrammarStructureEntity',
      structure.id,
      `Tạo ví dụ ngữ pháp: ${example.sentence}`,
    );
    return this.findExample(example.id, structure.id);
  }

  async findExample(id: string, structureId?: string) {
    const structure = await this.findStructureByExampleId(id, structureId);
    const example = this.toExampleViews(structure.id as string, structure.examplesJson).find(
      item => item.id === id,
    );
    if (!example)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(example) };
  }

  @DefTransaction()
  async updateExample(id: string, dto: UpdateGrammarExampleDto, user: UserDto) {
    const structure = await this.findStructureByExampleId(id, dto.grammarStructureId);
    const examples = this.normalizeExamples(structure.examplesJson);
    const index = examples.findIndex(item => item.id === id);
    if (index < 0)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    examples[index] = {
      id,
      sentence: dto.sentence,
      translation: dto.translation,
      explanation: dto.explanation,
      isNegativeExample: dto.isNegativeExample ?? examples[index].isNegativeExample,
      sortOrder: dto.sortOrder ?? examples[index].sortOrder,
    };
    structure.examplesJson = examples;
    structure.updatedBy = user.id;
    await this.grammarStructureRepo.save(structure);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'GrammarStructureEntity',
      structure.id,
      `Cập nhật ví dụ ngữ pháp: ${dto.sentence}`,
    );
    return this.findExample(id, structure.id);
  }

  @DefTransaction()
  async deactivateExample(id: string, user: UserDto) {
    const structure = await this.findStructureByExampleId(id);
    const examples = this.normalizeExamples(structure.examplesJson);
    const next = examples.filter(item => item.id !== id);
    if (next.length === examples.length) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_example'));
    }
    structure.examplesJson = next;
    structure.updatedBy = user.id;
    await this.grammarStructureRepo.save(structure);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'GrammarStructureEntity',
      structure.id,
      `Ngưng ví dụ ngữ pháp: ${id}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async updateMastery(userId: string, dto: UpdateGrammarMasteryDto) {
    const structure = await this.grammarStructureRepo.findOne({
      where: {
        id: dto.grammarStructureId,
        isDeleted: false,
      },
    });
    if (!structure) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grammar_structure'));
    }
    const now = new Date();
    const targetType = enumData.MASTERY_ENTITY_TYPE.GRAMMAR.code;
    let mastery = await this.userMasteryRepo.findOne({
      where: { userId, targetType, targetId: dto.grammarStructureId, isDeleted: false },
    });
    if (!mastery) {
      mastery = this.userMasteryRepo.create({
        id: uuidv4(),
        userId,
        targetType,
        targetId: dto.grammarStructureId,
        masteryScore: 0,
        practiceCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        createdBy: userId,
      });
    }
    const currentScore = Number(mastery.masteryScore || 0);
    mastery.masteryScore = dto.isCorrect
      ? Math.min(100, currentScore + 10)
      : Math.max(0, currentScore - 5);
    mastery.practiceCount = (mastery.practiceCount || 0) + 1;
    mastery.correctCount = (mastery.correctCount || 0) + (dto.isCorrect ? 1 : 0);
    mastery.incorrectCount = (mastery.incorrectCount || 0) + (dto.isCorrect ? 0 : 1);
    mastery.lastPracticedAt = now;
    mastery.nextReviewAt = new Date(now.getTime() + (dto.isCorrect ? 3 : 1) * 24 * 60 * 60 * 1000);
    mastery.updatedBy = userId;
    await this.userMasteryRepo.save(mastery);
    return { message: this.i18n.commonTranslate('update_success'), data: transformKeys(mastery) };
  }

  async importTopics(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const title = requireText(item.title, 'Tiêu đề');
      const slug =
        optionalText(item.slug) ||
        title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      const created = await this.createTopic(
        {
          title,
          titleEn: optionalText(item.titleEn),
          slug,
          cefrLevel: optionalText(item.cefrLevel),
          description: optionalText(item.description),
          sortOrder: optionalNumber(item.sortOrder, 0),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportTopics(body: PaginationDto<FilterGrammarTopicDto>) {
    const { data } = await this.paginationTopics({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importStructures(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const topicSlug = requireText(item.grammarTopicSlug, 'Slug chủ đề ngữ pháp');
      const topic = await this.grammarTopicRepo.findOne({
        where: { slug: topicSlug, isDeleted: false },
      });
      if (!topic) throw new NotFoundException(`Không tìm thấy chủ đề ngữ pháp slug ${topicSlug}`);
      const created = await this.createStructure(
        {
          grammarTopicId: topic.id,
          title: requireText(item.title, 'Tiêu đề'),
          titleEn: optionalText(item.titleEn),
          formula: requireText(item.formula, 'Công thức'),
          meaningVi: requireText(item.meaningVi, 'Nghĩa tiếng Việt'),
          meaningEn: optionalText(item.meaningEn),
          usageContent: optionalText(item.usageContent),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportStructures(body: PaginationDto<FilterGrammarStructureDto>) {
    const { data } = await this.paginationStructures({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
