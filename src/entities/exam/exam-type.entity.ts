import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamStructureEntity } from './exam-structure.entity';

/**
 * Bảng `exam_types` — loại kỳ thi (TOEIC, IELTS, VSTEP, APTIS).
 * Thang điểm mô tả bằng `scoreMin` / `scoreMax` / `scoreStep` / `scoreSchema`,
 * KHÔNG dùng cột `scoringScale`.
 */
@Entity('exam_types')
@Index('uq_exam_types_code_alive', ['code'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class ExamTypeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã kỳ thi (TOEIC, IELTS, VSTEP, APTIS)' })
  @Column({ type: 'varchar', length: 20 })
  code: string;

  @ApiProperty({ description: 'Tên hiển thị' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Tên tiếng Anh' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả kỳ thi' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Mô tả tiếng Anh' })
  @Column({ type: 'text', nullable: true })
  descriptionEn?: string;

  @ApiProperty({ description: 'Điểm tối thiểu của thang điểm' })
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0 })
  scoreMin: number;

  @ApiProperty({ description: 'Điểm tối đa của thang điểm' })
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 100 })
  scoreMax: number;

  @ApiProperty({ description: 'Bước nhảy điểm' })
  @Column({ type: 'numeric', precision: 4, scale: 2, default: 1 })
  scoreStep: number;

  @ApiPropertyOptional({ description: 'Bảng ánh xạ điểm sang band / level' })
  @Column({ type: 'jsonb', nullable: true })
  scoreSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Nội dung trang hub theo kỳ thi (mô tả part, tips) cho /practice/<code>',
  })
  @Column({ type: 'jsonb', nullable: true })
  hubContentJson?: Record<string, unknown>;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => ExamStructureEntity, structure => structure.examType)
  structures?: ExamStructureEntity[];
}
