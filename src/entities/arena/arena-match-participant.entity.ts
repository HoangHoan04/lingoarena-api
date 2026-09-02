import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ArenaMatchAnswerEntity } from './arena-match-answer.entity';
import { ArenaMatchEntity } from './arena-match.entity';

@Entity('arena_match_participants')
@Index('idx_arena_match_participants_unique', ['matchId', 'userId'], { unique: true })
@Index('idx_arena_match_participants_match_id', ['matchId'])
@Index('idx_arena_match_participants_user_id', ['userId'])
export class ArenaMatchParticipantEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến trận đấu Arena' })
  @Column({ type: 'uuid' })
  matchId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng tham gia' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Vị trí ghế ngồi trong phòng đấu', default: 1 })
  @Column({ type: 'int', default: 1 })
  seatNumber: number;

  @ApiPropertyOptional({ enum: enumData.ARENA_PARTICIPANT_RESULT, description: 'Kết quả trận đấu' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  result?: string;

  @ApiPropertyOptional({ description: 'Xếp hạng trong trận' })
  @Column({ type: 'int', nullable: true })
  rank?: number;

  @ApiProperty({ description: 'Số câu trả lời đúng', default: 0 })
  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @ApiProperty({ description: 'Tổng số câu đã trả lời', default: 0 })
  @Column({ type: 'int', default: 0 })
  totalAnswered: number;

  @ApiProperty({ description: 'Điểm số trong trận', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @ApiProperty({ description: 'Tổng thời gian làm bài (giây)', default: 0 })
  @Column({ type: 'int', default: 0 })
  timeTakenSeconds: number;

  @ApiPropertyOptional({ description: 'Điểm ELO trước trận' })
  @Column({ type: 'int', nullable: true })
  eloBefore?: number;

  @ApiPropertyOptional({ description: 'Điểm ELO sau trận' })
  @Column({ type: 'int', nullable: true })
  eloAfter?: number;

  @ApiPropertyOptional({ description: 'Biến động điểm ELO' })
  @Column({ type: 'int', nullable: true })
  eloChange?: number;

  @ApiPropertyOptional({ description: 'Thời điểm rời trận / mất kết nối' })
  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date;

  @ManyToOne(() => ArenaMatchEntity, match => match.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match?: ArenaMatchEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @OneToMany(() => ArenaMatchAnswerEntity, answer => answer.participant)
  answers?: ArenaMatchAnswerEntity[];
}
