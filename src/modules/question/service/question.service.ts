import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import {
  ContentReviewRepo,
  ExamSectionRepo,
  ExamSkillRepo,
  ExamTypeRepo,
  QuestionGroupRepo,
  QuestionOptionRepo,
  QuestionRepo,
  QuestionTagRepo,
  QuestionTopicRepo,
  QuestionTypeRepo,
  QuestionVersionRepo,
  TagRepo,
  TopicRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateQuestionDto,
  CreateQuestionGroupDto,
  CreateQuestionTypeDto,
  CreateTagDto,
  CreateTopicDto,
  FilterQuestionDto,
  FilterQuestionGroupDto,
  FilterQuestionTypeDto,
  FilterTagDto,
  FilterTopicDto,
  GradePracticeDto,
  ReviewQuestionDto,
  StartPracticeDto,
  UpdateQuestionDto,
  UpdateQuestionGroupDto,
  UpdateQuestionTypeDto,
  UpdateTagDto,
  UpdateTopicDto,
} from '../dto';
import {
  AUTO_GRADE_TYPES,
  buildQuestionPayload,
  defaultAnswerSchema,
  deriveCorrectAnswer,
  gradeAnswer,
} from '../helpers';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionTypeRepo: QuestionTypeRepo,
    private readonly questionGroupRepo: QuestionGroupRepo,
    private readonly questionRepo: QuestionRepo,
    private readonly questionVersionRepo: QuestionVersionRepo,
    private readonly questionOptionRepo: QuestionOptionRepo,
    private readonly topicRepo: TopicRepo,
    private readonly questionTopicRepo: QuestionTopicRepo,
    private readonly tagRepo: TagRepo,
    private readonly questionTagRepo: QuestionTagRepo,
    private readonly contentReviewRepo: ContentReviewRepo,
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly examSkillRepo: ExamSkillRepo,
    private readonly examSectionRepo: ExamSectionRepo,
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

  private toSelectBox(rows: Array<{ id?: string; name?: string; code?: string; label?: string }>) {
    return rows.map(item => ({
      id: item.id,
      label: item.label || item.name,
      value: item.id,
      name: item.name,
      code: item.code,
    }));
  }

  private questionRelations() {
    return {
      examType: true,
      examSkill: true,
      examSection: true,
      questionType: true,
      questionGroup: { audioAsset: true, imageAsset: true },
      currentVersion: { options: true, audioAsset: true, imageAsset: true },
      questionTopics: { topic: true },
      questionTags: { tag: true },
      versions: true,
    } as const;
  }

  private async assertUniqueCode(repo: { findOne: Function }, code: string, excludeId?: string) {
    const exist = await repo.findOne({ where: { code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  private mergeContentJson(
    contentJson?: Record<string, unknown>,
    imageUrl?: string,
    audioUrl?: string,
  ) {
    const next = { ...(contentJson || {}) };
    if (imageUrl !== undefined) next.imageUrl = imageUrl;
    if (audioUrl !== undefined) next.audioUrl = audioUrl;
    return Object.keys(next).length ? next : undefined;
  }

  async selectBoxExamTypes() {
    const rows = await this.examTypeRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return this.toSelectBox(rows);
  }

  async selectBoxSkills(examTypeId?: string) {
    const rows = await this.examSkillRepo.find({
      where: { isDeleted: false, ...(examTypeId ? { examTypeId } : {}) },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: { examType: true },
    });
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.name,
      code: item.code,
      examTypeId: item.examTypeId,
      label: item.examType ? `${item.examType.code} · ${item.name}` : item.name,
    }));
  }

  async selectBoxSections(examSkillId?: string) {
    const rows = await this.examSectionRepo.find({
      where: { isDeleted: false, ...(examSkillId ? { examSkillId } : {}) },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: { examSkill: true },
    });
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.name,
      code: item.code,
      examSkillId: item.examSkillId,
      label: item.examSkill ? `${item.examSkill.name} · ${item.name}` : item.name,
    }));
  }

  async selectBoxQuestionTypes() {
    const rows = await this.questionTypeRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
    return this.toSelectBox(rows);
  }

  async selectBoxTopics() {
    const rows = await this.topicRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return this.toSelectBox(rows);
  }

  async selectBoxTags() {
    const rows = await this.tagRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
    return this.toSelectBox(rows);
  }

  async selectBoxGroups(keyword?: string) {
    const qb = this.questionGroupRepo
      .createQueryBuilder('grp')
      .where('grp.isDeleted = false')
      .orderBy('grp.createdAt', 'DESC')
      .take(50);
    if (keyword) qb.andWhere('LOWER(grp.title) LIKE :kw', { kw: `%${keyword.trim().toLowerCase()}%` });
    const rows = await qb.getMany();
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.title || item.id,
      label: item.title || 'Nhóm không tiêu đề',
    }));
  }

  async paginationTypes(body: PaginationDto<FilterQuestionTypeDto>) {
    const { skip = 0, take = 20, where = {} as FilterQuestionTypeDto } = body;
    const whereCon: FindOptionsWhere<any> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.questionTypeRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findType(id: string) {
    const item = await this.questionTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_type'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createType(dto: CreateQuestionTypeDto, user: UserDto) {
    await this.assertUniqueCode(this.questionTypeRepo, dto.code.trim());
    const item = await this.questionTypeRepo.save(
      this.questionTypeRepo.create({
        id: uuidv4(),
        code: dto.code.trim(),
        name: dto.name.trim(),
        answerSchema: dto.answerSchema || defaultAnswerSchema(dto.code.trim()),
        gradingStrategy: dto.gradingStrategy || enumData.GRADING_STRATEGY.EXACT_MATCH.code,
        supportsAutoGrading: dto.supportsAutoGrading ?? true,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'QuestionTypeEntity', item.id, `Tạo loại câu: ${item.name}`);
    return this.findType(item.id);
  }

  async updateType(id: string, dto: UpdateQuestionTypeDto, user: UserDto) {
    const item = await this.questionTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_type'));
    if (dto.code) await this.assertUniqueCode(this.questionTypeRepo, dto.code.trim(), id);
    Object.assign(item, {
      code: dto.code.trim(),
      name: dto.name.trim(),
      answerSchema: dto.answerSchema || item.answerSchema,
      gradingStrategy: dto.gradingStrategy || item.gradingStrategy,
      supportsAutoGrading: dto.supportsAutoGrading ?? item.supportsAutoGrading,
      updatedBy: user.id,
    });
    await this.questionTypeRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'QuestionTypeEntity', item.id, `Cập nhật loại câu: ${item.name}`);
    return this.findType(id);
  }

  async deactivateType(id: string, user: UserDto) {
    const item = await this.questionTypeRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_type'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.questionTypeRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'QuestionTypeEntity', id, `Ngưng loại câu: ${item.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateType(id: string, user: UserDto) {
    const item = await this.questionTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_type'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.questionTypeRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'QuestionTypeEntity', id, `Kích hoạt loại câu: ${item.name}`);
    return this.findType(id);
  }

  async paginationTopics(body: PaginationDto<FilterTopicDto>) {
    const { skip = 0, take = 20, where = {} as FilterTopicDto } = body;
    const whereCon: FindOptionsWhere<any> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.examTypeId) whereCon.examTypeId = where.examTypeId;
    const [data, total] = await this.topicRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { examType: true, parent: true },
    });
    return { data: transformKeys(data), total };
  }

  async findTopic(id: string) {
    const item = await this.topicRepo.findOne({
      where: { id },
      relations: { examType: true, parent: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createTopic(dto: CreateTopicDto, user: UserDto) {
    await this.assertUniqueCode(this.topicRepo, dto.code.trim());
    const item = await this.topicRepo.save(
      this.topicRepo.create({
        id: uuidv4(),
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description,
        parentId: dto.parentId,
        examTypeId: dto.examTypeId,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'TopicEntity', item.id, `Tạo chủ đề: ${item.name}`);
    return this.findTopic(item.id);
  }

  async updateTopic(id: string, dto: UpdateTopicDto, user: UserDto) {
    const item = await this.topicRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    if (dto.code) await this.assertUniqueCode(this.topicRepo, dto.code.trim(), id);
    Object.assign(item, {
      code: dto.code.trim(),
      name: dto.name.trim(),
      description: dto.description,
      parentId: dto.parentId,
      examTypeId: dto.examTypeId,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.topicRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'TopicEntity', id, `Cập nhật chủ đề: ${item.name}`);
    return this.findTopic(id);
  }

  async deactivateTopic(id: string, user: UserDto) {
    const item = await this.topicRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.topicRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'TopicEntity', id, `Ngưng chủ đề: ${item.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateTopic(id: string, user: UserDto) {
    const item = await this.topicRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.topicRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'TopicEntity', id, `Kích hoạt chủ đề: ${item.name}`);
    return this.findTopic(id);
  }

  async paginationTags(body: PaginationDto<FilterTagDto>) {
    const { skip = 0, take = 20, where = {} as FilterTagDto } = body;
    const whereCon: FindOptionsWhere<any> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.tagRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { name: 'ASC' },
    });
    return { data: transformKeys(data), total };
  }

  async findTag(id: string) {
    const item = await this.tagRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createTag(dto: CreateTagDto, user: UserDto) {
    const exist = await this.tagRepo.findOne({ where: { name: dto.name.trim() } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('name_existing'));
    const item = await this.tagRepo.save(
      this.tagRepo.create({ id: uuidv4(), name: dto.name.trim(), createdBy: user.id }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'TagEntity', item.id, `Tạo thẻ: ${item.name}`);
    return this.findTag(item.id);
  }

  async updateTag(id: string, dto: UpdateTagDto, user: UserDto) {
    const item = await this.tagRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    const exist = await this.tagRepo.findOne({ where: { name: dto.name.trim() } });
    if (exist && exist.id !== id) throw new BusinessException(this.i18n.commonTranslate('name_existing'));
    item.name = dto.name.trim();
    item.updatedBy = user.id;
    await this.tagRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'TagEntity', id, `Cập nhật thẻ: ${item.name}`);
    return this.findTag(id);
  }

  async deactivateTag(id: string, user: UserDto) {
    const item = await this.tagRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.tagRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'TagEntity', id, `Ngưng thẻ: ${item.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateTag(id: string, user: UserDto) {
    const item = await this.tagRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.tagRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'TagEntity', id, `Kích hoạt thẻ: ${item.name}`);
    return this.findTag(id);
  }

  private groupMeta(dto: CreateQuestionGroupDto) {
    return {
      ...(dto.metadata || {}),
      ...(dto.imageUrl ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.audioUrl ? { audioUrl: dto.audioUrl } : {}),
    };
  }

  async paginationGroups(body: PaginationDto<FilterQuestionGroupDto>) {
    const { skip = 0, take = 20, where = {} as FilterQuestionGroupDto } = body;
    const qb = this.questionGroupRepo
      .createQueryBuilder('grp')
      .leftJoinAndSelect('grp.examSection', 'examSection')
      .where('grp.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });
    if (where.keyword) {
      qb.andWhere('(LOWER(grp.title) LIKE :kw OR LOWER(grp.passageText) LIKE :kw)', {
        kw: `%${where.keyword.trim().toLowerCase()}%`,
      });
    }
    if (where.examSectionId) qb.andWhere('grp.examSectionId = :examSectionId', { examSectionId: where.examSectionId });
    if (where.status) qb.andWhere('grp.status = :status', { status: where.status });
    const [data, total] = await qb.orderBy('grp.createdAt', 'DESC').skip(skip).take(take || 20).getManyAndCount();
    return { data: transformKeys(data), total };
  }

  async findGroup(id: string) {
    const item = await this.questionGroupRepo.findOne({
      where: { id },
      relations: {
        examSection: true,
        questions: { currentVersion: true, questionType: true },
        audioAsset: true,
        imageAsset: true,
      },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    const meta = (item.metadata || {}) as Record<string, unknown>;
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys({
        ...item,
        imageUrl: item.imageAsset?.publicUrl || meta.imageUrl,
        audioUrl: item.audioAsset?.publicUrl || meta.audioUrl,
        questions: (item.questions || []).map(question => ({
          id: question.id,
          status: question.status,
          isDeleted: question.isDeleted,
          prompt: question.currentVersion?.prompt || '',
          questionType: question.questionType
            ? {
                id: question.questionType.id,
                code: question.questionType.code,
                name: question.questionType.name,
              }
            : null,
        })),
      }),
    };
  }

  async createGroup(dto: CreateQuestionGroupDto, user: UserDto) {
    const item = await this.questionGroupRepo.save(
      this.questionGroupRepo.create({
        id: uuidv4(),
        examSectionId: dto.examSectionId,
        title: dto.title,
        instructions: dto.instructions,
        stimulusType: dto.stimulusType || enumData.STIMULUS_TYPE.PASSAGE.code,
        passageText: dto.passageText,
        audioAssetId: dto.audioAssetId,
        imageAssetId: dto.imageAssetId,
        transcript: dto.transcript,
        metadata: this.groupMeta(dto),
        status: dto.status || enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'QuestionGroupEntity', item.id, `Tạo nhóm câu: ${item.title || item.id}`);
    return this.findGroup(item.id);
  }

  async updateGroup(id: string, dto: UpdateQuestionGroupDto, user: UserDto) {
    const item = await this.questionGroupRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    Object.assign(item, {
      examSectionId: dto.examSectionId,
      title: dto.title,
      instructions: dto.instructions,
      stimulusType: dto.stimulusType || item.stimulusType,
      passageText: dto.passageText,
      audioAssetId: dto.audioAssetId,
      imageAssetId: dto.imageAssetId,
      transcript: dto.transcript,
      metadata: this.groupMeta(dto),
      status: dto.status || item.status,
      updatedBy: user.id,
    });
    await this.questionGroupRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'QuestionGroupEntity', id, `Cập nhật nhóm câu: ${item.title || id}`);
    return this.findGroup(id);
  }

  async deactivateGroup(id: string, user: UserDto) {
    const item = await this.questionGroupRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.questionGroupRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'QuestionGroupEntity', id, `Ngưng nhóm câu: ${item.title || id}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateGroup(id: string, user: UserDto) {
    const item = await this.questionGroupRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.questionGroupRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'QuestionGroupEntity', id, `Kích hoạt nhóm câu: ${item.title || id}`);
    return this.findGroup(id);
  }

  private async replaceTopics(questionId: string, topicIds?: string[]) {
    await this.questionTopicRepo.delete({ questionId });
    const ids = [...new Set((topicIds || []).filter(Boolean))];
    if (!ids.length) return;
    await this.questionTopicRepo.save(
      ids.map(topicId => this.questionTopicRepo.create({ id: uuidv4(), questionId, topicId })),
    );
  }

  private async replaceTags(questionId: string, tagIds?: string[]) {
    await this.questionTagRepo.delete({ questionId });
    const ids = [...new Set((tagIds || []).filter(Boolean))];
    if (!ids.length) return;
    await this.questionTagRepo.save(
      ids.map(tagId => this.questionTagRepo.create({ id: uuidv4(), questionId, tagId })),
    );
  }

  private async replaceOptions(versionId: string, options?: CreateQuestionDto['options']) {
    await this.questionOptionRepo.delete({ questionVersionId: versionId });
    if (!options?.length) return;
    await this.questionOptionRepo.save(
      options.map((item, index) =>
        this.questionOptionRepo.create({
          id: uuidv4(),
          questionVersionId: versionId,
          optionKey: item.optionKey.trim(),
          content: item.content.trim(),
          isCorrect: Boolean(item.isCorrect),
          feedback: item.feedback,
          sortOrder: item.sortOrder ?? index,
        }),
      ),
    );
  }

  private async saveVersion(questionId: string, dto: CreateQuestionDto, user: UserDto, versionNumber: number) {
    const questionType = await this.questionTypeRepo.findOne({ where: { id: dto.questionTypeId } });
    if (!questionType) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_type'));
    }
    const contentJson = this.mergeContentJson(dto.contentJson, dto.imageUrl, dto.audioUrl);
    const correctAnswerJson = deriveCorrectAnswer(
      questionType.code,
      dto.options || [],
      dto.correctAnswerJson,
    );
    const version = await this.questionVersionRepo.save(
      this.questionVersionRepo.create({
        id: uuidv4(),
        questionId,
        versionNumber,
        prompt: dto.prompt.trim(),
        instructions: dto.instructions,
        explanation: dto.explanation,
        contentJson,
        correctAnswerJson,
        gradingConfigJson: dto.gradingConfigJson,
        audioAssetId: dto.audioAssetId,
        imageAssetId: dto.imageAssetId,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    await this.replaceOptions(version.id, dto.options);
    return version;
  }

  async paginationQuestions(body: PaginationDto<FilterQuestionDto>, publicOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterQuestionDto } = body;
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.examType', 'examType')
      .leftJoinAndSelect('q.examSkill', 'examSkill')
      .leftJoinAndSelect('q.examSection', 'examSection')
      .leftJoinAndSelect('q.questionType', 'questionType')
      .leftJoinAndSelect('q.currentVersion', 'currentVersion')
      .leftJoinAndSelect('currentVersion.options', 'options')
      .leftJoinAndSelect('q.questionTopics', 'questionTopics')
      .leftJoinAndSelect('questionTopics.topic', 'topic')
      .where('q.isDeleted = :isDeleted', { isDeleted: publicOnly ? false : where.isDeleted ?? false });

    if (publicOnly) {
      qb.andWhere('q.status = :approved', { approved: enumData.CONTENT_REVIEW_STATUS.APPROVED.code });
    } else if (where.status) {
      qb.andWhere('q.status = :status', { status: where.status });
    }
    if (where.keyword) {
      qb.andWhere('LOWER(currentVersion.prompt) LIKE :kw', { kw: `%${where.keyword.trim().toLowerCase()}%` });
    }
    if (where.examTypeId) qb.andWhere('q.examTypeId = :examTypeId', { examTypeId: where.examTypeId });
    if (where.examSkillId) qb.andWhere('q.examSkillId = :examSkillId', { examSkillId: where.examSkillId });
    if (where.examSectionId) qb.andWhere('q.examSectionId = :examSectionId', { examSectionId: where.examSectionId });
    if (where.questionTypeId) qb.andWhere('q.questionTypeId = :questionTypeId', { questionTypeId: where.questionTypeId });
    if (where.questionGroupId) qb.andWhere('q.questionGroupId = :questionGroupId', { questionGroupId: where.questionGroupId });
    if (where.cefrLevel) qb.andWhere('q.cefrLevel = :cefrLevel', { cefrLevel: where.cefrLevel });
    if (where.difficultyLevel) qb.andWhere('q.difficultyLevel = :difficultyLevel', { difficultyLevel: where.difficultyLevel });
    if (where.topicId) {
      qb.innerJoin('q.questionTopics', 'qtFilter', 'qtFilter.topicId = :topicId', { topicId: where.topicId });
    }

    const [rows, total] = await qb.orderBy('q.createdAt', 'DESC').skip(skip).take(take || 20).getManyAndCount();
    return {
      data: rows.map(item => buildQuestionPayload(item, publicOnly)),
      total,
    };
  }

  async findQuestion(id: string, publicOnly = false) {
    const item = await this.questionRepo.findOne({
      where: { id, ...(publicOnly ? { isDeleted: false } : {}) },
      relations: this.questionRelations(),
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    if (publicOnly && item.status !== enumData.CONTENT_REVIEW_STATUS.APPROVED.code) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    }
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: buildQuestionPayload(item, publicOnly),
    };
  }

  async createQuestion(dto: CreateQuestionDto, user: UserDto) {
    const question = await this.questionRepo.save(
      this.questionRepo.create({
        id: uuidv4(),
        questionGroupId: dto.questionGroupId,
        examTypeId: dto.examTypeId,
        examSkillId: dto.examSkillId,
        examSectionId: dto.examSectionId,
        questionTypeId: dto.questionTypeId,
        difficultyLevel: dto.difficultyLevel || 3,
        cefrLevel: dto.cefrLevel || enumData.CEFR_LEVEL.B1.code,
        defaultPoints: dto.defaultPoints || 1,
        status: dto.status || enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    const version = await this.saveVersion(question.id, dto, user, 1);
    question.currentVersionId = version.id;
    await this.questionRepo.save(question);
    await this.replaceTopics(question.id, dto.topicIds);
    await this.replaceTags(question.id, dto.tagIds);
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'QuestionEntity', question.id, 'Tạo câu hỏi');
    return this.findQuestion(question.id);
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto, user: UserDto) {
    const question = await this.questionRepo.findOne({
      where: { id, isDeleted: false },
      relations: { currentVersion: true },
    });
    if (!question) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));

    const locked = question.status === enumData.CONTENT_REVIEW_STATUS.SUBMITTED.code;
    if (locked) throw new BadRequestException('Câu hỏi đang chờ duyệt, không thể sửa');

    Object.assign(question, {
      questionGroupId: dto.questionGroupId,
      examTypeId: dto.examTypeId,
      examSkillId: dto.examSkillId,
      examSectionId: dto.examSectionId,
      questionTypeId: dto.questionTypeId,
      difficultyLevel: dto.difficultyLevel ?? question.difficultyLevel,
      cefrLevel: dto.cefrLevel || question.cefrLevel,
      defaultPoints: dto.defaultPoints ?? question.defaultPoints,
      updatedBy: user.id,
    });

    const inPlace = (
      [
        enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
        enumData.CONTENT_REVIEW_STATUS.REJECTED.code,
        enumData.CONTENT_REVIEW_STATUS.CHANGES_REQUESTED.code,
      ] as string[]
    ).includes(question.status);

    if (inPlace && question.currentVersionId) {
      const version = await this.questionVersionRepo.findOne({ where: { id: question.currentVersionId } });
      if (!version) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_version'));
      const questionType = await this.questionTypeRepo.findOne({ where: { id: dto.questionTypeId } });
      Object.assign(version, {
        prompt: dto.prompt.trim(),
        instructions: dto.instructions,
        explanation: dto.explanation,
        contentJson: this.mergeContentJson(dto.contentJson, dto.imageUrl, dto.audioUrl),
        correctAnswerJson: deriveCorrectAnswer(questionType?.code || '', dto.options || [], dto.correctAnswerJson),
        gradingConfigJson: dto.gradingConfigJson,
        audioAssetId: dto.audioAssetId,
        imageAssetId: dto.imageAssetId,
        updatedBy: user.id,
      });
      await this.questionVersionRepo.save(version);
      await this.replaceOptions(version.id, dto.options);
    } else {
      const last = await this.questionVersionRepo.find({
        where: { questionId: id },
        order: { versionNumber: 'DESC' },
        take: 1,
      });
      const version = await this.saveVersion(id, dto, user, (last[0]?.versionNumber || 1) + 1);
      question.currentVersionId = version.id;
      if (question.status === enumData.CONTENT_REVIEW_STATUS.APPROVED.code) {
        question.status = enumData.CONTENT_REVIEW_STATUS.DRAFT.code;
      }
    }

    if (dto.status && inPlace) question.status = dto.status;
    await this.questionRepo.save(question);
    await this.replaceTopics(id, dto.topicIds);
    await this.replaceTags(id, dto.tagIds);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'QuestionEntity', id, 'Cập nhật câu hỏi');
    return this.findQuestion(id);
  }

  async deactivateQuestion(id: string, user: UserDto) {
    const item = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'QuestionEntity', id, 'Ngưng câu hỏi');
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateQuestion(id: string, user: UserDto) {
    const item = await this.questionRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'QuestionEntity', id, 'Kích hoạt câu hỏi');
    return this.findQuestion(id);
  }

  private async writeReview(questionId: string, status: string, user: UserDto, notes?: string) {
    await this.contentReviewRepo.save(
      this.contentReviewRepo.create({
        id: uuidv4(),
        entityType: enumData.CONTENT_REVIEW_ENTITY.QUESTION.code,
        entityId: questionId,
        reviewerId: user.id,
        status,
        reviewNotes: notes,
        reviewedAt: new Date(),
        createdBy: user.id,
      }),
    );
  }

  async submitQuestion(id: string, user: UserDto) {
    const item = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.status = enumData.CONTENT_REVIEW_STATUS.SUBMITTED.code;
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeReview(id, item.status, user);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'QuestionEntity', id, 'Nộp duyệt câu hỏi');
    return this.findQuestion(id);
  }

  async approveQuestion(id: string, user: UserDto, dto?: ReviewQuestionDto) {
    const item = await this.questionRepo.findOne({
      where: { id, isDeleted: false },
      relations: { currentVersion: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.status = enumData.CONTENT_REVIEW_STATUS.APPROVED.code;
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    if (item.currentVersionId) {
      await this.questionVersionRepo.update(item.currentVersionId, {
        publishedAt: new Date(),
        reviewedByUserId: user.id,
      });
    }
    await this.writeReview(id, item.status, user, dto?.reviewNotes);
    await this.writeLog(user, enumData.ACTION_LOG.APPROVE.code, 'QuestionEntity', id, 'Duyệt câu hỏi');
    return this.findQuestion(id);
  }

  async rejectQuestion(id: string, user: UserDto, dto?: ReviewQuestionDto) {
    const item = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.status = enumData.CONTENT_REVIEW_STATUS.REJECTED.code;
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeReview(id, item.status, user, dto?.reviewNotes);
    await this.writeLog(user, enumData.ACTION_LOG.REJECT.code, 'QuestionEntity', id, 'Từ chối câu hỏi');
    return this.findQuestion(id);
  }

  async requestChangesQuestion(id: string, user: UserDto, dto?: ReviewQuestionDto) {
    const item = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.status = enumData.CONTENT_REVIEW_STATUS.CHANGES_REQUESTED.code;
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeReview(id, item.status, user, dto?.reviewNotes);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'QuestionEntity', id, 'Yêu cầu chỉnh sửa câu hỏi');
    return this.findQuestion(id);
  }

  async startPractice(dto: StartPracticeDto) {
    const limit = Math.min(Math.max(dto.limit || 10, 1), 30);
    const result = await this.paginationQuestions(
      {
        skip: 0,
        take: 80,
        where: {
          examTypeId: dto.examTypeId,
          examSkillId: dto.examSkillId,
          examSectionId: dto.examSectionId,
          questionTypeId: dto.questionTypeId,
          topicId: dto.topicId,
          cefrLevel: dto.cefrLevel,
          difficultyLevel: dto.difficultyLevel,
        },
      },
      true,
    );
    const autoGrade = result.data.filter(
      item => item.questionType?.code && AUTO_GRADE_TYPES.includes(item.questionType.code),
    );
    const shuffled = autoGrade.sort(() => Math.random() - 0.5).slice(0, limit);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: { items: shuffled, total: shuffled.length },
    };
  }

  async gradePractice(dto: GradePracticeDto) {
    const question = await this.questionRepo.findOne({
      where: {
        id: dto.questionId,
        isDeleted: false,
        status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
      },
      relations: { questionType: true, currentVersion: { options: true } },
    });
    if (!question || question.currentVersionId !== dto.questionVersionId) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    }
    const version = question.currentVersion;
    const result = gradeAnswer({
      typeCode: question.questionType?.code || '',
      options: version?.options || [],
      correctAnswerJson: version?.correctAnswerJson,
      answerJson: dto.answerJson,
    });
    await this.questionRepo.increment({ id: question.id }, 'exposureCount', 1);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        questionId: question.id,
        isCorrect: result.isCorrect,
        explanation: version?.explanation,
        correctAnswerJson: result.correctAnswerJson,
        options: (version?.options || []).map(item => ({
          optionKey: item.optionKey,
          content: item.content,
          isCorrect: item.isCorrect,
          feedback: item.feedback,
        })),
      },
    };
  }
}
