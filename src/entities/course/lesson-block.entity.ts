import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { LessonEntity } from './lesson.entity';
import { LessonBlockItemEntity } from './lesson-block-item.entity';

@Entity('lesson_blocks')
@Index('idx_lesson_blocks_lesson_id', ['lessonId'])
export class LessonBlockEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến bài học' })
  @Column({ type: 'uuid' })
  lessonId: string;

  @ApiProperty({ enum: enumData.LESSON_BLOCK_TYPE, description: 'Loại khối nội dung' })
  @Column({ type: 'varchar', length: 50 })
  blockType: string;

  @ApiProperty({ description: 'Nội dung JSON của block' })
  @Column({ type: 'jsonb' })
  contentJson: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến file phương tiện' })
  @Column({ type: 'uuid', nullable: true })
  mediaAssetId?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Bắt buộc hoàn thành', default: true })
  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @ManyToOne(() => LessonEntity, lesson => lesson.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson?: LessonEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mediaAssetId' })
  mediaAsset?: MediaAssetEntity;

  @OneToMany(() => LessonBlockItemEntity, item => item.lessonBlock)
  items?: LessonBlockItemEntity[];
}
 