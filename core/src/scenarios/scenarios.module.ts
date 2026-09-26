import { Module } from '@nestjs/common';
import { DemoHistoryService } from './demo-history.js';
import { RunsController } from './runs.controller.js';
import { RunsService } from './runs.service.js';
import { ScenariosController } from './scenarios.controller.js';
import { ScenariosService } from './scenarios.service.js';

// Сценарии тренажёра: каталог из content/scenarios, прохождения с таймером и двумя шкалами, демо-история
@Module({
  controllers: [ScenariosController, RunsController],
  providers: [ScenariosService, RunsService, DemoHistoryService],
})
export class ScenariosModule {}
