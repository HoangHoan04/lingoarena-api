import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { RubricCriterionEntity } from './rubric-criterion.entity';

@Entity('rubrics')
export class RubricEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({ description: 'Mã rubric (IELTS_WRITING_TASK2, TOEIC_SPEAKING_Q11)' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tiêu đề rubric' })
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @OneToMany(() => RubricCriterionEntity, criterion => criterion.rubric)
  criteria?: RubricCriterionEntity[];
}
