import { Module } from '@nestjs/common';
import { RunsController } from './runs.controller.js';
import { RunsService } from './runs.service.js';
import { ScenariosController } from './scenarios.controller.js';
import { ScenariosService } from './scenarios.service.js';

// Сценарии тренажёра: каталог из content/scenarios и прохождения с таймером и двумя шкалами
@Module({
  controllers: [ScenariosController, RunsController],
  providers: [ScenariosService, RunsService],
})
export class ScenariosModule {}
