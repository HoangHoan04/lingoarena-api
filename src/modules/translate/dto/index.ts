import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TRANSLATE_LANG_CODES, TRANSLATE_TARGET_CODES } from '../helpers/languages';

export class TranslateDto {
  @ApiProperty({ example: 'How are you?' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  text: string;

  @ApiPropertyOptional({ example: 'auto', default: 'auto' })
  @IsOptional()
  @IsString()
  @IsIn([...TRANSLATE_LANG_CODES])
  sourceLang?: string;

  @ApiProperty({ example: 'vi' })
  @IsNotEmpty()
  @IsString()
  @IsIn(TRANSLATE_TARGET_CODES)
  targetLang: string;
}
