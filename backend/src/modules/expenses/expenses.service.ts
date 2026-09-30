import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        userId,
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        category: dto.category || 'General',
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: string, type?: string, category?: string) {
    return this.prisma.expense.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  async getSummary(userId: string) {
    const records = await this.prisma.expense.findMany({
      where: { userId },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const r of records) {
      if (r.type === 'income') {
        totalIncome += r.amount;
      } else {
        totalExpense += r.amount;
        categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + r.amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      count: records.length,
      categoryBreakdown,
    };
  }

  async findOne(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException('Expense record not found');
    return expense;
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(userId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.expense.delete({ where: { id } });
  }
}
