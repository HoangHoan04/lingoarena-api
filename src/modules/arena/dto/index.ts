import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateArenaDto {}

export class UpdateArenaDto extends CreateArenaDto {}

export class FilterArenaDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái trận đấu' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Kỹ năng thi đấu' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;
}

export class QueueArenaDto {
  @ApiProperty()
  @IsUUID()
  examSkillId: string;

  @ApiPropertyOptional({ default: 'RANKED' })
  @IsOptional()
  @IsString()
  matchMode?: string;
}

export class PracticeMatchDto {
  @ApiProperty()
  @IsUUID()
  examSkillId: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionCount?: number;
}

export class SubmitArenaAnswerDto {
  @ApiProperty()
  @IsUUID()
  arenaMatchQuestionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  answerJson?: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeTakenMs?: number;
}
