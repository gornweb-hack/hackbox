import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.js';
import { ApiError } from './api-error.js';

// Поля YAML-объекта до проверки: разборщики контента сверяют их по одному
export type Fields = Record<string, unknown>;

export const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Файл из content/ читается при каждом вызове: правка YAML видна сразу, без перезапуска ядра.
// Нет файла или он битый — 500 CONTENT_INVALID с причиной, чтобы автор контента сразу её увидел
export async function readContent<T>(file: string, what: string, parse: (text: string) => T): Promise<T> {
  try {
    return parse(await readFile(join(config.contentDir, file), 'utf8'));
  } catch (error) {
    throw new ApiError(500, 'CONTENT_INVALID', `${what} не читаются: ${(error as Error).message}`);
  }
}
