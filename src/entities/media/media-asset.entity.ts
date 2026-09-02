import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaVariantEntity } from './media-variant.entity';

@Entity('media_assets')
@Index('idx_media_assets_storage_key', ['storageKey'])
@Index('idx_media_assets_owner_id', ['ownerId'])
@Index('idx_media_assets_asset_type', ['assetType'])
export class MediaAssetEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến người sở hữu file' })
  @Column({ type: 'uuid', nullable: true })
  ownerId?: string;

  @ApiProperty({ enum: enumData.MEDIA_ASSET_TYPE, description: 'Loại file phương tiện' })
  @Column({ type: 'varchar', length: 50 })
  assetType: string;

  @ApiProperty({ description: 'Nhà cung cấp lưu trữ (s3, r2, cloudinary)', default: 's3' })
  @Column({ type: 'varchar', length: 50, default: 's3' })
  storageProvider: string;

  @ApiProperty({ description: 'Đường dẫn / key trên storage' })
  @Column({ type: 'varchar', length: 500 })
  storageKey: string;

  @ApiPropertyOptional({ description: 'URL truy cập công khai' })
  @Column({ type: 'text', nullable: true })
  publicUrl?: string;

  @ApiPropertyOptional({ description: 'Tên file gốc' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  originalFilename?: string;

  @ApiPropertyOptional({ description: 'MIME type' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @ApiProperty({ description: 'Dung lượng file tính bằng bytes', default: 0 })
  @Column({ type: 'bigint', default: 0 })
  sizeBytes: number | string;

  @ApiPropertyOptional({ description: 'Thời lượng file media (giây)', default: 0 })
  @Column({ type: 'int', default: 0, nullable: true })
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Mã băm kiểm tra toàn vẹn' })
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  @ApiProperty({
    description: 'Trạng thái xử lý file (uploading, processing, ready, failed)',
    default: 'ready',
  })
  @Column({ type: 'varchar', length: 30, default: 'ready' })
  processingStatus: string;

  @ApiProperty({
    enum: enumData.VISIBILITY,
    default: enumData.VISIBILITY.PUBLIC.code,
    description: 'Chế độ hiển thị',
  })
  @Column({ type: 'varchar', length: 30, default: enumData.VISIBILITY.PUBLIC.code })
  visibility: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner?: UserEntity;

  @OneToMany(() => MediaVariantEntity, variant => variant.mediaAsset)
  variants?: MediaVariantEntity[];
}
