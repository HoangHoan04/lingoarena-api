import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import { ExamSectionEntity, ExamSkillEntity, ExamTypeEntity } from '~/entities';
import { ExamSectionRepo, ExamSkillRepo, ExamTypeRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateExamSectionDto,
  CreateExamSkillDto,
  CreateExamTypeDto,
  FilterExamSectionDto,
  FilterExamSkillDto,
  FilterExamTypeDto,
  UpdateExamSectionDto,
  UpdateExamSkillDto,
  UpdateExamTypeDto,
} from '../dto';
import { toSelectBox } from '../helpers';

@Injectable()
export class ExamService {
  constructor(
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

  private async assertUniqueTypeCode(code: string, excludeId?: string) {
    const exist = await this.examTypeRepo.findOne({ where: { code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  private async assertUniqueSkillCode(examTypeId: string, code: string, excludeId?: string) {
    const exist = await this.examSkillRepo.findOne({ where: { examTypeId, code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  private async assertUniqueSectionCode(examSkillId: string, code: string, excludeId?: string) {
    const exist = await this.examSectionRepo.findOne({ where: { examSkillId, code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  async selectBoxTypes() {
    const rows = await this.examTypeRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return toSelectBox(rows);
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

  async paginationTypes(body: PaginationDto<FilterExamTypeDto>) {
    const { skip = 0, take = 20, where = {} as FilterExamTypeDto } = body;
    const whereCon: FindOptionsWhere<ExamTypeEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) {
      whereCon.name = UnaccentILike(`%${where.keyword}%`);
    }
    if (where.code) whereCon.code = where.code;
    if (where.isActive !== undefined && where.isActive !== null && (where.isActive as unknown) !== '') {
      whereCon.isActive = Boolean(where.isActive);
    }
    const [data, total] = await this.examTypeRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findType(id: string) {
    const item = await this.examTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createType(dto: CreateExamTypeDto, user: UserDto) {
    await this.assertUniqueTypeCode(dto.code.trim());
    const item = await this.examTypeRepo.save(
      this.examTypeRepo.create({
        id: uuidv4(),
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description,
        scoreMin: dto.scoreMin ?? 0,
        scoreMax: dto.scoreMax,
        scoreStep: dto.scoreStep ?? 1,
        scoreSchema: dto.scoreSchema,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'ExamTypeEntity', item.id, `Tạo kỳ thi: ${item.name}`);
    return this.findType(item.id);
  }

  async updateType(id: string, dto: UpdateExamTypeDto, user: UserDto) {
    const item = await this.examTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    if (dto.code) await this.assertUniqueTypeCode(dto.code.trim(), id);
    Object.assign(item, {
      code: dto.code.trim(),
      name: dto.name.trim(),
      description: dto.description,
      scoreMin: dto.scoreMin ?? item.scoreMin,
      scoreMax: dto.scoreMax ?? item.scoreMax,
      scoreStep: dto.scoreStep ?? item.scoreStep,
      scoreSchema: dto.scoreSchema,
      isActive: dto.isActive ?? item.isActive,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.examTypeRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'ExamTypeEntity', id, `Cập nhật kỳ thi: ${item.name}`);
    return this.findType(id);
  }

  async deactivateType(id: string, user: UserDto) {
    const item = await this.examTypeRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.examTypeRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'ExamTypeEntity', id, `Ngưng kỳ thi: ${item.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateType(id: string, user: UserDto) {
    const item = await this.examTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.examTypeRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'ExamTypeEntity', id, `Kích hoạt kỳ thi: ${item.name}`);
    return this.findType(id);
  }

  async paginationSkills(body: PaginationDto<FilterExamSkillDto>) {
    const { skip = 0, take = 20, where = {} as FilterExamSkillDto } = body;
    const whereCon: FindOptionsWhere<ExamSkillEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.examTypeId) whereCon.examTypeId = where.examTypeId;
    if (where.code) whereCon.code = where.code;
    const [data, total] = await this.examSkillRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { examType: true },
    });
    return { data: transformKeys(data), total };
  }

  async findSkill(id: string) {
    const item = await this.examSkillRepo.findOne({
      where: { id },
      relations: { examType: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_skill'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createSkill(dto: CreateExamSkillDto, user: UserDto) {
    const examType = await this.examTypeRepo.findOne({ where: { id: dto.examTypeId } });
    if (!examType) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    await this.assertUniqueSkillCode(dto.examTypeId, dto.code.trim());
    const item = await this.examSkillRepo.save(
      this.examSkillRepo.create({
        id: uuidv4(),
        examTypeId: dto.examTypeId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        durationSeconds: dto.durationSeconds || 0,
        scoreSchema: dto.scoreSchema,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'ExamSkillEntity', item.id, `Tạo kỹ năng: ${item.name}`);
    return this.findSkill(item.id);
  }

  async updateSkill(id: string, dto: UpdateExamSkillDto, user: UserDto) {
    const item = await this.examSkillRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_skill'));
    const examType = await this.examTypeRepo.findOne({ where: { id: dto.examTypeId } });
    if (!examType) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    await this.assertUniqueSkillCode(dto.examTypeId, dto.code.trim(), id);
    Object.assign(item, {
      examTypeId: dto.examTypeId,
      code: dto.code.trim(),
      name: dto.name.trim(),
      durationSeconds: dto.durationSeconds ?? item.durationSeconds,
      scoreSchema: dto.scoreSchema,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.examSkillRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'ExamSkillEntity', id, `Cập nhật kỹ năng: ${item.name}`);
    return this.findSkill(id);
  }

  async deactivateSkill(id: string, user: UserDto) {
    const item = await this.examSkillRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_skill'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.examSkillRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'ExamSkillEntity', id, `Ngưng kỹ năng: ${item.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateSkill(id: string, user: UserDto) {
    const item = await this.examSkillRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_skill'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.examSkillRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'ExamSkillEntity', id, `Kích hoạt kỹ năng: ${item.name}`);
    return this.findSkill(id);
  }

  async paginationSections(body: PaginationDto<FilterExamSectionDto>) {
    const { skip = 0, take = 20, where = {} as FilterExamSectionDto } = body;
    const whereCon: FindOptionsWhere<ExamSectionEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.examSkillId) whereCon.examSkillId = where.examSkillId;
    if (where.code) whereCon.code = where.code;
    if (where.examTypeId) {
      whereCon.examSkill = { examTypeId: where.examTypeId };
    }
    const [data, total] = await this.examSectionRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { examSkill: { examType: true } },
    });
    return { data: transformKeys(data), total };
  }

  async findSection(id: string) {
    const item = await this.examSectionRepo.findOne({
      where: { id },
      relations: { examSkill: { examType: true } },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_section'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createSection(dto: CreateExamSectionDto, user: UserDto) {
    const skill = await this.examSkillRepo.findOne({ where: { id: dto.examSkillId } });
    if (!skill) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_skill'));
    await this.assertUniqueSectionCode(dto.examSkillId, dto.code.trim());
    const item = await this.examSectionRepo.save(
      this.examSectionRepo.create({
        id: uuidv4(),
        examSkillId: dto.examSkillId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        instructions: dto.instructions,
        durationSeconds: dto.durationSeconds || 0,
        questionCount: dto.questionCount || 0,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'ExamSectionEntity', item.id, `Tạo phần thi: ${item.name}`);
    return this.findSection(item.id);
  }

  async updateSection(id: string, dto: UpdateExamSectionDto, user: UserDto) {
    const item = await this.examSectionRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_section'));
    const skill = await this.examSkillRepo.findOne({ where: { id: dto.examSkillId } });
    if (!skill) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_skill'));
    await this.assertUniqueSectionCode(dto.examSkillId, dto.code.trim(), id);
    Object.assign(item, {
      examSkillId: dto.examSkillId,
      code: dto.code.trim(),
      name: dto.name.trim(),
      instructions: dto.instructions,
      durationSeconds: dto.durationSeconds ?? item.durationSeconds,
      questionCount: dto.questionCount ?? item.questionCount,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.examSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'ExamSectionEntity', id, `Cập nhật phần thi: ${item.name}`);
    return this.findSection(id);
  }

  async deactivateSection(id: string, user: UserDto) {
    const item = await this.examSectionRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_section'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.examSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'ExamSectionEntity', id, `Ngưng phần thi: ${item.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateSection(id: string, user: UserDto) {
    const item = await this.examSectionRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_section'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.examSectionRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'ExamSectionEntity', id, `Kích hoạt phần thi: ${item.name}`);
    return this.findSection(id);
  }
}
