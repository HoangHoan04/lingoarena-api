import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PrimaryBaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_token_hash', ['tokenHash'])
@Index('idx_refresh_tokens_family_id', ['familyId'])
export class RefreshTokenEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến người dùng' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Giá trị băm của refresh token' })
  @Column({ type: 'varchar', length: 255, unique: true })
  tokenHash: string;

  @ApiProperty({ description: 'Family ID để phát hiện token reuse khi rotation' })
  @Column({ type: 'uuid' })
  familyId: string;

  @ApiProperty({ description: 'Cờ xác định bị thu hồi', default: false })
  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @ApiProperty({ description: 'Thời điểm hết hiệu lực' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => UserEntity, user => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;
}
