import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `user_mastery` — mức thành thạo theo kỹ năng / ngữ pháp / chủ đề / câu hỏi.
 *
 * Gộp 3 bảng cũ vì cùng hình dạng; phân biệt bằng `targetType` + `targetId`.
 * SRS từ vựng **không** nằm đây — xem `user_vocabulary_states` (quyết định 9.1).
 */
@Entity('user_mastery')
@Index('uq_user_mastery_target', ['userId', 'targetType', 'targetId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_user_mastery_user_type', ['userId', 'targetType'])
export class UserMasteryEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người học' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.MASTERY_ENTITY_TYPE, description: 'Loại đối tượng đo' })
  @Column({ type: 'varchar', length: 20 })
  targetType: string;

  @ApiProperty({ description: 'ID đối tượng tương ứng với targetType' })
  @Column({ type: 'uuid' })
  targetId: string;

  @ApiProperty({ description: 'Điểm thành thạo' })
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  masteryScore: number;

  @ApiProperty({ description: 'Tổng số lần luyện' })
  @Column({ type: 'int', default: 0 })
  practiceCount: number;

  @ApiProperty({ description: 'Số lần đúng' })
  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @ApiProperty({ description: 'Số lần sai' })
  @Column({ type: 'int', default: 0 })
  incorrectCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm luyện gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastPracticedAt?: Date;

  @ApiPropertyOptional({ description: 'Lịch ôn kế tiếp (ngữ pháp cũng có)' })
  @Column({ type: 'timestamptz', nullable: true })
  nextReviewAt?: Date;
}
