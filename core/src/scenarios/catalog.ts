import { parse } from 'yaml';

// Классы обслуживания ВСМ по СТО РЖД 03.011. Остальное («Эконом», опечатки) отсекается при загрузке
export const CAR_CLASSES = ['Стандарт', 'Комфорт', 'Бизнес', 'Первый'] as const;
export type CarClass = (typeof CAR_CLASSES)[number];

export interface Category {
  id: string;
  title: string;
}

export interface ScenarioMeta {
  id: string;
  title: string;
  summary: string;
  category: Category;
  carClass: CarClass;
  durationMin: number;
  order: number;
  isNew: boolean;
}

export interface CatalogFile {
  id: string;
  text: string;
}

function requireString(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`нет поля ${field}`);
  return value.trim();
}

function requireNumber(data: Record<string, unknown>, field: string): number {
  const value = data[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} должно быть числом`);
  return value;
}

// content/categories.yaml — список {id, title}
export function parseCategories(text: string): Category[] {
  const data: unknown = parse(text);
  if (!Array.isArray(data)) throw new Error('ожидается список категорий');
  return data.map((item: unknown, index) => {
    const { id, title } = (item ?? {}) as Record<string, unknown>;
    if (typeof id !== 'string' || typeof title !== 'string') {
      throw new Error(`у категории №${index + 1} нужны id и title`);
    }
    return { id, title };
  });
}

// content/scenarios/<id>.yaml — описание сценария для каталога
export function parseScenario(id: string, text: string, categories: Category[]): ScenarioMeta {
  const data: unknown = parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('ожидается описание сценария');
  const fields = data as Record<string, unknown>;

  const category = categories.find((item) => item.id === fields.category);
  if (!category) throw new Error(`неизвестная категория «${String(fields.category)}»`);
  const carClass = CAR_CLASSES.find((item) => item === fields.carClass);
  if (!carClass) throw new Error(`класс «${String(fields.carClass)}» не из списка: ${CAR_CLASSES.join(', ')}`);

  return {
    id,
    title: requireString(fields, 'title'),
    summary: requireString(fields, 'summary'),
    category,
    carClass,
    durationMin: requireNumber(fields, 'durationMin'),
    order: requireNumber(fields, 'order'),
    isNew: fields.new === true,
  };
}

// Каталог по порядку. Файл с ошибкой не попадает в список, а его ошибка — в errors:
// опечатка в одном сценарии не должна прятать остальные
export function buildCatalog(categoriesText: string, files: CatalogFile[]): { items: ScenarioMeta[]; errors: string[] } {
  const categories = parseCategories(categoriesText);
  const items: ScenarioMeta[] = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      items.push(parseScenario(file.id, file.text, categories));
    } catch (error) {
      errors.push(`${file.id}.yaml: ${(error as Error).message}`);
    }
  }
  items.sort((a, b) => a.order - b.order);
  return { items, errors };
}
