import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, In } from 'typeorm';
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
  splitCodes,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { ContentTaxonomyEntity, QuestionEntity, TaxonomyEntity } from '~/entities';
import {
  ContentSegmentRepo,
  ContentTaxonomyRepo,
  ExamStructureRepo,
  ExamTypeRepo,
  QuestionGroupRepo,
  QuestionOptionRepo,
  QuestionRepo,
  StudySessionItemRepo,
  StudySessionRepo,
  TaxonomyRepo,
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
  StartGroupSessionDto,
  StartPracticeDto,
  UpdateQuestionDto,
  UpdateQuestionGroupDto,
  UpdateQuestionTypeDto,
  UpdateTagDto,
  UpdateTopicDto,
} from '../dto';
import {
  AUTO_GRADE_TYPES,
  QUESTION_ENTITY_TYPE,
  QUESTION_TYPE_ENUM_LOCKED,
  buildQuestionPayload,
  deriveCorrectAnswer,
  gradeAnswer,
  listQuestionTypes,
  questionTypeShape,
  slugify,
} from '../helpers';

import { YoutubeTranscriptService } from './youtube-transcript.service';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionGroupRepo: QuestionGroupRepo,
    private readonly contentSegmentRepo: ContentSegmentRepo,
    private readonly questionRepo: QuestionRepo,
    private readonly questionOptionRepo: QuestionOptionRepo,
    private readonly taxonomyRepo: TaxonomyRepo,
    private readonly contentTaxonomyRepo: ContentTaxonomyRepo,
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly examStructureRepo: ExamStructureRepo,
    private readonly studySessionRepo: StudySessionRepo,
    private readonly studySessionItemRepo: StudySessionItemRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
    private readonly youtubeTranscriptService: YoutubeTranscriptService,
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
      examStructure: { parent: true, examType: true },
      questionGroup: true,
      options: true,
    } as const;
  }

  private mergeContentJson(
    contentJson?: Record<string, unknown>,
    imageUrl?: string,
    audioUrl?: string,
  ) {
    const next = { ...(contentJson || {}) };
    if (imageUrl !== undefined) {
      if (!imageUrl) delete next.imageUrl;
      else next.imageUrl = imageUrl;
    }
    if (audioUrl !== undefined) {
      if (!audioUrl) delete next.audioUrl;
      else next.audioUrl = audioUrl;
    }
    return Object.keys(next).length ? next : undefined;
  }

  private resolveQuestionType(dto: { questionType?: string; questionTypeId?: string }) {
    const code = (dto.questionType || dto.questionTypeId || '').trim();
    const item = listQuestionTypes().find(type => type.code === code);
    if (!item) {
      throw new BusinessException(this.i18n.commonTranslate('entity_not_found.question_type'));
    }
    return item.code;
  }

  private resolveExamStructureId(dto: {
    examStructureId?: string;
    examSectionId?: string;
    examSkillId?: string;
  }) {
    return dto.examStructureId || dto.examSectionId || dto.examSkillId;
  }

  private async attachTaxonomies(questions: QuestionEntity[]) {
    if (!questions.length) return questions;
    const links = await this.contentTaxonomyRepo.find({
      where: {
        entityType: QUESTION_ENTITY_TYPE,
        entityId: In(questions.map(item => item.id)),
        isDeleted: false,
      },
      relations: { taxonomy: true },
    });
    const grouped = new Map<string, ContentTaxonomyEntity[]>();
    for (const link of links) {
      const list = grouped.get(link.entityId) || [];
      list.push(link);
      grouped.set(link.entityId, list);
    }
    for (const question of questions) {
      (question as any).contentTaxonomies = grouped.get(question.id) || [];
    }
    return questions;
  }

  private async assertUniqueTaxonomy(kind: string, slug: string, excludeId?: string) {
    const exist = await this.taxonomyRepo.findOne({ where: { kind, slug } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  async selectBoxExamTypes() {
    const rows = await this.examTypeRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return this.toSelectBox(rows);
  }

  async selectBoxSkills(examTypeId?: string) {
    const rows = await this.examStructureRepo.find({
      where: {
        isDeleted: false,
        nodeType: enumData.EXAM_NODE_TYPE.SKILL.code,
        ...(examTypeId ? { examTypeId } : {}),
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: { examType: true },
    });
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.name,
      code: item.code,
      examTypeId: item.examTypeId,
      nodeType: item.nodeType,
      label: item.examType ? `${item.examType.code} · ${item.name}` : item.name,
    }));
  }

  async selectBoxSections(examSkillId?: string) {
    const rows = await this.examStructureRepo.find({
      where: {
        isDeleted: false,
        nodeType: In([enumData.EXAM_NODE_TYPE.SECTION.code, enumData.EXAM_NODE_TYPE.PART.code]),
        ...(examSkillId ? { parentId: examSkillId } : {}),
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: { parent: true },
    });
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.name,
      code: item.code,
      examSkillId: item.parentId,
      parentId: item.parentId,
      nodeType: item.nodeType,
      label: item.parent ? `${item.parent.name} · ${item.name}` : item.name,
    }));
  }

  async selectBoxQuestionTypes() {
    return listQuestionTypes();
  }

  async selectBoxTopics() {
    const rows = await this.taxonomyRepo.find({
      where: { kind: enumData.TAXONOMY_KIND.TOPIC.code, isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return this.toSelectBox(rows);
  }

  async selectBoxTags() {
    const rows = await this.taxonomyRepo.find({
      where: { kind: enumData.TAXONOMY_KIND.TAG.code, isDeleted: false },
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
    if (keyword)
      qb.andWhere('LOWER(grp.title) LIKE :kw', { kw: `%${keyword.trim().toLowerCase()}%` });
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
    if (where.isDeleted === true) return { data: [], total: 0 };
    const keyword = (where.keyword || '').trim().toLowerCase();
    const rows = listQuestionTypes().filter(item => {
      if (!keyword) return true;
      return item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword);
    });
    const start = skip || 0;
    const size = take || 20;
    return { data: transformKeys(rows.slice(start, start + size)), total: rows.length };
  }

  async findType(id: string) {
    const item = listQuestionTypes().find(type => type.code === id || type.id === id);
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_type'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createType(_dto: CreateQuestionTypeDto, _user: UserDto) {
    throw new BusinessException(QUESTION_TYPE_ENUM_LOCKED);
  }

  async updateType(_id: string, _dto: UpdateQuestionTypeDto, _user: UserDto) {
    throw new BusinessException(QUESTION_TYPE_ENUM_LOCKED);
  }

  async deactivateType(_id: string, _user: UserDto) {
    throw new BusinessException(QUESTION_TYPE_ENUM_LOCKED);
  }

  async activateType(_id: string, _user: UserDto) {
    throw new BusinessException(QUESTION_TYPE_ENUM_LOCKED);
  }

  private taxonomyWhere(kind: string, where: { keyword?: string; isDeleted?: boolean }) {
    const whereCon: FindOptionsWhere<TaxonomyEntity> = {
      kind,
      isDeleted: where.isDeleted ?? false,
    };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    return whereCon;
  }

  async paginationTopics(body: PaginationDto<FilterTopicDto>) {
    const { skip = 0, take = 20, where = {} as FilterTopicDto } = body;
    const [data, total] = await this.taxonomyRepo.findAndCount({
      where: this.taxonomyWhere(enumData.TAXONOMY_KIND.TOPIC.code, where),
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { parent: true },
    });
    return { data: transformKeys(data), total };
  }

  async findTopic(id: string) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TOPIC.code },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async createTopic(dto: CreateTopicDto, user: UserDto) {
    const slug = (dto.slug || slugify(dto.code)).trim();
    await this.assertUniqueTaxonomy(enumData.TAXONOMY_KIND.TOPIC.code, slug);
    const item = await this.taxonomyRepo.save(
      this.taxonomyRepo.create({
        id: uuidv4(),
        kind: enumData.TAXONOMY_KIND.TOPIC.code,
        code: dto.code.trim(),
        slug,
        name: dto.name.trim(),
        nameEn: dto.nameEn?.trim() || dto.name.trim(),
        description: dto.description,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'TaxonomyEntity',
      item.id,
      `Tạo chủ đề: ${item.name}`,
    );
    return this.findTopic(item.id);
  }

  @DefTransaction()
  async updateTopic(id: string, dto: UpdateTopicDto, user: UserDto) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TOPIC.code },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    const slug = (dto.slug || slugify(dto.code)).trim();
    await this.assertUniqueTaxonomy(enumData.TAXONOMY_KIND.TOPIC.code, slug, id);
    Object.assign(item, {
      code: dto.code.trim(),
      slug,
      name: dto.name.trim(),
      nameEn: dto.nameEn?.trim() || dto.name.trim(),
      description: dto.description,
      parentId: dto.parentId,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.taxonomyRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'TaxonomyEntity',
      id,
      `Cập nhật chủ đề: ${item.name}`,
    );
    return this.findTopic(id);
  }

  @DefTransaction()
  async deactivateTopic(id: string, user: UserDto) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TOPIC.code, isDeleted: false },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.taxonomyRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'TaxonomyEntity',
      id,
      `Ngưng chủ đề: ${item.name}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateTopic(id: string, user: UserDto) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TOPIC.code },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.topic'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.taxonomyRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'TaxonomyEntity',
      id,
      `Kích hoạt chủ đề: ${item.name}`,
    );
    return this.findTopic(id);
  }

  async paginationTags(body: PaginationDto<FilterTagDto>) {
    const { skip = 0, take = 20, where = {} as FilterTagDto } = body;
    const [data, total] = await this.taxonomyRepo.findAndCount({
      where: this.taxonomyWhere(enumData.TAXONOMY_KIND.TAG.code, where),
      skip,
      take: take || 20,
      order: { name: 'ASC' },
    });
    return { data: transformKeys(data), total };
  }

  async findTag(id: string) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TAG.code },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async createTag(dto: CreateTagDto, user: UserDto) {
    const slug = (dto.slug || slugify(dto.name)).trim();
    await this.assertUniqueTaxonomy(enumData.TAXONOMY_KIND.TAG.code, slug);
    const item = await this.taxonomyRepo.save(
      this.taxonomyRepo.create({
        id: uuidv4(),
        kind: enumData.TAXONOMY_KIND.TAG.code,
        code: dto.code?.trim() || slug,
        slug,
        name: dto.name.trim(),
        nameEn: dto.nameEn?.trim() || dto.name.trim(),
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'TaxonomyEntity',
      item.id,
      `Tạo thẻ: ${item.name}`,
    );
    return this.findTag(item.id);
  }

  @DefTransaction()
  async updateTag(id: string, dto: UpdateTagDto, user: UserDto) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TAG.code },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    const slug = (dto.slug || slugify(dto.name)).trim();
    await this.assertUniqueTaxonomy(enumData.TAXONOMY_KIND.TAG.code, slug, id);
    item.name = dto.name.trim();
    item.nameEn = dto.nameEn?.trim() || dto.name.trim();
    item.code = dto.code?.trim() || item.code || slug;
    item.slug = slug;
    item.updatedBy = user.id;
    await this.taxonomyRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'TaxonomyEntity',
      id,
      `Cập nhật thẻ: ${item.name}`,
    );
    return this.findTag(id);
  }

  @DefTransaction()
  async deactivateTag(id: string, user: UserDto) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TAG.code, isDeleted: false },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.taxonomyRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'TaxonomyEntity',
      id,
      `Ngưng thẻ: ${item.name}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateTag(id: string, user: UserDto) {
    const item = await this.taxonomyRepo.findOne({
      where: { id, kind: enumData.TAXONOMY_KIND.TAG.code },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.tag'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.taxonomyRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'TaxonomyEntity',
      id,
      `Kích hoạt thẻ: ${item.name}`,
    );
    return this.findTag(id);
  }

  private uniqueTopics(
    rows: Array<{ id?: string; name?: string; nameEn?: string; code?: string }>,
  ) {
    const map = new Map<string, { id: string; name: string; nameEn?: string; code?: string }>();
    for (const row of rows) {
      if (!row.id || !row.name) continue;
      map.set(row.id, { id: row.id, name: row.name, nameEn: row.nameEn, code: row.code });
    }
    return [...map.values()];
  }

  private async loadGroupTopics(groupIds: string[]) {
    const result = new Map<
      string,
      Array<{ id: string; name: string; nameEn?: string; code?: string }>
    >();
    if (!groupIds.length) return result;
    const rows: Array<{
      groupId: string;
      id: string;
      name: string;
      nameEn?: string;
      code?: string;
    }> = await this.taxonomyRepo.query(
      `SELECT DISTINCT q."questionGroupId" AS "groupId", t.id, t.name, t."nameEn", t.code
           FROM questions q
           INNER JOIN content_taxonomies ct
             ON ct."entityId" = q.id AND ct."entityType" = $1 AND ct."isDeleted" = false
           INNER JOIN taxonomies t
             ON t.id = ct."taxonomyId" AND t.kind = $2 AND t."isDeleted" = false
           WHERE q."questionGroupId" = ANY($3::uuid[]) AND q."isDeleted" = false`,
      [QUESTION_ENTITY_TYPE, enumData.TAXONOMY_KIND.TOPIC.code, groupIds],
    );
    for (const row of rows) {
      const list = result.get(row.groupId) || [];
      list.push({ id: row.id, name: row.name, nameEn: row.nameEn, code: row.code });
      result.set(row.groupId, list);
    }
    return result;
  }

  private groupPayload(
    item: any,
    publicOnly = false,
    topics: Array<{ id: string; name: string; nameEn?: string; code?: string }> = [],
  ) {
    const questions = (item.questions || [])
      .filter((q: any) => !q.isDeleted)
      .sort((a: any, b: any) => (a.questionNumber || 0) - (b.questionNumber || 0))
      .map((q: any) =>
        publicOnly
          ? buildQuestionPayload(q, true)
          : {
              id: q.id,
              isDeleted: q.isDeleted,
              prompt: q.prompt || '',
              questionType: questionTypeShape(q.questionType),
            },
      );
    const segments = [...(item.segments || [])]
      .filter((s: any) => !s.isDeleted)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const questionTopics = this.uniqueTopics(questions.flatMap((q: any) => q.topics || []));
    return {
      ...item,
      examSectionId: item.examStructureId,
      imageUrl: item.coverImageUrl,
      questions,
      questionsCount: questions.length,
      segments,
      topics: this.uniqueTopics([...topics, ...questionTopics]),
    };
  }

  async paginationGroups(body: PaginationDto<FilterQuestionGroupDto>, publicOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterQuestionGroupDto } = body;
    const qb = this.questionGroupRepo
      .createQueryBuilder('grp')
      .leftJoinAndSelect('grp.examType', 'examType')
      .leftJoinAndSelect('grp.examStructure', 'examStructure')
      .leftJoinAndSelect('grp.segments', 'segments', 'segments.isDeleted = false')
      .leftJoinAndSelect('grp.questions', 'questions', 'questions.isDeleted = false')
      .leftJoinAndSelect('questions.options', 'options')
      .where('grp.isDeleted = :isDeleted', {
        isDeleted: publicOnly ? false : (where.isDeleted ?? false),
      });

    if (publicOnly) {
      const publicTypes: string[] = [
        enumData.STIMULUS_TYPE.PASSAGE.code,
        enumData.STIMULUS_TYPE.VIDEO_YOUTUBE.code,
        enumData.STIMULUS_TYPE.AUDIO_CONVERSATION.code,
        enumData.STIMULUS_TYPE.IMAGE.code,
        enumData.STIMULUS_TYPE.TABLE.code,
        enumData.STIMULUS_TYPE.CHART.code,
      ];
      if (where.stimulusType) {
        if (!publicTypes.includes(where.stimulusType)) return { data: [], total: 0 };
        qb.andWhere('grp.stimulusType = :stimulusType', { stimulusType: where.stimulusType });
      } else {
        qb.andWhere('grp.stimulusType IN (:...publicTypes)', { publicTypes });
      }
    } else {
      if (where.stimulusType)
        qb.andWhere('grp.stimulusType = :stimulusType', { stimulusType: where.stimulusType });
    }

    if (where.hasAudio) {
      qb.andWhere(
        '(grp.audioUrl IS NOT NULL OR grp.youtubeId IS NOT NULL OR grp.stimulusType IN (:...audioTypes))',
        {
          audioTypes: [
            enumData.STIMULUS_TYPE.AUDIO_CONVERSATION.code,
            enumData.STIMULUS_TYPE.VIDEO_YOUTUBE.code,
          ],
        },
      );
    }
    if (where.keyword) {
      qb.andWhere('(LOWER(grp.title) LIKE :kw OR LOWER(grp.passageText) LIKE :kw)', {
        kw: `%${where.keyword.trim().toLowerCase()}%`,
      });
    }
    if (where.examTypeId)
      qb.andWhere('grp.examTypeId = :examTypeId', { examTypeId: where.examTypeId });
    const structureId = where.examStructureId || where.examSectionId;
    if (structureId) qb.andWhere('grp.examStructureId = :structureId', { structureId });
    if (where.cefrLevel) qb.andWhere('grp.cefrLevel = :cefrLevel', { cefrLevel: where.cefrLevel });
    if (where.topicId) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM questions q_topic
          INNER JOIN content_taxonomies ct_topic
            ON ct_topic."entityId" = q_topic.id AND ct_topic."entityType" = :ctType
            AND ct_topic."taxonomyId" = :topicId AND ct_topic."isDeleted" = false
          WHERE q_topic."questionGroupId" = grp.id AND q_topic."isDeleted" = false
        )`,
        { ctType: QUESTION_ENTITY_TYPE, topicId: where.topicId },
      );
    }

    const [data, total] = await qb
      .orderBy('grp.createdAt', 'DESC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();
    const topicMap = await this.loadGroupTopics(
      data.map(item => item.id as string).filter(Boolean),
    );
    return {
      data: transformKeys(
        data.map(item =>
          this.groupPayload(item, publicOnly, topicMap.get(item.id as string) || []),
        ),
      ),
      total,
    };
  }

  async findGroup(id: string, publicOnly = false) {
    const item = await this.questionGroupRepo.findOne({
      where: { id, ...(publicOnly ? { isDeleted: false } : {}) },
      relations: {
        examType: true,
        examStructure: { parent: true },
        segments: true,
        questions: { examType: true, examStructure: { parent: true }, options: true },
      },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    await this.attachTaxonomies(item.questions || []);
    const topicMap = await this.loadGroupTopics([id]);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys(this.groupPayload(item, publicOnly, topicMap.get(id) || [])),
    };
  }

  private async replaceSegments(groupId: string, segments?: CreateQuestionGroupDto['segments']) {
    await this.contentSegmentRepo.delete({ questionGroupId: groupId });
    if (!segments?.length) return;
    await this.contentSegmentRepo.save(
      segments.map(item =>
        this.contentSegmentRepo.create({
          id: uuidv4(),
          questionGroupId: groupId,
          sortOrder: item.sortOrder,
          label: item.label,
          text: item.text,
          translationVi: item.translationVi,
          explanation: item.explanation,
          startSec: item.startSec,
          endSec: item.endSec,
          keyVocabJson: item.keyVocabJson,
        }),
      ),
    );
  }

  private groupFields(dto: CreateQuestionGroupDto) {
    return {
      examTypeId: dto.examTypeId !== undefined ? dto.examTypeId : undefined,
      examStructureId:
        dto.examStructureId !== undefined
          ? dto.examStructureId
          : dto.examSectionId !== undefined
            ? dto.examSectionId
            : undefined,
      stimulusType: dto.stimulusType || enumData.STIMULUS_TYPE.PASSAGE.code,
      title: dto.title?.trim() || 'Nhóm câu hỏi',
      titleEn: dto.titleEn !== undefined ? dto.titleEn : undefined,
      instructions:
        dto.instructions !== undefined
          ? dto.instructions
          : dto.instructionsEn !== undefined
            ? dto.instructionsEn
            : undefined,
      passageText: dto.passageText !== undefined ? dto.passageText : undefined,
      summaryVi: dto.summaryVi !== undefined ? dto.summaryVi : undefined,
      wordCount: dto.wordCount !== undefined ? dto.wordCount : undefined,
      recommendedTimeMin: dto.recommendedTimeMin !== undefined ? dto.recommendedTimeMin : undefined,
      cefrLevel: dto.cefrLevel !== undefined ? dto.cefrLevel : undefined,
      coverImageUrl:
        dto.coverImageUrl !== undefined
          ? dto.coverImageUrl
          : dto.imageUrl !== undefined
            ? dto.imageUrl
            : undefined,
      audioUrl: dto.audioUrl !== undefined ? dto.audioUrl : undefined,
      youtubeId: dto.youtubeId !== undefined ? dto.youtubeId : undefined,
      channelName: dto.channelName !== undefined ? dto.channelName : undefined,
      channelAvatarUrl: dto.channelAvatarUrl !== undefined ? dto.channelAvatarUrl : undefined,
      thumbnailUrl: dto.thumbnailUrl !== undefined ? dto.thumbnailUrl : undefined,
      durationSec: dto.durationSec !== undefined ? dto.durationSec : undefined,
      keyVocabJson: dto.keyVocabJson !== undefined ? dto.keyVocabJson : undefined,
    };
  }

  @DefTransaction()
  async createGroup(dto: CreateQuestionGroupDto, user: UserDto) {
    const item = await this.questionGroupRepo.save(
      this.questionGroupRepo.create({ id: uuidv4(), ...this.groupFields(dto), createdBy: user.id }),
    );
    await this.replaceSegments(item.id, dto.segments);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'QuestionGroupEntity',
      item.id,
      `Tạo nhóm câu: ${item.title || item.id}`,
    );
    return this.findGroup(item.id);
  }

  @DefTransaction()
  async updateGroup(id: string, dto: UpdateQuestionGroupDto, user: UserDto) {
    const item = await this.questionGroupRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    const fields = this.groupFields(dto);
    Object.assign(item, {
      ...fields,
      stimulusType: dto.stimulusType !== undefined ? dto.stimulusType : item.stimulusType,
      updatedBy: user.id,
    });
    for (const key of Object.keys(fields)) {
      if ((fields as any)[key] === null) (item as any)[key] = null;
    }
    await this.questionGroupRepo.save(item);
    if (dto.segments !== undefined) await this.replaceSegments(id, dto.segments || []);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'QuestionGroupEntity',
      id,
      `Cập nhật nhóm câu: ${item.title || id}`,
    );
    return this.findGroup(id);
  }

  async getYoutubeTranscript(youtubeId: string) {
    const segments = await this.youtubeTranscriptService.getTranscript(youtubeId);
    return { data: segments, total: segments.length };
  }

  async translateSegments(texts: string[]) {
    const translations = await this.youtubeTranscriptService.translateBatchToVietnamese(texts);
    return { data: translations, total: translations.length };
  }

  @DefTransaction()
  async deactivateGroup(id: string, user: UserDto) {
    const item = await this.questionGroupRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.questionGroupRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'QuestionGroupEntity',
      id,
      `Ngưng nhóm câu: ${item.title || id}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateGroup(id: string, user: UserDto) {
    const item = await this.questionGroupRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.questionGroupRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'QuestionGroupEntity',
      id,
      `Kích hoạt nhóm câu: ${item.title || id}`,
    );
    return this.findGroup(id);
  }

  private async replaceContentTaxonomies(
    questionId: string,
    taxonomyIds: string[] | undefined,
    kind: string,
  ) {
    const existing = await this.contentTaxonomyRepo.find({
      where: { entityType: QUESTION_ENTITY_TYPE, entityId: questionId, isDeleted: false },
      relations: { taxonomy: true },
    });
    const toRemove = existing.filter(item => item.taxonomy?.kind === kind);
    if (toRemove.length) await this.contentTaxonomyRepo.delete(toRemove.map(item => item.id));
    const ids = [...new Set((taxonomyIds || []).filter(Boolean))];
    if (!ids.length) return;
    await this.contentTaxonomyRepo.save(
      ids.map(taxonomyId =>
        this.contentTaxonomyRepo.create({
          id: uuidv4(),
          taxonomyId,
          entityType: QUESTION_ENTITY_TYPE,
          entityId: questionId,
        }),
      ),
    );
  }

  private async replaceOptions(questionId: string, options?: CreateQuestionDto['options']) {
    await this.questionOptionRepo.delete({ questionId });
    if (!options?.length) return;
    await this.questionOptionRepo.save(
      options.map((item, index) =>
        this.questionOptionRepo.create({
          id: uuidv4(),
          questionId,
          optionKey: item.optionKey.trim(),
          content: item.content.trim(),
          isCorrect: Boolean(item.isCorrect),
          feedback: item.feedback,
          sortOrder: item.sortOrder ?? index,
        }),
      ),
    );
  }

  async paginationQuestions(body: PaginationDto<FilterQuestionDto>, publicOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterQuestionDto } = body;
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.examType', 'examType')
      .leftJoinAndSelect('q.examStructure', 'examStructure')
      .leftJoinAndSelect('examStructure.parent', 'examStructureParent')
      .leftJoinAndSelect('q.questionGroup', 'questionGroup')
      .leftJoinAndSelect('q.options', 'options')
      .where('q.isDeleted = :isDeleted', {
        isDeleted: publicOnly ? false : (where.isDeleted ?? false),
      });

    if (where.keyword) {
      qb.andWhere('LOWER(q.prompt) LIKE :kw', { kw: `%${where.keyword.trim().toLowerCase()}%` });
    }
    if (where.examTypeId)
      qb.andWhere('q.examTypeId = :examTypeId', { examTypeId: where.examTypeId });
    const structureId = where.examStructureId || where.examSectionId || where.examSkillId;
    if (structureId) {
      qb.andWhere('(q.examStructureId = :structureId OR examStructure.parentId = :structureId)', {
        structureId,
      });
    }
    const typeCode = where.questionType || where.questionTypeId;
    if (typeCode) qb.andWhere('q.questionType = :questionType', { questionType: typeCode });
    if (where.questionGroupId)
      qb.andWhere('q.questionGroupId = :questionGroupId', {
        questionGroupId: where.questionGroupId,
      });
    if (where.cefrLevel) qb.andWhere('q.cefrLevel = :cefrLevel', { cefrLevel: where.cefrLevel });
    if (where.difficultyLevel)
      qb.andWhere('q.difficultyLevel = :difficultyLevel', {
        difficultyLevel: where.difficultyLevel,
      });
    if (where.topicId) {
      qb.innerJoin(
        ContentTaxonomyEntity,
        'ctFilter',
        'ctFilter.entityId = q.id AND ctFilter.entityType = :ctType AND ctFilter.taxonomyId = :topicId AND ctFilter.isDeleted = false',
        { ctType: QUESTION_ENTITY_TYPE, topicId: where.topicId },
      );
    }

    const [rows, total] = await qb
      .orderBy('q.createdAt', 'DESC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();
    await this.attachTaxonomies(rows);
    return { data: rows.map(item => buildQuestionPayload(item, publicOnly)), total };
  }

  async findQuestion(id: string, publicOnly = false) {
    const item = await this.questionRepo.findOne({
      where: { id, ...(publicOnly ? { isDeleted: false } : {}) },
      relations: this.questionRelations(),
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    await this.attachTaxonomies([item]);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: buildQuestionPayload(item, publicOnly),
    };
  }

  @DefTransaction()
  async createQuestion(dto: CreateQuestionDto, user: UserDto) {
    const questionType = this.resolveQuestionType(dto);
    const correctAnswerJson = deriveCorrectAnswer(
      questionType,
      dto.options || [],
      dto.correctAnswerJson,
    );
    const question = await this.questionRepo.save(
      this.questionRepo.create({
        id: uuidv4(),
        questionGroupId: dto.questionGroupId,
        examTypeId: dto.examTypeId,
        examStructureId: this.resolveExamStructureId(dto),
        questionType,
        questionNumber: dto.questionNumber,
        difficultyLevel: dto.difficultyLevel || 3,
        cefrLevel: dto.cefrLevel,
        defaultPoints: dto.defaultPoints || 1,
        gradingStrategy:
          dto.gradingStrategy ||
          questionTypeShape(questionType)?.gradingStrategy ||
          enumData.GRADING_STRATEGY.EXACT_MATCH.code,
        rubricId: dto.rubricId,
        minWords: dto.minWords,
        maxWords: dto.maxWords,
        timeLimitMin: dto.timeLimitMin,
        prompt: dto.prompt.trim(),
        instructions: dto.instructions,
        explanation: dto.explanation,
        explanationEn: dto.explanationEn,
        sampleAnswer: dto.sampleAnswer,
        sampleBand: dto.sampleBand,
        sampleAnalysisVi: dto.sampleAnalysisVi,
        contentJson: this.mergeContentJson(dto.contentJson, dto.imageUrl, dto.audioUrl),
        correctAnswerJson,
        imageUrl: dto.imageUrl,
        metaJson: dto.metaJson,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    await this.replaceOptions(question.id, dto.options);
    await this.replaceContentTaxonomies(
      question.id,
      dto.topicIds,
      enumData.TAXONOMY_KIND.TOPIC.code,
    );
    await this.replaceContentTaxonomies(question.id, dto.tagIds, enumData.TAXONOMY_KIND.TAG.code);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'QuestionEntity',
      question.id,
      'Tạo câu hỏi',
    );
    return this.findQuestion(question.id);
  }

  @DefTransaction()
  async updateQuestion(id: string, dto: UpdateQuestionDto, user: UserDto) {
    const question = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!question)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    const questionType = this.resolveQuestionType(dto);
    const correctAnswerJson = deriveCorrectAnswer(
      questionType,
      dto.options || [],
      dto.correctAnswerJson,
    );
    Object.assign(question, {
      questionGroupId:
        dto.questionGroupId !== undefined ? dto.questionGroupId : question.questionGroupId,
      examTypeId: dto.examTypeId,
      examStructureId: this.resolveExamStructureId(dto) || question.examStructureId,
      questionType,
      questionNumber: dto.questionNumber ?? question.questionNumber,
      difficultyLevel: dto.difficultyLevel ?? question.difficultyLevel,
      cefrLevel: dto.cefrLevel !== undefined ? dto.cefrLevel : question.cefrLevel,
      defaultPoints: dto.defaultPoints ?? question.defaultPoints,
      gradingStrategy: dto.gradingStrategy || question.gradingStrategy,
      rubricId: dto.rubricId !== undefined ? dto.rubricId : question.rubricId,
      minWords: dto.minWords,
      maxWords: dto.maxWords,
      timeLimitMin: dto.timeLimitMin,
      prompt: dto.prompt.trim(),
      instructions: dto.instructions !== undefined ? dto.instructions : question.instructions,
      explanation: dto.explanation !== undefined ? dto.explanation : question.explanation,
      explanationEn: dto.explanationEn !== undefined ? dto.explanationEn : question.explanationEn,
      sampleAnswer: dto.sampleAnswer,
      sampleBand: dto.sampleBand,
      sampleAnalysisVi: dto.sampleAnalysisVi,
      contentJson: this.mergeContentJson(dto.contentJson, dto.imageUrl, dto.audioUrl),
      correctAnswerJson,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl || null : question.imageUrl,
      metaJson: dto.metaJson,
      updatedBy: user.id,
    });
    if (
      dto.questionGroupId === null ||
      dto.questionGroupId === '' ||
      (dto as any).questionGroupId === '__none__' ||
      (dto as any).questionGroupId === 'null'
    ) {
      question.questionGroupId = null;
    }
    if (dto.cefrLevel === null) question.cefrLevel = null;
    if (dto.instructions === null) question.instructions = null;
    if (dto.explanation === null) question.explanation = null;
    if (dto.explanationEn === null) question.explanationEn = null;
    await this.questionRepo.save(question);
    await this.replaceOptions(id, dto.options);
    await this.replaceContentTaxonomies(id, dto.topicIds, enumData.TAXONOMY_KIND.TOPIC.code);
    await this.replaceContentTaxonomies(id, dto.tagIds, enumData.TAXONOMY_KIND.TAG.code);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'QuestionEntity',
      id,
      'Cập nhật câu hỏi',
    );
    return this.findQuestion(id);
  }

  @DefTransaction()
  async detachQuestionFromGroup(id: string, user: UserDto) {
    const question = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!question)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    question.questionGroupId = null;
    question.updatedBy = user.id;
    await this.questionRepo.save(question);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'QuestionEntity',
      id,
      `Gỡ câu hỏi khỏi nhóm/bài đọc: ${id}`,
      { questionGroupId: null },
    );
    return {
      message: this.i18n.commonTranslate('update_success'),
      data: { id, questionGroupId: null },
    };
  }

  @DefTransaction()
  async deactivateQuestion(id: string, user: UserDto) {
    const item = await this.questionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'QuestionEntity',
      id,
      'Ngưng câu hỏi',
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateQuestion(id: string, user: UserDto) {
    const item = await this.questionRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.questionRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'QuestionEntity',
      id,
      'Kích hoạt câu hỏi',
    );
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
          examStructureId: dto.examStructureId,
          examSkillId: dto.examSkillId,
          examSectionId: dto.examSectionId,
          questionType: dto.questionType,
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
      where: { id: dto.questionId, isDeleted: false },
      relations: { options: true },
    });
    if (!question)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    const result = gradeAnswer({
      typeCode: question.questionType,
      options: question.options || [],
      correctAnswerJson: question.correctAnswerJson,
      answerJson: dto.answerJson,
    });
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        questionId: question.id,
        isCorrect: result.isCorrect,
        explanation: question.explanation,
        explanationEn: question.explanationEn,
        correctAnswerJson: result.correctAnswerJson,
        options: (question.options || []).map(item => ({
          optionKey: item.optionKey,
          content: item.content,
          isCorrect: item.isCorrect,
          feedback: item.feedback,
        })),
      },
    };
  }

  async exportQuestions(body: PaginationDto<FilterQuestionDto>) {
    const { data } = await this.paginationQuestions({
      skip: body?.skip || 0,
      take: body?.take || 5000,
      where: body?.where || {},
    });
    const rows = (data || []).map((item: any) => ({
      id: item.id,
      cefrLevel: item.cefrLevel,
      difficultyLevel: item.difficultyLevel,
      examType: item.examType?.code || item.examTypeId,
      examSkill: item.examSkill?.code || item.examSkillId,
      examStructure: item.examStructure?.code || item.examStructureId,
      questionType: item.questionType?.code || item.questionTypeId,
      prompt: item.prompt,
    }));
    return { message: this.i18n.commonTranslate('find_success'), data: rows };
  }

  private resolveSessionType(stimulusType: string, requested?: string) {
    const reading = enumData.STUDY_SESSION_TYPE.READING.code;
    const dictation = enumData.STUDY_SESSION_TYPE.DICTATION.code;
    const allowed: string[] = [reading, dictation];
    if (requested) {
      const code = requested.trim().toUpperCase();
      if (!allowed.includes(code)) throw new Error('Loại phiên không hợp lệ');
      return code;
    }
    if (stimulusType === enumData.STIMULUS_TYPE.VIDEO_YOUTUBE.code) return dictation;
    return reading;
  }

  @DefTransaction()
  async startGroupSession(id: string, dto: StartGroupSessionDto, user: UserDto) {
    const group = await this.questionGroupRepo.findOne({
      where: { id, isDeleted: false },
      relations: {
        segments: true,
        questions: { options: true, examType: true, examStructure: { parent: true } },
      },
    });
    if (!group)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question_group'));

    const sessionType = this.resolveSessionType(group.stimulusType, dto.sessionType);
    const approvedQuestions = (group.questions || []).filter(q => !q.isDeleted);
    await this.attachTaxonomies(approvedQuestions);
    const segments = [...(group.segments || [])]
      .filter(item => !item.isDeleted)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const useSegments =
      sessionType === enumData.STUDY_SESSION_TYPE.DICTATION.code && segments.length > 0;
    const targets = useSegments
      ? segments.map(item => ({ targetType: 'CONTENT_SEGMENT', targetId: item.id }))
      : approvedQuestions.map(item => ({ targetType: 'QUESTION', targetId: item.id }));

    const session = await this.studySessionRepo.save(
      this.studySessionRepo.create({
        id: uuidv4(),
        userId: user.id,
        sessionType,
        questionGroupId: group.id,
        status: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code,
        totalItems: targets.length,
        completedItems: 0,
        correctItems: 0,
        durationSeconds: 0,
        startedAt: new Date(),
        configJson: { stimulusType: group.stimulusType },
        createdBy: user.id,
      }),
    );

    if (targets.length) {
      await this.studySessionItemRepo.save(
        targets.map((item, index) =>
          this.studySessionItemRepo.create({
            id: uuidv4(),
            studySessionId: session.id,
            targetType: item.targetType,
            targetId: item.targetId,
            sortOrder: index,
          }),
        ),
      );
    }

    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'StudySessionEntity',
      session.id,
      `Bắt đầu phiên ${sessionType} cho nhóm ${group.title}`,
    );

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        sessionId: session.id,
        sessionType,
        status: session.status,
        questionGroupId: group.id,
        totalItems: session.totalItems,
        group: transformKeys(this.groupPayload(group, true)),
      },
    };
  }

  private async findExamTypeByCode(code: string) {
    const item = await this.examTypeRepo.findOne({
      where: { code: code.trim(), isDeleted: false },
    });
    if (!item) throw new NotFoundException(`Không tìm thấy loại kỳ thi mã ${code}`);
    return item;
  }

  private async findStructureByCode(examTypeId: string, code: string) {
    const item = await this.examStructureRepo.findOne({
      where: { examTypeId, code: code.trim(), isDeleted: false },
    });
    if (!item) throw new NotFoundException(`Không tìm thấy cấu trúc mã ${code}`);
    return item;
  }

  async importTopics(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createTopic(
        {
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          nameEn: optionalText(item.nameEn),
          slug: optionalText(item.slug),
          description: optionalText(item.description),
          sortOrder: optionalNumber(item.sortOrder, 0),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportTopics(body: PaginationDto<FilterTopicDto>) {
    const { data } = await this.paginationTopics({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importTags(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createTag(
        {
          name: requireText(item.name, 'Tên'),
          nameEn: optionalText(item.nameEn),
          code: optionalText(item.code),
          slug: optionalText(item.slug),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportTags(body: PaginationDto<FilterTagDto>) {
    const { data } = await this.paginationTags({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importGroups(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const examTypeCode = optionalText(item.examTypeCode);
      const examType = examTypeCode ? await this.findExamTypeByCode(examTypeCode) : null;
      const structureCode = optionalText(item.examStructureCode);
      const structure =
        examType && structureCode
          ? await this.findStructureByCode(examType.id, structureCode)
          : null;
      const created = await this.createGroup(
        {
          examTypeId: examType?.id,
          examStructureId: structure?.id,
          title: requireText(item.title, 'Tiêu đề'),
          titleEn: optionalText(item.titleEn),
          instructions: optionalText(item.instructions),
          instructionsEn: optionalText(item.instructionsEn),
          stimulusType: optionalText(item.stimulusType) || enumData.STIMULUS_TYPE.PASSAGE.code,
          passageText: optionalText(item.passageText),
          transcript: optionalText(item.transcript),
          audioUrl: optionalText(item.audioUrl),
          imageUrl: optionalText(item.imageUrl),
          cefrLevel: optionalText(item.cefrLevel),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportGroups(body: PaginationDto<FilterQuestionGroupDto>) {
    const { data } = await this.paginationGroups({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importQuestions(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const examType = await this.findExamTypeByCode(requireText(item.examTypeCode, 'Mã kỳ thi'));
      const structureCode = optionalText(item.examStructureCode);
      const structure = structureCode
        ? await this.findStructureByCode(examType.id, structureCode)
        : null;
      const topicCodes = splitCodes(item.topicCodes);
      const topicIds: string[] = [];
      for (const code of topicCodes) {
        const topic = await this.taxonomyRepo.findOne({
          where: { kind: enumData.TAXONOMY_KIND.TOPIC.code, code, isDeleted: false },
        });
        if (!topic) throw new NotFoundException(`Không tìm thấy chủ đề mã ${code}`);
        topicIds.push(topic.id);
      }
      const groupTitle = optionalText(item.groupTitle);
      let questionGroupId: string | undefined;
      if (groupTitle) {
        const group = await this.questionGroupRepo.findOne({
          where: { title: groupTitle, isDeleted: false },
        });
        if (!group) throw new NotFoundException(`Không tìm thấy bài đọc/nghe "${groupTitle}"`);
        questionGroupId = group.id;
      }
      const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
      const correctKeys = new Set(splitCodes(item.correctKeys).map(key => key.toUpperCase()));
      const options = optionKeys
        .map((key, index) => {
          const content = optionalText(item[`option${key}`]);
          if (!content) return null;
          return { optionKey: key, content, isCorrect: correctKeys.has(key), sortOrder: index };
        })
        .filter(
          (
            row,
          ): row is { optionKey: string; content: string; isCorrect: boolean; sortOrder: number } =>
            Boolean(row),
        );
      const created = await this.createQuestion(
        {
          examTypeId: examType.id,
          examStructureId: structure?.id,
          questionGroupId,
          questionType:
            optionalText(item.questionType) || enumData.QUESTION_TYPE_CODE.SINGLE_CHOICE.code,
          prompt: requireText(item.prompt, 'Đề bài'),
          instructions: optionalText(item.instructions),
          explanation: optionalText(item.explanation),
          cefrLevel: optionalText(item.cefrLevel) || enumData.CEFR_LEVEL.B1.code,
          difficultyLevel: optionalNumber(item.difficultyLevel, 3),
          defaultPoints: optionalNumber(item.defaultPoints, 1),
          options,
          topicIds,
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }
}
