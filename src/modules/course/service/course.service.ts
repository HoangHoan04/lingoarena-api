import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import { CourseEntity } from '~/entities';
import {
  CourseRepo,
  CourseVersionRepo,
  CourseInstructorRepo,
  CourseSectionRepo,
  LessonRepo,
  LessonBlockRepo,
  CourseEnrollmentRepo,
  CourseReviewRepo,
  LessonProgressRepo,
  LessonBlockProgressRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateCourseDto,
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
    private readonly courseVersionRepo: CourseVersionRepo,
    private readonly courseInstructorRepo: CourseInstructorRepo,
    private readonly courseSectionRepo: CourseSectionRepo,
    private readonly lessonRepo: LessonRepo,
    private readonly lessonBlockRepo: LessonBlockRepo,
    private readonly courseEnrollmentRepo: CourseEnrollmentRepo,
    private readonly courseReviewRepo: CourseReviewRepo,
    private readonly lessonProgressRepo: LessonProgressRepo,
    private readonly lessonBlockProgressRepo: LessonBlockProgressRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
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
    course.versions = (course.versions || [])
      .filter(version => !version.isDeleted)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    course.versions.forEach(version => {
      version.sections = (version.sections || [])
        .filter(section => !section.isDeleted)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      version.sections.forEach(section => {
        section.lessons = (section.lessons || [])
          .filter(lesson => !lesson.isDeleted)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        section.lessons.forEach(lesson => {
          lesson.blocks = (lesson.blocks || [])
            .filter(block => !block.isDeleted)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        });
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

  private async findCourseEntity(id: string, withTree = false) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: withTree
        ? { examType: true, versions: { sections: { lessons: { blocks: true } } } }
        : { examType: true },
    });
    if (!course) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    return withTree ? this.sortCourseTree(course) : course;
  }

  private async latestVersion(courseId: string) {
    return this.courseVersionRepo.findOne({
      where: { courseId, isDeleted: false },
      order: { versionNumber: 'DESC' },
    });
  }

  private async publishedVersion(courseId: string) {
    return this.courseVersionRepo.findOne({
      where: {
        courseId,
        status: enumData.COURSE_STATUS.PUBLISHED.code,
        isDeleted: false,
      },
      relations: { sections: { lessons: { blocks: true } } },
      order: { versionNumber: 'DESC' },
    });
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
        shortDescription: dto.shortDescription,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        levelFrom: dto.levelFrom || enumData.CEFR_LEVEL.A1.code,
        levelTo: dto.levelTo || enumData.CEFR_LEVEL.C1.code,
        estimatedMinutes: dto.estimatedMinutes || 0,
        status: dto.status || enumData.COURSE_STATUS.DRAFT.code,
        visibility: dto.visibility || enumData.VISIBILITY.PUBLIC.code,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'CourseEntity', item.id, `Tạo khóa học: ${item.title}`);
    return this.find(item.id);
  }

  async update(id: string, dto: UpdateCourseDto, user: UserDto) {
    const item = await this.findCourseEntity(id);
    if (dto.code) await this.assertUniqueCode(dto.code.trim(), id);
    if (dto.slug) await this.assertUniqueSlug(dto.slug.trim(), id);
    Object.assign(item, {
      examTypeId: dto.examTypeId || null,
      code: dto.code?.trim() || item.code,
      slug: dto.slug?.trim() || item.slug,
      title: dto.title?.trim() || item.title,
      shortDescription: dto.shortDescription,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      levelFrom: dto.levelFrom || item.levelFrom,
      levelTo: dto.levelTo || item.levelTo,
      estimatedMinutes: dto.estimatedMinutes ?? item.estimatedMinutes,
      status: dto.status || item.status,
      visibility: dto.visibility || item.visibility,
      updatedBy: user.id,
    });
    await this.courseRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'CourseEntity', id, `Cập nhật khóa học: ${item.title}`);
    return this.find(id);
  }

  async publish(id: string, user: UserDto) {
    const course = await this.findCourseEntity(id);
    const now = new Date();
    course.status = enumData.COURSE_STATUS.PUBLISHED.code;
    course.publishedAt = now;
    course.updatedBy = user.id;
    await this.courseRepo.save(course);

    let version = await this.latestVersion(id);
    if (!version) {
      version = await this.courseVersionRepo.save(
        this.courseVersionRepo.create({
          id: uuidv4(),
          courseId: id,
          versionNumber: 1,
          status: enumData.COURSE_STATUS.PUBLISHED.code,
          publishedAt: now,
          createdByUserId: user.id,
          createdBy: user.id,
        }),
      );
    } else {
      version.status = enumData.COURSE_STATUS.PUBLISHED.code;
      version.publishedAt = now;
      version.updatedBy = user.id;
      await this.courseVersionRepo.save(version);
    }
    await this.writeLog(user, enumData.ACTION_LOG.APPROVE.code, 'CourseEntity', id, `Xuất bản khóa học: ${course.title}`);
    return this.find(id);
  }

  async deactivate(id: string, user: UserDto) {
    const item = await this.courseRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.courseRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'CourseEntity', id, `Ngưng khóa học: ${item.title}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activate(id: string, user: UserDto) {
    const item = await this.findCourseEntity(id);
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.courseRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'CourseEntity', id, `Kích hoạt khóa học: ${item.title}`);
    return this.find(id);
  }

  async createVersion(dto: CreateCourseVersionDto, user: UserDto) {
    await this.findCourseEntity(dto.courseId);
    const latest = await this.latestVersion(dto.courseId);
    const item = await this.courseVersionRepo.save(
      this.courseVersionRepo.create({
        id: uuidv4(),
        courseId: dto.courseId,
        versionNumber: (latest?.versionNumber || 0) + 1,
        changeNote: dto.changeNote,
        status: enumData.COURSE_STATUS.DRAFT.code,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'CourseVersionEntity', item.id, `Tạo phiên bản khóa học ${item.versionNumber}`);
    return this.find(dto.courseId);
  }

  async publishVersion(id: string, user: UserDto) {
    const item = await this.courseVersionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_version'));
    item.status = enumData.COURSE_STATUS.PUBLISHED.code;
    item.publishedAt = new Date();
    item.updatedBy = user.id;
    await this.courseVersionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.APPROVE.code, 'CourseVersionEntity', id, `Xuất bản phiên bản khóa học ${item.versionNumber}`);
    return this.find(item.courseId);
  }

  async createSection(dto: CreateCourseSectionDto, user: UserDto) {
    const version = await this.courseVersionRepo.findOne({ where: { id: dto.courseVersionId, isDeleted: false } });
    if (!version) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_version'));
    const item = await this.courseSectionRepo.save(
      this.courseSectionRepo.create({
        id: uuidv4(),
        courseVersionId: dto.courseVersionId,
        title: dto.title.trim(),
        description: dto.description,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'CourseSectionEntity', item.id, `Tạo chương: ${item.title}`);
    return this.find(version.courseId);
  }

  async updateSection(id: string, dto: UpdateCourseSectionDto, user: UserDto) {
    const item = await this.courseSectionRepo.findOne({
      where: { id },
      relations: { courseVersion: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_section'));
    Object.assign(item, {
      courseVersionId: dto.courseVersionId || item.courseVersionId,
      title: dto.title?.trim() || item.title,
      description: dto.description,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.courseSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'CourseSectionEntity', id, `Cập nhật chương: ${item.title}`);
    const version = item.courseVersion || (await this.courseVersionRepo.findOne({ where: { id: item.courseVersionId } }));
    if (!version) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_version'));
    return this.find(version.courseId);
  }

  async deactivateSection(id: string, user: UserDto) {
    const item = await this.courseSectionRepo.findOne({ where: { id, isDeleted: false }, relations: { courseVersion: true } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_section'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.courseSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'CourseSectionEntity', id, `Ngưng chương: ${item.title}`);
    return this.find(item.courseVersion.courseId);
  }

  async createLesson(dto: CreateLessonDto, user: UserDto) {
    const section = await this.courseSectionRepo.findOne({ where: { id: dto.courseSectionId, isDeleted: false }, relations: { courseVersion: true } });
    if (!section) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_section'));
    const item = await this.lessonRepo.save(
      this.lessonRepo.create({
        id: uuidv4(),
        courseSectionId: dto.courseSectionId,
        title: dto.title.trim(),
        lessonType: dto.lessonType || enumData.LESSON_TYPE.LECTURE.code,
        estimatedMinutes: dto.estimatedMinutes ?? 15,
        isPreview: dto.isPreview ?? false,
        sortOrder: dto.sortOrder || 0,
        status: dto.status || enumData.LESSON_STATUS.DRAFT.code,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'LessonEntity', item.id, `Tạo bài học: ${item.title}`);
    return this.find(section.courseVersion.courseId);
  }

  async updateLesson(id: string, dto: UpdateLessonDto, user: UserDto) {
    const item = await this.lessonRepo.findOne({
      where: { id },
      relations: { courseSection: { courseVersion: true } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    Object.assign(item, {
      courseSectionId: dto.courseSectionId || item.courseSectionId,
      title: dto.title?.trim() || item.title,
      lessonType: dto.lessonType || item.lessonType,
      estimatedMinutes: dto.estimatedMinutes ?? item.estimatedMinutes,
      isPreview: dto.isPreview ?? item.isPreview,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      status: dto.status || item.status,
      updatedBy: user.id,
    });
    await this.lessonRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'LessonEntity', id, `Cập nhật bài học: ${item.title}`);
    return this.find(item.courseSection.courseVersion.courseId);
  }

  async publishLesson(id: string, user: UserDto) {
    const item = await this.lessonRepo.findOne({
      where: { id, isDeleted: false },
      relations: { courseSection: { courseVersion: true } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    item.status = enumData.LESSON_STATUS.PUBLISHED.code;
    item.updatedBy = user.id;
    await this.lessonRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.APPROVE.code, 'LessonEntity', id, `Xuất bản bài học: ${item.title}`);
    return this.find(item.courseSection.courseVersion.courseId);
  }

  async createBlock(dto: CreateLessonBlockDto, user: UserDto) {
    this.assertP3BlockType(dto.blockType);
    const lesson = await this.lessonRepo.findOne({
      where: { id: dto.lessonId, isDeleted: false },
      relations: { courseSection: { courseVersion: true } },
    });
    if (!lesson) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    const item = await this.lessonBlockRepo.save(
      this.lessonBlockRepo.create({
        id: uuidv4(),
        lessonId: dto.lessonId,
        blockType: dto.blockType,
        contentJson: dto.contentJson,
        mediaAssetId: dto.mediaAssetId || null,
        sortOrder: dto.sortOrder || 0,
        isRequired: dto.isRequired ?? true,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'LessonBlockEntity', item.id, `Tạo nội dung bài học: ${lesson.title}`);
    return this.find(lesson.courseSection.courseVersion.courseId);
  }

  async updateBlock(id: string, dto: UpdateLessonBlockDto, user: UserDto) {
    this.assertP3BlockType(dto.blockType);
    const item = await this.lessonBlockRepo.findOne({
      where: { id },
      relations: { lesson: { courseSection: { courseVersion: true } } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson_block'));
    Object.assign(item, {
      lessonId: dto.lessonId || item.lessonId,
      blockType: dto.blockType || item.blockType,
      contentJson: dto.contentJson || item.contentJson,
      mediaAssetId: dto.mediaAssetId || null,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      isRequired: dto.isRequired ?? item.isRequired,
      updatedBy: user.id,
    });
    await this.lessonBlockRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'LessonBlockEntity', id, 'Cập nhật nội dung bài học');
    return this.find(item.lesson.courseSection.courseVersion.courseId);
  }

  async deactivateBlock(id: string, user: UserDto) {
    const item = await this.lessonBlockRepo.findOne({
      where: { id, isDeleted: false },
      relations: { lesson: { courseSection: { courseVersion: true } } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson_block'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.lessonBlockRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'LessonBlockEntity', id, 'Ngưng nội dung bài học');
    return this.find(item.lesson.courseSection.courseVersion.courseId);
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
      relations: { examType: true },
    });
    if (!course) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course'));
    const version = await this.publishedVersion(course.id);
    course.versions = version ? [version] : [];
    this.sortCourseTree(course);
    course.versions.forEach(item => {
      item.sections?.forEach(section => {
        section.lessons = (section.lessons || []).filter(
          lesson => lesson.status === enumData.LESSON_STATUS.PUBLISHED.code,
        );
      });
    });
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(course) };
  }

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
    if (!enrollment) {
      enrollment = this.courseEnrollmentRepo.create({
        id: uuidv4(),
        userId,
        courseId,
        sourceType: 'admin_grant',
        status: enumData.ENROLLMENT_STATUS.ACTIVE.code,
        enrolledAt: new Date(),
      });
    } else {
      enrollment.status = enumData.ENROLLMENT_STATUS.ACTIVE.code;
      enrollment.sourceType = enrollment.sourceType || 'admin_grant';
      enrollment.enrolledAt = enrollment.enrolledAt || new Date();
    }
    await this.courseEnrollmentRepo.save(enrollment);
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
        status: enumData.LESSON_STATUS.PUBLISHED.code,
        isDeleted: false,
      },
      relations: { blocks: true, courseSection: { courseVersion: { course: true } } },
    });
    if (!lesson) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.lesson'));
    lesson.blocks = (lesson.blocks || [])
      .filter(block => !block.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return lesson;
  }

  async userLesson(lessonId: string, userId: string) {
    const lesson = await this.lessonCourse(lessonId);
    const course = lesson.courseSection?.courseVersion?.course;
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
          status: enumData.ENROLLMENT_STATUS.ACTIVE.code,
          isDeleted: false,
        },
      });
      if (!enrollment) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_enrollment'));
    }
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(lesson) };
  }

  async updateProgress(lessonId: string, userId: string, dto: UpdateLessonProgressDto) {
    const lesson = await this.lessonCourse(lessonId);
    const course = lesson.courseSection?.courseVersion?.course;
    if (!lesson.isPreview) {
      const enrollment = await this.courseEnrollmentRepo.findOne({
        where: {
          userId,
          courseId: course.id,
          status: enumData.ENROLLMENT_STATUS.ACTIVE.code,
          isDeleted: false,
        },
      });
      if (!enrollment) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.course_enrollment'));
    }
    let progress = await this.lessonProgressRepo.findOne({ where: { userId, lessonId } });
    const now = new Date();
    const nextPercent = Math.max(0, Math.min(100, Number(dto.progressPercent ?? progress?.progressPercent ?? 0)));
    const nextStatus =
      dto.status ||
      (nextPercent >= 100 ? enumData.PROGRESS_STATUS.COMPLETED.code : enumData.PROGRESS_STATUS.IN_PROGRESS.code);
    if (!progress) {
      progress = this.lessonProgressRepo.create({
        id: uuidv4(),
        userId,
        lessonId,
        status: nextStatus,
        progressPercent: nextPercent,
        lastBlockId: dto.lastBlockId,
        startedAt: now,
        completedAt: nextStatus === enumData.PROGRESS_STATUS.COMPLETED.code ? now : null,
        lastAccessedAt: now,
      });
    } else {
      progress.status = nextStatus;
      progress.progressPercent = nextPercent;
      progress.lastBlockId = dto.lastBlockId ?? progress.lastBlockId;
      progress.startedAt = progress.startedAt || now;
      progress.completedAt = nextStatus === enumData.PROGRESS_STATUS.COMPLETED.code ? progress.completedAt || now : progress.completedAt;
      progress.lastAccessedAt = now;
    }
    await this.lessonProgressRepo.save(progress);
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(progress) };
  }
}
