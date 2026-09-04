import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ConversationEntity } from './conversation.entity';

/**
 * Bảng `conversation_messages` — tin nhắn trong luồng hội thoại.
 * KHÔNG ghi action log cho bảng này (quyết định 9.4) — bản thân nó đã là lịch sử.
 * `audioUrl` là 1 bản ghi âm / tin nên lưu URL thẳng; file kèm nhiều hơn thì
 * nối qua `media_attachments`.
 */
@Entity('conversation_messages')
@Index('idx_conversation_messages_conversation', ['conversationId', 'sentAt'])
@Index('idx_conversation_messages_sender', ['senderUserId'])
export class ConversationMessageEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến luồng hội thoại' })
  @Column({ type: 'uuid' })
  conversationId: string;

  @ApiPropertyOptional({ description: 'Người gửi, null nếu là AI hoặc hệ thống' })
  @Column({ type: 'uuid', nullable: true })
  senderUserId?: string;

  @ApiProperty({ enum: enumData.CONVERSATION_ROLE, description: 'Vai trò người gửi' })
  @Column({ type: 'varchar', length: 20 })
  senderRole: string;

  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @Column({ type: 'text' })
  content: string;

  @ApiPropertyOptional({ description: 'Bản dịch tiếng Việt, dùng ở hội thoại AI' })
  @Column({ type: 'text', nullable: true })
  translationVi?: string;

  @ApiPropertyOptional({ description: 'Bản ghi âm của tin (1 file nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Thời lượng bản ghi âm (giây)' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  audioDurationSeconds?: number;

  @ApiPropertyOptional({ description: 'Nhận xét ngữ pháp của AI cho tin nhắn này' })
  @Column({ type: 'jsonb', nullable: true })
  feedbackJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Tin do hệ thống sinh ra' })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Thời điểm gửi' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @ManyToOne(() => ConversationEntity, conversation => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation?: ConversationEntity;
}
