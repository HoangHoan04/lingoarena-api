import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ClassroomEntity } from './classroom.entity';

/** Bảng `classroom_members` — học viên trong lớp. */
@Entity('classroom_members')
@Index('uq_classroom_members_link', ['classroomId', 'userId'], {
  unique: true,
  where: '"isDeleted" = false',
})
@Index('idx_classroom_members_user', ['userId'])
export class ClassroomMemberEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lớp học' })
  @Column({ type: 'uuid' })
  classroomId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến học viên' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.CLASSROOM_MEMBER_STATUS,
    default: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code,
    description: 'Trạng thái thành viên',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code,
  })
  status: string;

  @ApiProperty({ description: 'Thời điểm vào lớp' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @ApiPropertyOptional({ description: 'Thời điểm rời lớp' })
  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date;

  @ManyToOne(() => ClassroomEntity, classroom => classroom.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classroomId' })
  classroom?: ClassroomEntity;
}
