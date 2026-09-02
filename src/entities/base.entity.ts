import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class PrimaryBaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  @IsUUID(4)
  id?: string;

  @Index()
  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  createdBy?: string;

  @ApiPropertyOptional()
  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  updatedBy?: string;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  deletedBy?: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isDeleted?: boolean;

  @Exclude()
  @VersionColumn({ default: 0 })
  version?: number;
}
