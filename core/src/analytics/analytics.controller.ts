import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { AnalyticsService, type SkillsSummary } from './analytics.service.js';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  // Навыки вошедшего за последние прохождения и сценарий, чтобы подтянуть слабый
  @Get('me/skills')
  skills(@CurrentUser() user: AuthUser): Promise<SkillsSummary> {
    return this.analytics.skills(user.id);
  }
}
