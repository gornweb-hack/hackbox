import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AUTH_FAILURES, type TokensService } from '../auth/tokens.js';
import { sendError } from '../common/api-error.js';
import { config } from '../config.js';
import type { ModulesRegistry } from '../modules-registry/modules-registry.service.js';

// Запросы, оборванные по таймауту: так их ошибку можно отличить от обрыва соединения
const timedOut = new WeakSet<Request>();

// Ошибки, при которых модуля точно нет: контейнер остановлен или не слушает порт
const UNREACHABLE = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH']);

// Прокси /api/m/<name>/<путь> → http://<name>:8080/<путь>. Монтируется на /api/m,
// поэтому req.url здесь начинается с /<name>
export function createModuleProxy(registry: ModulesRegistry, tokens: TokensService): RequestHandler {
  const proxies = new Map<string, RequestHandler>();

  for (const { name } of registry.list()) {
    const proxy = createProxyMiddleware<Request, Response>({
      target: registry.get(name)!.url,
      changeOrigin: true,
      proxyTimeout: config.moduleTimeoutMs,
      pathRewrite: (path) => {
        const rest = path.slice(name.length + 1);
        return rest.startsWith('/') ? rest : `/${rest}`;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.on('timeout', () => timedOut.add(req));
        },
        error: (err, req, res) => {
          if (UNREACHABLE.has((err as NodeJS.ErrnoException).code ?? '')) registry.markDown(name);
          if (!('writeHead' in res)) {
            res.destroy();
          } else if (res.headersSent) {
            res.end();
          } else if (timedOut.has(req)) {
            sendError(res, 504, 'MODULE_TIMEOUT', `Модуль «${name}» не ответил за ${config.moduleTimeoutMs / 1000} с`);
          } else {
            sendError(res, 503, 'MODULE_UNAVAILABLE', `Модуль «${name}» недоступен`);
          }
        },
      },
    });
    proxies.set(name, proxy as unknown as RequestHandler);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const name = req.url.split(/[/?]/)[1] ?? '';
    const proxy = proxies.get(name);
    if (!proxy) {
      sendError(res, 404, 'MODULE_NOT_FOUND', `Модуль «${name}» не зарегистрирован`);
      return;
    }
    // Лежащий модуль: отвечаем сразу, без ожидания таймаута
    if (registry.get(name)?.status !== 'up') {
      sendError(res, 503, 'MODULE_UNAVAILABLE', `Модуль «${name}» недоступен`);
      return;
    }
    // Пользователя модулю передаёт только ядро, клиент подделать не может
    for (const header of Object.keys(req.headers)) {
      if (header.startsWith('x-user-')) delete req.headers[header];
    }
    // Без токена запрос уходит анонимно — модуль сам решает, нужен ли ему пользователь.
    // Токен без обращения к базе: прокси работает, даже когда база лежит
    const check = tokens.check(req);
    if (check.status === 'expired' || check.status === 'invalid') {
      const failure = AUTH_FAILURES[check.status];
      sendError(res, 401, failure.code, failure.message);
      return;
    }
    if (check.status === 'valid') {
      req.headers['x-user-id'] = check.user.id;
      req.headers['x-user-role'] = check.user.role;
    }
    void proxy(req, res, next);
  };
}
