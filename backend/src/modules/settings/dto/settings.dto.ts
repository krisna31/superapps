import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetSettingDto {
  @ApiProperty({ example: 'theme' })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ example: 'dark' })
  @IsNotEmpty()
  @IsString()
  value: string;
}
