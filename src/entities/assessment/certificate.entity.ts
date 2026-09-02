import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { UserEntity } from '../auth/user.entity';
import { PrimaryBaseEntity } from '../base.entity';
import { CourseEntity } from '../course/course.entity';
import { ExamTypeEntity } from '../exam/exam-type.entity';
import { MediaAssetEntity } from '../media/media-asset.entity';

@Entity('certificate_templates')
@Index('idx_certificate_templates_code', ['code'], { unique: true })
export class CertificateTemplateEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Mã mẫu chứng chỉ' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Tiêu đề chứng chỉ' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ enum: enumData.CERTIFICATE_SOURCE_TYPE, description: 'Nguồn cấp' })
  @Column({ type: 'varchar', length: 30 })
  sourceType: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại loại kỳ thi' })
  @Column({ type: 'uuid', nullable: true })
  examTypeId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại khóa học' })
  @Column({ type: 'uuid', nullable: true })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Điểm tối thiểu để cấp' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minScore?: number;

  @ApiProperty({ description: 'Cờ đang dùng', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => ExamTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'examTypeId' })
  examType?: ExamTypeEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;
}

@Entity('user_certificates')
@Index('idx_user_certificates_verify_code', ['verifyCode'], { unique: true })
@Index('idx_user_certificates_user_id', ['userId'])
@Index('uq_user_certificates_source', ['userId', 'sourceType', 'sourceId'], { unique: true })
export class UserCertificateEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại người nhận' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại mẫu chứng chỉ' })
  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @ApiProperty({ enum: enumData.CERTIFICATE_SOURCE_TYPE, description: 'Nguồn hoàn thành' })
  @Column({ type: 'varchar', length: 30 })
  sourceType: string;

  @ApiProperty({ description: 'ID nguồn (assessment attempt hoặc course)' })
  @Column({ type: 'uuid' })
  sourceId: string;

  @ApiProperty({ description: 'Tiêu đề in trên chứng chỉ' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Điểm đạt được' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @ApiPropertyOptional({ description: 'Điểm quy đổi' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  convertedScore?: number;

  @ApiProperty({ description: 'Mã xác thực công khai' })
  @Column({ type: 'varchar', length: 40, unique: true })
  verifyCode: string;

  @ApiPropertyOptional({ description: 'File PDF chứng chỉ' })
  @Column({ type: 'uuid', nullable: true })
  pdfAssetId?: string;

  @ApiProperty({
    enum: enumData.CERTIFICATE_STATUS,
    default: enumData.CERTIFICATE_STATUS.ISSUED.code,
    description: 'Trạng thái chứng chỉ',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.CERTIFICATE_STATUS.ISSUED.code })
  status: string;

  @ApiProperty({ description: 'Thời điểm cấp' })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @ManyToOne(() => CertificateTemplateEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: CertificateTemplateEntity;

  @ManyToOne(() => MediaAssetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pdfAssetId' })
  pdfAsset?: MediaAssetEntity;
}
