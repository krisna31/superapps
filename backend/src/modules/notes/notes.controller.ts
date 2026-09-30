import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Markdown note' })
  create(@Req() req: any, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List notes with optional full-text search' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Req() req: any, @Query('search') search?: string) {
    return this.notesService.findAll(req.user.id, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.notesService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update note' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete note' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.notesService.remove(req.user.id, id);
  }
}
