import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { LessonBlockEntity } from './lesson-block.entity';
import { LessonEntity } from './lesson.entity';

@Entity('lesson_progress')
@Index('idx_lesson_progress_user_lesson', ['userId', 'lessonId'], { unique: true })
@Index('idx_lesson_progress_user_id', ['userId'])
@Index('idx_lesson_progress_lesson_id', ['lessonId'])
@Index('idx_lesson_progress_status', ['status'])
export class LessonProgressEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài học' })
  @Column({ type: 'uuid' })
  lessonId: string;

  @ApiProperty({
    enum: enumData.PROGRESS_STATUS,
    default: enumData.PROGRESS_STATUS.NOT_STARTED.code,
    description: 'Trạng thái tiến độ',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.PROGRESS_STATUS.NOT_STARTED.code })
  status: string;

  @ApiProperty({ description: 'Tỷ lệ hoàn thành (%)', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến block cuối đã học' })
  @Column({ type: 'uuid', nullable: true })
  lastBlockId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm bắt đầu bài học' })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành bài học' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Thời điểm truy cập gần nhất' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastAccessedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson?: LessonEntity;

  @ManyToOne(() => LessonBlockEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lastBlockId' })
  lastBlock?: LessonBlockEntity;
}
