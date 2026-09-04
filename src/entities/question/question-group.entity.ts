import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamStructureEntity } from '../exam/exam-structure.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { ContentSegmentEntity } from './content-segment.entity';
import { QuestionEntity } from './question.entity';

/**
 * Bảng `question_groups` — khối stimulus dùng chung cho nhiều feature:
 * đoạn đọc (Reading), video nghe chép (Listening), nhóm câu theo part (TOEIC).
 *
 * Nhờ bảng này mà Reading / Listening KHÔNG cần bảng nội dung riêng.
 * Đoạn văn và câu có timing nằm ở `content_segments`.
 * File phụ (nhiều ảnh / audio) nối qua `media_attachments`.
 */
@Entity('question_groups')
@Index('idx_question_groups_stimulus_type', ['stimulusType'])
@Index('idx_question_groups_exam_type', ['examTypeId'])
export class QuestionGroupEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến node cấu trúc kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examStructureId?: string;

  @ApiProperty({ enum: enumData.STIMULUS_TYPE, description: 'Loại khối kích thích' })
  @Column({ type: 'varchar', length: 30 })
  stimulusType: string;

  @ApiProperty({ description: 'Tiêu đề' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Tiêu đề tiếng Anh' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn làm bài' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({ description: 'Toàn văn đoạn đọc (Reading)' })
  @Column({ type: 'text', nullable: true })
  passageText?: string;

  @ApiPropertyOptional({ description: 'Tóm tắt tiếng Việt' })
  @Column({ type: 'text', nullable: true })
  summaryVi?: string;

  @ApiPropertyOptional({ description: 'Số từ của đoạn đọc' })
  @Column({ type: 'int', nullable: true })
  wordCount?: number;

  @ApiPropertyOptional({ description: 'Thời gian đọc đề xuất (phút)' })
  @Column({ type: 'int', nullable: true })
  recommendedTimeMin?: number;

  @ApiPropertyOptional({ enum: enumData.CEFR_LEVEL, description: 'Trình độ CEFR' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  cefrLevel?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Audio chính (1 file nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Mã video YouTube (Listening)' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  youtubeId?: string;

  @ApiPropertyOptional({ description: 'Tên kênh YouTube' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  channelName?: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện kênh (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  channelAvatarUrl?: string;

  @ApiPropertyOptional({ description: 'Ảnh thumbnail (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Thời lượng video (giây)' })
  @Column({ type: 'int', nullable: true })
  durationSec?: number;

  @ApiPropertyOptional({
    description: 'Từ khoá gợi ý kèm khối — chỉ hiển thị nên lưu jsonb',
  })
  @Column({ type: 'jsonb', nullable: true })
  keyVocabJson?: Record<string, unknown>[];

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => ExamStructureEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examStructureId' })
  examStructure?: ExamStructureEntity;

  @OneToMany(() => ContentSegmentEntity, segment => segment.questionGroup)
  segments?: ContentSegmentEntity[];

  @OneToMany(() => QuestionEntity, question => question.questionGroup)
  questions?: QuestionEntity[];
}
