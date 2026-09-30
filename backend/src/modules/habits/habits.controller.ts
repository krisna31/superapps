import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { CreateHabitDto, ToggleHabitDto } from './dto/habit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Habits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new daily or weekly habit' })
  create(@Req() req: any, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all habits for current user' })
  findAll(@Req() req: any) {
    return this.habitsService.findAll(req.user.id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle completion status of a habit for a specific date' })
  toggle(@Req() req: any, @Param('id') id: string, @Body() dto: ToggleHabitDto) {
    return this.habitsService.toggleCompletion(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a habit' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.habitsService.remove(req.user.id, id);
  }
}
