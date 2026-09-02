import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('mastery_records')
@Index('idx_mastery_records_unique', ['userId', 'entityType', 'entityId'], { unique: true })
@Index('idx_mastery_records_user_id', ['userId'])
@Index('idx_mastery_records_type_id', ['entityType', 'entityId'])
export class MasteryRecordEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.MASTERY_ENTITY_TYPE,
    description: 'Loại entity rollup (skill, topic, grammar, vocabulary)',
  })
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @ApiProperty({ description: 'ID của entity' })
  @Column({ type: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Điểm thành thạo', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  masteryScore: number;

  @ApiProperty({ description: 'Độ tin cậy', default: 0.5 })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5 })
  confidenceScore: number;

  @ApiProperty({ description: 'Số lượng bằng chứng đánh giá', default: 0 })
  @Column({ type: 'int', default: 0 })
  evidenceCount: number;

  @ApiProperty({ description: 'Thời điểm tính toán điểm' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  calculatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
