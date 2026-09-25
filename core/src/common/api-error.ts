import { HttpException } from '@nestjs/common';
import type { Response } from 'express';

// Формат ошибки из контракта: {"code": "NOT_FOUND", "message": "..."}
export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends HttpException {
  constructor(status: number, code: string, message: string) {
    super({ code, message } satisfies ApiErrorBody, status);
  }
}

// Для обработчиков вне Nest (прокси), где исключение бросить нельзя
export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ code, message } satisfies ApiErrorBody);
}
