import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { LessonBlockEntity } from './lesson-block.entity';

@Entity('lesson_block_progress')
@Index('idx_lesson_block_progress_user_block', ['userId', 'lessonBlockId'], { unique: true })
@Index('idx_lesson_block_progress_user_id', ['userId'])
@Index('idx_lesson_block_progress_block_id', ['lessonBlockId'])
export class LessonBlockProgressEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến khối nội dung bài học' })
  @Column({ type: 'uuid' })
  lessonBlockId: string;

  @ApiProperty({
    enum: enumData.PROGRESS_STATUS,
    default: enumData.PROGRESS_STATUS.NOT_STARTED.code,
    description: 'Trạng thái tiến độ block',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.PROGRESS_STATUS.NOT_STARTED.code })
  status: string;

  @ApiProperty({ description: 'Thời gian đã học (giây)', default: 0 })
  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => LessonBlockEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonBlockId' })
  lessonBlock?: LessonBlockEntity;
}
