import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { ModulesController } from './modules-registry/modules.controller.js';
import { ModulesRegistry } from './modules-registry/modules-registry.service.js';
import { PrismaService } from './prisma/prisma.service.js';

@Module({
  controllers: [HealthController, ModulesController],
  providers: [PrismaService, ModulesRegistry],
})
export class AppModule {}
