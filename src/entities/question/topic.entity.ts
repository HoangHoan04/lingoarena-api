import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { QuestionTopicEntity } from './question-topic.entity';

@Entity('topics')
@Index('idx_topics_code', ['code'])
@Index('idx_topics_parent_id', ['parentId'])
export class TopicEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến chủ đề cha' })
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ApiProperty({ description: 'Mã nghiệp vụ chủ đề' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tên chủ đề' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiProperty({ description: 'Thứ tự sắp xếp', default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => TopicEntity, topic => topic.children, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: TopicEntity;

  @OneToMany(() => TopicEntity, topic => topic.parent)
  children?: TopicEntity[];

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @OneToMany(() => QuestionTopicEntity, qt => qt.topic)
  questionTopics?: QuestionTopicEntity[];
}
