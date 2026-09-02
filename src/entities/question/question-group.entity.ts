import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSectionEntity } from '../exam/exam-section.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { QuestionEntity } from './question.entity';

@Entity('question_groups')
@Index('idx_question_groups_section_id', ['examSectionId'])
@Index('idx_question_groups_status', ['status'])
export class QuestionGroupEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến phần thi' })
  @Column({ type: 'uuid', nullable: true })
  examSectionId?: string;

  @ApiPropertyOptional({ description: 'Tiêu đề nhóm câu hỏi' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn nhóm câu hỏi' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Loại ngữ liệu (passage, audio_conversation, image, table, chart)',
    default: 'passage',
  })
  @Column({ type: 'varchar', length: 50, default: 'passage' })
  stimulusType?: string;

  @ApiPropertyOptional({ description: 'Nội dung đoạn văn ngữ liệu' })
  @Column({ type: 'text', nullable: true })
  passageText?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến file audio' })
  @Column({ type: 'uuid', nullable: true })
  audioAssetId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến file hình ảnh' })
  @Column({ type: 'uuid', nullable: true })
  imageAssetId?: string;

  @ApiPropertyOptional({ description: 'Bản chép lời audio' })
  @Column({ type: 'text', nullable: true })
  transcript?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu metadata JSON bổ sung' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    enum: enumData.CONTENT_REVIEW_STATUS,
    default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
    description: 'Trạng thái kiểm duyệt',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code })
  status: string;

  @ApiPropertyOptional({ description: 'ID người tạo' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => ExamSectionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examSectionId' })
  examSection?: ExamSectionEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'audioAssetId' })
  audioAsset?: MediaAssetEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'imageAssetId' })
  imageAsset?: MediaAssetEntity;

  @OneToMany(() => QuestionEntity, question => question.questionGroup)
  questions?: QuestionEntity[];
}
