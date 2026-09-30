import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ShortlinksService } from './shortlinks.service';
import { CreateShortlinkDto, UpdateShortlinkDto } from './dto/shortlink.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Shortlinks')
@Controller('shortlinks')
export class ShortlinksController {
  constructor(private readonly shortlinksService: ShortlinksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new personal shortlink' })
  create(@Req() req: any, @Body() dto: CreateShortlinkDto) {
    return this.shortlinksService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all shortlinks for current user' })
  findAll(@Req() req: any) {
    return this.shortlinksService.findAll(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shortlink by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.shortlinksService.findOne(req.user.id, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing shortlink' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShortlinkDto) {
    return this.shortlinksService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a shortlink' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.shortlinksService.remove(req.user.id, id);
  }

  @Get('r/:key')
  @ApiOperation({ summary: 'Public shortlink redirection target' })
  async redirect(@Param('key') key: string, @Res() res: Response) {
    const item = await this.shortlinksService.resolveKey(key);
    return res.redirect(HttpStatus.FOUND, item.url);
  }
}
