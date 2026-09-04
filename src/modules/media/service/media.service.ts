import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
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
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { MediaAssetEntity } from '~/entities';
import { MediaAssetRepo, MediaAttachmentRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { CreateMediaAssetDto, FilterMediaAssetDto } from '../dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaAssetRepo: MediaAssetRepo,
    private readonly mediaAttachmentRepo: MediaAttachmentRepo,
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

  async paginationAssets(body: PaginationDto<FilterMediaAssetDto>) {
    const { skip = 0, take = 20, where = {} as FilterMediaAssetDto } = body;
    const whereCon: FindOptionsWhere<MediaAssetEntity> = { isDeleted: where.isDeleted ?? false };
    if (where.keyword) whereCon.originalFilename = UnaccentILike(`%${where.keyword}%`);
    if (where.assetType) whereCon.assetType = where.assetType;
    if (where.visibility) whereCon.visibility = where.visibility;
    const [data, total] = await this.mediaAssetRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findAsset(id: string, publicOnly = false) {
    const item = await this.mediaAssetRepo.findOne({
      where: {
        id,
        ...(publicOnly
          ? {
              isDeleted: false,
              visibility: enumData.VISIBILITY.PUBLIC.code,
            }
          : {}),
      },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.media_asset'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createAsset(dto: CreateMediaAssetDto, user: UserDto) {
    const item = await this.mediaAssetRepo.save(
      this.mediaAssetRepo.create({
        id: uuidv4(),
        ownerId: dto.ownerId,
        assetType: dto.assetType,
        storageProvider: dto.storageProvider || 's3',
        storageKey: dto.storageKey,
        publicUrl: dto.publicUrl,
        originalFilename: dto.originalFilename,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes || 0,
        durationSeconds: dto.durationSeconds,
        checksum: dto.checksum,
        visibility: dto.visibility || enumData.VISIBILITY.PUBLIC.code,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'MediaAssetEntity',
      item.id,
      `Đăng ký media: ${item.originalFilename || item.storageKey}`,
    );
    return this.findAsset(item.id);
  }

  async deactivateAsset(id: string, user: UserDto) {
    const item = await this.mediaAssetRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.media_asset'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.mediaAssetRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'MediaAssetEntity',
      id,
      `Ngưng media: ${item.originalFilename || item.storageKey}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateAsset(id: string, user: UserDto) {
    const item = await this.mediaAssetRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.media_asset'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.mediaAssetRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'MediaAssetEntity',
      id,
      `Kích hoạt media: ${item.originalFilename || item.storageKey}`,
    );
    return this.findAsset(id);
  }

  async listAttachments(ownerType: string, ownerId: string) {
    const data = await this.mediaAttachmentRepo.find({
      where: { ownerType, ownerId, isDeleted: false },
      relations: { mediaAsset: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(data) };
  }

  async attach(
    ownerType: string,
    ownerId: string,
    mediaAssetId: string,
    purpose: string,
    user: UserDto,
    caption?: string,
    sortOrder = 0,
  ) {
    const asset = await this.mediaAssetRepo.findOne({ where: { id: mediaAssetId, isDeleted: false } });
    if (!asset) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.media_asset'));
    const item = await this.mediaAttachmentRepo.save(
      this.mediaAttachmentRepo.create({
        id: uuidv4(),
        ownerType,
        ownerId,
        mediaAssetId,
        purpose,
        caption,
        sortOrder,
        createdBy: user.id,
      }),
    );
    return { message: this.i18n.commonTranslate('create_success'), data: transformKeys(item) };
  }

  async importAssets(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createAsset(
        {
          assetType: requireText(item.assetType, 'Loại media'),
          storageKey: requireText(item.storageKey, 'Storage key'),
          publicUrl: optionalText(item.publicUrl),
          originalFilename: optionalText(item.originalFilename),
          mimeType: optionalText(item.mimeType),
          sizeBytes: optionalNumber(item.sizeBytes, 0),
          durationSeconds: optionalNumber(item.durationSeconds),
          visibility: optionalText(item.visibility),
          storageProvider: optionalText(item.storageProvider) || 's3',
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportAssets(body: PaginationDto<FilterMediaAssetDto>) {
    const { data } = await this.paginationAssets({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
