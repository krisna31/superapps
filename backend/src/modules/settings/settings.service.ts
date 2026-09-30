import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetSettingDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async set(userId: string, dto: SetSettingDto) {
    return this.prisma.appSetting.upsert({
      where: {
        userId_key: { userId, key: dto.key },
      },
      update: { value: dto.value },
      create: {
        userId,
        key: dto.key,
        value: dto.value,
      },
    });
  }

  async getAll(userId: string) {
    const settings = await this.prisma.appSetting.findMany({
      where: { userId },
    });
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async get(userId: string, key: string) {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        userId_key: { userId, key },
      },
    });
    return setting ? setting.value : null;
  }
}
