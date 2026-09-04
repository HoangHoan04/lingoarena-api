import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';

/** Bảng `daily_challenges` — thử thách theo ngày, phục vụ `/challenges/today`. */
@Entity('daily_challenges')
@Index('uq_daily_challenges_code_date', ['code', 'activeDate'], {
  unique: true,
  where: '"isDeleted" = false',
})
export class DailyChallengeEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã thử thách' })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty({ description: 'Tên thử thách' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ enum: enumData.DAILY_CHALLENGE_TYPE, description: 'Loại thử thách' })
  @Column({ type: 'varchar', length: 30 })
  challengeType: string;

  @ApiProperty({ description: 'Số lượng cần đạt để hoàn thành' })
  @Column({ type: 'int', default: 1 })
  targetCount: number;

  @ApiProperty({ description: 'Điểm thưởng khi hoàn thành' })
  @Column({ type: 'int', default: 0 })
  rewardPoints: number;

  @ApiProperty({ description: 'Ngày thử thách có hiệu lực' })
  @Column({ type: 'date' })
  activeDate: Date | string;
}
