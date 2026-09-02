import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity('oauth_accounts')
@Index('idx_oauth_accounts_provider_user', ['provider', 'providerUserId'], { unique: true })
@Index('idx_oauth_accounts_user_id', ['userId'])
export class OauthAccountEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Nhà cung cấp OAuth (google, facebook, apple, zalo)' })
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @ApiProperty({ description: 'ID người dùng bên phía nhà cung cấp' })
  @Column({ type: 'varchar', length: 255 })
  providerUserId: string;

  @ApiPropertyOptional({ description: 'Dữ liệu hồ sơ OAuth JSON' })
  @Column({ type: 'jsonb', nullable: true })
  profileData?: Record<string, unknown>;

  @ApiProperty({ description: 'Thời điểm liên kết' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  linkedAt: Date;

  @ManyToOne(() => UserEntity, user => user.oauthAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
