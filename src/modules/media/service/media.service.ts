import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { PaginationDto, UserDto } from '~/dto';
import { MediaAssetEntity } from '~/entities';
import { MediaAssetRepo, MediaVariantRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { CreateMediaAssetDto, FilterMediaAssetDto } from '../dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaAssetRepo: MediaAssetRepo,
    private readonly mediaVariantRepo: MediaVariantRepo,
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
    if (where.processingStatus) whereCon.processingStatus = where.processingStatus;
    if (where.visibility) whereCon.visibility = where.visibility;
    const [data, total] = await this.mediaAssetRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { owner: true, variants: true },
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
              processingStatus: 'ready',
              visibility: enumData.VISIBILITY.PUBLIC.code,
            }
          : {}),
      },
      relations: { variants: true },
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
        processingStatus: dto.processingStatus || 'ready',
        visibility: dto.visibility || enumData.VISIBILITY.PUBLIC.code,
        createdBy: user.id,
      }),
    );
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'MediaAssetEntity', item.id, `Đăng ký media: ${item.originalFilename || item.storageKey}`);
    return this.findAsset(item.id);
  }

  async deactivateAsset(id: string, user: UserDto) {
    const item = await this.mediaAssetRepo.findOne({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.media_asset'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.mediaAssetRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'MediaAssetEntity', id, `Ngưng media: ${item.originalFilename || item.storageKey}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateAsset(id: string, user: UserDto) {
    const item = await this.mediaAssetRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.media_asset'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.mediaAssetRepo.save(item);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'MediaAssetEntity', id, `Kích hoạt media: ${item.originalFilename || item.storageKey}`);
    return this.findAsset(id);
  }
}
