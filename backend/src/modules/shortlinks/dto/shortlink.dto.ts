import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateShortlinkDto {
  @ApiProperty({ example: 'gh', description: 'Unique shortcut key (e.g., gh -> go/gh)' })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ example: 'GitHub Profile', description: 'Friendly title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'https://github.com/krisna31', description: 'Destination URL' })
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ example: 'Developer', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateShortlinkDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
