import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { ScenarioMeta } from './catalog.js';
import { ScenariosService } from './scenarios.service.js';

@Controller('scenarios')
@UseGuards(AuthGuard)
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  // Каталог по порядку: первым идёт сценарий, с которого начинает новичок
  @Get()
  async list(): Promise<{ items: ScenarioMeta[]; total: number }> {
    const items = await this.scenarios.catalog();
    return { items, total: items.length };
  }
}
