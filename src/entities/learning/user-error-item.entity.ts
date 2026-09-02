import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { AttemptAnswerEntity } from '../assessment/attempt-answer.entity';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from '../question/question.entity';

@Entity('user_error_items')
@Index('idx_user_error_items_user_question', ['userId', 'questionId'], { unique: true })
@Index('idx_user_error_items_user_id', ['userId'])
@Index('idx_user_error_items_is_resolved', ['isResolved'])
@Index('idx_user_error_items_next_review', ['nextReviewAt'])
export class UserErrorItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến câu trả lời' })
  @Column({ type: 'uuid', nullable: true })
  attemptAnswerId?: string;

  @ApiProperty({
    enum: enumData.ERROR_TYPE,
    default: enumData.ERROR_TYPE.GRAMMAR.code,
    description: 'Loại lỗi sai',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.ERROR_TYPE.GRAMMAR.code })
  errorType: string;

  @ApiPropertyOptional({ description: 'Lý do mắc lỗi' })
  @Column({ type: 'text', nullable: true })
  errorReason?: string;

  @ApiPropertyOptional({ description: 'Ghi chú cá nhân của người học' })
  @Column({ type: 'text', nullable: true })
  userNote?: string;

  @ApiProperty({ description: 'Cờ đã khắc phục lỗi', default: false })
  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @ApiProperty({ description: 'Số lần làm sai câu này', default: 1 })
  @Column({ type: 'int', default: 1 })
  wrongCount: number;

  @ApiProperty({ description: 'Thời điểm làm sai gần nhất' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastWrongAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm ôn tập lại lỗi tiếp theo' })
  @Column({ type: 'timestamptz', nullable: true })
  nextReviewAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => QuestionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => AttemptAnswerEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'attemptAnswerId' })
  attemptAnswer?: AttemptAnswerEntity;
}
