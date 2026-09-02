import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { PrimaryBaseEntity } from './base.entity';

/**
 * Bảng `action_logs` — Nhật ký thao tác admin (audit trail).
 * Lưu snapshot trước/sau khi CREATE | UPDATE | DELETE entity.
 */
@Entity('action_logs')
@Index('idx_action_logs_entity', ['entityType', 'entityId', 'createdAt'])
export class ActionLogEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Mã người thực hiện' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  actorCode?: string;

  @ApiProperty({ description: 'Tên người thực hiện' })
  @Column({ type: 'varchar', length: 255 })
  actorName: string;

  @ApiProperty({ description: 'Loại thao tác' })
  @Column({ type: 'varchar', length: 50 })
  actionType: string;

  @ApiProperty({ description: 'Loại entity bị tác động' })
  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @ApiProperty({ description: 'ID entity bị tác động' })
  @Index()
  @Column({ type: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Mô tả hành động hiển thị trên UI' })
  @Column({ type: 'text' })
  description: string;

  @ApiPropertyOptional({ description: 'Snapshot dữ liệu trước thay đổi' })
  @Column({ type: 'jsonb', nullable: true })
  dataBefore?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Snapshot dữ liệu sau thay đổi' })
  @Column({ type: 'jsonb', nullable: true })
  dataAfter?: Record<string, unknown>;
}
