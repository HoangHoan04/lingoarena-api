import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionVersionEntity } from '../question/question-version.entity';
import { QuestionEntity } from '../question/question.entity';
import { ArenaMatchAnswerEntity } from './arena-match-answer.entity';
import { ArenaMatchEntity } from './arena-match.entity';

@Entity('arena_match_questions')
@Index('idx_arena_match_questions_unique', ['matchId', 'sortOrder'], { unique: true })
@Index('idx_arena_match_questions_match_id', ['matchId'])
export class ArenaMatchQuestionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến trận đấu Arena' })
  @Column({ type: 'uuid' })
  matchId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến câu hỏi' })
  @Column({ type: 'uuid' })
  questionId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến phiên bản câu hỏi' })
  @Column({ type: 'uuid' })
  questionVersionId: string;

  @ApiProperty({ description: 'Thứ tự câu hỏi trong trận', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ArenaMatchEntity, match => match.matchQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match?: ArenaMatchEntity;

  @ManyToOne(() => QuestionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question?: QuestionEntity;

  @ManyToOne(() => QuestionVersionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionVersionId' })
  questionVersion?: QuestionVersionEntity;

  @OneToMany(() => ArenaMatchAnswerEntity, ma => ma.arenaMatchQuestion)
  answers?: ArenaMatchAnswerEntity[];
}
