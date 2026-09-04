import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { compare, hash } from 'bcrypt';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { PWD_SALT_ROUNDS } from '~/common/constants';
import { PrimaryBaseEntity } from '../base.entity';
import { OauthAccountEntity } from './oauth-account.entity';
import { UserProfileEntity } from './user-profile.entity';
import { UserRoleEntity } from './user-role.entity';
import { UserSessionEntity } from './user-session.entity';
import { VerificationCodeEntity } from './verification-code.entity';

@Entity('users')
@Index('idx_users_email', ['email'])
@Index('idx_users_phone', ['phone'])
@Index('uq_users_username_alive', ['username'], {
  unique: true,
  where: '"username" IS NOT NULL AND "isDeleted" = false',
})
@Index('idx_users_is_deleted', ['isDeleted'])
@Index('idx_users_created_at', ['createdAt'])
export class UserEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Địa chỉ email của người dùng' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiPropertyOptional({ description: 'Số điện thoại của người dùng' })
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone?: string;

  @ApiPropertyOptional({ description: 'Tên hiển thị công khai trên Arena / leaderboard' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  username?: string;

  @ApiPropertyOptional({ description: 'Giá trị băm của mật khẩu (null với tài khoản OAuth)' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @ApiProperty({ description: 'Người dùng này có phải admin hệ thống' })
  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @ApiPropertyOptional({ description: 'Thời điểm email verified' })
  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm điện thoại verified' })
  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm đăng nhập gần nhất' })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ description: 'Ngôn ngữ ưu tiên', default: 'vi' })
  @Column({ type: 'varchar', length: 10, default: 'vi' })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Múi giờ dùng để hiển thị và xử lý thời gian',
    default: 'Asia/Ho_Chi_Minh',
  })
  @Column({ type: 'varchar', length: 50, default: 'Asia/Ho_Chi_Minh' })
  timezone?: string;

  @OneToOne(() => UserProfileEntity, profile => profile.user)
  profile?: UserProfileEntity;

  @OneToMany(() => UserRoleEntity, userRole => userRole.user)
  userRoles?: UserRoleEntity[];

  @OneToMany(() => UserSessionEntity, session => session.user)
  sessions?: UserSessionEntity[];

  @OneToMany(() => OauthAccountEntity, account => account.user)
  oauthAccounts?: OauthAccountEntity[];

  @OneToMany(() => VerificationCodeEntity, vc => vc.user)
  verificationCodes?: VerificationCodeEntity[];

  /** Hàm tự động hash password khi save entity */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.passwordHash || this.passwordHash.startsWith('$2')) return;
    this.passwordHash = await hash(this.passwordHash, PWD_SALT_ROUNDS);
  }

  /** So sánh mật khẩu thuần với hash đã lưu. Tài khoản OAuth không có passwordHash. */
  async comparePassword(pass: string) {
    if (!pass || !this.passwordHash) return false;
    return compare(pass, this.passwordHash);
  }
}
