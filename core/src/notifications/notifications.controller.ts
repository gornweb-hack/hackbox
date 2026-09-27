import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/tokens.js';
import { ApiAuth } from '../common/swagger.js';
import { NOTIFICATIONS_EXAMPLE } from './api-examples.js';
import { type NotificationView, NotificationsService } from './notifications.service.js';

@ApiTags('Уведомления')
@ApiAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // Центр уведомлений: последние уведомления вошедшего и счётчик непрочитанных для колокольчика
  @ApiOperation({
    summary: 'Уведомления вошедшего',
    description: 'Последние 50, новые сверху. Появляются из события notification.requested; unread — сколько не прочитано',
  })
  @ApiOkResponse({ example: NOTIFICATIONS_EXAMPLE })
  @Get()
  list(@CurrentUser() user: AuthUser): Promise<{ items: NotificationView[]; total: number; unread: number }> {
    return this.notifications.list(user.id);
  }

  // Страница уведомлений открыта — всё прочитано
  @ApiOperation({ summary: 'Отметить все уведомления прочитанными' })
  @ApiOkResponse({ example: { unread: 0 } })
  @Post('read')
  @HttpCode(200)
  read(@CurrentUser() user: AuthUser): Promise<{ unread: number }> {
    return this.notifications.markRead(user.id);
  }
}
