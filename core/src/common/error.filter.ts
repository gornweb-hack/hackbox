import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { type ApiErrorBody, sendError } from './api-error.js';
import { isDatabaseDown } from './db-errors.js';

// Приводит любую ошибку ядра к формату контракта {code, message}
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (isApiErrorBody(body)) {
        sendError(res, status, body.code, body.message);
      } else {
        sendError(res, status, HttpStatus[status] ?? 'ERROR', exception.message);
      }
      return;
    }

    // База лежит — не «внутренняя ошибка», а временная недоступность: фронт покажет понятное сообщение
    if (isDatabaseDown(exception)) {
      this.logger.warn(`база недоступна: ${exception instanceof Error ? exception.message : String(exception)}`);
      sendError(res, 503, 'DB_UNAVAILABLE', 'База данных недоступна, попробуйте через минуту');
      return;
    }

    this.logger.error(exception);
    sendError(res, 500, 'INTERNAL', 'Внутренняя ошибка ядра');
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'code' in body && 'message' in body;
}
