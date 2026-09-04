import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from './exam-type.entity';

/**
 * Bảng `exam_structures` — cây cấu trúc kỳ thi, gộp `exam_skills` + `exam_sections` cũ.
 * Phân cấp bằng `parentId`: SKILL → SECTION → PART.
 *
 * Nơi nào cần "kỹ năng" (vd `arena_matches.examStructureId`) thì trỏ node có
 * `nodeType = SKILL`. Ràng buộc đúng cấp được kiểm ở service, không ở DB.
 */
@Entity('exam_structures')
@Index('uq_exam_structures_type_code_alive', ['examTypeId', 'code'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_exam_structures_parent', ['parentId'])
@Index('idx_exam_structures_node_type', ['nodeType'])
export class ExamStructureEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid' })
  examTypeId: string;

  @ApiPropertyOptional({ description: 'Node cha, null nếu là kỹ năng gốc' })
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ApiProperty({ enum: enumData.EXAM_NODE_TYPE, description: 'Cấp của node' })
  @Column({ type: 'varchar', length: 20 })
  nodeType: string;

  @ApiProperty({ description: 'Mã node (LISTENING, READING, PART1…)' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên hiển thị' })
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiPropertyOptional({ description: 'Tên tiếng Anh' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Số hiệu part (TOEIC Part 1–7)' })
  @Column({ type: 'int', nullable: true })
  partNumber?: number;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ExamTypeEntity, examType => examType.structures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => ExamStructureEntity, parent => parent.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: ExamStructureEntity;

  @OneToMany(() => ExamStructureEntity, child => child.parent)
  children?: ExamStructureEntity[];
}
