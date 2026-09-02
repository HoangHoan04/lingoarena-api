import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from '../course/course.entity';
import { AssignmentEntity } from './assignment.entity';
import { ClassroomMemberEntity } from './classroom-member.entity';

@Entity('classrooms')
@Index('idx_classrooms_code', ['code'], { unique: true })
@Index('idx_classrooms_teacher_id', ['teacherUserId'])
@Index('idx_classrooms_status', ['status'])
export class ClassroomEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Tên lớp học' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Mã mời tham gia lớp học' })
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến giáo viên phụ trách' })
  @Column({ type: 'uuid' })
  teacherUserId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến khóa học' })
  @Column({ type: 'uuid', nullable: true })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu lớp học' })
  @Column({ type: 'date', nullable: true })
  startDate?: Date | string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc lớp học' })
  @Column({ type: 'date', nullable: true })
  endDate?: Date | string;

  @ApiPropertyOptional({ description: 'Sức chứa tối đa của lớp', default: 50 })
  @Column({ type: 'int', default: 50 })
  capacity?: number;

  @ApiProperty({
    enum: enumData.CLASSROOM_STATUS,
    default: enumData.CLASSROOM_STATUS.ACTIVE.code,
    description: 'Trạng thái lớp học',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CLASSROOM_STATUS.ACTIVE.code })
  status: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacherUserId' })
  teacher?: UserEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  @OneToMany(() => ClassroomMemberEntity, member => member.classroom)
  members?: ClassroomMemberEntity[];

  @OneToMany(() => AssignmentEntity, assignment => assignment.classroom)
  assignments?: AssignmentEntity[];
}
