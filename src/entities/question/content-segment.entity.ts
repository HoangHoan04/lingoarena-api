import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { QuestionGroupEntity } from './question-group.entity';

/**
 * Bảng `content_segments` — đơn vị nội dung có thứ tự bên trong một `question_group`.
 *
 * Một bảng phục vụ hai feature vì chúng cùng hình dạng:
 * - Đoạn văn Reading  → `sortOrder` + `label` ("Paragraph A") + `text` + `translationVi`
 * - Câu nghe chép     → thêm `startSec` / `endSec` để tua video theo câu
 */
@Entity('content_segments')
@Index('uq_content_segments_group_order', ['questionGroupId', 'sortOrder'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class ContentSegmentEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến nhóm câu hỏi' })
  @Column({ type: 'uuid' })
  questionGroupId: string;

  @ApiProperty({ description: 'Thứ tự đoạn / câu trong khối' })
  @Column({ type: 'int' })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Nhãn hiển thị (vd "Paragraph A")' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  label?: string;

  @ApiProperty({ description: 'Nội dung tiếng Anh của đoạn / câu' })
  @Column({ type: 'text' })
  text: string;

  @ApiPropertyOptional({ description: 'Bản dịch tiếng Việt' })
  @Column({ type: 'text', nullable: true })
  translationVi?: string;

  @ApiPropertyOptional({ description: 'Giải thích thêm' })
  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @ApiPropertyOptional({ description: 'Mốc bắt đầu trong audio / video (giây)' })
  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  startSec?: number;

  @ApiPropertyOptional({ description: 'Mốc kết thúc trong audio / video (giây)' })
  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  endSec?: number;

  @ApiPropertyOptional({ description: 'Từ khoá trong câu — chỉ hiển thị nên lưu jsonb' })
  @Column({ type: 'jsonb', nullable: true })
  keyVocabJson?: Record<string, unknown>[];

  @ManyToOne(() => QuestionGroupEntity, group => group.segments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionGroupId' })
  questionGroup?: QuestionGroupEntity;
}
