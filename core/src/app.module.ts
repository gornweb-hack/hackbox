import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthService } from './auth/auth.service.js';
import { SeedService } from './auth/seed.js';
import { TokensService } from './auth/tokens.js';
import { config } from './config.js';
import { EventsConsumer } from './events/events.consumer.js';
import { EventsService } from './events/events.service.js';
import { StreamController } from './events/stream.controller.js';
import { HealthController } from './health/health.controller.js';
import { ModulesController } from './modules-registry/modules.controller.js';
import { ModulesRegistry } from './modules-registry/modules-registry.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';

@Module({
  imports: [
    JwtModule.register({
      secret: config.auth.jwtSecret,
      signOptions: { expiresIn: config.auth.accessTtl as JwtSignOptions['expiresIn'] },
    }),
  ],
  controllers: [HealthController, ModulesController, AuthController, UsersController, StreamController],
  providers: [
    PrismaService,
    ModulesRegistry,
    TokensService,
    AuthGuard,
    AuthService,
    UsersService,
    SeedService,
    EventsService,
    EventsConsumer,
  ],
})
export class AppModule {}
