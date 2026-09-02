import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { GrammarStructureEntity } from './grammar-structure.entity';

@Entity('user_grammar_mastery')
@Index('idx_user_grammar_mastery_pk', ['userId', 'grammarStructureId'], { unique: true })
export class UserGrammarMasteryEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến cấu trúc ngữ pháp' })
  @Column({ type: 'uuid' })
  grammarStructureId: string;

  @ApiProperty({ description: 'Điểm thành thạo (0.00 to 100.00%)', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  masteryScore: number;

  @ApiProperty({ description: 'Số lần trả lời đúng', default: 0 })
  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @ApiProperty({ description: 'Số lần trả lời sai', default: 0 })
  @Column({ type: 'int', default: 0 })
  incorrectCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm luyện tập gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastPracticedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm ôn tập tiếp theo' })
  @Column({ type: 'timestamptz', nullable: true })
  nextReviewAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => GrammarStructureEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grammarStructureId' })
  grammarStructure?: GrammarStructureEntity;
}
