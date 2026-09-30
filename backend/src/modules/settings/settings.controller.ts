import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SetSettingDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Save or update a user setting key-value pair' })
  setSetting(@Req() req: any, @Body() dto: SetSettingDto) {
    return this.settingsService.set(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user settings' })
  getAllSettings(@Req() req: any) {
    return this.settingsService.getAll(req.user.id);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get specific setting value by key' })
  getSetting(@Req() req: any, @Param('key') key: string) {
    return this.settingsService.get(req.user.id, key);
  }
}
