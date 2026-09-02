import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';
import { QuestionOptionEntity } from './question-option.entity';
import { QuestionEntity } from './question.entity';

@Entity('question_versions')
@Index('idx_question_versions_quest_ver', ['questionId', 'versionNumber'], { unique: true })
@Index('idx_question_versions_question_id', ['questionId'])
export class QuestionVersionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Số thứ tự phiên bản', default: 1 })
  @Column({ type: 'int', default: 1 })
  versionNumber: number;

  @ApiProperty({ description: 'Nội dung đề bài / câu hỏi' })
  @Column({ type: 'text' })
  prompt: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn làm câu hỏi' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({ description: 'Nội dung có cấu trúc dạng JSON' })
  @Column({ type: 'jsonb', nullable: true })
  contentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Giải thích chi tiết đáp án' })
  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @ApiProperty({ description: 'Đáp án chuẩn dạng JSON' })
  @Column({ type: 'jsonb' })
  correctAnswerJson: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Cấu hình chấm điểm JSON' })
  @Column({ type: 'jsonb', nullable: true })
  gradingConfigJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến audio' })
  @Column({ type: 'uuid', nullable: true })
  audioAssetId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến hình ảnh' })
  @Column({ type: 'uuid', nullable: true })
  imageAssetId?: string;

  @ApiPropertyOptional({ description: 'ID người tạo phiên bản' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ApiPropertyOptional({ description: 'ID người duyệt' })
  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm xuất bản' })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => QuestionEntity, question => question.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'audioAssetId' })
  audioAsset?: MediaAssetEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'imageAssetId' })
  imageAsset?: MediaAssetEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewedByUserId' })
  reviewerUser?: UserEntity;

  @OneToMany(() => QuestionOptionEntity, option => option.questionVersion)
  options?: QuestionOptionEntity[];
}
