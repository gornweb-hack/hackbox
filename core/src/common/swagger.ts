import { applyDecorators, type INestApplication } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ACCESS_COOKIE } from '../auth/tokens.js';

// Общие правила API — в шапке документа, чтобы не повторять их у каждого эндпоинта
const DESCRIPTION = `API тренажёра проводников ВСМ-400 «Рейс 400».

**Вход.** \`POST /api/auth/login\` ставит httpOnly-cookie \`${ACCESS_COOKIE}\` — браузер и эта страница дальше ходят с ней.
Внешней системе (HR, LMS) удобнее \`Authorization: Bearer <accessToken>\` из ответа входа. Роли: \`USER\`, \`MANAGER\`, \`ADMIN\`.

**Ошибки** — \`{"code": "UPPER_SNAKE_CASE", "message": "текст для человека"}\`. Ошибка валидации — \`422 VALIDATION_ERROR\`,
нет входа — \`401 UNAUTHORIZED\`, \`TOKEN_EXPIRED\` или \`TOKEN_INVALID\`, нет прав — \`403 FORBIDDEN\`.

**Формат.** Списки — \`{items, total}\`, JSON в camelCase, даты ISO 8601 в UTC, идентификаторы — UUID.

**События.** Прохождения, опыт и уведомления публикуются в Redis Stream \`events\` (\`scenario.completed\`, \`progress.updated\`,
\`notification.requested\`): LMS или учёт обучения можно подключить отдельной группой читателей этого стрима. Браузер получает события по SSE \`GET /api/stream\`.
Формат — в docs/events.md.`;

// Swagger UI на /api/docs, схема — /api/docs-json. Схемы тел запросов строит плагин Nest CLI из DTO (nest-cli.json)
export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Рейс 400 — API')
      .setDescription(DESCRIPTION)
      .setVersion('1.0')
      // Порядок групп — по пути пользователя: вход, сценарии, награды, аналитика, служебное
      .addTag('Вход')
      .addTag('Сотрудники')
      .addTag('Сценарии')
      .addTag('Прохождения')
      .addTag('Геймификация')
      .addTag('Аналитика')
      .addTag('События')
      .addTag('Состояние')
      .addCookieAuth(ACCESS_COOKIE)
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);
}

// Эндпоинт требует входа: cookie hb_access или заголовок Authorization: Bearer
export const ApiAuth = () => applyDecorators(ApiCookieAuth(), ApiBearerAuth());
