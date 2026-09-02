import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionTagEntity } from './question-tag.entity';

@Entity('tags')
export class TagEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Tên thẻ phân loại' })
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @OneToMany(() => QuestionTagEntity, qt => qt.tag)
  questionTags?: QuestionTagEntity[];
}
