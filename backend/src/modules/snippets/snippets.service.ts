import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSnippetDto, UpdateSnippetDto } from './dto/snippet.dto';

@Injectable()
export class SnippetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSnippetDto) {
    return this.prisma.snippet.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        language: dto.language,
        code: dto.code,
        tags: dto.tags || [],
        isPinned: dto.isPinned || false,
      },
    });
  }

  async findAll(userId: string, language?: string, search?: string) {
    return this.prisma.snippet.findMany({
      where: {
        userId,
        ...(language ? { language } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const snippet = await this.prisma.snippet.findFirst({
      where: { id, userId },
    });
    if (!snippet) throw new NotFoundException('Snippet not found');
    return snippet;
  }

  async update(userId: string, id: string, dto: UpdateSnippetDto) {
    await this.findOne(userId, id);
    return this.prisma.snippet.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.snippet.delete({ where: { id } });
  }
}
