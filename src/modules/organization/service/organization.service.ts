import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import {
  createdEntityId,
  excelExportTake,
  optionalText,
  requireText,
  runBulkImport,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { OrganizationEntity } from '~/entities';
import { OrganizationMemberRepo, OrganizationRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { CreateOrganizationDto, CreateOrganizationMemberDto, FilterOrganizationDto, UpdateOrganizationDto } from '../dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepo: OrganizationRepo,
    private readonly organizationMemberRepo: OrganizationMemberRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
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

  async pagination(body: PaginationDto<FilterOrganizationDto>) {
    const { skip = 0, take = 20, where = {} as FilterOrganizationDto } = body;
    const whereCon: FindOptionsWhere<OrganizationEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    if (where.status) whereCon.status = where.status;
    const [data, total] = await this.organizationRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findOne(id: string) {
    const item = await this.organizationRepo.findOne({
      where: { id },
      relations: { members: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.organization'));
    item.members = (item.members || []).filter(member => !member.isDeleted);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async create(dto: CreateOrganizationDto, user: UserDto) {
    const exist = await this.organizationRepo.findOne({ where: { code: dto.code } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const item = await this.organizationRepo.save(
      this.organizationRepo.create({
        id: uuidv4(),
        code: dto.code,
        name: dto.name,
        slug: dto.code.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        address: dto.billingAddress,
        logoUrl: dto.logoUrl,
        status: dto.status || enumData.ORG_STATUS.ACTIVE.code,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'OrganizationEntity', item.id, `Tạo tổ chức: ${item.code}`);
    return this.findOne(item.id);
  }

  @DefTransaction()
  async update(id: string, dto: UpdateOrganizationDto, user: UserDto) {
    const item = await this.organizationRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.organization'));
    if (dto.code && dto.code !== item.code) {
      const exist = await this.organizationRepo.findOne({ where: { code: dto.code } });
      if (exist && exist.id !== id) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    Object.assign(item, {
      code: dto.code ?? item.code,
      name: dto.name ?? item.name,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      address: dto.billingAddress ?? item.address,
      logoUrl: dto.logoUrl,
      status: dto.status ?? item.status,
      updatedBy: user.id,
    });
    await this.organizationRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'OrganizationEntity', id, `Cập nhật tổ chức: ${item.code}`);
    return this.findOne(id);
  }

  @DefTransaction()
  async deactivate(id: string, user: UserDto) {
    const item = await this.organizationRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.organization'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.organizationRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'OrganizationEntity', id, `Ngưng tổ chức: ${item.code}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activate(id: string, user: UserDto) {
    const item = await this.organizationRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.organization'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.organizationRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'OrganizationEntity', id, `Kích hoạt tổ chức: ${item.code}`);
    return this.findOne(id);
  }

  async listMembers(organizationId: string) {
    await this.findOne(organizationId);
    const data = await this.organizationMemberRepo.find({
      where: { organizationId, isDeleted: false },
      order: { joinedAt: 'ASC' },
    });
    return { data: transformKeys(data), total: data.length };
  }

  @DefTransaction()
  async addMember(dto: CreateOrganizationMemberDto, user: UserDto) {
    const org = await this.organizationRepo.findOne({ where: { id: dto.organizationId, isDeleted: false } });
    if (!org) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.organization'));
    const memberRole = dto.role || enumData.ORG_MEMBER_ROLE.MEMBER.code;
    let member = await this.organizationMemberRepo.findOne({
      where: { organizationId: dto.organizationId, userId: dto.userId },
    });
    if (member && !member.isDeleted) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    if (!member) {
      member = this.organizationMemberRepo.create({
        id: uuidv4(),
        organizationId: dto.organizationId,
        userId: dto.userId,
        role: memberRole,
        joinedAt: new Date(),
        createdBy: user.id,
      });
    } else {
      member.role = memberRole;
      member.isDeleted = false;
      member.deletedAt = null;
      member.updatedBy = user.id;
    }
    await this.organizationMemberRepo.save(member);
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'OrganizationMemberEntity', member.id, 'Thêm thành viên tổ chức');
    return this.findOne(org.id);
  }

  async myOrganizations(user: UserDto) {
    const data = await this.organizationMemberRepo.find({
      where: { userId: user.id, isDeleted: false },
      relations: { organization: true },
      order: { joinedAt: 'DESC' },
    });
    return { data: transformKeys(data), total: data.length };
  }

  async importOrganizations(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.create(
        {
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          contactEmail: optionalText(item.contactEmail),
          contactPhone: optionalText(item.contactPhone),
          billingAddress: optionalText(item.billingAddress),
          logoUrl: optionalText(item.logoUrl),
          status: optionalText(item.status),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportOrganizations(body: PaginationDto<FilterOrganizationDto>) {
    const { data } = await this.pagination({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
