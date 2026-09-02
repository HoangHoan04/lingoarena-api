import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from './exam-skill.entity';

@Entity('exam_types')
@Index('idx_exam_types_code', ['code'])
@Index('idx_exam_types_is_active', ['isActive'])
export class ExamTypeEntity extends PrimaryBaseEntity {
  @ApiProperty({
    description: 'Mã loại kỳ thi (TOEIC_LR, TOEIC_SW, IELTS_AC, IELTS_GEN, APTIS, VSTEP, GENERAL)',
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên hiển thị của kỳ thi' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Điểm thấp nhất có thể đạt', default: 0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scoreMin: number;

  @ApiProperty({ description: 'Điểm cao nhất có thể đạt' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  scoreMax: number;

  @ApiProperty({ description: 'Bước tăng hợp lệ của điểm số', default: 1 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  scoreStep: number;

  @ApiPropertyOptional({ description: 'Cấu hình quy đổi và cấu trúc điểm JSON' })
  @Column({ type: 'jsonb', nullable: true })
  scoreSchema?: Record<string, unknown>;

  @ApiProperty({ description: 'Trạng thái hoạt động', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => ExamSkillEntity, skill => skill.examType)
  skills?: ExamSkillEntity[];
}
