import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { LearningPathEntity } from './learning-path.entity';

@Entity('learning_path_items')
@Index('idx_learning_path_items_path_date', ['learningPathId', 'scheduledDate'])
@Index('idx_learning_path_items_path_id', ['learningPathId'])
@Index('idx_learning_path_items_status', ['status'])
@Index('idx_learning_path_items_type_id', ['itemType', 'itemId'])
export class LearningPathItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lộ trình học' })
  @Column({ type: 'uuid' })
  learningPathId: string;

  @ApiProperty({ enum: enumData.LEARNING_PATH_ITEM_TYPE, description: 'Loại hoạt động' })
  @Column({ type: 'varchar', length: 50 })
  itemType: string;

  @ApiProperty({
    description: 'ID tài nguyên polymorphic (Lesson, Assessment, Deck) — bắt buộc kèm itemType',
  })
  @Column({ type: 'uuid' })
  itemId: string;

  @ApiProperty({ description: 'Ngày dự kiến thực hiện' })
  @Column({ type: 'date' })
  scheduledDate: Date | string;

  @ApiProperty({ description: 'Thứ tự sắp xếp trong ngày', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    enum: enumData.PROGRESS_STATUS,
    default: enumData.PROGRESS_STATUS.NOT_STARTED.code,
    description: 'Trạng thái hoàn thành',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.PROGRESS_STATUS.NOT_STARTED.code })
  status: string;

  @ApiPropertyOptional({ description: 'Lý do gợi ý hoạt động này JSON' })
  @Column({ type: 'jsonb', nullable: true })
  reasonJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => LearningPathEntity, path => path.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'learningPathId' })
  learningPath?: LearningPathEntity;
}
