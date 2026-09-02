import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('user_gamification_stats')
export class UserGamificationStatEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @ApiProperty({ description: 'Tổng điểm tích lũy', default: 0 })
  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @ApiProperty({ description: 'Chuỗi ngày học liên tục hiện tại', default: 0 })
  @Column({ type: 'int', default: 0 })
  currentStreakDays: number;

  @ApiProperty({ description: 'Chuỗi ngày học liên tục dài nhất', default: 0 })
  @Column({ type: 'int', default: 0 })
  longestStreakDays: number;

  @ApiPropertyOptional({ description: 'Ngày hoạt động gần nhất' })
  @Column({ type: 'date', nullable: true })
  lastActivityDate?: Date | string;

  @ApiProperty({ description: 'Số lượt đóng băng chuỗi có sẵn (freeze streak)', default: 0 })
  @Column({ type: 'int', default: 0 })
  freezeCredits: number;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
