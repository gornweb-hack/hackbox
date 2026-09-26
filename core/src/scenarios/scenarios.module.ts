import { Module } from '@nestjs/common';
import { ScenariosController } from './scenarios.controller.js';
import { ScenariosService } from './scenarios.service.js';

// Сценарии тренажёра: каталог из content/scenarios
@Module({
  controllers: [ScenariosController],
  providers: [ScenariosService],
})
export class ScenariosModule {}
