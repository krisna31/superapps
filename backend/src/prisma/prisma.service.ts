import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(' Connected to PostgreSQL database.');
    } catch {
      this.logger.warn(
        '⚠️ PostgreSQL is currently offline. Backend started in standalone mode. Start PostgreSQL via "docker compose up -d" or configure DATABASE_URL in .env to enable database persistence.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

