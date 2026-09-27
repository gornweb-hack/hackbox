import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../common/swagger.js';
import type { CookieOptions, Request, Response } from 'express';
import { ApiError } from '../common/api-error.js';
import { config } from '../config.js';
import { type UserProfile, UsersService } from '../users/users.service.js';
import { AuthGuard, CurrentUser } from './auth.guard.js';
import { type Session, AuthService } from './auth.service.js';
import { LoginDto, RegisterDto, UpdateMeDto } from './dto.js';
import { ACCESS_COOKIE, type AuthUser, REFRESH_COOKIE } from './tokens.js';

// Обе cookie живут как refresh-токен: истёкший access всё равно дойдёт до ядра,
// и фронт получит явный TOKEN_EXPIRED, а не анонимный ответ
function cookieOptions(path: string): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path, maxAge: config.auth.refreshTtlDays * 86_400_000 };
}

function setSessionCookies(res: Response, session: Session): void {
  res.cookie(ACCESS_COOKIE, session.accessToken, cookieOptions('/'));
  // Refresh-cookie уходит только на /api/auth: остальные запросы его не несут
  res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions('/api/auth'));
}

// Refresh-токен из тела ({"refreshToken": "..."}) или из cookie
function refreshTokenFrom(req: Request): string | undefined {
  const fromBody = (req.body as { refreshToken?: unknown } | undefined)?.refreshToken;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE] || undefined;
}

@ApiTags('Вход')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @ApiOperation({ summary: 'Войти по логину и паролю', description: 'Ставит cookie сессии и возвращает accessToken и refreshToken для Bearer' })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<Session> {
    const session = await this.auth.login(dto.login, dto.password);
    setSessionCookies(res, session);
    return session;
  }

  @ApiOperation({ summary: 'Регистрация с ролью USER', description: 'Только при REGISTRATION_OPEN=true' })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<Session> {
    const session = await this.auth.register(dto);
    setSessionCookies(res, session);
    return session;
  }

  @ApiOperation({ summary: 'Новая пара токенов', description: 'Refresh-токен — из cookie или из тела {refreshToken}' })
  @ApiBody({ required: false, schema: { properties: { refreshToken: { type: 'string' } } } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Session> {
    const session = await this.auth.refresh(refreshTokenFrom(req));
    setSessionCookies(res, session);
    return session;
  }

  @ApiOperation({ summary: 'Выйти: отозвать refresh-токен и стереть cookie' })
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(refreshTokenFrom(req));
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  }

  @ApiOperation({ summary: 'Профиль вошедшего: имя, роль, бригада и депо' })
  @ApiAuth()
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: AuthUser): Promise<UserProfile> {
    const profile = await this.users.profile(user.id);
    if (!profile) throw new ApiError(401, 'UNAUTHORIZED', 'Пользователь больше не существует');
    return profile;
  }

  @ApiOperation({ summary: 'Сменить свой портрет', description: 'avatar — id портрета из набора или null, чтобы вернуть инициалы. Остальные поля профиля меняет администратор' })
  @ApiAuth()
  @Patch('me')
  @UseGuards(AuthGuard)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto): Promise<UserProfile> {
    return this.users.update(user.id, { avatar: dto.avatar });
  }
}
