import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from './exam-skill.entity';

@Entity('exam_sections')
@Index('idx_exam_sections_skill_code', ['examSkillId', 'code'], { unique: true })
@Index('idx_exam_sections_skill_id', ['examSkillId'])
export class ExamSectionEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiProperty({ description: 'Mã phần thi (PART_1, PART_2, TASK_1, TASK_2, PASSAGE_1)' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên hiển thị phần thi' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn làm bài' })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @ApiPropertyOptional({ description: 'Thời lượng tính bằng giây', default: 0 })
  @Column({ type: 'int', default: 0, nullable: true })
  durationSeconds?: number;

  @ApiProperty({ description: 'Số lượng câu hỏi', default: 0 })
  @Column({ type: 'int', default: 0 })
  questionCount: number;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ExamSkillEntity, skill => skill.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;
}
