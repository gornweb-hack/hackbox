import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { TokensService } from './auth/tokens.js';
import { ApiError } from './common/api-error.js';
import { ErrorFilter } from './common/error.filter.js';
import { requestId } from './common/request-id.js';
import { config } from './config.js';
import { ModulesRegistry } from './modules-registry/modules-registry.service.js';
import { createModuleProxy } from './proxy/module-proxy.js';

// bodyParser выключен: прокси должен получить тело нетронутым
const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

app.use(requestId);
// Cookie разбираются до прокси: по access-cookie прокси узнаёт пользователя
app.use(cookieParser());
// Прокси в модули — до разбора тела, чтобы JSON и файлы уходили в модуль как есть
app.use('/api/m', createModuleProxy(app.get(ModulesRegistry), app.get(TokensService)));
app.useBodyParser('json');

app.setGlobalPrefix('api');
app.useGlobalFilters(new ErrorFilter());
// Ошибки валидации — 422 VALIDATION_ERROR, как в контракте
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) =>
      new ApiError(
        422,
        'VALIDATION_ERROR',
        errors.flatMap((error) => Object.values(error.constraints ?? {})).join('; '),
      ),
  }),
);
app.enableShutdownHooks();

await app.listen(config.port);
