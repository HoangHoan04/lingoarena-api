import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `user_gamification_stats` — 1 dòng / user, giữ tổng đã cộng dồn.
 *
 * Tách khỏi `user_profiles` vì đây là dữ liệu ghi rất thường xuyên (mỗi lần
 * kiếm điểm), trong khi hồ sơ gần như tĩnh — không nên khoá cùng một dòng.
 * `totalPoints` phải khớp tổng `point_ledger_entries`.
 */
@Entity('user_gamification_stats')
@Index('uq_user_gamification_stats_user', ['userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_user_gamification_stats_points', ['totalPoints'])
export class UserGamificationStatEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Tổng điểm tích lũy' })
  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @ApiProperty({ description: 'Cấp độ hiện tại, suy ra từ tổng điểm' })
  @Column({ type: 'int', default: 1 })
  currentLevel: number;

  @ApiProperty({ description: 'Số ngày học liên tiếp hiện tại' })
  @Column({ type: 'int', default: 0 })
  currentStreakDays: number;

  @ApiProperty({ description: 'Chuỗi ngày học dài nhất từng đạt' })
  @Column({ type: 'int', default: 0 })
  longestStreakDays: number;

  @ApiPropertyOptional({ description: 'Ngày hoạt động gần nhất, theo timezone người dùng' })
  @Column({ type: 'date', nullable: true })
  lastActivityDate?: Date | string;

  @ApiProperty({ description: 'Số lượt được phép nghỉ mà không mất streak' })
  @Column({ type: 'int', default: 0 })
  freezeCredits: number;
}
