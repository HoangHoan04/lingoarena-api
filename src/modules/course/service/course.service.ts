import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  slugifyText,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { CourseEntity } from '~/entities';
import {
  CourseEnrollmentRepo,
  CourseRepo,
  CourseReviewRepo,
  CourseSectionRepo,
  ExamTypeRepo,
  LessonBlockRepo,
  LessonProgressRepo,
  LessonRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateCourseDto,
  CreateCourseInstructorDto,
  CreateCourseReviewDto,
  CreateCourseSectionDto,
  CreateCourseVersionDto,
  CreateLessonBlockDto,
  CreateLessonDto,
  EnrollCourseDto,
  FilterCourseDto,
  UpdateCourseDto,
  UpdateCourseSectionDto,
  UpdateLessonBlockDto,
  UpdateLessonDto,
  UpdateLessonProgressDto,
} from '../dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepo: CourseRepo,
    private readonly courseSectionRepo: CourseSectionRepo,
    private readonly lessonRepo: LessonRepo,
    private readonly lessonBlockRepo: LessonBlockRepo,
    private readonly courseEnrollmentRepo: CourseEnrollmentRepo,
    private readonly courseReviewRepo: CourseReviewRepo,
    private readonly lessonProgressRepo: LessonProgressRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
    private readonly examTypeRepo: ExamTypeRepo,
  ) {}

  private actorName(user: UserDto) {
    return user?.fullName || user?.name || user?.username || user?.email || 'Admin';
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

  private sortCourseTree(course: CourseEntity) {
    course.sections = (course.sections || [])
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    course.sections.forEach(section => {
      section.lessons = (section.lessons || [])
        .filter(lesson => !lesson.isDeleted)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      section.lessons.forEach(lesson => {
        lesson.blocks = (lesson.blocks || [])
          .filter(block => !block.isDeleted)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      });
    });
    return course;
  }

  private async assertUniqueCode(code: string, excludeId?: string) {
    const exist = await this.courseRepo.findOne({ where: { code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const exist = await this.courseRepo.findOne({ where: { slug } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  private assertP3BlockType(blockType: string) {
    const allowed: string[] = [
      enumData.LESSON_BLOCK_TYPE.TEXT.code,
      enumData.LESSON_BLOCK_TYPE.MARKDOWN.code,
      enumData.LESSON_BLOCK_TYPE.VIDEO.code,
    ];
    if (!allowed.includes(blockType)) {
      throw new BusinessException('Lesson block type must be TEXT, MARKDOWN, or VIDEO');
    }
  }

  private courseRelations(withTree = false) {
    return withTree
      ? { examType: true, sections: { lessons: { blocks: true } } }
      : { examType: true };
  }

  private async findCourseEntity(id: string, withTree = false) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: this.courseRelations(withTree),
    });
    if (!course) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    return withTree ? this.sortCourseTree(course) : course;
  }

  private resolveCourseId(dto: { courseId?: string; courseVersionId?: string }) {
    const courseId = dto.courseId || dto.courseVersionId;
    if (!courseId) throw new BadRequestException('Thiếu courseId');
    return courseId;
  }

  async pagination(body: PaginationDto<FilterCourseDto>) {
    const { skip = 0, take = 20, where = {} as FilterCourseDto } = body;
    const whereCon: FindOptionsWhere<CourseEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.title = UnaccentILike(`%${where.keyword}%`);
    if (where.examTypeId) whereCon.examTypeId = where.examTypeId;
    if (where.status) whereCon.status = where.status;
    if (where.visibility) whereCon.visibility = where.visibility;
    const [data, total] = await this.courseRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { examType: true },
    });
    return { data: transformKeys(data), total };
  }

  async find(id: string) {
    const course = await this.findCourseEntity(id, true);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(course) };
  }

  @DefTransaction()
  async create(dto: CreateCourseDto, user: UserDto) {
    await this.assertUniqueCode(dto.code.trim());
    await this.assertUniqueSlug(dto.slug.trim());
    const item = await this.courseRepo.save(
      this.courseRepo.create({
        id: uuidv4(),
        examTypeId: dto.examTypeId || null,
        code: dto.code.trim(),
        slug: dto.slug.trim(),
        title: dto.title.trim(),
        titleEn: dto.titleEn?.trim() || dto.title.trim(),
        shortDescription: dto.shortDescription,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        levelFrom: dto.levelFrom,
        levelTo: dto.levelTo,
        estimatedMinutes: dto.estimatedMinutes,
        visibility: dto.visibility || enumData.VISIBILITY.PUBLIC.code,
        instructorsJson: [],
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'CourseEntity',
      item.id,
      `Tạo khóa học: ${item.title}`,
    );
    return this.find(item.id);
  }

  @DefTransaction()
  async update(id: string, dto: UpdateCourseDto, user: UserDto) {
    const item = await this.findCourseEntity(id);
    if (dto.code) await this.assertUniqueCode(dto.code.trim(), id);
    if (dto.slug) await this.assertUniqueSlug(dto.slug.trim(), id);
    Object.assign(item, {
      examTypeId: dto.examTypeId ?? item.examTypeId,
      code: dto.code?.trim() || item.code,
      slug: dto.slug?.trim() || item.slug,
      title: dto.title?.trim() || item.title,
      titleEn: dto.titleEn?.trim() || dto.title?.trim() || item.titleEn,
      shortDescription: dto.shortDescription ?? item.shortDescription,
      description: dto.description ?? item.description,
      thumbnailUrl: dto.thumbnailUrl ?? item.thumbnailUrl,
      levelFrom: dto.levelFrom ?? item.levelFrom,
      levelTo: dto.levelTo ?? item.levelTo,
      estimatedMinutes: dto.estimatedMinutes ?? item.estimatedMinutes,
      visibility: dto.visibility || item.visibility,
      updatedBy: user.id,
    });
    await this.courseRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'CourseEntity',
      id,
      `Cập nhật khóa học: ${item.title}`,
    );
    return this.find(id);
  }

  @DefTransaction()
  async publish(id: string, user: UserDto) {
    const course = await this.findCourseEntity(id);
    course.status = enumData.COURSE_STATUS.PUBLISHED.code;
    course.publishedAt = new Date();
    course.updatedBy = user.id;
    await this.courseRepo.save(course);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.APPROVE.code,
      'CourseEntity',
      id,
      `Xuất bản khóa học: ${course.title}`,
    );
    return this.find(id);
  }

  @DefTransaction()
  async deactivate(id: string, user: UserDto) {
    const item = await this.courseRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.courseRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'CourseEntity',
      id,
      `Ngưng khóa học: ${item.title}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activate(id: string, user: UserDto) {
    const item = await this.findCourseEntity(id);
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.courseRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'CourseEntity',
      id,
      `Kích hoạt khóa học: ${item.title}`,
    );
    return this.find(id);
  }

  async createVersion(dto: CreateCourseVersionDto, user: UserDto) {
    await this.findCourseEntity(dto.courseId);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'CourseEntity',
      dto.courseId,
      'Phiên bản khóa học đã gộp vào course; không tạo bản ghi riêng',
    );
    return this.find(dto.courseId);
  }

  async publishVersion(id: string, user: UserDto) {
    return this.publish(id, user);
  }

  @DefTransaction()
  async createSection(dto: CreateCourseSectionDto, user: UserDto) {
    const courseId = this.resolveCourseId(dto);
    await this.findCourseEntity(courseId);
    const item = await this.courseSectionRepo.save(
      this.courseSectionRepo.create({
        id: uuidv4(),
        courseId,
        title: dto.title.trim(),
        titleEn: dto.titleEn?.trim() || dto.title.trim(),
        description: dto.description,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'CourseSectionEntity',
      item.id,
      `Tạo chương: ${item.title}`,
    );
    return this.find(courseId);
  }

  @DefTransaction()
  async updateSection(id: string, dto: UpdateCourseSectionDto, user: UserDto) {
    const item = await this.courseSectionRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_section'));
    Object.assign(item, {
      courseId: dto.courseId || dto.courseVersionId || item.courseId,
      title: dto.title?.trim() || item.title,
      titleEn: dto.titleEn?.trim() || dto.title?.trim() || item.titleEn,
      description: dto.description ?? item.description,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.courseSectionRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'CourseSectionEntity',
      id,
      `Cập nhật chương: ${item.title}`,
    );
    return this.find(item.courseId);
  }

  @DefTransaction()
  async deactivateSection(id: string, user: UserDto) {
    const item = await this.courseSectionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_section'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.courseSectionRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'CourseSectionEntity',
      id,
      `Ngưng chương: ${item.title}`,
    );
    return this.find(item.courseId);
  }

  @DefTransaction()
  async createLesson(dto: CreateLessonDto, user: UserDto) {
    const section = await this.courseSectionRepo.findOne({
      where: { id: dto.courseSectionId, isDeleted: false },
    });
    if (!section)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_section'));
    const item = await this.lessonRepo.save(
      this.lessonRepo.create({
        id: uuidv4(),
        courseSectionId: dto.courseSectionId,
        title: dto.title.trim(),
        lessonType: dto.lessonType || enumData.LESSON_TYPE.LECTURE.code,
        estimatedMinutes: dto.estimatedMinutes,
        isPreview: dto.isPreview ?? false,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'LessonEntity',
      item.id,
      `Tạo bài học: ${item.title}`,
    );
    return this.find(section.courseId);
  }

  @DefTransaction()
  async updateLesson(id: string, dto: UpdateLessonDto, user: UserDto) {
    const item = await this.lessonRepo.findOne({
      where: { id },
      relations: { courseSection: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    Object.assign(item, {
      courseSectionId: dto.courseSectionId || item.courseSectionId,
      title: dto.title?.trim() || item.title,
      lessonType: dto.lessonType || item.lessonType,
      estimatedMinutes: dto.estimatedMinutes ?? item.estimatedMinutes,
      isPreview: dto.isPreview ?? item.isPreview,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.lessonRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'LessonEntity',
      id,
      `Cập nhật bài học: ${item.title}`,
    );
    return this.find(item.courseSection.courseId);
  }

  @DefTransaction()
  async publishLesson(id: string, user: UserDto) {
    const item = await this.lessonRepo.findOne({
      where: { id, isDeleted: false },
      relations: { courseSection: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    item.updatedBy = user.id;
    await this.lessonRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.APPROVE.code,
      'LessonEntity',
      id,
      `Xuất bản bài học: ${item.title}`,
    );
    return this.find(item.courseSection.courseId);
  }

  @DefTransaction()
  async createBlock(dto: CreateLessonBlockDto, user: UserDto) {
    this.assertP3BlockType(dto.blockType);
    const lesson = await this.lessonRepo.findOne({
      where: { id: dto.lessonId, isDeleted: false },
      relations: { courseSection: true },
    });
    if (!lesson) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    const contentJson = {
      ...(dto.contentJson || {}),
      ...(dto.mediaAssetId ? { mediaAssetId: dto.mediaAssetId } : {}),
    };
    const item = await this.lessonBlockRepo.save(
      this.lessonBlockRepo.create({
        id: uuidv4(),
        lessonId: dto.lessonId,
        blockType: dto.blockType,
        contentJson,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'LessonBlockEntity',
      item.id,
      `Tạo nội dung bài học: ${lesson.title}`,
    );
    return this.find(lesson.courseSection.courseId);
  }

  @DefTransaction()
  async updateBlock(id: string, dto: UpdateLessonBlockDto, user: UserDto) {
    if (dto.blockType) this.assertP3BlockType(dto.blockType);
    const item = await this.lessonBlockRepo.findOne({
      where: { id },
      relations: { lesson: { courseSection: true } },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson_block'));
    const contentJson = {
      ...(dto.contentJson || item.contentJson || {}),
      ...(dto.mediaAssetId ? { mediaAssetId: dto.mediaAssetId } : {}),
    };
    Object.assign(item, {
      lessonId: dto.lessonId || item.lessonId,
      blockType: dto.blockType || item.blockType,
      contentJson,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.lessonBlockRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'LessonBlockEntity',
      id,
      'Cập nhật nội dung bài học',
    );
    return this.find(item.lesson.courseSection.courseId);
  }

  @DefTransaction()
  async deactivateBlock(id: string, user: UserDto) {
    const item = await this.lessonBlockRepo.findOne({
      where: { id, isDeleted: false },
      relations: { lesson: { courseSection: true } },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson_block'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.lessonBlockRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'LessonBlockEntity',
      id,
      'Ngưng nội dung bài học',
    );
    return this.find(item.lesson.courseSection.courseId);
  }

  async publicPagination(body: PaginationDto<FilterCourseDto>) {
    return this.pagination({
      ...body,
      where: {
        ...(body?.where || {}),
        status: enumData.COURSE_STATUS.PUBLISHED.code,
        visibility: enumData.VISIBILITY.PUBLIC.code,
        isDeleted: false,
      },
    });
  }

  async findBySlug(slug: string) {
    const course = await this.courseRepo.findOne({
      where: {
        slug,
        status: enumData.COURSE_STATUS.PUBLISHED.code,
        visibility: enumData.VISIBILITY.PUBLIC.code,
        isDeleted: false,
      },
      relations: { examType: true, sections: { lessons: { blocks: true } } },
    });
    if (!course) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    this.sortCourseTree(course);
    course.sections?.forEach(section => {
      section.lessons = (section.lessons || []).filter(lesson => lesson.isDeleted === false);
    });
    const reviews = await this.courseReviewRepo.find({
      where: { courseId: course.id, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys({ ...course, reviews }),
    };
  }

  @DefTransaction()
  async enroll(userId: string, dto: EnrollCourseDto | string) {
    const courseId = typeof dto === 'string' ? dto : dto.courseId;
    const course = await this.courseRepo.findOne({
      where: {
        id: courseId,
        status: enumData.COURSE_STATUS.PUBLISHED.code,
        visibility: enumData.VISIBILITY.PUBLIC.code,
        isDeleted: false,
      },
    });
    if (!course) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    let enrollment = await this.courseEnrollmentRepo.findOne({ where: { userId, courseId } });
    const isNew = !enrollment;
    if (!enrollment) {
      enrollment = this.courseEnrollmentRepo.create({
        id: uuidv4(),
        userId,
        courseId,
        sourceType: enumData.ENTITLEMENT_SOURCE_TYPE.MANUAL_GRANT.code,
        status: enumData.ENROLLMENT_STATUS.ACTIVE.code,
        enrolledAt: new Date(),
      });
    } else {
      enrollment.status = enumData.ENROLLMENT_STATUS.ACTIVE.code;
      enrollment.sourceType =
        enrollment.sourceType || enumData.ENTITLEMENT_SOURCE_TYPE.MANUAL_GRANT.code;
      enrollment.enrolledAt = enrollment.enrolledAt || new Date();
      enrollment.isDeleted = false;
      enrollment.deletedAt = null;
    }
    await this.courseEnrollmentRepo.save(enrollment);
    if (isNew) {
      await this.courseRepo.increment({ id: courseId }, 'enrollmentCount', 1);
    }
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(enrollment) };
  }

  async myEnrollments(userId: string) {
    const data = await this.courseEnrollmentRepo.find({
      where: { userId, isDeleted: false },
      relations: { course: { examType: true } },
      order: { enrolledAt: 'DESC' },
    });
    return { data: transformKeys(data), total: data.length };
  }

  private async lessonCourse(lessonId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: {
        id: lessonId,
        isDeleted: false,
      },
      relations: {
        blocks: true,
        courseSection: { course: true },
      },
    });
    if (!lesson) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    lesson.blocks = (lesson.blocks || [])
      .filter(block => !block.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return lesson;
  }

  private enrolledStatuses() {
    return [
      enumData.ENROLLMENT_STATUS.ACTIVE.code,
      enumData.ENROLLMENT_STATUS.IN_PROGRESS.code,
      enumData.ENROLLMENT_STATUS.NOT_STARTED.code,
      enumData.ENROLLMENT_STATUS.COMPLETED.code,
    ];
  }

  async userLesson(lessonId: string, userId: string) {
    const lesson = await this.lessonCourse(lessonId);
    const course = lesson.courseSection?.course;
    if (
      !course ||
      course.status !== enumData.COURSE_STATUS.PUBLISHED.code ||
      course.visibility !== enumData.VISIBILITY.PUBLIC.code ||
      course.isDeleted
    ) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    }
    if (!lesson.isPreview) {
      const enrollment = await this.courseEnrollmentRepo.findOne({
        where: {
          userId,
          courseId: course.id,
          status: In(this.enrolledStatuses()),
          isDeleted: false,
        },
      });
      if (!enrollment)
        throw new NotFoundException(
          this.i18n.commonTranslate('entity_not_found.course_enrollment'),
        );
    }
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(lesson) };
  }

  @DefTransaction()
  async updateProgress(lessonId: string, userId: string, dto: UpdateLessonProgressDto) {
    const lesson = await this.lessonCourse(lessonId);
    const course = lesson.courseSection?.course;
    if (!lesson.isPreview) {
      const enrollment = await this.courseEnrollmentRepo.findOne({
        where: {
          userId,
          courseId: course.id,
          status: In(this.enrolledStatuses()),
          isDeleted: false,
        },
      });
      if (!enrollment)
        throw new NotFoundException(
          this.i18n.commonTranslate('entity_not_found.course_enrollment'),
        );
    }
    let progress = await this.lessonProgressRepo.findOne({ where: { userId, lessonId } });
    const now = new Date();
    const nextPercent = Math.max(
      0,
      Math.min(100, Number(dto.progressPercent ?? progress?.progressPercent ?? 0)),
    );
    const nextStatus =
      dto.status ||
      (nextPercent >= 100
        ? enumData.PROGRESS_STATUS.COMPLETED.code
        : enumData.PROGRESS_STATUS.IN_PROGRESS.code);
    const lastPositionJson = dto.lastPositionJson || {
      ...(progress?.lastPositionJson || {}),
      ...(dto.lastBlockId || dto.blockId ? { blockId: dto.blockId || dto.lastBlockId } : {}),
    };
    if (!progress) {
      progress = this.lessonProgressRepo.create({
        id: uuidv4(),
        userId,
        lessonId,
        status: nextStatus,
        progressPercent: nextPercent,
        lastPositionJson,
        completedAt: nextStatus === enumData.PROGRESS_STATUS.COMPLETED.code ? now : null,
      });
    } else {
      progress.status = nextStatus;
      progress.progressPercent = nextPercent;
      progress.lastPositionJson = lastPositionJson;
      progress.completedAt =
        nextStatus === enumData.PROGRESS_STATUS.COMPLETED.code
          ? progress.completedAt || now
          : progress.completedAt;
    }
    await this.lessonProgressRepo.save(progress);
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(progress) };
  }

  async listInstructors(courseId: string) {
    const course = await this.findCourseEntity(courseId);
    const data = course.instructorsJson || [];
    return { data: transformKeys(data), total: data.length };
  }

  @DefTransaction()
  async createInstructor(dto: CreateCourseInstructorDto, user: UserDto) {
    const course = await this.findCourseEntity(dto.courseId);
    const instructors = [...(course.instructorsJson || [])];
    if (instructors.some(item => String(item.userId || '') === dto.userId)) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    const entry = {
      userId: dto.userId,
      role: dto.role || 'lead_instructor',
      assignedAt: new Date().toISOString(),
    };
    instructors.push(entry);
    course.instructorsJson = instructors;
    course.updatedBy = user.id;
    await this.courseRepo.save(course);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'CourseEntity',
      course.id,
      `Gán giảng viên khóa học`,
    );
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(entry) };
  }

  @DefTransaction()
  async createReview(courseId: string, dto: CreateCourseReviewDto, user: UserDto) {
    const course = await this.courseRepo.findOne({
      where: {
        id: courseId,
        status: enumData.COURSE_STATUS.PUBLISHED.code,
        isDeleted: false,
      },
    });
    if (!course) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    let review = await this.courseReviewRepo.findOne({ where: { courseId, userId: user.id } });
    if (!review) {
      review = this.courseReviewRepo.create({
        id: uuidv4(),
        courseId,
        userId: user.id,
        rating: dto.rating,
        comment: dto.comment,
        createdBy: user.id,
      });
    } else {
      review.rating = dto.rating;
      review.comment = dto.comment;
      review.isDeleted = false;
      review.deletedAt = null;
      review.updatedBy = user.id;
    }
    await this.courseReviewRepo.save(review);
    const reviews = await this.courseReviewRepo.find({
      where: { courseId, isDeleted: false },
    });
    const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    course.ratingAvg = reviews.length ? Number((sum / reviews.length).toFixed(2)) : undefined;
    await this.courseRepo.save(course);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'CourseReviewEntity',
      review.id,
      `Đánh giá khóa học: ${course.title}`,
    );
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(review) };
  }

  private async findExamTypeByCode(code: string) {
    const item = await this.examTypeRepo.findOne({
      where: { code: code.trim(), isDeleted: false },
    });
    if (!item) throw new NotFoundException(`Không tìm thấy loại kỳ thi mã ${code}`);
    return item;
  }

  async importCourses(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const examTypeCode = optionalText(item.examTypeCode);
      const examType = examTypeCode ? await this.findExamTypeByCode(examTypeCode) : null;
      const title = requireText(item.title, 'Tiêu đề');
      const code = requireText(item.code, 'Mã');
      const created = await this.create(
        {
          examTypeId: examType?.id,
          code,
          slug: optionalText(item.slug) || slugifyText(code),
          title,
          titleEn: optionalText(item.titleEn),
          shortDescription: optionalText(item.shortDescription),
          description: optionalText(item.description),
          thumbnailUrl: optionalText(item.thumbnailUrl),
          levelFrom: optionalText(item.levelFrom),
          levelTo: optionalText(item.levelTo),
          estimatedMinutes: optionalNumber(item.estimatedMinutes),
          visibility: optionalText(item.visibility),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportCourses(body: PaginationDto<FilterCourseDto>) {
    const { data } = await this.pagination({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
