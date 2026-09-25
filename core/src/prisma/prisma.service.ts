import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      // Короткий таймаут подключения: если база лежит, health отвечает быстро, а не висит
      adapter: new PrismaPg({ connectionString: config.databaseUrl, connectionTimeoutMillis: 2_000 }),
    });
  }

  async isAlive(): Promise<boolean> {
    const timeout = new Promise<false>((resolve) => setTimeout(() => resolve(false), 3_000));
    const query = this.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    );
    return Promise.race([query, timeout]);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
