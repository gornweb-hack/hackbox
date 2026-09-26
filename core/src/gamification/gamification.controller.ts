import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { GamificationService, type Progress, type Reward } from './gamification.service.js';

@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  // Опыт, уровень, репутация и ачивки вошедшего — для главной и шапки
  @Get('me/progress')
  progress(@CurrentUser() user: AuthUser): Promise<Progress> {
    return this.gamification.progress(user.id);
  }

  // Опыт и ачивки за одно своё прохождение — для разбора
  @Get('runs/:runId/reward')
  reward(@CurrentUser() user: AuthUser, @Param('runId', ParseUUIDPipe) runId: string): Promise<Reward> {
    return this.gamification.reward(user.id, runId);
  }
}
