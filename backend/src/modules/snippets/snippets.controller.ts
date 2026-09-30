import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SnippetsService } from './snippets.service';
import { CreateSnippetDto, UpdateSnippetDto } from './dto/snippet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Snippets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('snippets')
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new code snippet' })
  create(@Req() req: any, @Body() dto: CreateSnippetDto) {
    return this.snippetsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List code snippets with optional language and search filters' })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Req() req: any, @Query('language') language?: string, @Query('search') search?: string) {
    return this.snippetsService.findAll(req.user.id, language, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get snippet by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.snippetsService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update snippet' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSnippetDto) {
    return this.snippetsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete snippet' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.snippetsService.remove(req.user.id, id);
  }
}
