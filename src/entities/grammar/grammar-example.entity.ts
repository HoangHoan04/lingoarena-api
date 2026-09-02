import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { GrammarStructureEntity } from './grammar-structure.entity';

@Entity('grammar_examples')
@Index('idx_grammar_examples_struct_id', ['grammarStructureId'])
export class GrammarExampleEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến cấu trúc ngữ pháp' })
  @Column({ type: 'uuid' })
  grammarStructureId: string;

  @ApiProperty({ description: 'Câu ví dụ tiếng Anh' })
  @Column({ type: 'text' })
  sentence: string;

  @ApiProperty({ description: 'Bản dịch tiếng Việt' })
  @Column({ type: 'text' })
  translation: string;

  @ApiPropertyOptional({ description: 'Giải thích chi tiết' })
  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @ApiProperty({
    description: 'Cờ ví dụ phản diện (câu sai minh họa lỗi phổ biến)',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isNegativeExample: boolean;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => GrammarStructureEntity, struct => struct.examples, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grammarStructureId' })
  grammarStructure?: GrammarStructureEntity;
}
