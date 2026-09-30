import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement WebSocket dropzone signaling' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Create Socket.io gateway in NestJS', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'todo', enum: ['todo', 'in_progress', 'done'], required: false })
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: string;

  @ApiProperty({ example: 'high', enum: ['low', 'medium', 'high'], required: false })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({ example: '2026-10-05T18:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: ['backend', 'webrtc'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: ['todo', 'in_progress', 'done'] })
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: string;

  @ApiProperty({ required: false, enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
