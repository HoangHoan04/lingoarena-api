import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from './media-asset.entity';

@Entity('media_variants')
@Index('idx_media_variants_unique', ['mediaAssetId', 'variantType'], { unique: true })
@Index('idx_media_variants_asset_id', ['mediaAssetId'])
export class MediaVariantEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến file phương tiện gốc' })
  @Column({ type: 'uuid' })
  mediaAssetId: string;

  @ApiProperty({
    description: 'Loại biến thể (thumbnail, 720p, 1080p, audio_compressed, waveform)',
  })
  @Column({ type: 'varchar', length: 50 })
  variantType: string;

  @ApiProperty({ description: 'Đường dẫn / key trên storage' })
  @Column({ type: 'varchar', length: 500 })
  storageKey: string;

  @ApiPropertyOptional({ description: 'URL truy cập công khai' })
  @Column({ type: 'text', nullable: true })
  publicUrl?: string;

  @ApiPropertyOptional({ description: 'MIME type' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Dung lượng file biến thể tính bằng bytes', default: 0 })
  @Column({ type: 'bigint', default: 0, nullable: true })
  sizeBytes?: number | string;

  @ApiPropertyOptional({ description: 'Metadata JSON bổ sung' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => MediaAssetEntity, asset => asset.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mediaAssetId' })
  mediaAsset?: MediaAssetEntity;
}
