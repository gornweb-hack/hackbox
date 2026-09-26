import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, Roles } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import type { ScenarioMeta } from './catalog.js';
import { DemoHistoryService } from './demo-history.js';
import { RunsService } from './runs.service.js';
import { ScenariosService } from './scenarios.service.js';

@Controller('scenarios')
@UseGuards(AuthGuard)
export class ScenariosController {
  constructor(
    private readonly scenarios: ScenariosService,
    private readonly runs: RunsService,
    private readonly demoHistory: DemoHistoryService,
  ) {}

  // Каталог по порядку: первым идёт сценарий, с которого начинает новичок.
  // completed — пользователь хоть раз дошёл до финала
  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<{ items: (ScenarioMeta & { completed: boolean })[]; total: number }> {
    const [scenarios, completed] = await Promise.all([this.scenarios.catalog(), this.runs.completedIds(user.id)]);
    const items = scenarios.map(({ meta }) => ({ ...meta, completed: completed.has(meta.id) }));
    return { items, total: items.length };
  }

  // Демо-история для синтетического штата — только админу и только при SEED_DEMO_USERS=true
  @Post('demo-history')
  @Roles(['ADMIN'])
  generateDemoHistory(): Promise<{ users: number; runs: number }> {
    return this.demoHistory.generate();
  }
}
