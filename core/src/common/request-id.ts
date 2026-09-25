import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

// X-Request-Id: берём из запроса или создаём; уходит в модуль и возвращается клиенту
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.header('x-request-id') || randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
}
