import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionEntity } from './question.entity';

@Entity('question_types')
@Index('idx_question_types_code', ['code'])
export class QuestionTypeEntity extends PrimaryBaseEntity {
  @ApiProperty({
    description:
      'Mã loại câu hỏi (SINGLE_CHOICE, MULTI_CHOICE, TRUE_FALSE_NG, FILL_BLANK, MATCHING, ESSAY, AUDIO_RECORD)',
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên loại câu hỏi' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'JSON schema kiểm tra định dạng đáp án' })
  @Column({ type: 'jsonb' })
  answerSchema: Record<string, unknown>;

  @ApiProperty({
    description: 'Chiến lược chấm điểm (exact_match, partial_match, rubric_manual, ai_assisted)',
  })
  @Column({ type: 'varchar', length: 50 })
  gradingStrategy: string;

  @ApiProperty({ description: 'Hỗ trợ chấm điểm tự động', default: true })
  @Column({ type: 'boolean', default: true })
  supportsAutoGrading: boolean;

  @OneToMany(() => QuestionEntity, question => question.questionType)
  questions?: QuestionEntity[];
}
