FROM node:24-alpine AS build
WORKDIR /app
# Схема нужна до npm ci: postinstall генерирует клиент Prisma
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
# Запас потоков libuv: DNS-запросы к незапущенным модулям идут секундами и занимают поток
ENV UV_THREADPOOL_SIZE=16
COPY --from=build /app/package.json /app/prisma7.config.ts ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4000
# Миграции ядра применяются при каждом старте, затем запускается сервер
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
