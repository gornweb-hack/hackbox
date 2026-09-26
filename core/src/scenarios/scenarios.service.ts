import { Injectable, Logger } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApiError } from '../common/api-error.js';
import { config } from '../config.js';
import { buildCatalog, type Scenario } from './catalog.js';

const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

// Каталог читается с диска при каждом запросе: файлов единицы, зато правка YAML видна сразу,
// без перезапуска ядра. Так на защите сценарий меняют за минуту
@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);
  // Одни и те же ошибки в файлах пишем в лог один раз, а не на каждый запрос
  private lastWarning = '';

  async catalog(): Promise<Scenario[]> {
    let categories: string;
    try {
      categories = await readFile(join(config.contentDir, 'categories.yaml'), 'utf8');
    } catch (error) {
      if (!isMissing(error)) throw error;
      this.warn(`нет ${join(config.contentDir, 'categories.yaml')}: каталог сценариев пуст`);
      return [];
    }

    const dir = join(config.contentDir, 'scenarios');
    const names = await readdir(dir).catch((error: unknown) => {
      if (isMissing(error)) return [];
      throw error;
    });
    const files = await Promise.all(
      names
        .filter((name) => name.endsWith('.yaml'))
        .map(async (name) => ({ id: name.slice(0, -'.yaml'.length), text: await readFile(join(dir, name), 'utf8') })),
    );

    let catalog: ReturnType<typeof buildCatalog>;
    try {
      catalog = buildCatalog(categories, files);
    } catch (error) {
      throw new ApiError(500, 'CONTENT_INVALID', `Справочник категорий не читается: ${(error as Error).message}`);
    }
    this.warn(catalog.errors.map((error) => `сценарий пропущен — ${error}`).join('\n'));
    return catalog.items;
  }

  async find(id: string): Promise<Scenario> {
    const scenario = (await this.catalog()).find((item) => item.meta.id === id);
    if (!scenario) throw new ApiError(404, 'SCENARIO_NOT_FOUND', 'Сценарий не найден');
    return scenario;
  }

  private warn(message: string): void {
    if (message && message !== this.lastWarning) this.logger.warn(message);
    this.lastWarning = message;
  }
}
