import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning Meditation' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'daily', enum: ['daily', 'weekly'] })
  @IsNotEmpty()
  @IsIn(['daily', 'weekly'])
  frequency: string;
}

export class ToggleHabitDto {
  @ApiProperty({ example: '2026-09-30', description: 'Date to toggle habit completion (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  date: string;
}
