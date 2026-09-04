import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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
import { ExamStructureEntity, ExamTypeEntity } from '~/entities';
import { AssessmentRepo, ExamStructureRepo, ExamTypeRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateExamSectionDto,
  CreateExamSkillDto,
  CreateExamStructureDto,
  CreateExamTypeDto,
  FilterExamSectionDto,
  FilterExamSkillDto,
  FilterExamStructureDto,
  FilterExamTypeDto,
  UpdateExamSectionDto,
  UpdateExamSkillDto,
  UpdateExamStructureDto,
  UpdateExamTypeDto,
} from '../dto';
import { toSelectBox } from '../helpers';

@Injectable()
export class ExamService {
  constructor(
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly examStructureRepo: ExamStructureRepo,
    private readonly assessmentRepo: AssessmentRepo,
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

  private async assertUniqueStructureCode(examTypeId: string, code: string, excludeId?: string) {
    const exist = await this.examStructureRepo.findOne({ where: { examTypeId, code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  private async requireType(id: string) {
    const item = await this.examTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    return item;
  }

  private async requireStructure(id: string) {
    const item = await this.examStructureRepo.findOne({
      where: { id },
      relations: { examType: true, parent: true },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_structure'));
    return item;
  }

  private toSkillShape(item: ExamStructureEntity) {
    return {
      ...item,
      examSkillId: item.parentId,
    };
  }

  async selectBoxTypes() {
    const rows = await this.examTypeRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return toSelectBox(rows);
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
      relations: { parent: true, examType: true },
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

  async paginationTypes(body: PaginationDto<FilterExamTypeDto>) {
    const { skip = 0, take = 20, where = {} as FilterExamTypeDto } = body;
    const whereCon: FindOptionsWhere<ExamTypeEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.code) whereCon.code = where.code;

    const [data, total] = await this.examTypeRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findType(id: string) {
    const item = await this.requireType(id);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async findTypeTree(id: string) {
    const item = await this.requireType(id);
    const nodes = await this.examStructureRepo.find({
      where: { examTypeId: id, isDeleted: false },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    const paperRows = await this.assessmentRepo
      .createQueryBuilder('a')
      .leftJoin('a.sections', 's', 's.isDeleted = false')
      .select('COALESCE(a.examStructureId, s.examStructureId)', 'skillId')
      .addSelect('COUNT(DISTINCT a.id)', 'paperCount')
      .where('a.isDeleted = false')
      .andWhere('a.examTypeId = :typeId', { typeId: id })
      .andWhere('COALESCE(a.examStructureId, s.examStructureId) IS NOT NULL')
      .groupBy('COALESCE(a.examStructureId, s.examStructureId)')
      .getRawMany<{ skillId: string; paperCount: string }>();

    const paperCountBySkill = new Map(
      paperRows.map(row => {
        const raw = row as { skillId?: string; skillid?: string; paperCount?: string };
        return [raw.skillId || raw.skillid || '', Number(raw.paperCount || 0)];
      }),
    );
    const childrenByParent = new Map<string, ExamStructureEntity[]>();
    for (const node of nodes) {
      if (!node.parentId) continue;
      const list = childrenByParent.get(node.parentId) || [];
      list.push(node);
      childrenByParent.set(node.parentId, list);
    }

    const skills = nodes
      .filter(node => node.nodeType === enumData.EXAM_NODE_TYPE.SKILL.code)
      .map(skill => ({
        ...skill,
        paperCount: paperCountBySkill.get(skill.id) || 0,
        children: childrenByParent.get(skill.id) || [],
      }));

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys({ ...item, skills }),
    };
  }

  async createType(dto: CreateExamTypeDto, user: UserDto) {
    await this.assertUniqueTypeCode(dto.code.trim());
    const item = await this.examTypeRepo.save(
      this.examTypeRepo.create({
        id: uuidv4(),
        code: dto.code.trim(),
        name: dto.name.trim(),
        nameEn: dto.nameEn?.trim() || dto.name.trim(),
        description: dto.description,
        descriptionEn: dto.descriptionEn,
        scoreMin: dto.scoreMin ?? 0,
        scoreMax: dto.scoreMax,
        scoreStep: dto.scoreStep ?? 1,
        scoreSchema: dto.scoreSchema,
        hubContentJson: dto.hubContentJson,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'ExamTypeEntity',
      item.id,
      `Tạo kỳ thi: ${item.name}`,
    );
    return this.findType(item.id);
  }

  async updateType(id: string, dto: UpdateExamTypeDto, user: UserDto) {
    const item = await this.requireType(id);
    if (dto.code) await this.assertUniqueTypeCode(dto.code.trim(), id);
    Object.assign(item, {
      code: dto.code.trim(),
      name: dto.name.trim(),
      nameEn: dto.nameEn?.trim() || dto.name.trim(),
      description: dto.description,
      descriptionEn: dto.descriptionEn,
      scoreMin: dto.scoreMin ?? item.scoreMin,
      scoreMax: dto.scoreMax ?? item.scoreMax,
      scoreStep: dto.scoreStep ?? item.scoreStep,
      scoreSchema: dto.scoreSchema,
      hubContentJson: dto.hubContentJson ?? item.hubContentJson,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.examTypeRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'ExamTypeEntity',
      id,
      `Cập nhật kỳ thi: ${item.name}`,
    );
    return this.findType(id);
  }

  async deactivateType(id: string, user: UserDto) {
    const item = await this.examTypeRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.examTypeRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'ExamTypeEntity',
      id,
      `Ngưng kỳ thi: ${item.name}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateType(id: string, user: UserDto) {
    const item = await this.requireType(id);
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.examTypeRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'ExamTypeEntity',
      id,
      `Kích hoạt kỳ thi: ${item.name}`,
    );
    return this.findType(id);
  }

  async paginationStructures(body: PaginationDto<FilterExamStructureDto>) {
    const { skip = 0, take = 10, where = {} as FilterExamStructureDto } = body;
    const whereCon: FindOptionsWhere<ExamStructureEntity> = {};
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.examTypeId) whereCon.examTypeId = where.examTypeId;
    if (where.parentId) whereCon.parentId = where.parentId;
    if (where.nodeType) whereCon.nodeType = where.nodeType;
    if (where.code) whereCon.code = where.code;

    if ([true, false].includes(where.isDeleted)) whereCon.isDeleted = where.isDeleted;

    const [data, total] = await this.examStructureRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 10,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { examType: true, parent: true },
    });
    return { data: transformKeys(data), total };
  }

  async findStructure(id: string) {
    const item = await this.requireStructure(id);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createStructure(dto: CreateExamStructureDto, user: UserDto) {
    await this.requireType(dto.examTypeId);
    if (dto.parentId) await this.requireStructure(dto.parentId);
    await this.assertUniqueStructureCode(dto.examTypeId, dto.code.trim());
    const item = await this.examStructureRepo.save(
      this.examStructureRepo.create({
        id: uuidv4(),
        examTypeId: dto.examTypeId,
        parentId: dto.parentId,
        nodeType: dto.nodeType,
        code: dto.code.trim(),
        name: dto.name.trim(),
        nameEn: dto.nameEn?.trim() || dto.name.trim(),
        partNumber: dto.partNumber,
        sortOrder: dto.sortOrder || 0,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'ExamStructureEntity',
      item.id,
      `Tạo cấu trúc kỳ thi: ${item.name}`,
    );
    return this.findStructure(item.id);
  }

  async updateStructure(id: string, dto: UpdateExamStructureDto, user: UserDto) {
    const item = await this.requireStructure(id);
    await this.requireType(dto.examTypeId);
    if (dto.parentId) await this.requireStructure(dto.parentId);
    await this.assertUniqueStructureCode(dto.examTypeId, dto.code.trim(), id);
    Object.assign(item, {
      examTypeId: dto.examTypeId,
      parentId: dto.parentId,
      nodeType: dto.nodeType,
      code: dto.code.trim(),
      name: dto.name.trim(),
      nameEn: dto.nameEn?.trim() || dto.name.trim(),
      partNumber: dto.partNumber ?? item.partNumber,
      sortOrder: dto.sortOrder ?? item.sortOrder,
      updatedBy: user.id,
    });
    await this.examStructureRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'ExamStructureEntity',
      id,
      `Cập nhật cấu trúc kỳ thi: ${item.name}`,
    );
    return this.findStructure(id);
  }

  async deactivateStructure(id: string, user: UserDto) {
    const item = await this.examStructureRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_structure'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.examStructureRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'ExamStructureEntity',
      id,
      `Ngưng cấu trúc kỳ thi: ${item.name}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateStructure(id: string, user: UserDto) {
    const item = await this.requireStructure(id);
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.examStructureRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'ExamStructureEntity',
      id,
      `Kích hoạt cấu trúc kỳ thi: ${item.name}`,
    );
    return this.findStructure(id);
  }

  async paginationSkills(body: PaginationDto<FilterExamSkillDto>) {
    return this.paginationStructures({
      skip: body.skip,
      take: body.take,
      where: {
        keyword: body.where?.keyword,
        examTypeId: body.where?.examTypeId,
        code: body.where?.code,
        nodeType: enumData.EXAM_NODE_TYPE.SKILL.code,
        isDeleted: body.where?.isDeleted,
      },
    });
  }

  async findSkill(id: string) {
    const item = await this.requireStructure(id);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createSkill(dto: CreateExamSkillDto, user: UserDto) {
    return this.createStructure(
      {
        examTypeId: dto.examTypeId,
        nodeType: enumData.EXAM_NODE_TYPE.SKILL.code,
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder,
      },
      user,
    );
  }

  async updateSkill(id: string, dto: UpdateExamSkillDto, user: UserDto) {
    return this.updateStructure(
      id,
      {
        examTypeId: dto.examTypeId,
        nodeType: enumData.EXAM_NODE_TYPE.SKILL.code,
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder,
      },
      user,
    );
  }

  async deactivateSkill(id: string, user: UserDto) {
    return this.deactivateStructure(id, user);
  }

  async activateSkill(id: string, user: UserDto) {
    return this.activateStructure(id, user);
  }

  async paginationSections(body: PaginationDto<FilterExamSectionDto>) {
    const { skip = 0, take = 20, where = {} as FilterExamSectionDto } = body;
    const whereCon: FindOptionsWhere<ExamStructureEntity> = {
      isDeleted: where.isDeleted ?? false,
      nodeType: In([enumData.EXAM_NODE_TYPE.SECTION.code, enumData.EXAM_NODE_TYPE.PART.code]),
    };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.examSkillId) whereCon.parentId = where.examSkillId;
    if (where.code) whereCon.code = where.code;
    if (where.examTypeId) whereCon.examTypeId = where.examTypeId;
    const [data, total] = await this.examStructureRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: { examType: true, parent: true },
    });
    return { data: transformKeys(data.map(item => this.toSkillShape(item))), total };
  }

  async findSection(id: string) {
    const item = await this.requireStructure(id);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: transformKeys(this.toSkillShape(item)),
    };
  }

  async createSection(dto: CreateExamSectionDto, user: UserDto) {
    const parent = await this.requireStructure(dto.examSkillId);
    return this.createStructure(
      {
        examTypeId: parent.examTypeId,
        parentId: dto.examSkillId,
        nodeType: enumData.EXAM_NODE_TYPE.SECTION.code,
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder,
      },
      user,
    );
  }

  async updateSection(id: string, dto: UpdateExamSectionDto, user: UserDto) {
    const parent = await this.requireStructure(dto.examSkillId);
    return this.updateStructure(
      id,
      {
        examTypeId: parent.examTypeId,
        parentId: dto.examSkillId,
        nodeType: enumData.EXAM_NODE_TYPE.SECTION.code,
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder,
      },
      user,
    );
  }

  async deactivateSection(id: string, user: UserDto) {
    return this.deactivateStructure(id, user);
  }

  async activateSection(id: string, user: UserDto) {
    return this.activateStructure(id, user);
  }

  private async findTypeByCode(code: string) {
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

  async importTypes(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createType(
        {
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          nameEn: optionalText(item.nameEn),
          description: optionalText(item.description),
          descriptionEn: optionalText(item.descriptionEn),
          scoreMin: optionalNumber(item.scoreMin, 0),
          scoreMax: optionalNumber(item.scoreMax, 990) as number,
          scoreStep: optionalNumber(item.scoreStep, 1),
          sortOrder: optionalNumber(item.sortOrder, 0),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportTypes(body: PaginationDto<FilterExamTypeDto>) {
    const { data } = await this.paginationTypes({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }

  async importStructures(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const examType = await this.findTypeByCode(requireText(item.examTypeCode, 'Mã kỳ thi'));
      const parentCode = optionalText(item.parentCode);
      const parent = parentCode ? await this.findStructureByCode(examType.id, parentCode) : null;
      const created = await this.createStructure(
        {
          examTypeId: examType.id,
          parentId: parent?.id,
          nodeType: requireText(item.nodeType, 'Loại node'),
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          nameEn: optionalText(item.nameEn),
          partNumber: optionalNumber(item.partNumber),
          sortOrder: optionalNumber(item.sortOrder, 0),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportStructures(body: PaginationDto<FilterExamStructureDto>) {
    const { data } = await this.paginationStructures({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
