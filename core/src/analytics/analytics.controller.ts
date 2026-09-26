import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../common/swagger.js';
import { SKILLS_EXAMPLE } from './api-examples.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { AnalyticsService, type SkillsSummary } from './analytics.service.js';

@ApiTags('Аналитика')
@ApiAuth()
@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  // Навыки вошедшего за последние прохождения и сценарий, чтобы подтянуть слабый
  @ApiOperation({ summary: 'Навыки вошедшего и что потренировать', description: 'Процент верных решений по меткам skills из YAML за последние прохождения; recommendation — сценарий, где слабый навык проверяется чаще всего' })
  @ApiOkResponse({ example: SKILLS_EXAMPLE })
  @Get('me/skills')
  skills(@CurrentUser() user: AuthUser): Promise<SkillsSummary> {
    return this.analytics.skills(user.id);
  }
}
