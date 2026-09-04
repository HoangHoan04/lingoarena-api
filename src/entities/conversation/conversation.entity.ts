import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { AiTutorPersonaEntity } from './ai-tutor-persona.entity';
import { ConversationMessageEntity } from './conversation-message.entity';
import { ConversationParticipantEntity } from './conversation-participant.entity';

/**
 * Bảng `conversations` — động cơ hội thoại dùng chung cho 3 tính năng:
 * chat với AI, phòng luyện nói nhiều người, thông báo trong lớp học.
 * Gộp được vì cả ba đều là "một luồng tin nhắn có người tham gia"; phân biệt
 * bằng `conversationType` và các cột chỉ dùng cho một loại đều nullable.
 * Ticket hỗ trợ **không** dùng bảng này (quyết định 9.3): nó có
 * `isInternalNote` mà mọi query phía customer phải lọc, nhồi chung sẽ dễ rò rỉ
 * ghi chú nội bộ.
 */
@Entity('conversations')
@Index('idx_conversations_type_status', ['conversationType', 'status'])
@Index('idx_conversations_host', ['hostUserId'])
@Index('idx_conversations_classroom', ['classroomId'])
export class ConversationEntity extends PrimaryBaseEntity {
  @ApiProperty({ enum: enumData.CONVERSATION_TYPE, description: 'Loại luồng hội thoại' })
  @Column({ type: 'varchar', length: 30 })
  conversationType: string;

  @ApiPropertyOptional({ description: 'Tên phòng / tiêu đề luồng' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @ApiPropertyOptional({ description: 'Chủ đề trao đổi' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  topic?: string;

  @ApiPropertyOptional({ description: 'Nhân vật AI, chỉ dùng với AI_TUTOR' })
  @Column({ type: 'uuid', nullable: true })
  personaId?: string;

  @ApiPropertyOptional({ description: 'Chủ phòng' })
  @Column({ type: 'uuid', nullable: true })
  hostUserId?: string;

  @ApiPropertyOptional({ description: 'Lớp học, chỉ dùng với CLASSROOM' })
  @Column({ type: 'uuid', nullable: true })
  classroomId?: string;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ yêu cầu của phòng' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  cefrLevel?: string;

  @ApiPropertyOptional({ description: 'Số người tham gia tối đa' })
  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  @ApiProperty({ description: 'Phòng riêng tư hay công khai' })
  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @ApiPropertyOptional({ description: 'Mật khẩu phòng riêng tư, lưu dạng băm' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @ApiPropertyOptional({ description: 'Câu gợi mở để phá băng' })
  @Column({ type: 'jsonb', nullable: true })
  icebreakersJson?: string[];

  @ApiProperty({
    enum: enumData.CONVERSATION_STATUS,
    default: enumData.CONVERSATION_STATUS.OPEN.code,
    description: 'Trạng thái luồng',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CONVERSATION_STATUS.OPEN.code })
  status: string;

  @ApiProperty({ description: 'Số tin nhắn — denormalize để list không phải count' })
  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm tin nhắn gần nhất, dùng để sắp xếp' })
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @ApiPropertyOptional({ description: 'Dữ liệu riêng theo từng loại hội thoại' })
  @Column({ type: 'jsonb', nullable: true })
  metaJson?: Record<string, unknown>;

  @ManyToOne(() => AiTutorPersonaEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'personaId' })
  persona?: AiTutorPersonaEntity;

  @OneToMany(() => ConversationParticipantEntity, participant => participant.conversation)
  participants?: ConversationParticipantEntity[];

  @OneToMany(() => ConversationMessageEntity, message => message.conversation)
  messages?: ConversationMessageEntity[];
}
