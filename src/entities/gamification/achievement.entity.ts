import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/** Bảng `achievements` — huy hiệu người học có thể đạt được. */
@Entity('achievements')
@Index('uq_achievements_code_alive', ['code'], { unique: true, where: '"isDeleted" = false' })
@Index('idx_achievements_category', ['category'])
export class AchievementEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã huy hiệu' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên huy hiệu' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả điều kiện đạt được' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: enumData.ACHIEVEMENT_CATEGORY, description: 'Nhóm huy hiệu' })
  @Column({ type: 'varchar', length: 30 })
  category: string;

  @ApiPropertyOptional({ description: 'Ảnh huy hiệu (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  iconUrl?: string;

  @ApiProperty({ description: 'Điều kiện đạt được dưới dạng cấu hình' })
  @Column({ type: 'jsonb' })
  criteriaJson: Record<string, unknown>;

  @ApiProperty({ description: 'Điểm thưởng khi đạt' })
  @Column({ type: 'int', default: 0 })
  rewardPoints: number;
}
