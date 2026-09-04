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
import { ClassroomEntity } from '~/entities';
import {
  AssignmentRepo,
  AssignmentSubmissionRepo,
  ClassroomMemberRepo,
  ClassroomRepo,
  MediaAttachmentRepo,
  RoleRepo,
  UserRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { NotificationService } from '../../notification/service';
import {
  CreateAssignmentDto,
  CreateClassroomDto,
  CreateClassroomMemberDto,
  FilterClassroomDto,
  JoinClassroomDto,
  SubmitAssignmentDto,
  UpdateClassroomDto,
} from '../dto';

@Injectable()
export class ClassroomService {
  constructor(
    private readonly classroomRepo: ClassroomRepo,
    private readonly classroomMemberRepo: ClassroomMemberRepo,
    private readonly assignmentRepo: AssignmentRepo,
    private readonly assignmentSubmissionRepo: AssignmentSubmissionRepo,
    private readonly mediaAttachmentRepo: MediaAttachmentRepo,
    private readonly roleRepo: RoleRepo,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
    private readonly userRepo: UserRepo,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private async writeLog(user: UserDto, actionType: string, entityType: string, entityId: string, description: string) {
    await this.actionLogService.create({
      entityId,
      entityType,
      actionType,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: this.actorName(user),
      description,
      dataBefore: '{}',
      dataAfter: '{}',
    });
  }

  private async studentRoleId() {
    const role = await this.roleRepo.findOne({ where: { code: 'student', isDeleted: false } });
    if (!role) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    return role.id;
  }

  async pagination(body: PaginationDto<FilterClassroomDto>) {
    const { skip = 0, take = 20, where = {} as FilterClassroomDto } = body;
    const whereCon: FindOptionsWhere<ClassroomEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.status) whereCon.status = where.status;
    if (where.teacherUserId) whereCon.teacherUserId = where.teacherUserId;
    const [data, total] = await this.classroomRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findOne(id: string) {
    const item = await this.classroomRepo.findOne({
      where: { id },
      relations: { members: true, assignments: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    item.members = (item.members || []).filter(member => !member.isDeleted);
    item.assignments = (item.assignments || []).filter(assignment => !assignment.isDeleted);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async create(dto: CreateClassroomDto, user: UserDto) {
    const exist = await this.classroomRepo.findOne({ where: { code: dto.code } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const item = await this.classroomRepo.save(
      this.classroomRepo.create({
        id: uuidv4(),
        name: dto.name,
        code: dto.code,
        teacherUserId: dto.teacherUserId,
        courseId: dto.courseId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        capacity: dto.capacity ?? 50,
        status: dto.status || enumData.CLASSROOM_STATUS.ACTIVE.code,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'ClassroomEntity', item.id, `Tạo lớp: ${item.code}`);
    return this.findOne(item.id);
  }

  @DefTransaction()
  async update(id: string, dto: UpdateClassroomDto, user: UserDto) {
    const item = await this.classroomRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    if (dto.code && dto.code !== item.code) {
      const exist = await this.classroomRepo.findOne({ where: { code: dto.code } });
      if (exist && exist.id !== id) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    Object.assign(item, {
      name: dto.name ?? item.name,
      code: dto.code ?? item.code,
      teacherUserId: dto.teacherUserId ?? item.teacherUserId,
      courseId: dto.courseId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      capacity: dto.capacity ?? item.capacity,
      status: dto.status ?? item.status,
      updatedBy: user.id,
    });
    await this.classroomRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'ClassroomEntity', id, `Cập nhật lớp: ${item.code}`);
    return this.findOne(id);
  }

  @DefTransaction()
  async deactivate(id: string, user: UserDto) {
    const item = await this.classroomRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.classroomRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'ClassroomEntity', id, `Ngưng lớp: ${item.code}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activate(id: string, user: UserDto) {
    const item = await this.classroomRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.classroomRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'ClassroomEntity', id, `Kích hoạt lớp: ${item.code}`);
    return this.findOne(id);
  }

  async listMembers(classroomId: string) {
    await this.findOne(classroomId);
    const data = await this.classroomMemberRepo.find({
      where: { classroomId, isDeleted: false },
      order: { joinedAt: 'ASC' },
    });
    return { data: transformKeys(data), total: data.length };
  }

  @DefTransaction()
  async addMember(dto: CreateClassroomMemberDto, user: UserDto) {
    const classroom = await this.classroomRepo.findOne({ where: { id: dto.classroomId, isDeleted: false } });
    if (!classroom) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    let member = await this.classroomMemberRepo.findOne({
      where: { classroomId: dto.classroomId, userId: dto.userId },
    });
    if (member && !member.isDeleted) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    if (!member) {
      member = this.classroomMemberRepo.create({
        id: uuidv4(),
        classroomId: dto.classroomId,
        userId: dto.userId,
        joinedAt: new Date(),
        status: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code,
        createdBy: user.id,
      });
    } else {
      member.status = enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code;
      member.isDeleted = false;
      member.deletedAt = null;
      member.updatedBy = user.id;
    }
    await this.classroomMemberRepo.save(member);
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'ClassroomMemberEntity', member.id, 'Thêm thành viên lớp');
    return this.findOne(dto.classroomId);
  }

  async listAssignments(classroomId: string) {
    await this.findOne(classroomId);
    const data = await this.assignmentRepo.find({
      where: { classroomId, isDeleted: false },
      order: { dueAt: 'ASC' },
    });
    return { data: transformKeys(data), total: data.length };
  }

  @DefTransaction()
  async createAssignment(dto: CreateAssignmentDto, user: UserDto) {
    const classroom = await this.classroomRepo.findOne({ where: { id: dto.classroomId, isDeleted: false } });
    if (!classroom) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    const item = await this.assignmentRepo.save(
      this.assignmentRepo.create({
        id: uuidv4(),
        classroomId: dto.classroomId,
        title: dto.title,
        description: dto.description,
        assignmentType: dto.assignmentType,
        resourceId: dto.resourceId,
        dueAt: new Date(dto.dueAt),
        maxScore: dto.maxScore ?? 100,
        createdByUserId: user.id,
        createdBy: user.id,
      }),
    );
    const members = await this.classroomMemberRepo.find({
      where: { classroomId: dto.classroomId, isDeleted: false, status: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code },
    });
    for (const member of members) {
      await this.notificationService.notify(
        member.userId,
        'assignment_due',
        item.title,
        `Bài tập mới: ${item.title}`,
        `/classroom/${classroom.id}`,
      );
    }
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'AssignmentEntity', item.id, `Giao bài: ${item.title}`);
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(item) };
  }

  async myClasses(user: UserDto) {
    const memberships = await this.classroomMemberRepo.find({
      where: { userId: user.id, isDeleted: false },
      relations: { classroom: true },
      order: { joinedAt: 'DESC' },
    });
    const taught = await this.classroomRepo.find({
      where: { teacherUserId: user.id, isDeleted: false },
    });
    return { data: transformKeys({ memberships, taught }) };
  }

  async userFindOne(id: string, user: UserDto) {
    const classroom = await this.classroomRepo.findOne({
      where: { id, isDeleted: false },
      relations: { assignments: true, members: true },
    });
    if (!classroom) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    const isTeacher = classroom.teacherUserId === user.id;
    const isMember = (classroom.members || []).some(member => member.userId === user.id && !member.isDeleted);
    if (!isTeacher && !isMember) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    classroom.assignments = (classroom.assignments || []).filter(item => !item.isDeleted);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(classroom) };
  }

  @DefTransaction()
  async join(dto: JoinClassroomDto, user: UserDto) {
    const classroom = await this.classroomRepo.findOne({
      where: { code: dto.code.trim(), isDeleted: false },
    });
    if (!classroom) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom'));
    const existing = await this.classroomMemberRepo.findOne({
      where: { classroomId: classroom.id, userId: user.id },
    });
    if (existing && !existing.isDeleted) return this.userFindOne(classroom.id, user);
    const count = await this.classroomMemberRepo.count({
      where: { classroomId: classroom.id, isDeleted: false, status: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code },
    });
    if (classroom.capacity && count >= classroom.capacity) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    await this.addMember(
      { classroomId: classroom.id, userId: user.id, roleId: await this.studentRoleId() },
      user,
    );
    return this.userFindOne(classroom.id, user);
  }

  @DefTransaction()
  async submitAssignment(id: string, dto: SubmitAssignmentDto, user: UserDto) {
    const assignment = await this.assignmentRepo.findOne({ where: { id, isDeleted: false } });
    if (!assignment) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.assignment'));
    const member = await this.classroomMemberRepo.findOne({
      where: { classroomId: assignment.classroomId, userId: user.id, isDeleted: false },
    });
    if (!member) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.classroom_member'));
    let submission = await this.assignmentSubmissionRepo.findOne({
      where: { assignmentId: id, userId: user.id },
    });
    const late = assignment.dueAt ? new Date() > new Date(assignment.dueAt) : false;
    const assessmentAttemptId = dto.assessmentAttemptId || dto.attemptId;
    if (!submission) {
      submission = this.assignmentSubmissionRepo.create({
        id: uuidv4(),
        assignmentId: id,
        userId: user.id,
        assessmentAttemptId,
        status: late
          ? enumData.ASSIGNMENT_SUBMISSION_STATUS.LATE.code
          : enumData.ASSIGNMENT_SUBMISSION_STATUS.SUBMITTED.code,
        submittedAt: new Date(),
        createdBy: user.id,
      });
    } else {
      submission.assessmentAttemptId = assessmentAttemptId ?? submission.assessmentAttemptId;
      submission.status = late
        ? enumData.ASSIGNMENT_SUBMISSION_STATUS.LATE.code
        : enumData.ASSIGNMENT_SUBMISSION_STATUS.SUBMITTED.code;
      submission.submittedAt = new Date();
      submission.updatedBy = user.id;
    }
    await this.assignmentSubmissionRepo.save(submission);
    if (dto.mediaAssetIds?.length) {
      await this.mediaAttachmentRepo.delete({
        ownerType: 'AssignmentSubmissionEntity',
        ownerId: submission.id,
      });
      await this.mediaAttachmentRepo.save(
        dto.mediaAssetIds.map((mediaAssetId, index) =>
          this.mediaAttachmentRepo.create({
            id: uuidv4(),
            ownerType: 'AssignmentSubmissionEntity',
            ownerId: submission.id,
            purpose: enumData.MEDIA_PURPOSE.SUBMISSION.code,
            mediaAssetId,
            sortOrder: index,
            createdBy: user.id,
          }),
        ),
      );
    }
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'AssignmentSubmissionEntity', submission.id, 'Nộp bài tập');
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(submission) };
  }

  async importClassrooms(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const teacherUserId = optionalText(item.teacherUserId);
      const teacherEmail = optionalText(item.teacherEmail);
      let resolvedTeacherId = teacherUserId;
      if (!resolvedTeacherId && teacherEmail) {
        const teacher = await this.userRepo.findOne({
          where: { email: teacherEmail, isDeleted: false },
        });
        if (!teacher) throw new NotFoundException(`Không tìm thấy giáo viên email ${teacherEmail}`);
        resolvedTeacherId = teacher.id;
      }
      if (!resolvedTeacherId) throw new Error('Thiếu teacherEmail hoặc teacherUserId');
      const created = await this.create(
        {
          name: requireText(item.name, 'Tên lớp'),
          nameEn: optionalText(item.nameEn),
          code: requireText(item.code, 'Mã lớp'),
          teacherUserId: resolvedTeacherId,
          startDate: optionalText(item.startDate),
          endDate: optionalText(item.endDate),
          capacity: optionalNumber(item.capacity, 50),
          status: optionalText(item.status),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportClassrooms(body: PaginationDto<FilterClassroomDto>) {
    const { data } = await this.pagination({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
