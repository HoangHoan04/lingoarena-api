import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { AssessmentAttemptEntity } from './assessment-attempt.entity';
import { AssessmentSectionEntity } from './assessment-section.entity';
import { AttemptQuestionEntity } from './attempt-question.entity';

@Entity('attempt_sections')
@Index('idx_attempt_sections_attempt_id', ['attemptId'])
@Index('idx_attempt_sections_section_id', ['assessmentSectionId'])
export class AttemptSectionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lượt làm bài' })
  @Column({ type: 'uuid' })
  attemptId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phần của bài đánh giá' })
  @Column({ type: 'uuid' })
  assessmentSectionId: string;

  @ApiPropertyOptional({ description: 'Thời điểm bắt đầu phần thi' })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm nộp phần thi' })
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @ApiProperty({ description: 'Thời gian đã làm (giây)', default: 0 })
  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @ApiPropertyOptional({ description: 'Điểm thô', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rawScore?: number;

  @ApiPropertyOptional({ description: 'Điểm quy đổi' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  convertedScore?: number;

  @ManyToOne(() => AssessmentAttemptEntity, attempt => attempt.attemptSections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptId' })
  attempt?: AssessmentAttemptEntity;

  @ManyToOne(() => AssessmentSectionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assessmentSectionId' })
  assessmentSection?: AssessmentSectionEntity;

  @OneToMany(() => AttemptQuestionEntity, aq => aq.attemptSection)
  attemptQuestions?: AttemptQuestionEntity[];
}
