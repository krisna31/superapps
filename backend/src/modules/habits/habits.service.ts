import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHabitDto, ToggleHabitDto } from './dto/habit.dto';

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: {
        userId,
        title: dto.title,
        frequency: dto.frequency || 'daily',
        streak: 0,
        completedDates: [],
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleCompletion(userId: string, id: string, dto: ToggleHabitDto) {
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
    });
    if (!habit) throw new NotFoundException('Habit not found');

    let dates = [...habit.completedDates];
    const exists = dates.includes(dto.date);

    if (exists) {
      dates = dates.filter((d) => d !== dto.date);
    } else {
      dates.push(dto.date);
      dates.sort();
    }

    // Recalculate streak
    const streak = this.calculateStreak(dates);

    return this.prisma.habit.update({
      where: { id },
      data: {
        completedDates: dates,
        streak,
      },
    });
  }

  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...dates].sort();
    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    return maxStreak;
  }

  async remove(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return this.prisma.habit.delete({ where: { id } });
  }
}
