import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from './media-asset.entity';

/**
 * Bảng `media_attachments` — nối N file vào bất kỳ entity nào (đa hình).
 * Chỉ dùng khi chủ thể cần **nhiều** file. Trường hợp 1 file cố định thì entity
 * khai cột URL thẳng (vd `user_profiles.avatarUrl`, `courses.thumbnailUrl`).
 */
@Entity('media_attachments')
@Index('idx_media_attachments_owner', ['ownerType', 'ownerId', 'purpose', 'sortOrder'])
export class MediaAttachmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Tên class entity chủ (vd QuestionGroupEntity)' })
  @Column({ type: 'varchar', length: 50 })
  ownerType: string;

  @ApiProperty({ description: 'ID bản ghi chủ' })
  @Column({ type: 'uuid' })
  ownerId: string;

  @ApiProperty({ enum: enumData.MEDIA_PURPOSE, description: 'Mục đích sử dụng file' })
  @Column({ type: 'varchar', length: 50 })
  purpose: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến file đã upload' })
  @Column({ type: 'uuid' })
  mediaAssetId: string;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Chú thích hiển thị kèm file' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  caption?: string;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mediaAssetId' })
  mediaAsset?: MediaAssetEntity;
}
