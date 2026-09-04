import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, In, MoreThan } from 'typeorm';
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
  slugifyText,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { RubricEntity } from '~/entities';
import {
  AnswerEvaluationRepo,
  AssessmentAttemptRepo,
  AssessmentItemRepo,
  AssessmentRepo,
  AssessmentSectionRepo,
  AttemptAnswerRepo,
  AttemptQuestionRepo,
  ExamStructureRepo,
  ExamTypeRepo,
  QuestionRepo,
  RubricRepo,
  UserErrorItemRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { NotificationService } from '../../notification/service';
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
  CreateCertificateTemplateDto,
  CreateRubricCriterionDto,
  CreateRubricDto,
  FilterAssessmentDto,
  FilterCertificateTemplateDto,
  FilterRubricDto,
  HeartbeatAssessmentAttemptDto,
  SaveAssessmentAnswerDto,
  StartAssessmentAttemptDto,
  UpdateAssessmentDto,
  UpdateAssessmentItemDto,
  UpdateAssessmentSectionDto,
  UpdateCertificateTemplateDto,
  UpdateRubricCriterionDto,
  UpdateRubricDto,
} from '../dto';
import { gradeWithChatCompletion } from '../helpers/ai-grade';

type RubricCriterionJson = {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  maxScore?: number;
  weight?: number;
  sortOrder?: number;
  isDeleted?: boolean;
};

@Injectable()
export class AssessmentService {
  constructor(
    private readonly assessmentRepo: AssessmentRepo,
    private readonly assessmentSectionRepo: AssessmentSectionRepo,
    private readonly assessmentItemRepo: AssessmentItemRepo,
    private readonly assessmentAttemptRepo: AssessmentAttemptRepo,
    private readonly attemptQuestionRepo: AttemptQuestionRepo,
    private readonly attemptAnswerRepo: AttemptAnswerRepo,
    private readonly questionRepo: QuestionRepo,
    private readonly userErrorItemRepo: UserErrorItemRepo,
    private readonly rubricRepo: RubricRepo,
    private readonly answerEvaluationRepo: AnswerEvaluationRepo,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly examStructureRepo: ExamStructureRepo,
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

  private certificateDeferred(): never {
    throw new BusinessException('Chứng chỉ đã hoãn');
  }

  private assessmentRelations() {
    return {
      examType: true,
      examStructure: true,
      sections: {
        examStructure: true,
        items: {
          question: {
            examType: true,
            examStructure: true,
            questionGroup: true,
            options: true,
          },
        },
      },
    } as const;
  }

  private resolveSkillId(dto: { examStructureId?: string; examSkillId?: string }) {
    return dto.examStructureId || dto.examSkillId;
  }

  private async requireSkillForType(examTypeId: string, skillId: string) {
    const skill = await this.examStructureRepo.findOne({
      where: { id: skillId, isDeleted: false },
    });
    if (!skill) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_structure'));
    }
    if (skill.nodeType !== enumData.EXAM_NODE_TYPE.SKILL.code) {
      throw new BadRequestException('examSkillId phải là node kỹ năng (SKILL)');
    }
    if (skill.examTypeId !== examTypeId) {
      throw new BadRequestException('Kỹ năng không thuộc loại kỳ thi này');
    }
    return skill;
  }

  private attemptRelations() {
    return {
      assessment: true,
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
      (
        [
          enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
          enumData.SHOW_ANSWERS_POLICY.IMMEDIATE.code,
        ] as string[]
      ).includes(assessment.showAnswersPolicy || '')
    );
  }

  private sanitizeAttempt(attempt: any, showAnswers = false) {
    const clone = JSON.parse(JSON.stringify(attempt || {}));
    clone.attemptQuestions = (clone.attemptQuestions || []).map((question: any) => {
      if (!showAnswers) delete question.correctAnswerSnapshotJson;
      return question;
    });
    return transformKeys(clone);
  }

  private typeCodeOf(source: any): string {
    if (typeof source?.questionType === 'string') return source.questionType;
    return (
      source?.typeCode ||
      source?.questionType?.code ||
      source?.questionSnapshotJson?.typeCode ||
      source?.questionSnapshotJson?.questionType?.code ||
      ''
    );
  }

  private rubricCriteria(rubric?: RubricEntity | null): RubricCriterionJson[] {
    return ((rubric?.criteriaJson || []) as RubricCriterionJson[]).filter(item => !item?.isDeleted);
  }

  private async findAssessmentOrFail(id: string) {
    const item = await this.assessmentRepo.findOne({
      where: { id },
      relations: this.assessmentRelations(),
      order: { sections: { sortOrder: 'ASC', items: { sortOrder: 'ASC' } } },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    return item;
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const existing = await this.assessmentRepo.findOne({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  async pagination(body: PaginationDto<FilterAssessmentDto>) {
    const { skip = 0, take = 20, where = {} as FilterAssessmentDto } = body;
    const skillId = this.resolveSkillId(where);
    const qb = this.assessmentRepo
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.examType', 'examType')
      .leftJoinAndSelect('assessment.examStructure', 'examStructure')
      .leftJoinAndSelect('assessment.sections', 'sections')
      .leftJoinAndSelect('sections.items', 'items')
      .where('assessment.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });

    if (where.status) qb.andWhere('assessment.status = :status', { status: where.status });
    if (where.examTypeId) {
      qb.andWhere('assessment.examTypeId = :examTypeId', { examTypeId: where.examTypeId });
    }
    if (where.assessmentType) {
      qb.andWhere('assessment.assessmentType = :assessmentType', {
        assessmentType: where.assessmentType,
      });
    }
    if (where.isFree !== undefined && where.isFree !== null && (where.isFree as unknown) !== '') {
      qb.andWhere('assessment.isFree = :isFree', { isFree: Boolean(where.isFree) });
    }
    if (where.keyword) {
      qb.andWhere({ title: UnaccentILike(`%${where.keyword}%`) });
    }
    if (skillId) {
      qb.andWhere(
        `(assessment.examStructureId = :skillId OR EXISTS (
          SELECT 1 FROM assessment_sections s
          WHERE s."assessmentId" = assessment.id
            AND s."isDeleted" = false
            AND s."examStructureId" = :skillId
        ))`,
        { skillId },
      );
    }

    const [rows, total] = await qb
      .orderBy('assessment.createdAt', 'DESC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();
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
        isDeleted: false,
      },
      relations: { examType: true, sections: { examStructure: true, items: true } },
      order: { sections: { sortOrder: 'ASC', items: { sortOrder: 'ASC' } } },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async create(dto: CreateAssessmentDto, user: UserDto) {
    await this.assertUniqueSlug(dto.slug.trim());
    const skillId = this.resolveSkillId(dto);
    const skill = skillId ? await this.requireSkillForType(dto.examTypeId, skillId) : null;
    const item = await this.assessmentRepo.save(
      this.assessmentRepo.create({
        id: uuidv4(),
        examTypeId: dto.examTypeId,
        examStructureId: skill?.id,
        courseId: dto.courseId,
        assessmentType: dto.assessmentType,
        title: dto.title.trim(),
        slug: dto.slug.trim(),
        description: dto.description,
        durationSeconds: dto.durationSeconds ?? 0,
        maxAttempts: dto.maxAttempts,
        passingScore: dto.passingScore,
        selectionMode: dto.selectionMode || enumData.SELECTION_MODE.FIXED.code,
        showAnswersPolicy:
          dto.showAnswersPolicy || enumData.SHOW_ANSWERS_POLICY.AFTER_SUBMISSION.code,
        isFree: dto.isFree ?? true,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    if (skill) {
      await this.assessmentSectionRepo.save(
        this.assessmentSectionRepo.create({
          id: uuidv4(),
          assessmentId: item.id,
          examStructureId: skill.id,
          title: skill.name,
          durationSeconds: item.durationSeconds,
          sortOrder: 0,
          createdBy: user.id,
        }),
      );
    }
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'AssessmentEntity',
      item.id,
      `Tạo đề: ${item.title}`,
    );
    return this.findOne(item.id);
  }

  @DefTransaction()
  async update(id: string, dto: UpdateAssessmentDto, user: UserDto) {
    const item = await this.assessmentRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    if (dto.slug) await this.assertUniqueSlug(dto.slug.trim(), id);
    const nextTypeId = dto.examTypeId ?? item.examTypeId;
    const skillId = this.resolveSkillId(dto);
    const skill = skillId ? await this.requireSkillForType(nextTypeId, skillId) : null;
    Object.assign(item, {
      examTypeId: nextTypeId,
      examStructureId: skill ? skill.id : item.examStructureId,
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
      isFree: dto.isFree ?? item.isFree,
      updatedBy: user.id,
    });
    await this.assessmentRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AssessmentEntity',
      id,
      `Cập nhật đề: ${item.title}`,
    );
    return this.findOne(id);
  }

  @DefTransaction()
  async deactivate(id: string, user: UserDto) {
    const item = await this.assessmentRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.assessmentRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'AssessmentEntity',
      id,
      `Ngưng đề: ${item.title}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activate(id: string, user: UserDto) {
    const item = await this.assessmentRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.assessmentRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'AssessmentEntity',
      id,
      `Kích hoạt đề: ${item.title}`,
    );
    return this.findOne(id);
  }

  @DefTransaction()
  async createSection(dto: CreateAssessmentSectionDto, user: UserDto) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: dto.assessmentId, isDeleted: false },
    });
    if (!assessment)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));
    const examStructureId = dto.examStructureId || dto.examSkillId;
    if (!examStructureId) throw new BadRequestException('Thiếu examStructureId');
    const item = await this.assessmentSectionRepo.save(
      this.assessmentSectionRepo.create({
        id: uuidv4(),
        assessmentId: dto.assessmentId,
        examStructureId,
        title: dto.title.trim(),
        instructions: dto.instructions,
        durationSeconds: dto.durationSeconds,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'AssessmentSectionEntity',
      item.id,
      `Tạo phần: ${item.title}`,
    );
    return this.findOne(dto.assessmentId);
  }

  @DefTransaction()
  async updateSection(id: string, dto: UpdateAssessmentSectionDto, user: UserDto) {
    const item = await this.assessmentSectionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_section'));
    Object.assign(item, {
      examStructureId: dto.examStructureId || dto.examSkillId || item.examStructureId,
      title: dto.title?.trim() ?? item.title,
      instructions: dto.instructions ?? item.instructions,
      durationSeconds: dto.durationSeconds ?? item.durationSeconds,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.assessmentSectionRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AssessmentSectionEntity',
      id,
      `Cập nhật phần: ${item.title}`,
    );
    return this.findOne(item.assessmentId);
  }

  @DefTransaction()
  async deactivateSection(id: string, user: UserDto) {
    const item = await this.assessmentSectionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_section'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.assessmentSectionRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'AssessmentSectionEntity',
      id,
      `Ngưng phần: ${item.title}`,
    );
    return this.findOne(item.assessmentId);
  }

  private async loadApprovedQuestion(questionId: string) {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, isDeleted: false },
      relations: { questionGroup: true, examType: true, examStructure: true, options: true },
    });
    if (!question) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.question'));
    }
    return question;
  }

  @DefTransaction()
  async createItem(dto: CreateAssessmentItemDto, user: UserDto) {
    const section = await this.assessmentSectionRepo.findOne({
      where: { id: dto.assessmentSectionId, isDeleted: false },
    });
    if (!section)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_section'));
    const duplicate = await this.assessmentItemRepo.findOne({
      where: {
        assessmentSectionId: dto.assessmentSectionId,
        questionId: dto.questionId,
        isDeleted: false,
      },
    });
    if (duplicate) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const question = await this.loadApprovedQuestion(dto.questionId);
    const item = await this.assessmentItemRepo.save(
      this.assessmentItemRepo.create({
        id: uuidv4(),
        assessmentSectionId: dto.assessmentSectionId,
        questionId: question.id,
        points: dto.points ?? 1,
        sortOrder: dto.sortOrder || 0,
        isRequired: dto.isRequired ?? true,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'AssessmentItemEntity',
      item.id,
      `Thêm câu vào đề`,
    );
    return this.findOne(section.assessmentId);
  }

  @DefTransaction()
  async updateItem(id: string, dto: UpdateAssessmentItemDto, user: UserDto) {
    const item = await this.assessmentItemRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assessmentSection: true },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_item'));
    Object.assign(item, {
      points: dto.points ?? item.points,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      isRequired: dto.isRequired ?? item.isRequired,
      updatedBy: user.id,
    });
    await this.assessmentItemRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AssessmentItemEntity',
      id,
      `Cập nhật câu trong đề`,
    );
    return this.findOne(item.assessmentSection.assessmentId);
  }

  @DefTransaction()
  async deactivateItem(id: string, user: UserDto) {
    const item = await this.assessmentItemRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assessmentSection: true },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_item'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.assessmentItemRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'AssessmentItemEntity',
      id,
      `Ngưng câu trong đề`,
    );
    return this.findOne(item.assessmentSection.assessmentId);
  }

  async paginationAttempts(body: PaginationDto<FilterAssessmentDto>) {
    const { skip = 0, take = 20, where = {} as any } = body;
    const whereCon: FindOptionsWhere<any> = { isDeleted: where.isDeleted ?? false };
    if (where.assessmentId) whereCon.assessmentId = where.assessmentId;
    if (where.userId) whereCon.userId = where.userId;
    if (where.status) whereCon.status = where.status;
    const [rows, total] = await this.assessmentAttemptRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { assessment: true },
    });
    return { data: transformKeys(rows), total };
  }

  private async loadAttemptOrFail(id: string, userId?: string) {
    const attempt = await this.assessmentAttemptRepo.findOne({
      where: { id, ...(userId ? { userId } : {}), isDeleted: false },
      relations: this.attemptRelations(),
      order: { attemptQuestions: { sortOrder: 'ASC' } },
    });
    if (!attempt)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_attempt'));
    return attempt;
  }

  private buildSnapshot(question: any) {
    const typeCode = this.typeCodeOf(question);
    return {
      ...buildQuestionPayload(question, true),
      typeCode,
      rubricId: question.rubricId,
      examStructureId: question.examStructureId,
    };
  }

  @DefTransaction()
  async startAttempt(dto: StartAssessmentAttemptDto, user: UserDto) {
    if (!dto.slug && !dto.assessmentId) {
      throw new BadRequestException('Thiếu đề thi cần bắt đầu');
    }
    const assessment = await this.assessmentRepo.findOne({
      where: {
        ...(dto.assessmentId ? { id: dto.assessmentId } : { slug: dto.slug }),
        isDeleted: false,
      },
      relations: this.assessmentRelations(),
      order: { sections: { sortOrder: 'ASC', items: { sortOrder: 'ASC' } } },
    });
    if (!assessment)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment'));

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
    const durationMs = (assessment.durationSeconds || 24 * 60 * 60) * 1000;
    const expiresAt = new Date(now.getTime() + durationMs);
    const attempt = await this.assessmentAttemptRepo.save(
      this.assessmentAttemptRepo.create({
        id: uuidv4(),
        assessmentId: assessment.id,
        userId: user.id,
        attemptNumber: attemptCount + 1,
        status: enumData.ATTEMPT_STATUS.IN_PROGRESS.code,
        startedAt: now,
        expiresAt,
        gradingStatus: enumData.GRADING_STATUS.PENDING.code,
        clientMetadataJson: dto.clientMetadata,
        createdBy: user.id,
      }),
    );

    const activeSections = (assessment.sections || []).filter(section => !section.isDeleted);
    for (const section of activeSections) {
      const activeItems = (section.items || []).filter(item => !item.isDeleted);
      for (const item of activeItems) {
        const question = item.question;
        if (!question) continue;
        const typeCode = this.typeCodeOf(question);
        const snapshot = this.buildSnapshot(question);
        const correctAnswer =
          question.correctAnswerJson ||
          deriveCorrectAnswer(typeCode, question.options || [], question.correctAnswerJson);
        const attemptQuestion = await this.attemptQuestionRepo.save(
          this.attemptQuestionRepo.create({
            id: uuidv4(),
            attemptId: attempt.id,
            assessmentSectionId: section.id,
            questionId: item.questionId,
            questionSnapshotJson: snapshot,
            correctAnswerSnapshotJson: correctAnswer,
            points: item.points ?? 1,
            sortOrder: item.sortOrder || 0,
            displayedAt: now,
            createdBy: user.id,
          }),
        );
        await this.attemptAnswerRepo.save(
          this.attemptAnswerRepo.create({
            id: uuidv4(),
            attemptQuestionId: attemptQuestion.id,
            answerJson: {},
            gradingStatus: enumData.GRADING_STATUS.PENDING.code,
            answeredAt: now,
            createdBy: user.id,
          }),
        );
      }
    }

    await this.assessmentRepo.increment({ id: assessment.id }, 'attemptCount', 1);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'AssessmentAttemptEntity',
      attempt.id,
      `Bắt đầu làm đề: ${assessment.title}`,
    );
    const fullAttempt = await this.loadAttemptOrFail(attempt.id, user.id);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: this.sanitizeAttempt(fullAttempt, false),
    };
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
    if (attempt.expiresAt && new Date(attempt.expiresAt) < new Date()) {
      attempt.status = enumData.ATTEMPT_STATUS.EXPIRED.code;
      await this.assessmentAttemptRepo.save(attempt);
      throw new BadRequestException('Lượt làm bài đã hết hạn');
    }
    attempt.lastHeartbeatAt = new Date();
    attempt.focusLossCount = dto.focusLossCount ?? attempt.focusLossCount ?? 0;
    await this.assessmentAttemptRepo.save(attempt);
    return { message: this.i18n.commonTranslate('update_success'), data: { id: attempt.id } };
  }

  private gradeAttemptQuestion(attemptQuestion: any, answerJson?: Record<string, unknown>) {
    const typeCode =
      this.typeCodeOf(attemptQuestion.questionSnapshotJson) || this.typeCodeOf(attemptQuestion);
    if (this.subjectiveType(typeCode) || !AUTO_GRADE_TYPES.includes(typeCode)) {
      return {
        isCorrect: null as boolean | null,
        scoreAwarded: 0,
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
    };
  }

  async saveAnswer(id: string, dto: SaveAssessmentAnswerDto, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (attempt.status !== enumData.ATTEMPT_STATUS.IN_PROGRESS.code) {
      throw new BadRequestException('Lượt làm bài đã kết thúc');
    }
    if (attempt.expiresAt && new Date(attempt.expiresAt) < new Date()) {
      attempt.status = enumData.ATTEMPT_STATUS.EXPIRED.code;
      await this.assessmentAttemptRepo.save(attempt);
      throw new BadRequestException('Lượt làm bài đã hết hạn');
    }
    const attemptQuestion = await this.attemptQuestionRepo.findOne({
      where: { id: dto.attemptQuestionId, attemptId: id, isDeleted: false },
    });
    if (!attemptQuestion)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_item'));
    const existing = await this.attemptAnswerRepo.findOne({
      where: { attemptQuestionId: dto.attemptQuestionId },
    });
    const answerJson = dto.answerJson || {
      ...(existing?.answerJson || {}),
      ...(dto.answerText ? { text: dto.answerText } : {}),
      ...(dto.audioAssetId ? { audioAssetId: dto.audioAssetId } : {}),
    };
    const shouldGrade =
      attempt.assessment?.showAnswersPolicy === enumData.SHOW_ANSWERS_POLICY.IMMEDIATE.code;
    const grade = shouldGrade
      ? this.gradeAttemptQuestion(attemptQuestion, answerJson)
      : {
          isCorrect: undefined as boolean | null | undefined,
          scoreAwarded: undefined as number | undefined,
          gradingStatus: enumData.GRADING_STATUS.PENDING.code,
        };
    const eventType = dto.audioAssetId
      ? 'audio_uploaded'
      : dto.answerText
        ? 'text_changed'
        : 'option_selected';
    const eventsJson = [
      ...((existing?.eventsJson || []) as Record<string, unknown>[]),
      {
        eventType,
        payload: {
          attemptQuestionId: dto.attemptQuestionId,
          hasAnswerJson: Boolean(dto.answerJson),
          hasAnswerText: Boolean(dto.answerText),
        },
        occurredAt: new Date().toISOString(),
      },
    ];
    const answer = await this.attemptAnswerRepo.save(
      this.attemptAnswerRepo.create({
        ...(existing || {}),
        id: existing?.id || uuidv4(),
        attemptQuestionId: dto.attemptQuestionId,
        answerJson,
        answeredAt: new Date(),
        eventsJson,
        isCorrect: grade.isCorrect === null ? undefined : grade.isCorrect,
        scoreAwarded: grade.scoreAwarded,
        updatedBy: existing ? user.id : undefined,
        createdBy: existing ? existing.createdBy : user.id,
      }),
    );
    return { message: this.i18n.commonTranslate('update_success'), data: transformKeys(answer) };
  }

  private async upsertWrongItem(userId: string, questionId: string, attemptAnswerId: string) {
    const existing = await this.userErrorItemRepo.findOne({ where: { userId, questionId } });
    if (existing) {
      existing.occurrenceCount = Number(existing.occurrenceCount || 0) + 1;
      existing.lastOccurredAt = new Date();
      existing.sourceType = 'attempt_answer';
      existing.sourceId = attemptAnswerId;
      existing.isResolved = false;
      await this.userErrorItemRepo.save(existing);
      return;
    }
    await this.userErrorItemRepo.save(
      this.userErrorItemRepo.create({
        id: uuidv4(),
        userId,
        questionId,
        sourceType: 'attempt_answer',
        sourceId: attemptAnswerId,
        errorType: enumData.ERROR_TYPE.COMPREHENSION.code,
        description: 'Sai câu trong đề thi',
        occurrenceCount: 1,
        lastOccurredAt: new Date(),
      }),
    );
  }

  private subjectiveType(typeCode: string) {
    return (
      typeCode === enumData.QUESTION_TYPE_CODE.ESSAY.code ||
      typeCode === enumData.QUESTION_TYPE_CODE.AUDIO_RECORD.code
    );
  }

  private async createAnswerEvaluation(answerId: string, question: any, user: UserDto) {
    const typeCode = this.typeCodeOf(question.questionSnapshotJson);
    if (!this.subjectiveType(typeCode)) return;
    const exist = await this.answerEvaluationRepo.findOne({
      where: { attemptAnswerId: answerId, isDeleted: false },
    });
    if (exist) return;
    const rubricId = (question.questionSnapshotJson as any)?.rubricId;
    let rubric = rubricId
      ? await this.rubricRepo.findOne({ where: { id: rubricId, isDeleted: false } })
      : null;
    if (!rubric) {
      rubric = await this.rubricRepo.findOne({
        where: { isDeleted: false },
        order: { createdAt: 'ASC' },
      });
    }
    await this.answerEvaluationRepo.save(
      this.answerEvaluationRepo.create({
        id: uuidv4(),
        attemptAnswerId: answerId,
        rubricId: rubric?.id,
        graderType: enumData.GRADER_TYPE.AI.code,
        status: enumData.AI_JOB_STATUS.PENDING.code,
        createdBy: user.id,
      }),
    );
  }

  @DefTransaction()
  async submitAttempt(id: string, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (attempt.status !== enumData.ATTEMPT_STATUS.IN_PROGRESS.code) {
      return this.getResult(id, user);
    }
    const questions = await this.attemptQuestionRepo.find({
      where: { attemptId: id, isDeleted: false },
      relations: { answer: true },
      order: { sortOrder: 'ASC' },
    });
    let objectiveScore = 0;
    let pendingSubjective = 0;
    const results: Array<{
      attemptQuestionId?: string;
      questionId: string;
      isCorrect: boolean | null;
      scoreAwarded: number;
    }> = [];
    for (const question of questions) {
      const answer =
        question.answer ||
        (await this.attemptAnswerRepo.save(
          this.attemptAnswerRepo.create({
            id: uuidv4(),
            attemptQuestionId: question.id,
            answerJson: {},
            gradingStatus: enumData.GRADING_STATUS.PENDING.code,
            answeredAt: new Date(),
            createdBy: user.id,
          }),
        ));
      const grade = this.gradeAttemptQuestion(question, answer.answerJson);
      Object.assign(answer, {
        isCorrect: grade.isCorrect === null ? undefined : grade.isCorrect,
        scoreAwarded: grade.scoreAwarded,
        updatedBy: user.id,
      });
      const saved = await this.attemptAnswerRepo.save(answer);
      if (this.subjectiveType(this.typeCodeOf(question.questionSnapshotJson))) {
        await this.createAnswerEvaluation(saved.id, question, user);
        pendingSubjective += 1;
      }
      results.push({
        attemptQuestionId: question.id,
        questionId: question.questionId,
        isCorrect: grade.isCorrect,
        scoreAwarded: grade.scoreAwarded,
      });
    }

    const totalScore = objectiveScore;
    attempt.status =
      pendingSubjective > 0
        ? enumData.ATTEMPT_STATUS.SUBMITTED.code
        : enumData.ATTEMPT_STATUS.GRADED.code;
    attempt.submittedAt = new Date();
    attempt.objectiveScore = objectiveScore;
    attempt.subjectiveScore = pendingSubjective > 0 ? undefined : 0;
    attempt.totalScore = totalScore;
    attempt.convertedScore = totalScore;
    attempt.gradingStatus =
      pendingSubjective > 0
        ? enumData.GRADING_STATUS.PENDING.code
        : enumData.GRADING_STATUS.COMPLETED.code;
    attempt.resultJson = { items: results };
    attempt.updatedBy = user.id;
    await this.assessmentAttemptRepo.save(attempt);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AssessmentAttemptEntity',
      id,
      'Nộp bài đánh giá',
    );
    return this.getResult(id, user);
  }

  async getResult(id: string, user: UserDto) {
    const attempt = await this.loadAttemptOrFail(id, user.id);
    if (
      !(
        [enumData.ATTEMPT_STATUS.SUBMITTED.code, enumData.ATTEMPT_STATUS.GRADED.code] as string[]
      ).includes(attempt.status)
    ) {
      throw new BadRequestException('Chưa nộp bài');
    }
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: this.sanitizeAttempt(attempt, this.canShowAnswers(attempt.assessment, attempt.status)),
    };
  }

  async paginationRubrics(body: PaginationDto<FilterRubricDto>) {
    const { skip = 0, take = 20, where = {} as FilterRubricDto } = body;
    const whereCon: FindOptionsWhere<RubricEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.rubricRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findRubric(id: string) {
    const item = await this.rubricRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric'));
    const criteria = this.rubricCriteria(item);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys({ ...item, criteria }),
    };
  }

  @DefTransaction()
  async createRubric(dto: CreateRubricDto, user: UserDto) {
    const exist = await this.rubricRepo.findOne({ where: { code: dto.code } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const name = (dto.name || dto.title || dto.code).trim();
    const item = await this.rubricRepo.save(
      this.rubricRepo.create({
        id: uuidv4(),
        examTypeId: dto.examTypeId,
        code: dto.code,
        name,
        skillCode: dto.skillCode,
        maxScore: dto.maxScore ?? 9,
        criteriaJson: dto.criteriaJson || [],
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'RubricEntity',
      item.id,
      `Tạo rubric: ${item.code}`,
    );
    return this.findRubric(item.id);
  }

  @DefTransaction()
  async updateRubric(id: string, dto: UpdateRubricDto, user: UserDto) {
    const item = await this.rubricRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric'));
    if (dto.code && dto.code !== item.code) {
      const exist = await this.rubricRepo.findOne({ where: { code: dto.code } });
      if (exist && exist.id !== id)
        throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    Object.assign(item, {
      examTypeId: dto.examTypeId ?? item.examTypeId,
      code: dto.code ?? item.code,
      name: (dto.name || dto.title || item.name).trim(),
      skillCode: dto.skillCode ?? item.skillCode,
      maxScore: dto.maxScore ?? item.maxScore,
      criteriaJson: dto.criteriaJson ?? item.criteriaJson,
      updatedBy: user.id,
    });
    await this.rubricRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'RubricEntity',
      id,
      `Cập nhật rubric: ${item.code}`,
    );
    return this.findRubric(id);
  }

  @DefTransaction()
  async deactivateRubric(id: string, user: UserDto) {
    const item = await this.rubricRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.rubricRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'RubricEntity',
      id,
      `Ngưng rubric: ${item.code}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activateRubric(id: string, user: UserDto) {
    const item = await this.rubricRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.rubricRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'RubricEntity',
      id,
      `Kích hoạt rubric: ${item.code}`,
    );
    return this.findRubric(id);
  }

  @DefTransaction()
  async createRubricCriterion(dto: CreateRubricCriterionDto, user: UserDto) {
    const rubric = await this.rubricRepo.findOne({ where: { id: dto.rubricId, isDeleted: false } });
    if (!rubric) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric'));
    const criteria = this.rubricCriteria(rubric);
    if (criteria.some(item => item.code === dto.code)) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    const criterion: RubricCriterionJson = {
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      nameEn: dto.nameEn,
      description: dto.description,
      maxScore: dto.maxScore ?? 9,
      weight: dto.weight ?? 1,
      sortOrder: dto.sortOrder || 0,
    };
    rubric.criteriaJson = [...criteria, criterion];
    rubric.updatedBy = user.id;
    await this.rubricRepo.save(rubric);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'RubricEntity',
      rubric.id,
      `Tạo tiêu chí rubric: ${criterion.code}`,
    );
    return this.findRubric(dto.rubricId);
  }

  @DefTransaction()
  async updateRubricCriterion(id: string, dto: UpdateRubricCriterionDto, user: UserDto) {
    const rubrics = await this.rubricRepo.find({ where: { isDeleted: false } });
    const rubric = rubrics.find(item =>
      ((item.criteriaJson || []) as RubricCriterionJson[]).some(criterion => criterion.id === id),
    );
    if (!rubric)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric_criterion'));
    rubric.criteriaJson = ((rubric.criteriaJson || []) as RubricCriterionJson[]).map(criterion =>
      criterion.id === id
        ? {
            ...criterion,
            code: dto.code ?? criterion.code,
            name: dto.name ?? criterion.name,
            nameEn: dto.nameEn ?? criterion.nameEn,
            description: dto.description ?? criterion.description,
            maxScore: dto.maxScore ?? criterion.maxScore,
            weight: dto.weight ?? criterion.weight,
            sortOrder: dto.sortOrder ?? criterion.sortOrder,
          }
        : criterion,
    );
    rubric.updatedBy = user.id;
    await this.rubricRepo.save(rubric);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'RubricEntity',
      rubric.id,
      `Cập nhật tiêu chí rubric`,
    );
    return this.findRubric(rubric.id);
  }

  @DefTransaction()
  async deactivateRubricCriterion(id: string, user: UserDto) {
    const rubrics = await this.rubricRepo.find({ where: { isDeleted: false } });
    const rubric = rubrics.find(item =>
      ((item.criteriaJson || []) as RubricCriterionJson[]).some(criterion => criterion.id === id),
    );
    if (!rubric)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.rubric_criterion'));
    rubric.criteriaJson = ((rubric.criteriaJson || []) as RubricCriterionJson[]).map(criterion =>
      criterion.id === id ? { ...criterion, isDeleted: true } : criterion,
    );
    rubric.updatedBy = user.id;
    await this.rubricRepo.save(rubric);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'RubricEntity',
      rubric.id,
      `Ngưng tiêu chí rubric`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async paginationCertificateTemplates(_body: PaginationDto<FilterCertificateTemplateDto>) {
    this.certificateDeferred();
  }

  async findCertificateTemplate(_id: string) {
    this.certificateDeferred();
  }

  async createCertificateTemplate(_dto: CreateCertificateTemplateDto, _user: UserDto) {
    this.certificateDeferred();
  }

  async updateCertificateTemplate(_id: string, _dto: UpdateCertificateTemplateDto, _user: UserDto) {
    this.certificateDeferred();
  }

  async deactivateCertificateTemplate(_id: string, _user: UserDto) {
    this.certificateDeferred();
  }

  async activateCertificateTemplate(_id: string, _user: UserDto) {
    this.certificateDeferred();
  }

  @DefTransaction()
  async runGradingTask(id: string, user: UserDto, asOwner = false) {
    const evaluation = await this.answerEvaluationRepo.findOne({
      where: { id, isDeleted: false },
      relations: { rubric: true },
    });
    if (!evaluation)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grading_task'));
    if (!evaluation.attemptAnswerId) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_attempt'));
    }
    const answer = await this.attemptAnswerRepo.findOne({
      where: { id: evaluation.attemptAnswerId, isDeleted: false },
      relations: { attemptQuestion: { attempt: { assessment: true } } },
    });
    const attempt = answer?.attemptQuestion?.attempt;
    if (!attempt)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assessment_attempt'));
    if (asOwner && attempt.userId !== user.id) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.grading_task'));
    }

    const criteria = this.rubricCriteria(evaluation.rubric);
    const passing = Number(attempt.assessment?.passingScore || 70);
    const heuristicScore = Math.min(passing, 70);
    const answerText =
      String((answer.answerJson as any)?.text || '') || JSON.stringify(answer.answerJson || {});
    let overallScore = heuristicScore;
    let generalFeedback = 'Heuristic grade: server-side score, not a claimed IELTS band.';
    let criterionPayload = criteria.map(criterion => ({
      code: criterion.code,
      score: Math.min(heuristicScore, Number(criterion.maxScore || heuristicScore)),
      comment: 'Heuristic',
    }));
    let modelUsed = 'heuristic';
    let promptTokens = 0;
    let completionTokens = 0;
    const ai = await gradeWithChatCompletion({
      prompt: `Rubric: ${evaluation.rubric?.name}\nCriteria: ${JSON.stringify(criteria.map(item => ({ code: item.code, name: item.name, maxScore: item.maxScore })))}\nAnswer:\n${answerText}`,
    }).catch(() => null);
    if (ai) {
      overallScore = Number(ai.overallScore || heuristicScore);
      generalFeedback = ai.generalFeedback || generalFeedback;
      if (ai.criterionScores.length) {
        criterionPayload = criteria.map(criterion => {
          const found = ai.criterionScores.find(item => item.code === criterion.code);
          return {
            code: criterion.code,
            score: Number(
              found?.score ?? Math.min(overallScore, Number(criterion.maxScore || overallScore)),
            ),
            comment: found?.comment,
          };
        });
      }
      modelUsed = ai.modelUsed;
      promptTokens = ai.promptTokens;
      completionTokens = ai.completionTokens;
    }

    evaluation.status = enumData.AI_JOB_STATUS.COMPLETED.code;
    evaluation.overallScore = overallScore;
    evaluation.criteriaScoresJson = { items: criterionPayload, provider: modelUsed };
    evaluation.generalFeedback = generalFeedback;
    evaluation.aiModel = modelUsed;
    evaluation.aiPromptTokens = promptTokens;
    evaluation.aiCompletionTokens = completionTokens;
    evaluation.aiRawResponseJson = ai
      ? {
          content: ai.rawContent,
          overallScore: ai.overallScore,
          criterionScores: ai.criterionScores,
        }
      : { provider: 'heuristic' };
    evaluation.evaluatedAt = new Date();
    evaluation.graderType =
      modelUsed === 'heuristic' ? enumData.GRADER_TYPE.SYSTEM.code : enumData.GRADER_TYPE.AI.code;
    evaluation.graderUserId = modelUsed === 'heuristic' ? user.id : undefined;
    evaluation.updatedBy = user.id;
    await this.answerEvaluationRepo.save(evaluation);

    answer.scoreAwarded = overallScore;
    answer.gradingStatus = enumData.GRADING_STATUS.COMPLETED.code;
    await this.attemptAnswerRepo.save(answer);

    const attemptQuestions = await this.attemptQuestionRepo.find({
      where: { attemptId: attempt.id, isDeleted: false },
      relations: { answer: true },
    });
    const subjectiveScore = attemptQuestions.reduce((sum, question) => {
      const typeCode = this.typeCodeOf(question.questionSnapshotJson);
      if ((AUTO_GRADE_TYPES as string[]).includes(typeCode)) return sum;
      return sum + Number(question.answer?.scoreAwarded || 0);
    }, 0);
    attempt.subjectiveScore = subjectiveScore;
    attempt.totalScore = Number(attempt.objectiveScore || 0) + subjectiveScore;
    attempt.convertedScore = attempt.totalScore;
    const answerIds = attemptQuestions.map(question => question.answer?.id).filter(Boolean);
    const pendingForAttempt = answerIds.length
      ? await this.answerEvaluationRepo.count({
          where: {
            attemptAnswerId: In(answerIds as string[]),
            status: enumData.AI_JOB_STATUS.PENDING.code,
            isDeleted: false,
          },
        })
      : 0;
    if (!pendingForAttempt) {
      attempt.status = enumData.ATTEMPT_STATUS.GRADED.code;
      attempt.gradingStatus = enumData.GRADING_STATUS.COMPLETED.code;
    }
    await this.assessmentAttemptRepo.save(attempt);
    await this.notificationService.notify(
      attempt.userId,
      'grading_ready',
      'Bài đã được chấm',
      generalFeedback,
      `/practice/${attempt.assessmentId}`,
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AnswerEvaluationEntity',
      id,
      `Chấm bài ${modelUsed}`,
    );
    return {
      message: this.i18n.commonTranslate('save_success'),
      data: transformKeys({ evaluation, overallScore, modelUsed }),
    };
  }

  private async findExamTypeByCode(code: string) {
    const item = await this.examTypeRepo.findOne({
      where: { code: code.trim(), isDeleted: false },
    });
    if (!item) throw new NotFoundException(`Không tìm thấy loại kỳ thi mã ${code}`);
    return item;
  }

  async importAssessments(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const examType = await this.findExamTypeByCode(requireText(item.examTypeCode, 'Mã kỳ thi'));
      const title = requireText(item.title, 'Tiêu đề');
      const created = await this.create(
        {
          examTypeId: examType.id,
          assessmentType: requireText(item.assessmentType, 'Loại đề'),
          title,
          slug: optionalText(item.slug) || slugifyText(title),
          description: optionalText(item.description),
          durationSeconds: optionalNumber(item.durationSeconds, 0),
          maxAttempts: optionalNumber(item.maxAttempts),
          passingScore: optionalNumber(item.passingScore),
          selectionMode: optionalText(item.selectionMode),
          showAnswersPolicy: optionalText(item.showAnswersPolicy),
          status: optionalText(item.status),
          isFree: String(item.isFree ?? 'true').toLowerCase() !== 'false',
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportAssessments(body: PaginationDto<FilterAssessmentDto>) {
    const { data } = await this.pagination({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importRubrics(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const examTypeCode = optionalText(item.examTypeCode);
      const examType = examTypeCode ? await this.findExamTypeByCode(examTypeCode) : null;
      const created = await this.createRubric(
        {
          examTypeId: examType?.id,
          code: requireText(item.code, 'Mã'),
          name: optionalText(item.name) || optionalText(item.title),
          title: optionalText(item.title),
          skillCode: optionalText(item.skillCode),
          maxScore: optionalNumber(item.maxScore, 9),
          description: optionalText(item.description),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportRubrics(body: PaginationDto<FilterRubricDto>) {
    const { data } = await this.paginationRubrics({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
