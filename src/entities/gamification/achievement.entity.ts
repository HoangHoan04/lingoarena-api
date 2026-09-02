import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { UserAchievementEntity } from './user-achievement.entity';

@Entity('achievements')
@Index('idx_achievements_code', ['code'], { unique: true })
@Index('idx_achievements_category', ['category'])
export class AchievementEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã nghiệp vụ huy hiệu thành tích' })
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên thành tích' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: enumData.ACHIEVEMENT_CATEGORY, description: 'Danh mục thành tích' })
  @Column({ type: 'varchar', length: 50 })
  category: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến icon huy hiệu' })
  @Column({ type: 'uuid', nullable: true })
  iconMediaAssetId?: string;

  @ApiProperty({
    description: 'Điều kiện mở khóa thành tích dạng JSON (e.g. {"type":"streak","value":30 })',
  })
  @Column({ type: 'jsonb' })
  conditionJson: Record<string, unknown>;

  @ApiProperty({ description: 'Số điểm thưởng', default: 0 })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiProperty({ description: 'Trạng thái hoạt động', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'iconMediaAssetId' })
  iconMediaAsset?: MediaAssetEntity;

  @OneToMany(() => UserAchievementEntity, ua => ua.achievement)
  userAchievements?: UserAchievementEntity[];
}
