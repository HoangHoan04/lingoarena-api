import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { LessonEntity } from './lesson.entity';

/**
 * Bảng `lesson_progress` — tiến độ của người học trên từng bài.
 *
 * Bỏ bảng `lesson_block_progress` cũ: vị trí đang xem trong bài lưu ở
 * `lastPositionJson` (vd `{ blockId, videoSeconds }`), đủ để "học tiếp".
 */
@Entity('lesson_progress')
@Index('uq_lesson_progress_user_lesson', ['userId', 'lessonId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_lesson_progress_user', ['userId'])
export class LessonProgressEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài học' })
  @Column({ type: 'uuid' })
  lessonId: string;

  @ApiProperty({
    enum: enumData.PROGRESS_STATUS,
    default: enumData.PROGRESS_STATUS.NOT_STARTED.code,
    description: 'Trạng thái học bài',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.PROGRESS_STATUS.NOT_STARTED.code })
  status: string;

  @ApiProperty({ description: 'Phần trăm hoàn thành bài' })
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @ApiPropertyOptional({ description: 'Vị trí đang xem để tiếp tục học' })
  @Column({ type: 'jsonb', nullable: true })
  lastPositionJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành bài' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson?: LessonEntity;
}
