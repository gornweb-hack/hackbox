import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../common/swagger.js';
import { ACTIVE_RUN_EXAMPLE, FINISHED_RUN_EXAMPLE, HISTORY_EXAMPLE } from './api-examples.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { ChooseDto, StartRunDto } from './dto.js';
import { type RunSummary, type RunView, RunsService } from './runs.service.js';

@ApiTags('Прохождения')
@ApiAuth()
@Controller('scenarios/runs')
@UseGuards(AuthGuard)
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  // Свои завершённые прохождения, новые первыми, — история в профиле
  @ApiOperation({ summary: 'Свои завершённые прохождения, новые первыми (до 50)' })
  @ApiOkResponse({ example: HISTORY_EXAMPLE })
  @Get()
  history(@CurrentUser() user: AuthUser): Promise<{ items: RunSummary[]; total: number }> {
    return this.runs.history(user.id);
  }

  @ApiOperation({ summary: 'Начать прохождение', description: 'Шкалы стартуют с 50/50; в ответе — первый узел с вариантами и таймером' })
  @ApiCreatedResponse({ example: ACTIVE_RUN_EXAMPLE })
  @Post()
  start(@CurrentUser() user: AuthUser, @Body() dto: StartRunDto): Promise<RunView> {
    return this.runs.start(user.id, dto.scenarioId);
  }

  // После перезагрузки страницы фронт продолжает с того же узла, таймер не обнуляется
  @ApiOperation({ summary: 'Состояние своего прохождения', description: 'В процессе — текущий узел; после финала — исход и разбор каждого решения. 409 SCENARIO_CHANGED — узел убрали из YAML' })
  @ApiOkResponse({ example: FINISHED_RUN_EXAMPLE })
  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<RunView> {
    return this.runs.get(user.id, id);
  }

  @ApiOperation({ summary: 'Решение в текущем узле', description: 'Без choiceId — «время вышло». Таймер проверяет сервер: выбор после дедлайна засчитывается как таймаут. В финале публикуется scenario.completed' })
  @ApiOkResponse({ example: ACTIVE_RUN_EXAMPLE })
  @Post(':id/choices')
  @HttpCode(200)
  choose(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChooseDto): Promise<RunView> {
    return this.runs.choose(user.id, id, dto.choiceId);
  }
}
