import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { EventsModule } from './events/events.module.js';
import { GamificationModule } from './gamification/gamification.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ScenariosModule } from './scenarios/scenarios.module.js';

// Приложение собирается из модулей; новый модуль подключается строкой в imports
@Module({
  imports: [PrismaModule, EventsModule, AuthModule, HealthModule, ScenariosModule, GamificationModule],
})
export class AppModule {}
