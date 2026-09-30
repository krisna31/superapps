import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Sprint Planning Notes' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: '# Meeting Agenda\n- Discuss architecture\n- Review PRs' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'Work', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateNoteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
