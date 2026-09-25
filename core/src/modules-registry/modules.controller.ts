import { Controller, Get } from '@nestjs/common';
import { ModulesRegistry } from './modules-registry.service.js';

@Controller('modules')
export class ModulesController {
  constructor(private readonly registry: ModulesRegistry) {}

  // Какие модули живы: фронт скрывает блоки модулей со статусом down
  @Get()
  list() {
    return this.registry.list();
  }
}
