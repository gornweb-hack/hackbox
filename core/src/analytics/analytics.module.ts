import { Module } from '@nestjs/common';
import { ScenariosModule } from '../scenarios/scenarios.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

// Аналитика компетенций: навыки ролевой модели по решениям в сценариях и рекомендация, что потренировать
@Module({
  imports: [ScenariosModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
