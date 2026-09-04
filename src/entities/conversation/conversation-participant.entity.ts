import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ConversationEntity } from './conversation.entity';

/**
 * Bảng `conversation_participants` — người tham gia một luồng hội thoại.
 * `isMuted` / `isSpeaking` / `hasHandRaised` là trạng thái phòng luyện nói.
 * Chúng đổi rất nhanh nên nguồn sự thật khi phòng đang mở là realtime layer;
 * bảng này chỉ giữ trạng thái gần nhất để dựng lại UI khi vào lại phòng.
 */
@Entity('conversation_participants')
@Index('uq_conversation_participants_link', ['conversationId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_conversation_participants_user', ['userId'])
export class ConversationParticipantEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến luồng hội thoại' })
  @Column({ type: 'uuid' })
  conversationId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người tham gia' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.CONVERSATION_PARTICIPANT_ROLE,
    default: enumData.CONVERSATION_PARTICIPANT_ROLE.MEMBER.code,
    description: 'Vai trò trong phòng',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: enumData.CONVERSATION_PARTICIPANT_ROLE.MEMBER.code,
  })
  role: string;

  @ApiProperty({ description: 'Đang tắt tiếng' })
  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @ApiProperty({ description: 'Đang nói' })
  @Column({ type: 'boolean', default: false })
  isSpeaking: boolean;

  @ApiProperty({ description: 'Đang giơ tay xin nói' })
  @Column({ type: 'boolean', default: false })
  hasHandRaised: boolean;

  @ApiProperty({ description: 'Thời điểm vào phòng' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm rời phòng' })
  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm đọc tin gần nhất, dùng để đếm tin chưa đọc' })
  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt?: Date;

  @ManyToOne(() => ConversationEntity, conversation => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation?: ConversationEntity;
}
