import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShortlinkDto, UpdateShortlinkDto } from './dto/shortlink.dto';

@Injectable()
export class ShortlinksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateShortlinkDto) {
    const existing = await this.prisma.shortlink.findUnique({
      where: { key: dto.key.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`Shortlink key '${dto.key}' is already in use`);
    }

    return this.prisma.shortlink.create({
      data: {
        userId,
        key: dto.key.toLowerCase(),
        title: dto.title,
        url: dto.url,
        category: dto.category || 'General',
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.shortlink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.shortlink.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Shortlink not found');
    return item;
  }

  async update(userId: string, id: string, dto: UpdateShortlinkDto) {
    await this.findOne(userId, id);
    return this.prisma.shortlink.update({
      where: { id },
      data: {
        ...(dto.key ? { key: dto.key.toLowerCase() } : {}),
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.url ? { url: dto.url } : {}),
        ...(dto.category ? { category: dto.category } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.shortlink.delete({ where: { id } });
  }

  async resolveKey(key: string) {
    const item = await this.prisma.shortlink.findUnique({
      where: { key: key.toLowerCase() },
    });

    if (!item) throw new NotFoundException('Shortlink target not found');

    // Increment click count asynchronously
    await this.prisma.shortlink.update({
      where: { id: item.id },
      data: { clicks: { increment: 1 } },
    });

    return item;
  }
}
