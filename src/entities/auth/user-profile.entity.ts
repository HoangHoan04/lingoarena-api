import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity('user_profiles')
export class UserProfileEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @ApiProperty({ description: 'Họ và tên đầy đủ' })
  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @ApiPropertyOptional({ description: 'Tên hiển thị công khai' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn đến ảnh đại diện' })
  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date | string;

  @ApiPropertyOptional({ enum: enumData.GENDER, description: 'Thông tin giới tính' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string;

  @ApiPropertyOptional({ description: 'Mã quốc gia', default: 'VN' })
  @Column({ type: 'varchar', length: 5, default: 'VN' })
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Nghề nghiệp' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  occupation?: string;

  @ApiPropertyOptional({ description: 'Trường học hoặc công ty' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  schoolOrCompany?: string;

  @ApiPropertyOptional({ description: 'Tiểu sử' })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiPropertyOptional({
    enum: enumData.CEFR_LEVEL,
    description: 'Trình độ hiện tại, hiển thị ở phòng luyện nói và bảng xếp hạng',
  })
  @Column({ type: 'varchar', length: 10, nullable: true })
  currentLevel?: string;

  @ApiPropertyOptional({ description: 'Thời điểm hoàn thành onboarding' })
  @Column({ type: 'timestamptz', nullable: true })
  onboardingCompletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Tuỳ chọn nhận thông báo theo từng loại — thay bảng notification_preferences',
  })
  @Column({ type: 'jsonb', nullable: true })
  notificationPrefsJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Tuỳ chọn giao diện phía customer (vd StudioSettings của trang luyện nghe)',
  })
  @Column({ type: 'jsonb', nullable: true })
  preferencesJson?: Record<string, unknown>;

  @OneToOne(() => UserEntity, user => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
