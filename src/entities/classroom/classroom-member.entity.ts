import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { ClassroomEntity } from './classroom.entity';

@Entity('classroom_members')
@Index('idx_classroom_members_pk', ['classroomId', 'userId'], { unique: true })
@Index('idx_classroom_members_classroom_id', ['classroomId'])
@Index('idx_classroom_members_user_id', ['userId'])
export class ClassroomMemberEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến lớp học' })
  @Column({ type: 'uuid' })
  classroomId: string;

  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    enum: enumData.CLASSROOM_MEMBER_ROLE,
    default: enumData.CLASSROOM_MEMBER_ROLE.STUDENT.code,
    description: 'Vai trò trong lớp',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CLASSROOM_MEMBER_ROLE.STUDENT.code })
  role: string;

  @ApiProperty({ description: 'Thời điểm tham gia lớp' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @ApiProperty({
    enum: enumData.CLASSROOM_MEMBER_STATUS,
    default: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code,
    description: 'Trạng thái thành viên',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CLASSROOM_MEMBER_STATUS.ACTIVE.code })
  status: string;

  @ManyToOne(() => ClassroomEntity, classroom => classroom.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classroomId' })
  classroom?: ClassroomEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
