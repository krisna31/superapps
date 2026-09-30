import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSnippetDto {
  @ApiProperty({ example: 'Prisma Client Singleton' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'NestJS injectable service wrapping PrismaClient', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'typescript' })
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty({ example: 'import { PrismaClient } from "@prisma/client";\nexport const prisma = new PrismaClient();' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: ['database', 'orm'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateSnippetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
