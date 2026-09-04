import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums';
import {
  createdEntityId,
  excelExportTake,
  optionalText,
  requireText,
  runBulkImport,
  splitCodes,
  SuccessResponse,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { RoleEntity } from '~/entities';
import { RoleRepo, UserRoleRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../action-log/action-log.service';
import { I18nCustomService } from '../i18n-custom-module/i18n.service';
import { AssignUserRoleDto, CreateRoleDto, FilterRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly repo: RoleRepo,
    private readonly userRoleRepo: UserRoleRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || user.id;
  }

  private async writeLog(
    user: UserDto,
    actionType: string,
    entityId: string,
    description: string,
    dataBefore: unknown,
    dataAfter: unknown,
  ) {
    await this.actionLogService.create({
      entityId,
      entityType: 'RoleEntity',
      actionType,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: this.actorName(user),
      description,
      dataBefore: JSON.stringify(dataBefore ?? {}),
      dataAfter: JSON.stringify(dataAfter ?? {}),
    });
  }

  private async assertUniqueCode(code: string, excludeId?: string) {
    const exist = await this.repo.findOne({ where: { code } });
    if (exist && exist.id !== excludeId) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async selectBox() {
    const res: any[] = await this.repo.find({
      where: { isDeleted: false },
      select: { id: true, code: true, name: true },
      order: { name: 'ASC' },
    });
    for (const item of res) {
      item.label = item.name;
      item.value = item.id;
    }
    return res;
  }

  async pagination(body: PaginationDto<FilterRoleDto>) {
    const { skip = 0, take = 0, where = {} as FilterRoleDto } = body;
    const whereCon: FindOptionsWhere<RoleEntity> = {};
    if (where.code) whereCon.code = UnaccentILike(`%${where.code}%`);
    if (where.name) whereCon.name = UnaccentILike(`%${where.name}%`);
    if ([true, false].includes(where.isDeleted as boolean)) whereCon.isDeleted = where.isDeleted;
    const [data, total] = await this.repo.findAndCount({
      where: whereCon,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  @DefTransaction()
  async create(dto: CreateRoleDto, user: UserDto): Promise<SuccessResponse> {
    await this.assertUniqueCode(dto.code);
    const item = new RoleEntity();
    item.id = uuidv4();
    item.code = dto.code;
    item.name = dto.name;
    item.nameEn = dto.nameEn;
    item.description = dto.description;
    item.permissionCodes = dto.permissionCodes || [];
    item.createdBy = user.id;
    await this.repo.insert(item);
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, item.id, `Tạo mới vai trò: ${item.name}`, {}, item);
    return { message: this.i18n.commonTranslate('create_success') };
  }

  @DefTransaction()
  async update(user: UserDto, id: string, dto: UpdateRoleDto): Promise<SuccessResponse> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    if (dto.code) await this.assertUniqueCode(dto.code, id);
    const oldData = { ...item };
    item.code = dto.code;
    item.name = dto.name;
    item.nameEn = dto.nameEn;
    item.description = dto.description;
    if (dto.permissionCodes) item.permissionCodes = dto.permissionCodes;
    item.updatedBy = user.id;
    await this.repo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, item.id, `Cập nhật vai trò: ${item.name}`, oldData, item);
    return { message: this.i18n.commonTranslate('update_success') };
  }

  @DefTransaction()
  async deactivate(user: UserDto, id: string): Promise<SuccessResponse> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    if (item.isSystem) throw new BusinessException(this.i18n.commonTranslate('cannot_delete_system_role'));
    await this.repo.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: user.id,
      updatedBy: user.id,
    });
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, item.id, `Ngừng hoạt động vai trò: ${item.name}`, item, {
      isDeleted: true,
    });
    return { message: this.i18n.commonTranslate('remove_success') };
  }

  @DefTransaction()
  async activate(user: UserDto, id: string): Promise<SuccessResponse> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    await this.repo.update(id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedBy: user.id,
    });
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, item.id, `Kích hoạt vai trò: ${item.name}`, item, {
      isDeleted: false,
    });
    return { message: this.i18n.commonTranslate('active_success') };
  }

  async exportToExcel(filter?: PaginationDto<FilterRoleDto>) {
    const { data } = await this.pagination({
      skip: filter?.skip || 0,
      take: excelExportTake(filter?.take),
      where: filter?.where || {},
    });
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: (data || []).map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        nameEn: item.nameEn,
        isDeleted: item.isDeleted,
      })),
    };
  }

  @DefTransaction()
  async assignUserRole(dto: AssignUserRoleDto, user: UserDto) {
    const exist = await this.userRoleRepo.findOne({
      where: { userId: dto.userId, roleId: dto.roleId, scopeType: enumData.SCOPE_TYPE.GLOBAL.code },
    });
    if (!exist) {
      await this.userRoleRepo.save(
        this.userRoleRepo.create({
          id: uuidv4(),
          userId: dto.userId,
          roleId: dto.roleId,
          scopeType: enumData.SCOPE_TYPE.GLOBAL.code,
          createdBy: user.id,
        }),
      );
    }
    return { message: this.i18n.commonTranslate('update_success') };
  }

  async importRoles(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.create(
        {
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          nameEn: optionalText(item.nameEn),
          description: optionalText(item.description),
          permissionCodes: splitCodes(item.permissionCodes),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }
}
