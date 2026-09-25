import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { ErrorFilter } from './common/error.filter.js';
import { requestId } from './common/request-id.js';
import { config } from './config.js';
import { ModulesRegistry } from './modules-registry/modules-registry.service.js';
import { createModuleProxy } from './proxy/module-proxy.js';

// bodyParser выключен: прокси должен получить тело нетронутым
const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

app.use(requestId);
// Прокси в модули — до разбора тела, чтобы JSON и файлы уходили в модуль как есть
app.use('/api/m', createModuleProxy(app.get(ModulesRegistry)));
app.useBodyParser('json');

app.setGlobalPrefix('api');
app.useGlobalFilters(new ErrorFilter());
app.enableShutdownHooks();

await app.listen(config.port);
