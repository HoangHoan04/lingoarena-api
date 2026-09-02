import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { GradingTaskEntity } from './grading-task.entity';

@Entity('ai_grading_logs')
@Index('idx_ai_grading_logs_task_id', ['gradingTaskId'])
@Index('idx_ai_grading_logs_model', ['modelUsed'])
@Index('idx_ai_grading_logs_created_at', ['createdAt'])
export class AiGradingLogEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến nhiệm vụ chấm điểm' })
  @Column({ type: 'uuid' })
  gradingTaskId: string;

  @ApiProperty({ description: 'Mô hình AI sử dụng (gpt-4o, claude-sonnet-4-6)' })
  @Column({ type: 'varchar', length: 100 })
  modelUsed: string;

  @ApiProperty({ description: 'Số prompt tokens tiêu thụ', default: 0 })
  @Column({ type: 'int', default: 0 })
  promptTokens: number;

  @ApiProperty({ description: 'Số completion tokens tiêu thụ', default: 0 })
  @Column({ type: 'int', default: 0 })
  completionTokens: number;

  @ApiProperty({ description: 'Chi phí tính theo USD', default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  costUsd: number;

  @ApiProperty({ description: 'Thời gian phản hồi tính bằng ms', default: 0 })
  @Column({ type: 'int', default: 0 })
  durationMs: number;

  @ApiProperty({
    enum: enumData.AI_JOB_STATUS,
    default: enumData.AI_JOB_STATUS.COMPLETED.code,
    description: 'Trạng thái tác vụ AI',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.AI_JOB_STATUS.COMPLETED.code })
  status: string;

  @ApiPropertyOptional({
    description: 'Khóa ngoại tham chiếu đến response thô lưu trong media_assets',
  })
  @Column({ type: 'uuid', nullable: true })
  rawResponseAssetId?: string;

  @ApiPropertyOptional({ description: 'Thông báo lỗi nếu thất bại' })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ManyToOne(() => GradingTaskEntity, task => task.aiLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gradingTaskId' })
  gradingTask?: GradingTaskEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rawResponseAssetId' })
  rawResponseAsset?: MediaAssetEntity;
}
