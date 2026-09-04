import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `media_assets` — sổ đăng ký trung tâm cho mọi file đã upload.
 * Entity nghiệp vụ chỉ cần 1 file thì lưu URL thẳng vào cột (vd `avatarUrl`);
 * cần nhiều file thì nối qua `media_attachments`.
 */
@Entity('media_assets')
@Index('idx_media_assets_asset_type', ['assetType'])
@Index('idx_media_assets_owner', ['ownerId'])
@Index('idx_media_assets_checksum', ['checksum'])
export class MediaAssetEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Người dùng đã upload file' })
  @Column({ type: 'uuid', nullable: true })
  ownerId?: string;

  @ApiProperty({ enum: enumData.MEDIA_ASSET_TYPE, description: 'Loại tài nguyên' })
  @Column({ type: 'varchar', length: 20 })
  assetType: string;

  @ApiProperty({ description: 'Nhà cung cấp lưu trữ (cloudinary, catbox, s3)' })
  @Column({ type: 'varchar', length: 30 })
  storageProvider: string;

  @ApiProperty({ description: 'Khóa định danh file trên nhà cung cấp' })
  @Column({ type: 'varchar', length: 500 })
  storageKey: string;

  @ApiPropertyOptional({ description: 'Đường dẫn truy cập công khai' })
  @Column({ type: 'text', nullable: true })
  publicUrl?: string;

  @ApiPropertyOptional({ description: 'Tên file gốc khi upload' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  originalFilename?: string;

  @ApiPropertyOptional({ description: 'MIME type' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @ApiProperty({ description: 'Kích thước file tính theo byte' })
  @Column({ type: 'bigint', default: 0 })
  sizeBytes: number;

  @ApiPropertyOptional({ description: 'Thời lượng với audio / video (giây)' })
  @Column({ type: 'int', nullable: true })
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Checksum dùng để phát hiện upload trùng' })
  @Column({ type: 'varchar', length: 128, nullable: true })
  checksum?: string;

  @ApiProperty({
    enum: enumData.VISIBILITY,
    default: enumData.VISIBILITY.PRIVATE.code,
    description: 'Phạm vi hiển thị',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.VISIBILITY.PRIVATE.code })
  visibility: string;

  @ApiPropertyOptional({
    description: 'Các biến thể của file (thumbnail, độ phân giải) — thay bảng media_variants',
  })
  @Column({ type: 'jsonb', nullable: true })
  variantsJson?: Record<string, unknown>;
}
