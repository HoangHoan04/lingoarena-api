import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { GrammarExampleEntity } from './grammar-example.entity';
import { GrammarTopicEntity } from './grammar-topic.entity';

@Entity('grammar_structures')
@Index('idx_grammar_structures_topic_id', ['grammarTopicId'])
@Index('idx_grammar_structures_status', ['status'])
export class GrammarStructureEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến chủ đề ngữ pháp' })
  @Column({ type: 'uuid' })
  grammarTopicId: string;

  @ApiProperty({ description: 'Tiêu đề cấu trúc ngữ pháp' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Công thức ngữ pháp (e.g. S + have/has + V3/ed + O)' })
  @Column({ type: 'text' })
  formula: string;

  @ApiProperty({ description: 'Nghĩa tiếng Việt' })
  @Column({ type: 'text' })
  meaningVi: string;

  @ApiProperty({ description: 'Cách sử dụng chi tiết' })
  @Column({ type: 'text' })
  usageContent: string;

  @ApiPropertyOptional({ description: 'Lỗi thường gặp' })
  @Column({ type: 'text', nullable: true })
  commonMistakes?: string;

  @ApiProperty({
    enum: enumData.CONTENT_REVIEW_STATUS,
    default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code,
    description: 'Trạng thái kiểm duyệt',
  })
  @Column({ type: 'varchar', length: 50, default: enumData.CONTENT_REVIEW_STATUS.DRAFT.code })
  status: string;

  @ManyToOne(() => GrammarTopicEntity, topic => topic.structures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grammarTopicId' })
  grammarTopic?: GrammarTopicEntity;

  @OneToMany(() => GrammarExampleEntity, example => example.grammarStructure)
  examples?: GrammarExampleEntity[];
}
