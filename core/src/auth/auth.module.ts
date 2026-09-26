import { Global, Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { config } from '../config.js';
import { UsersController } from '../users/users.controller.js';
import { UsersService } from '../users/users.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { SeedService } from './seed.js';
import { TokensService } from './tokens.js';

// Вход и сотрудники — один модуль: вход и демо-аккаунты работают через UsersService,
// а эндпоинты сотрудников закрыты AuthGuard, поэтому раздельные модули ссылались бы друг на друга.
// Глобальный: AuthGuard нужен контроллерам любого модуля, а ему — TokensService
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: config.auth.jwtSecret,
      signOptions: { expiresIn: config.auth.accessTtl as JwtSignOptions['expiresIn'] },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [TokensService, AuthGuard, AuthService, UsersService, SeedService],
  exports: [TokensService],
})
export class AuthModule {}
