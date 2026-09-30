import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new income or expense transaction' })
  create(@Req() req: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with optional type and category filters' })
  @ApiQuery({ name: 'type', required: false, enum: ['income', 'expense'] })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Req() req: any, @Query('type') type?: string, @Query('category') category?: string) {
    return this.expensesService.findAll(req.user.id, type, category);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary: income, expense totals, net balance, and breakdown' })
  getSummary(@Req() req: any) {
    return this.expensesService.getSummary(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.expensesService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.expensesService.remove(req.user.id, id);
  }
}
