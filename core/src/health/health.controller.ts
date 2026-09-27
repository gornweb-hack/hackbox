import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiError } from '../common/api-error.js';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Состояние')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  // Ядро живо и видит базу. По нему работает healthcheck в compose.
  // Redis только для информации: без него события не ходят, но ядро работает
  @ApiOperation({ summary: 'Ядро живо и видит базу; состояние Redis — для информации' })
  @Get()
  async check(): Promise<{ status: 'ok'; db: 'up'; redis: 'up' | 'down' }> {
    if (!(await this.prisma.isAlive())) {
      throw new ApiError(503, 'DB_UNAVAILABLE', 'База данных недоступна');
    }
    return { status: 'ok', db: 'up', redis: this.events.isUp() ? 'up' : 'down' };
  }
}
