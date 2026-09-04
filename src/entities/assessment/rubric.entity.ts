import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';

/**
 * Bảng `rubrics` — bộ tiêu chí chấm bài Writing / Speaking.
 *
 * `criteriaJson` thay bảng `rubric_criteria` cũ: tiêu chí luôn đọc kèm rubric
 * cha, không lọc theo. Mỗi phần tử gồm `code`, `name`, `maxScore`, `descriptors`.
 */
@Entity('rubrics')
@Index('uq_rubrics_code_alive', ['code'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class RubricEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã rubric' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên rubric' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Mã kỹ năng áp dụng (WRITING, SPEAKING)' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  skillCode?: string;

  @ApiProperty({ description: 'Điểm tối đa của rubric' })
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 9 })
  maxScore: number;

  @ApiProperty({ description: 'Danh sách tiêu chí — thay bảng rubric_criteria' })
  @Column({ type: 'jsonb' })
  criteriaJson: Record<string, unknown>[];
}
