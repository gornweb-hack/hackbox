import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Одно подключение к базе на всё приложение: модули получают PrismaService без импорта
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
