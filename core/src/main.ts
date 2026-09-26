import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { ApiError } from './common/api-error.js';
import { ErrorFilter } from './common/error.filter.js';
import { requestId } from './common/request-id.js';
import { config } from './config.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

app.use(requestId);
// Браузер присылает access- и refresh-токены в httpOnly-cookie
app.use(cookieParser());

app.setGlobalPrefix('api');
app.useGlobalFilters(new ErrorFilter());
// Ошибки валидации — 422 VALIDATION_ERROR в общем формате ошибок {code, message}
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
