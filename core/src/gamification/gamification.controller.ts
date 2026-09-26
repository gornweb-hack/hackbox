import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { GamificationService, type Progress } from './gamification.service.js';

@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  // Опыт, уровень и репутация вошедшего — для главной и шапки
  @Get('me/progress')
  progress(@CurrentUser() user: AuthUser): Promise<Progress> {
    return this.gamification.progress(user.id);
  }
}
