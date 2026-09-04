import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `ai_tutor_personas` — nhân vật AI cho trang `/ai-conversation`.
 * `avatarUrl` và `coverImageUrl` là 2 slot cố định mang nghĩa khác nhau nên lưu
 * URL thẳng, không dùng `media_attachments`.
 */
@Entity('ai_tutor_personas')
@Index('uq_ai_tutor_personas_code_alive', ['code'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class AiTutorPersonaEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã nhân vật' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên nhân vật' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Chức danh hiển thị' })
  @Column({ type: 'varchar', length: 150 })
  title: string;

  @ApiProperty({ enum: enumData.GENDER, description: 'Giới tính nhân vật' })
  @Column({ type: 'varchar', length: 20 })
  gender: string;

  @ApiProperty({ description: 'Mã chất giọng (US, UK, AUS)' })
  @Column({ type: 'varchar', length: 10 })
  accent: string;

  @ApiProperty({ description: 'Nhãn chất giọng hiển thị' })
  @Column({ type: 'varchar', length: 50 })
  accentLabel: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  coverImageUrl?: string;

  @ApiProperty({ description: 'Vai trò nhân vật đóng trong hội thoại' })
  @Column({ type: 'text' })
  roleDescription: string;

  @ApiProperty({ description: 'Tính cách, dùng để dựng system prompt' })
  @Column({ type: 'text' })
  personality: string;

  @ApiPropertyOptional({ description: 'Câu giới thiệu ngắn' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  tagline?: string;

  @ApiPropertyOptional({ description: 'Chủ đề nhân vật có thể nói — chỉ hiển thị nên lưu jsonb' })
  @Column({ type: 'jsonb', nullable: true })
  topicsJson?: string[];

  @ApiProperty({ description: 'Tốc độ đọc khi phát âm' })
  @Column({ type: 'numeric', precision: 4, scale: 2, default: 1 })
  speechRate: number;

  @ApiProperty({ description: 'Cao độ giọng khi phát âm' })
  @Column({ type: 'numeric', precision: 4, scale: 2, default: 1 })
  speechPitch: number;

  @ApiProperty({ description: 'Mã ngôn ngữ giọng đọc (en-US, en-GB, en-AU)' })
  @Column({ type: 'varchar', length: 20, default: 'en-US' })
  voiceLang: string;

  @ApiPropertyOptional({ description: 'Khóa asset nhân vật động phía frontend' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  animeId?: string;

  @ApiProperty({ description: 'Câu chào mở đầu hội thoại' })
  @Column({ type: 'text' })
  welcomeMessage: string;

  @ApiPropertyOptional({ description: 'Bản dịch tiếng Việt của câu chào' })
  @Column({ type: 'text', nullable: true })
  welcomeMessageVi?: string;

  @ApiPropertyOptional({ description: 'Câu gợi ý mở lời, dạng [{ en, vi }]' })
  @Column({ type: 'jsonb', nullable: true })
  samplePromptsJson?: Record<string, unknown>[];

}
