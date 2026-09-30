import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DropZoneService {
  private readonly logger = new Logger(DropZoneService.name);
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, userId?: string, expiryHours = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (Number(expiryHours) || 24));

    const record = await this.prisma.dropZoneFile.create({
      data: {
        userId: userId || null,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storagePath: file.filename,
        url: `/api/dropzone/file/${file.filename}`,
        expiresAt,
        isEphemeral: true,
      },
    });

    return record;
  }

  async findFile(filename: string) {
    const record = await this.prisma.dropZoneFile.findFirst({
      where: { storagePath: filename },
    });

    if (!record) throw new NotFoundException('File not found or expired');
    const filePath = path.join(this.uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File binary missing from disk');
    }

    return { record, filePath };
  }

  async listUserFiles(userId: string) {
    return this.prisma.dropZoneFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(id: string, userId?: string) {
    const record = await this.prisma.dropZoneFile.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    });

    if (!record) throw new NotFoundException('File not found');

    const filePath = path.join(this.uploadDir, record.storagePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        this.logger.warn(`Failed to remove file from disk: ${filePath}`, e);
      }
    }

    return this.prisma.dropZoneFile.delete({ where: { id } });
  }

  // Hourly cleanup cron job to prune expired files
  @Cron(CronExpression.EVERY_HOUR)
  async pruneExpiredFiles() {
    const now = new Date();
    const expired = await this.prisma.dropZoneFile.findMany({
      where: {
        isEphemeral: true,
        expiresAt: { lte: now },
      },
    });

    if (expired.length === 0) return;

    this.logger.log(`Pruning ${expired.length} expired ephemeral files...`);

    for (const file of expired) {
      const filePath = path.join(this.uploadDir, file.storagePath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          this.logger.warn(`Failed to unlink expired file ${filePath}`, e);
        }
      }
      await this.prisma.dropZoneFile.delete({ where: { id: file.id } }).catch(() => null);
    }
  }
}
