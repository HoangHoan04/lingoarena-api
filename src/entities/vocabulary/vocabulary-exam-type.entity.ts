import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('vocabulary_exam_types')
@Index('idx_vocabulary_exam_types_pk', ['vocabularyId', 'examTypeId'], { unique: true })
export class VocabularyExamTypeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến từ vựng' })
  @Column({ type: 'uuid' })
  vocabularyId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ManyToOne(() => VocabularyEntity, vocab => vocab.vocabularyExamTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vocabularyId' })
  vocabulary?: VocabularyEntity;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;
}
