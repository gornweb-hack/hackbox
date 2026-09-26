import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { ChooseDto, StartRunDto } from './dto.js';
import { type RunView, RunsService } from './runs.service.js';

@Controller('scenarios/runs')
@UseGuards(AuthGuard)
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post()
  start(@CurrentUser() user: AuthUser, @Body() dto: StartRunDto): Promise<RunView> {
    return this.runs.start(user.id, dto.scenarioId);
  }

  // После перезагрузки страницы фронт продолжает с того же узла, таймер не обнуляется
  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<RunView> {
    return this.runs.get(user.id, id);
  }

  @Post(':id/choices')
  @HttpCode(200)
  choose(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChooseDto): Promise<RunView> {
    return this.runs.choose(user.id, id, dto.choiceId);
  }
}
