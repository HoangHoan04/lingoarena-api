import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import {
  AssessmentAttemptRepo,
  AssessmentItemRepo,
  AssessmentRepo,
  AssessmentSectionRepo,
  AttemptAnswerRepo,
  AttemptQuestionRepo,
  AttemptSectionRepo,
  QuestionRepo,
  UserEntitlementRepo,
  UserErrorItemRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  AUTO_GRADE_TYPES,
  buildQuestionPayload,
  deriveCorrectAnswer,
  gradeAnswer,
} from '../../question/helpers/question.helper';
import {
  CreateAssessmentDto,
  CreateAssessmentItemDto,
  CreateAssessmentSectionDto,
  FilterAssessmentDto,
  HeartbeatAssessmentAttemptDto,
  SaveAssessmentAnswerDto,
  StartAssessmentAttemptDto,
  UpdateAssessmentDto,
  UpdateAssessmentItemDto,
  UpdateAssessmentSectionDto,
} from '../dto';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly assessmentRepo: AssessmentRepo,
    private readonly assessmentSectionRepo: AssessmentSectionRepo,
    private readonly assessmentItemRepo: AssessmentItemRepo,
    private readonly assessmentAttemptRepo: AssessmentAttemptRepo,
    private readonly attemptSectionRepo: AttemptSectionRepo,
    private readonly attemptQuestionRepo: AttemptQuestionRepo,
    private readonly attemptAnswerRepo: AttemptAnswerRepo,
    private readonly questionRepo: QuestionRepo,
    private readonly userEntitlementRepo: UserEntitlementRepo,
    private readonly userErrorItemRepo: UserErrorItemRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'User';
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

  private assessmentRelations() {
    return {
      examType: true,
      course: true,
      sections: {
        examSkill: true,
        items: {
          question: {
            examType: true,
            examSkill: true,
            examSection: true,
            questionType: true,
            questionGroup: { audioAsset: true, imageAsset: true },
            currentVersion: { options: true, audioAsset: true, imageAsset: true },
            questionTopics: { topic: true },
            questionTags: { tag: true },
          },
          questionVersion: { options: true },
        },
      },
    } as const;
  }

  private attemptRelations() {
    return {
      assessment: true,
      attemptSections: {
        assessmentSection: true,
        attemptQuestions: {
          answer: true,
        },
      },
      attemptQuestions: {
        answer: true,
      },
    } as const;
  }

  private canShowAnswers(assessment: { showAnswersPolicy?: string }, status?: string) {
    const finished = (
      [enumData.ATTEMPT_STATUS.SUBMITTED.code, enumData.ATTEMPT_STATUS.GRADED.code] as string[]
    ).includes(status || '');
    return (
      finished &&
      ([
        enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
        enumData.SHOW_ANSWERS_POLICY.IMMEDIATE.code,
      ] as string[]).includes(assessment.showAnswersPolicy || '')
    );
  }

  private sanitizeAttempt(attempt: any, showAnswers = false) {
    const clone = JSON.parse(JSON.stringify(attempt || {}));
    const strip = (question: any) => {
      if (!showAnswers) delete question.correctAnswerSnapshotJson;
      return question;
    };
    clone.attemptQuestions = (clone.attemptQuestions || []).map(strip);
    clone.attemptSections = (clone.attemptSections || []).map((section: any) => ({
      ...section,
      attemptQuestions: (section.attemptQuestions || []).map(strip),
    }));
    return transformKeys(clone);
  }

  private async findAssessmentOrFail(id: string) {
    const item = await this.assessmentRepo.findOne({
      where: { id },
      relations: this.assessmentRelations(),
      order: { sections: { sortOrder: 'ASC', items: { sortOrder: 'ASC' } } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    return item;
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const existing = await this.assessmentRepo.findOne({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  async pagination(body: PaginationDto<FilterAssessmentDto>, publicOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterAssessmentDto } = body;
    const whereCon: FindOptionsWhere<any> = { isDeleted: where.isDeleted ?? false };
    if (publicOnly) {
      whereCon.status = enumData.ASSESSMENT_STATUS.PUBLISHED.code;
    } else if (where.status) {
      whereCon.status = where.status;
    }
    if (where.examTypeId) whereCon.examTypeId = where.examTypeId;
    if (where.assessmentType) whereCon.assessmentType = where.assessmentType;
    if (where.isFree !== undefined && where.isFree !== null && (where.isFree as unknown) !== '') {
      whereCon.isFree = Boolean(where.isFree);
    }
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    const [rows, total] = await this.assessmentRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { examType: true, sections: { items: true } },
    });
    return { data: transformKeys(rows), total };
  }

  async findOne(id: string) {
    const item = await this.findAssessmentOrFail(id);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async findBySlug(slug: string) {
    const item = await this.assessmentRepo.findOne({
      where: {
        slug,
        status: enumData.ASSESSMENT_STATUS.PUBLISHED.code,
        isDeleted: false,
      },
      relations: { examType: true, sections: { examSkill: true, items: true } },
      order: { sections: { sortOrder: 'ASC', items: { sortOrder: 'ASC' } } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async create(dto: CreateAssessmentDto, user: UserDto) {
    await this.assertUniqueSlug(dto.slug.trim());
    const item = await this.assessmentRepo.save(
      this.assessmentRepo.create({
        id: uuidv4(),
        examTypeId: dto.examTypeId,
        courseId: dto.courseId,
        assessmentType: dto.assessmentType,
        title: dto.title.trim(),
        slug: dto.slug.trim(),
        description: dto.description,
        durationSeconds: dto.durationSeconds ?? 0,
        maxAttempts: dto.maxAttempts ?? 0,
        passingScore: dto.passingScore,
        selectionMode: dto.selectionMode || enumData.SELECTION_MODE.FIXED.code,
        showAnswersPolicy:
          dto.showAnswersPolicy || enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
        status: dto.status || enumData.ASSESSMENT_STATUS.DRAFT.code,
        isFree: dto.isFree ?? false,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'AssessmentEntity', item.id, `Tạo đề: ${item.title}`);
    return this.findOne(item.id);
  }

  async update(id: string, dto: UpdateAssessmentDto, user: UserDto) {
    const item = await this.assessmentRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    if (dto.slug) await this.assertUniqueSlug(dto.slug.trim(), id);
    Object.assign(item, {
      examTypeId: dto.examTypeId ?? item.examTypeId,
      courseId: dto.courseId ?? item.courseId,
      assessmentType: dto.assessmentType ?? item.assessmentType,
      title: dto.title?.trim() ?? item.title,
      slug: dto.slug?.trim() ?? item.slug,
      description: dto.description ?? item.description,
      durationSeconds: dto.durationSeconds ?? item.durationSeconds,
      maxAttempts: dto.maxAttempts ?? item.maxAttempts,
      passingScore: dto.passingScore ?? item.passingScore,
      selectionMode: dto.selectionMode ?? item.selectionMode,
      showAnswersPolicy: dto.showAnswersPolicy ?? item.showAnswersPolicy,
      status: dto.status ?? item.status,
      isFree: dto.isFree ?? item.isFree,
      updatedBy: user.id,
    });
    await this.assessmentRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AssessmentEntity', id, `Cập nhật đề: ${item.title}`);
    return this.findOne(id);
  }

  async publish(id: string, user: UserDto) {
    return this.setStatus(id, enumData.ASSESSMENT_STATUS.PUBLISHED.code, user, 'Xuất bản đề');
  }

  async archive(id: string, user: UserDto) {
    return this.setStatus(id, enumData.ASSESSMENT_STATUS.ARCHIVED.code, user, 'Lưu trữ đề');
  }

  private async setStatus(id: string, status: string, user: UserDto, label: string) {
    const item = await this.assessmentRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    item.status = status;
    item.updatedBy = user.id;
    await this.assessmentRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AssessmentEntity', id, label);
    return this.findOne(id);
  }

  async deactivate(id: string, user: UserDto) {
    const item = await this.assessmentRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.assessmentRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'AssessmentEntity', id, `Ngưng đề: ${item.title}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activate(id: string, user: UserDto) {
    const item = await this.assessmentRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.assessmentRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'AssessmentEntity', id, `Kích hoạt đề: ${item.title}`);
    return this.findOne(id);
  }

  async createSection(dto: CreateAssessmentSectionDto, user: UserDto) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: dto.assessmentId, isDeleted: false } });
    if (!assessment) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    const item = await this.assessmentSectionRepo.save(
      this.assessmentSectionRepo.create({
        id: uuidv4(),
        assessmentId: dto.assessmentId,
        examSkillId: dto.examSkillId,
        title: dto.title.trim(),
        instructions: dto.instructions,
        durationSeconds: dto.durationSeconds,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'AssessmentSectionEntity', item.id, `Tạo phần: ${item.title}`);
    return this.findOne(dto.assessmentId);
  }

  async updateSection(id: string, dto: UpdateAssessmentSectionDto, user: UserDto) {
    const item = await this.assessmentSectionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_section'));
    Object.assign(item, {
      examSkillId: dto.examSkillId ?? item.examSkillId,
      title: dto.title?.trim() ?? item.title,
      instructions: dto.instructions ?? item.instructions,
      durationSeconds: dto.durationSeconds ?? item.durationSeconds,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.assessmentSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AssessmentSectionEntity', id, `Cập nhật phần: ${item.title}`);
    return this.findOne(item.assessmentId);
  }

  async deactivateSection(id: string, user: UserDto) {
    const item = await this.assessmentSectionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_section'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.assessmentSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'AssessmentSectionEntity', id, `Ngưng phần: ${item.title}`);
    return this.findOne(item.assessmentId);
  }

  private async loadApprovedQuestion(questionId: string) {
    const question = await this.questionRepo.findOne({
      where: {
        id: questionId,
        isDeleted: false,
        status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
      },
      relations: {
        questionType: true,
        currentVersion: { options: true, audioAsset: true, imageAsset: true },
      },
    });
    if (!question || !question.currentVersionId) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    }
    return question;
  }

  async createItem(dto: CreateAssessmentItemDto, user: UserDto) {
    const section = await this.assessmentSectionRepo.findOne({ where: { id: dto.assessmentSectionId, isDeleted: false } });
    if (!section) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_section'));
    const question = await this.loadApprovedQuestion(dto.questionId);
    const item = await this.assessmentItemRepo.save(
      this.assessmentItemRepo.create({
        id: uuidv4(),
        assessmentSectionId: dto.assessmentSectionId,
        questionId: question.id,
        questionVersionId: question.currentVersionId,
        points: dto.points ?? 1,
        sortOrder: dto.sortOrder || 0,
        isRequired: dto.isRequired ?? true,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'AssessmentItemEntity', item.id, `Thêm câu vào đề`);
    return this.findOne(section.assessmentId);
  }

  async updateItem(id: string, dto: UpdateAssessmentItemDto, user: UserDto) {
    const item = await this.assessmentItemRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assessmentSection: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_item'));
    Object.assign(item, {
      points: dto.points ?? item.points,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      isRequired: dto.isRequired ?? item.isRequired,
      updatedBy: user.id,
    });
    await this.assessmentItemRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AssessmentItemEntity', id, `Cập nhật câu trong đề`);
    return this.findOne(item.assessmentSection.assessmentId);
  }

  async deactivateItem(id: string, user: UserDto) {
    const item = await this.assessmentItemRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assessmentSection: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_item'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.assessmentItemRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'AssessmentItemEntity', id, `Ngưng câu trong đề`);
    return this.findOne(item.assessmentSection.assessmentId);
  }

  async paginationAttempts(body: PaginationDto<FilterAssessmentDto>) {
    const { skip = 0, take = 20, where = {} as any } = body;
    const qb = this.assessmentAttemptRepo
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.assessment', 'assessment')
      .leftJoinAndSelect('attempt.user', 'user')
      .where('attempt.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });
    if (where.assessmentId) qb.andWhere('attempt.assessmentId = :assessmentId', { assessmentId: where.assessmentId });
    if (where.userId) qb.andWhere('attempt.userId = :userId', { userId: where.userId });
    if (where.status) qb.andWhere('attempt.status = :status', { status: where.status });
    const [rows, total] = await qb.orderBy('attempt.createdAt', 'DESC').skip(skip).take(take || 20).getManyAndCount();
    return { data: transformKeys(rows), total };
  }

  private async assertEntitlement(assessment: any, userId: string) {
    if (assessment.isFree) return;
    const now = new Date();
    const entitlement = await this.userEntitlementRepo
      .createQueryBuilder('ent')
      .where('ent.userId = :userId', { userId })
      .andWhere('ent.status = :status', { status: enumData.ENTITLEMENT_STATUS.ACTIVE.code })
      .andWhere('ent.resourceType IN (:...types)', {
        types: [
          enumData.ENTITLEMENT_RESOURCE_TYPE.ASSESSMENT.code,
          enumData.ENTITLEMENT_RESOURCE_TYPE.ALL_ACCESS.code,
        ],
      })
      .andWhere('(ent.resourceId = :assessmentId OR ent.resourceId IS NULL)', { assessmentId: assessment.id })
      .andWhere('(ent.expiresAt IS NULL OR ent.expiresAt > :now)', { now })
      .getOne();
    if (!entitlement) {
      throw new BusinessException(this.i18n.commonTranslate('entity_not_found.user_entitlement'));
    }
  }

  private async loadAttemptOrFail(id: string, userId?: string) {
    const attempt = await this.assessmentAttemptRepo.findOne({
      where: { id, ...(userId ? { userId } : {}), isDeleted: false },
      relations: this.attemptRelations(),
      order: {
        attemptSections: { assessmentSection: { sortOrder: 'ASC' }, attemptQuestions: { sortOrder: 'ASC' } },
        attemptQuestions: { sortOrder: 'ASC' },
      },
    });
    if (!attempt) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_attempt'));
    return attempt;
  }

  async startAttempt(dto: StartAssessmentAttemptDto, user: UserDto) {
    if (!dto.slug && !dto.assessmentId) {
      throw new BadRequestException('Thiếu đề thi cần bắt đầu');
    }
    const assessment = await this.assessmentRepo.findOne({
      where: {
        ...(dto.assessmentId ? { id: dto.assessmentId } : { slug: dto.slug }),
        status: enumData.ASSESSMENT_STATUS.PUBLISHED.code,
        isDeleted: false,
      },
      relations: this.assessmentRelations(),
      order: { sections: { sortOrder: 'ASC', items: { sortOrder: 'ASC' } } },
    });
    if (!assessment) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    await this.assertEntitlement(assessment, user.id);

    const activeAttempt = await this.assessmentAttemptRepo.findOne({
      where: {
        assessmentId: assessment.id,
        userId: user.id,
        status: enumData.ATTEMPT_STATUS.IN_PROGRESS.code,
        expiresAt: MoreThan(new Date()),
        isDeleted: false,
      },
      relations: this.attemptRelations(),
    });
    if (activeAttempt) {
      return {
        message: this.i18n.commonTranslate('find_success'),
        data: this.sanitizeAttempt(activeAttempt, false),
      };
    }

    const attemptCount = await this.assessmentAttemptRepo.count({
      where: { assessmentId: assessment.id, userId: user.id, isDeleted: false },
    });
    if (assessment.maxAttempts && attemptCount >= Number(assessment.maxAttempts)) {
      throw new BusinessException('Đã hết số lượt làm bài');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (assessment.durationSeconds || 24 * 60 * 60) * 1000);
    const attempt = await this.assessmentAttemptRepo.save(
      this.assessmentAttemptRepo.create({
        id: uuidv4(),
        assessmentId: assessment.id,
        userId: user.id,
        attemptNumber: attemptCount + 1,
        status: enumData.ATTEMPT_STATUS.IN_PROGRESS.code,
        startedAt: now,
        expiresAt,
        clientMetadata: dto.clientMetadata,
        clientClockSkewMs: dto.clientClockSkewMs,
        createdBy: user.id,
      }),
    );

    const activeSections = (assessment.sections || []).filter(section => !section.isDeleted);
    for (const section of activeSections) {
      const attemptSection = await this.attemptSectionRepo.save(
        this.attemptSectionRepo.create({
          id: uuidv4(),
          attemptId: attempt.id,
          assessmentSectionId: section.id,
          startedAt: now,
          timeSpentSeconds: 0,
          createdBy: user.id,
        }),
      );
      const activeItems = (section.items || []).filter(item => !item.isDeleted);
      for (const item of activeItems) {
        const question = item.question;
        if (!question || !question.currentVersionId) continue;
        const typeCode = question.questionType?.code || '';
        const snapshot = {
          ...buildQuestionPayload(question, true),
          typeCode,
        };
        const correctAnswer =
          item.questionVersion?.correctAnswerJson ||
          question.currentVersion?.correctAnswerJson ||
          deriveCorrectAnswer(typeCode, question.currentVersion?.options || [], undefined);
        await this.attemptQuestionRepo.save(
          this.attemptQuestionRepo.create({
            id: uuidv4(),
            attemptId: attempt.id,
            attemptSectionId: attemptSection.id,
            questionId: item.questionId,
            questionVersionId: item.questionVersionId,
            questionSnapshotJson: snapshot,
            correctAnswerSnapshotJson: correctAnswer,
            points: item.points ?? 1,
            sortOrder: item.sortOrder || 0,
            displayedAt: now,
            createdBy: user.id,
          }),
        );
        await this.questionRepo.increment({ id: item.questionId }, 'exposureCount', 1);
      }
    }

    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'AssessmentAttemptEntity', attempt.id, `Bắt đầu làm đề: ${assessment.title}`);
    const fullAttempt = await this.loadAttemptOrFail(attempt.id, user.id);
    return { message: this.i18n.commonTranslate('find_success'), data: this.sanitizeAttempt(fullAttempt, false) };
  }

  async getAttempt(id: string, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: this.sanitizeAttempt(attempt, this.canShowAnswers(attempt.assessment, attempt.status)),
    };
  }

  async heartbeatAttempt(id: string, dto: HeartbeatAssessmentAttemptDto, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (attempt.status !== enumData.ATTEMPT_STATUS.IN_PROGRESS.code) {
      throw new BadRequestException('Lượt làm bài đã kết thúc');
    }
    attempt.lastHeartbeatAt = new Date();
    attempt.focusLossCount = dto.focusLossCount ?? attempt.focusLossCount ?? 0;
    attempt.clientClockSkewMs = dto.clientClockSkewMs ?? attempt.clientClockSkewMs;
    await this.assessmentAttemptRepo.save(attempt);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AssessmentAttemptEntity', id, 'Cập nhật heartbeat bài làm');
    return { message: this.i18n.commonTranslate('update_success'), data: { id: attempt.id } };
  }

  private async gradeAttemptQuestion(attemptQuestion: any, answerJson?: Record<string, unknown>) {
    const typeCode =
      attemptQuestion.questionSnapshotJson?.typeCode ||
      attemptQuestion.questionSnapshotJson?.questionType?.code ||
      '';
    if (!AUTO_GRADE_TYPES.includes(typeCode)) {
      return {
        isCorrect: null,
        scoreAwarded: 0,
        gradingStatus: enumData.GRADING_STATUS.PENDING.code,
        graderType: undefined,
        feedbackJson: undefined,
      };
    }
    const result = gradeAnswer({
      typeCode,
      options: attemptQuestion.questionSnapshotJson?.options || [],
      correctAnswerJson: attemptQuestion.correctAnswerSnapshotJson,
      answerJson,
    });
    return {
      isCorrect: result.isCorrect,
      scoreAwarded: result.isCorrect ? Number(attemptQuestion.points || 0) : 0,
      gradingStatus: enumData.GRADING_STATUS.AUTO_GRADED.code,
      graderType: enumData.GRADER_TYPE.SYSTEM.code,
      feedbackJson: { correctAnswerJson: result.correctAnswerJson },
    };
  }

  async saveAnswer(id: string, dto: SaveAssessmentAnswerDto, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (attempt.status !== enumData.ATTEMPT_STATUS.IN_PROGRESS.code) {
      throw new BadRequestException('Lượt làm bài đã kết thúc');
    }
    const attemptQuestion = await this.attemptQuestionRepo.findOne({
      where: { id: dto.attemptQuestionId, attemptId: id, isDeleted: false },
    });
    if (!attemptQuestion) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_item'));
    const existing = await this.attemptAnswerRepo.findOne({
      where: { attemptQuestionId: dto.attemptQuestionId },
    });
    const shouldGrade = attempt.assessment?.showAnswersPolicy === enumData.SHOW_ANSWERS_POLICY.IMMEDIATE.code;
    const grade = shouldGrade
      ? await this.gradeAttemptQuestion(attemptQuestion, dto.answerJson)
      : {
          isCorrect: undefined,
          scoreAwarded: undefined,
          gradingStatus: enumData.GRADING_STATUS.PENDING.code,
          graderType: undefined,
          feedbackJson: undefined,
        };
    const answer = await this.attemptAnswerRepo.save(
      this.attemptAnswerRepo.create({
        ...(existing || {}),
        id: existing?.id || uuidv4(),
        attemptQuestionId: dto.attemptQuestionId,
        answerJson: dto.answerJson,
        answerText: dto.answerText,
        audioAssetId: dto.audioAssetId,
        answeredAt: new Date(),
        lastSavedAt: new Date(),
        ...grade,
        updatedBy: existing ? user.id : undefined,
        createdBy: existing ? existing.createdBy : user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AttemptAnswerEntity', answer.id, 'Lưu câu trả lời');
    return { message: this.i18n.commonTranslate('update_success'), data: transformKeys(answer) };
  }

  private async upsertWrongItem(userId: string, questionId: string, attemptAnswerId: string) {
    const existing = await this.userErrorItemRepo.findOne({ where: { userId, questionId } });
    if (existing) {
      existing.wrongCount = Number(existing.wrongCount || 0) + 1;
      existing.lastWrongAt = new Date();
      existing.attemptAnswerId = attemptAnswerId;
      existing.errorType = existing.errorType || enumData.ERROR_TYPE.GRAMMAR.code;
      existing.isResolved = false;
      await this.userErrorItemRepo.save(existing);
      return;
    }
    await this.userErrorItemRepo.save(
      this.userErrorItemRepo.create({
        id: uuidv4(),
        userId,
        questionId,
        attemptAnswerId,
        errorType: enumData.ERROR_TYPE.GRAMMAR.code,
        wrongCount: 1,
        lastWrongAt: new Date(),
      }),
    );
  }

  async submitAttempt(id: string, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (attempt.status !== enumData.ATTEMPT_STATUS.IN_PROGRESS.code) {
      return this.getResult(id, user);
    }
    const questions = await this.attemptQuestionRepo.find({
      where: { attemptId: id, isDeleted: false },
      relations: { answer: true, attemptSection: true },
      order: { sortOrder: 'ASC' },
    });
    let objectiveScore = 0;
    let subjectiveScore = 0;
    const sectionScores = new Map<string, number>();
    const results = [];

    for (const question of questions) {
      const answer =
        question.answer ||
        (await this.attemptAnswerRepo.save(
          this.attemptAnswerRepo.create({
            id: uuidv4(),
            attemptQuestionId: question.id,
            gradingStatus: enumData.GRADING_STATUS.PENDING.code,
            lastSavedAt: new Date(),
            createdBy: user.id,
          }),
        ));
      const grade = await this.gradeAttemptQuestion(question, answer.answerJson);
      Object.assign(answer, {
        isCorrect: grade.isCorrect === null ? undefined : grade.isCorrect,
        scoreAwarded: grade.scoreAwarded,
        gradingStatus: grade.gradingStatus,
        graderType: grade.graderType,
        feedbackJson: grade.feedbackJson,
        lastSavedAt: new Date(),
        updatedBy: user.id,
      });
      const saved = await this.attemptAnswerRepo.save(answer);
      if (grade.gradingStatus === enumData.GRADING_STATUS.AUTO_GRADED.code) {
        objectiveScore += Number(grade.scoreAwarded || 0);
        sectionScores.set(
          question.attemptSectionId,
          (sectionScores.get(question.attemptSectionId) || 0) + Number(grade.scoreAwarded || 0),
        );
        if (grade.isCorrect === false) {
          await this.upsertWrongItem(user.id, question.questionId, saved.id);
        }
      } else {
        subjectiveScore += Number(grade.scoreAwarded || 0);
      }
      results.push({
        attemptQuestionId: question.id,
        questionId: question.questionId,
        isCorrect: grade.isCorrect,
        scoreAwarded: grade.scoreAwarded,
        correctAnswerJson: question.correctAnswerSnapshotJson,
      });
    }

    for (const [attemptSectionId, rawScore] of sectionScores.entries()) {
      await this.attemptSectionRepo.update(attemptSectionId, { rawScore, convertedScore: rawScore });
    }

    const totalScore = objectiveScore + subjectiveScore;
    attempt.status = enumData.ATTEMPT_STATUS.GRADED.code;
    attempt.submittedAt = new Date();
    attempt.objectiveScore = objectiveScore;
    attempt.subjectiveScore = subjectiveScore;
    attempt.totalScore = totalScore;
    attempt.convertedScore = totalScore;
    attempt.resultJson = { items: results };
    attempt.updatedBy = user.id;
    await this.assessmentAttemptRepo.save(attempt);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'AssessmentAttemptEntity', id, 'Nộp bài đánh giá');
    return this.getResult(id, user);
  }

  async getResult(id: string, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (!([enumData.ATTEMPT_STATUS.SUBMITTED.code, enumData.ATTEMPT_STATUS.GRADED.code] as string[]).includes(attempt.status)) {
      throw new BadRequestException('Chưa nộp bài');
    }
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: this.sanitizeAttempt(attempt, this.canShowAnswers(attempt.assessment, attempt.status)),
    };
  }
}
