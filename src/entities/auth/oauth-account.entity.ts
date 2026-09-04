import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

/**
 * Bảng `oauth_accounts` — liên kết tài khoản với nhà cung cấp OAuth.
 * Một user có thể liên kết nhiều provider (Google + Facebook), nên phải là bảng riêng
 * thay vì cột `provider` trên `users`.
 */
@Entity('oauth_accounts')
@Index('uq_oauth_accounts_provider_user', ['provider', 'providerUserId'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class OauthAccountEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: enumData.LOGIN_PROVIDER, description: 'Nhà cung cấp OAuth' })
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @ApiProperty({ description: 'ID người dùng bên phía nhà cung cấp' })
  @Column({ type: 'varchar', length: 255 })
  providerUserId: string;

  @ApiPropertyOptional({ description: 'Snapshot hồ sơ trả về từ nhà cung cấp' })
  @Column({ type: 'jsonb', nullable: true })
  profileJson?: Record<string, unknown>;

  @ManyToOne(() => UserEntity, user => user.oauthAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
