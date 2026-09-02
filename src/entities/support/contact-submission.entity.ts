import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';

@Entity('contact_submissions')
@Index('idx_contact_submissions_status', ['status'])
@Index('idx_contact_submissions_email', ['email'])
export class ContactSubmissionEntity extends PrimaryBaseEntity {
  @ApiPropertyOptional({ description: 'User đã đăng nhập (nếu có)' })
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ApiProperty({ description: 'Họ tên người gửi' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Email liên hệ' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Tiêu đề' })
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @ApiProperty({ description: 'Nội dung' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    enum: enumData.CONTACT_STATUS,
    default: enumData.CONTACT_STATUS.NEW.code,
    description: 'Trạng thái xử lý',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CONTACT_STATUS.NEW.code })
  status: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
