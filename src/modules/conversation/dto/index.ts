import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAiTutorPersonaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gender: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  accent: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  accentLabel: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  roleDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  personality: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  topicsJson?: string[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  speechRate?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  speechPitch?: number;

  @ApiPropertyOptional({ default: 'en-US' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  voiceLang?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  animeId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  welcomeMessage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  welcomeMessageVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  samplePromptsJson?: Record<string, unknown>[];
}

export class UpdateAiTutorPersonaDto extends CreateAiTutorPersonaDto {}

export class FilterAiTutorPersonaDto {
  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class FilterConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  personaId?: string;

  @ApiPropertyOptional({ description: 'Lọc phòng nói theo tên chủ đề' })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class CreateSpeakingRoomDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cefrLevel?: string;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  icebreakersJson?: string[];
}

export class JoinSpeakingRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}

export class StartAiSessionDto {
  @ApiProperty()
  @IsUUID()
  personaId: string;
}

export class CreateConversationMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  translationVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  audioDurationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  feedbackJson?: Record<string, unknown>;
}
