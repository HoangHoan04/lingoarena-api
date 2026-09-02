import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('content_reviews')
@Index('idx_content_reviews_entity', ['entityType', 'entityId'])
@Index('idx_content_reviews_reviewer_id', ['reviewerId'])
export class ContentReviewEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Loại entity (question, course, vocabulary, grammar)' })
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @ApiProperty({ description: 'ID của entity' })
  @Column({ type: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người duyệt' })
  @Column({ type: 'uuid' })
  reviewerId: string;

  @ApiProperty({ enum: enumData.CONTENT_REVIEW_STATUS, description: 'Trạng thái duyệt' })
  @Column({ type: 'varchar', length: 50 })
  status: string;

  @ApiPropertyOptional({ description: 'Ghi chú đánh giá / duyệt' })
  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @ApiProperty({ description: 'Thời điểm duyệt' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  reviewedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer?: UserEntity;
}
