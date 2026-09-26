import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller.js';
import { GamificationService } from './gamification.service.js';

// Геймификация: журнал прохождений из scenario.completed, опыт, уровни и репутация
@Module({
  controllers: [GamificationController],
  providers: [GamificationService],
})
export class GamificationModule {}
