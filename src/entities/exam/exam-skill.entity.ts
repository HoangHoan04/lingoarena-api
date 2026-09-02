import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSectionEntity } from './exam-section.entity';
import { ExamTypeEntity } from './exam-type.entity';

@Entity('exam_skills')
@Index('idx_exam_skills_type_code', ['examTypeId', 'code'], { unique: true })
@Index('idx_exam_skills_type_id', ['examTypeId'])
export class ExamSkillEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiProperty({ description: 'Mã kỹ năng (LISTENING, READING, WRITING, SPEAKING, GRAMMAR_VOCAB)' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên kỹ năng' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Thời lượng tính bằng giây', default: 0 })
  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @ApiPropertyOptional({ description: 'Cấu hình quy đổi điểm JSON' })
  @Column({ type: 'jsonb', nullable: true })
  scoreSchema?: Record<string, unknown>;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ExamTypeEntity, examType => examType.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @OneToMany(() => ExamSectionEntity, section => section.examSkill)
  sections?: ExamSectionEntity[];
}
