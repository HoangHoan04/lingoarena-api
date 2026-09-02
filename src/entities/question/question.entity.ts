import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSectionEntity } from '../exam/exam-section.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { QuestionGroupEntity } from './question-group.entity';
import { QuestionTagEntity } from './question-tag.entity';
import { QuestionTopicEntity } from './question-topic.entity';
import { QuestionTypeEntity } from './question-type.entity';
import { QuestionVersionEntity } from './question-version.entity';

@Entity('questions')
@Index('idx_questions_composite', ['examTypeId', 'examSkillId', 'difficultyLevel', 'status'])
@Index('idx_questions_group_id', ['questionGroupId'])
@Index('idx_questions_status', ['status'])
export class QuestionEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến nhóm câu hỏi' })
  @Column({ type: 'uuid', nullable: true })
  questionGroupId?: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến phần thi' })
  @Column({ type: 'uuid', nullable: true })
  examSectionId?: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại câu hỏi' })
  @Column({ type: 'uuid' })
  questionTypeId: string;

  @ApiProperty({ description: 'Độ khó (1: Rất dễ đến 5: Rất khó)', default: 3 })
  @Column({ type: 'int', default: 3 })
  difficultyLevel: number;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    default: enumData.CEFR_LEVEL.B1,
    description: 'Trình độ CEFR',
  })
  @Column({ type: 'varchar', length: 30, default: enumData.CEFR_LEVEL.B1.code })
  cefrLevel?: string;

  @ApiProperty({ description: 'Điểm mặc định', default: 1 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  defaultPoints: number;

  @ApiPropertyOptional({ description: 'IRT discrimination (a)' })
  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  irtA?: number;

  @ApiPropertyOptional({ description: 'IRT difficulty (b)' })
  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  irtB?: number;

  @ApiPropertyOptional({ description: 'IRT guessing (c)' })
  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  irtC?: number;

  @ApiProperty({ description: 'Số lần câu hỏi đã được ra', default: 0 })
  @Column({ type: 'int', default: 0 })
  exposureCount: number;

  @ApiPropertyOptional({ description: 'Thời điểm hiệu chỉnh IRT gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastCalibratedAt?: Date;

  @ApiProperty({
    enum: enumData.CONTENT_REVIEW_STATUS,
    default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
    description: 'Trạng thái kiểm duyệt',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code })
  status: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến phiên bản hiện tại' })
  @Column({ type: 'uuid', nullable: true })
  currentVersionId?: string;

  @ApiPropertyOptional({ description: 'ID người tạo' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => QuestionGroupEntity, group => group.questions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'questionGroupId' })
  questionGroup?: QuestionGroupEntity;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @ManyToOne(() => ExamSectionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examSectionId' })
  examSection?: ExamSectionEntity;

  @ManyToOne(() => QuestionTypeEntity, qtype => qtype.questions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionTypeId' })
  questionType?: QuestionTypeEntity;

  @ManyToOne(() => QuestionVersionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'currentVersionId' })
  currentVersion?: QuestionVersionEntity;

  @OneToMany(() => QuestionVersionEntity, version => version.question)
  versions?: QuestionVersionEntity[];

  @OneToMany(() => QuestionTopicEntity, qt => qt.question)
  questionTopics?: QuestionTopicEntity[];

  @OneToMany(() => QuestionTagEntity, qtag => qtag.question)
  questionTags?: QuestionTagEntity[];
}
