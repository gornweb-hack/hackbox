import { Controller, Get } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  // Ядро живо и видит базу. По нему работает healthcheck в compose.
  // Redis только для информации: без него события не ходят, но ядро работает
  @Get()
  async check(): Promise<{ status: 'ok'; db: 'up'; redis: 'up' | 'down' }> {
    if (!(await this.prisma.isAlive())) {
      throw new ApiError(503, 'DB_UNAVAILABLE', 'База данных недоступна');
    }
    return { status: 'ok', db: 'up', redis: this.events.isUp() ? 'up' : 'down' };
  }
}
