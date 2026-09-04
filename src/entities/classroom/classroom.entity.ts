import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { AssignmentEntity } from './assignment.entity';
import { ClassroomMemberEntity } from './classroom-member.entity';

/**
 * Bảng `classrooms` — lớp học có giáo viên phụ trách.
 *
 * `syllabusJson` + `scheduleJson` thay 2 bảng con: cả hai chỉ để hiển thị theo
 * lớp, không lọc / join. Thông báo trong lớp dùng `conversations` với
 * `conversationType = CLASSROOM`.
 */
@Entity('classrooms')
@Index('uq_classrooms_code_alive', ['code'], { unique: true, where: '"isDeleted" = false' })
@Index('idx_classrooms_teacher', ['teacherUserId'])
@Index('idx_classrooms_status', ['status'])
export class ClassroomEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã lớp để học viên tham gia' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên lớp' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Giáo viên phụ trách' })
  @Column({ type: 'uuid' })
  teacherUserId: string;

  @ApiPropertyOptional({ description: 'Khóa học gắn với lớp' })
  @Column({ type: 'uuid', nullable: true })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Tổ chức chủ quản' })
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa lớp (1 ảnh nên lưu URL thẳng)' })
  @Column({ type: 'text', nullable: true })
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Mô tả lớp' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Đề cương lớp — chỉ hiển thị nên lưu jsonb' })
  @Column({ type: 'jsonb', nullable: true })
  syllabusJson?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Link phòng học trực tuyến' })
  @Column({ type: 'text', nullable: true })
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Lịch học — chỉ hiển thị nên lưu jsonb' })
  @Column({ type: 'jsonb', nullable: true })
  scheduleJson?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Ngày khai giảng' })
  @Column({ type: 'date', nullable: true })
  startDate?: Date | string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc' })
  @Column({ type: 'date', nullable: true })
  endDate?: Date | string;

  @ApiPropertyOptional({ description: 'Số học viên tối đa' })
  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @ApiProperty({
    enum: enumData.CLASSROOM_STATUS,
    default: enumData.CLASSROOM_STATUS.NEW.code,
    description: 'Trạng thái lớp',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CLASSROOM_STATUS.NEW.code })
  status: string;

  @OneToMany(() => ClassroomMemberEntity, member => member.classroom)
  members?: ClassroomMemberEntity[];

  @OneToMany(() => AssignmentEntity, assignment => assignment.classroom)
  assignments?: AssignmentEntity[];
}
