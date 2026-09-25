import { Controller, Get } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Ядро живо и видит базу. По нему работает healthcheck в compose
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    if (!(await this.prisma.isAlive())) {
      throw new ApiError(503, 'DB_UNAVAILABLE', 'База данных недоступна');
    }
    return { status: 'ok' };
  }
}
