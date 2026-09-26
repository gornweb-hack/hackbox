import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { RatingQueryDto } from './dto.js';
import { GamificationService, type Progress, type Rating, type Reward, type ShelfItem } from './gamification.service.js';

@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  // Опыт, уровень, репутация и ачивки вошедшего — для главной и шапки
  @Get('me/progress')
  progress(@CurrentUser() user: AuthUser): Promise<Progress> {
    return this.gamification.progress(user.id);
  }

  // Полка профиля: все ачивки, полученные и закрытые
  @Get('me/achievements')
  achievements(@CurrentUser() user: AuthUser): Promise<{ items: ShelfItem[]; total: number }> {
    return this.gamification.shelf(user.id);
  }

  // Опыт и ачивки за одно своё прохождение — для разбора
  @Get('runs/:runId/reward')
  reward(@CurrentUser() user: AuthUser, @Param('runId', ParseUUIDPipe) runId: string): Promise<Reward> {
    return this.gamification.reward(user.id, runId);
  }

  // Рейтинг за месяц: вся таблица бригады, депо или компании и место вошедшего
  @Get('rating')
  rating(@CurrentUser() user: AuthUser, @Query() query: RatingQueryDto): Promise<Rating> {
    return this.gamification.rating(user.id, query.scope);
  }
}
