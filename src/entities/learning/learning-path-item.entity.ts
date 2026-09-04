import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { LearningPathEntity } from './learning-path.entity';

/**
 * Bảng `learning_path_items` — một việc cần làm trong lộ trình.
 *
 * `itemId` trỏ tới resource thật theo `itemType` (deck / lesson / assessment /
 * cấu trúc ngữ pháp). Không có FK vì đa hình — service phải kiểm tra tồn tại.
 * Nếu chưa có dữ liệu thì để lộ trình rỗng, KHÔNG bịa UUID.
 */
@Entity('learning_path_items')
@Index('idx_learning_path_items_path', ['learningPathId', 'sortOrder'])
@Index('idx_learning_path_items_scheduled', ['learningPathId', 'scheduledDate'])
export class LearningPathItemEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lộ trình' })
  @Column({ type: 'uuid' })
  learningPathId: string;

  @ApiProperty({ enum: enumData.LEARNING_PATH_ITEM_TYPE, description: 'Loại việc cần làm' })
  @Column({ type: 'varchar', length: 30 })
  itemType: string;

  @ApiProperty({ description: 'ID resource tương ứng với itemType' })
  @Column({ type: 'uuid' })
  itemId: string;

  @ApiProperty({ description: 'Ngày dự kiến thực hiện' })
  @Column({ type: 'date' })
  scheduledDate: Date | string;

  @ApiProperty({ description: 'Thứ tự trong ngày' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    enum: enumData.PROGRESS_STATUS,
    default: enumData.PROGRESS_STATUS.NOT_STARTED.code,
    description: 'Trạng thái thực hiện',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.PROGRESS_STATUS.NOT_STARTED.code })
  status: string;

  @ApiPropertyOptional({
    description: 'Dữ liệu để UI render thẻ việc cần làm, dạng { title, href }',
  })
  @Column({ type: 'jsonb', nullable: true })
  reasonJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành' })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => LearningPathEntity, path => path.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'learningPathId' })
  learningPath?: LearningPathEntity;
}
