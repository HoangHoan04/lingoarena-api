import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateArenaChallengeDto {
  @ApiProperty()
  @IsUUID()
  opponentUserId: string;

  @ApiPropertyOptional({ description: 'Node cấu trúc cấp SKILL' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias cũ — map sang examStructureId' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;
}

export class FilterArenaDto {
  @ApiPropertyOptional({ description: 'Trạng thái đã xóa' })
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái trận đấu' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Node cấu trúc cấp SKILL' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias cũ — map sang examStructureId' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;
}

export class QueueArenaDto {
  @ApiPropertyOptional({ description: 'Node cấu trúc cấp SKILL' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias cũ — map sang examStructureId' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional({ default: 'RANKED' })
  @IsOptional()
  @IsString()
  matchMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxonomyId?: string;
}

export class PracticeMatchDto {
  @ApiPropertyOptional({ description: 'Node cấu trúc cấp SKILL' })
  @IsOptional()
  @IsUUID()
  examStructureId?: string;

  @ApiPropertyOptional({ description: 'Alias cũ — map sang examStructureId' })
  @IsOptional()
  @IsUUID()
  examSkillId?: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxonomyId?: string;
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
