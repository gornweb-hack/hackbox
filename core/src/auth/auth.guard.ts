import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiError } from '../common/api-error.js';
import type { Role } from '../generated/prisma/client.js';
import { AUTH_FAILURES, type AuthUser, TokensService } from './tokens.js';

// @Roles('ADMIN') — эндпоинт доступен только этим ролям. Без декоратора — любому вошедшему
export const Roles = Reflector.createDecorator<Role[]>();

type AuthedRequest = Request & { user?: AuthUser };

// @UseGuards(AuthGuard): пускает только с действующим access-токеном
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokensService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const check = this.tokens.check(req);
    if (check.status !== 'valid') {
      const failure = AUTH_FAILURES[check.status];
      throw new ApiError(401, failure.code, failure.message);
    }

    const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(check.user.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Недостаточно прав');
    }

    req.user = check.user;
    return true;
  }
}

// Пользователь, которого пропустил AuthGuard
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser => context.switchToHttp().getRequest<AuthedRequest>().user!,
);
