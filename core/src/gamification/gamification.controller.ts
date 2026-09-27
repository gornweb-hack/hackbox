import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../common/swagger.js';
import { PROGRESS_EXAMPLE, RATING_EXAMPLE } from './api-examples.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { RatingQueryDto } from './dto.js';
import { GamificationService, type Progress, type Rating, type Reward, type ShelfItem } from './gamification.service.js';

@ApiTags('Геймификация')
@ApiAuth()
@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  // Опыт, уровень, репутация и ачивки вошедшего — для главной и шапки
  @ApiOperation({ summary: 'Опыт, уровень, репутация и ачивки вошедшего', description: 'Считается из журнала прохождений по правилам content/gamification.yaml' })
  @ApiOkResponse({ example: PROGRESS_EXAMPLE })
  @Get('me/progress')
  progress(@CurrentUser() user: AuthUser): Promise<Progress> {
    return this.gamification.progress(user.id);
  }

  // Полка профиля: все ачивки, полученные и закрытые
  @ApiOperation({ summary: 'Полка: все ачивки', description: 'У полученных — earnedAt, у закрытых — прогресс share и text' })
  @Get('me/achievements')
  achievements(@CurrentUser() user: AuthUser): Promise<{ items: ShelfItem[]; total: number }> {
    return this.gamification.shelf(user.id);
  }

  // Опыт и ачивки за одно своё прохождение — для разбора
  @ApiOperation({ summary: 'Награда за своё прохождение: опыт и ачивки', description: '404 REWARD_PENDING — прохождения ещё нет в журнале' })
  @Get('runs/:runId/reward')
  reward(@CurrentUser() user: AuthUser, @Param('runId', ParseUUIDPipe) runId: string): Promise<Reward> {
    return this.gamification.reward(user.id, runId);
  }

  // Рейтинг за месяц: вся таблица бригады, депо или компании и место вошедшего
  @ApiOperation({ summary: 'Рейтинг за месяц: бригада, депо или компания', description: 'Опыт за календарный месяц по Москве; при равном опыте выше тот, кто набрал его раньше' })
  @ApiOkResponse({ example: RATING_EXAMPLE })
  @Get('rating')
  rating(@CurrentUser() user: AuthUser, @Query() query: RatingQueryDto): Promise<Rating> {
    return this.gamification.rating(user.id, query.scope);
  }
}
