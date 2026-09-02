import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums';
import { SuccessResponse, transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import { RoleEntity } from '~/entities/auth';
import { RoleRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../action-log/action-log.service';
import { I18nCustomService } from '../i18n-custom-module/i18n.service';
import { CreateRoleDto, FilterRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly repo: RoleRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

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
    if ([true, false].includes(where.isDeleted)) whereCon.isDeleted = where.isDeleted;
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
    item.description = dto.description;
    item.createdBy = user.id;
    item.createdAt = new Date();
    await this.repo.insert(item);
    await this.actionLogService.create({
      entityId: item.id,
      entityType: 'RoleEntity',
      actionType: enumData.ACTION_LOG.CREATE.code,
      createdBy: user.id,
      actorCode: user.id,
      actorName: user.username,
      description: `Tạo mới vai trò: ${item.name}`,
      dataBefore: '{}',
      dataAfter: JSON.stringify({ item }),
    });
    return { message: this.i18n.commonTranslate('create_success') };
  }

  @DefTransaction()
  async update(user: UserDto, id: string, dto: UpdateRoleDto): Promise<SuccessResponse> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    if (dto.code) await this.assertUniqueCode(dto.code, id);
    const oldData = JSON.stringify(item);
    const updateData: Partial<RoleEntity> = { updatedBy: user.id, updatedAt: new Date() };
    if (dto.code) updateData.code = dto.code;
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    await this.repo.update(id, updateData);
    await this.actionLogService.create({
      entityId: item.id,
      entityType: 'RoleEntity',
      actionType: enumData.ACTION_LOG.UPDATE.code,
      createdBy: user.id,
      actorCode: user.id,
      actorName: user.username,
      description: `Cập nhật vai trò: ${item.name}`,
      dataBefore: oldData,
      dataAfter: JSON.stringify(updateData),
    });
    return { message: this.i18n.commonTranslate('update_success') };
  }

  @DefTransaction()
  async deactivate(user: UserDto, id: string): Promise<SuccessResponse> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.role'));
    await this.repo.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: user.id,
      updatedBy: user.id,
      updatedAt: new Date(),
    });
    await this.actionLogService.create({
      entityId: item.id,
      entityType: 'RoleEntity',
      actionType: enumData.ACTION_LOG.DEACTIVATE.code,
      createdBy: user.id,
      actorCode: user.id,
      actorName: user.username,
      description: `Ngừng hoạt động vai trò: ${item.name}`,
      dataBefore: JSON.stringify(item),
      dataAfter: JSON.stringify({ ...item, isDeleted: true }),
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
      updatedAt: new Date(),
    });
    await this.actionLogService.create({
      entityId: item.id,
      entityType: 'RoleEntity',
      actionType: enumData.ACTION_LOG.ACTIVATE.code,
      createdBy: user.id,
      actorCode: user.id,
      actorName: user.username,
      description: `Kích hoạt vai trò: ${item.name}`,
      dataBefore: JSON.stringify(item),
      dataAfter: JSON.stringify({ ...item, isDeleted: false }),
    });
    return { message: this.i18n.commonTranslate('active_success') };
  }

  async exportToExcel(_filter?: PaginationDto<FilterRoleDto>) {}
}
