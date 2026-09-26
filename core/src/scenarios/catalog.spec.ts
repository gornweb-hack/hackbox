import { describe, expect, it } from 'vitest';
import { buildCatalog, parseCategories, parseScenario } from './catalog.js';

const categories = parseCategories(`
- id: medical
  title: Медицина и безопасность
- id: service
  title: Сервис
`);

const scenario = (fields: string) => `
title: Пассажиру плохо на 400 км/ч
summary: Пассажиру стало плохо на полном ходу.
category: medical
carClass: Комфорт
durationMin: 4
order: 3
${fields}`;

describe('parseScenario', () => {
  it('правильный файл', () => {
    expect(parseScenario('sick-passenger', scenario('new: true'), categories)).toEqual({
      id: 'sick-passenger',
      title: 'Пассажиру плохо на 400 км/ч',
      summary: 'Пассажиру стало плохо на полном ходу.',
      category: { id: 'medical', title: 'Медицина и безопасность' },
      carClass: 'Комфорт',
      durationMin: 4,
      order: 3,
      isNew: true,
    });
  });

  it('без new сценарий не новый', () => {
    expect(parseScenario('sick-passenger', scenario(''), categories).isNew).toBe(false);
  });

  it('нет title', () => {
    const text = scenario('').replace(/^title:.*$/m, '');
    expect(() => parseScenario('sick-passenger', text, categories)).toThrow('нет поля title');
  });

  it('неизвестная категория', () => {
    const text = scenario('').replace('category: medical', 'category: fire');
    expect(() => parseScenario('sick-passenger', text, categories)).toThrow('неизвестная категория «fire»');
  });

  it('класса «Эконом» на ВСМ нет', () => {
    const text = scenario('').replace('carClass: Комфорт', 'carClass: Эконом');
    expect(() => parseScenario('sick-passenger', text, categories)).toThrow('класс «Эконом» не из списка');
  });

  it('длительность должна быть числом', () => {
    const text = scenario('').replace('durationMin: 4', 'durationMin: четыре');
    expect(() => parseScenario('sick-passenger', text, categories)).toThrow('durationMin должно быть числом');
  });
});

describe('buildCatalog', () => {
  const categoriesText = '- {id: medical, title: Медицина и безопасность}';

  it('сортирует по order и пропускает файлы с ошибкой', () => {
    const { items, errors } = buildCatalog(categoriesText, [
      { id: 'late', text: scenario('').replace('order: 3', 'order: 9') },
      { id: 'broken', text: scenario('').replace('carClass: Комфорт', 'carClass: Эконом') },
      { id: 'early', text: scenario('').replace('order: 3', 'order: 1') },
    ]);
    expect(items.map((item) => item.id)).toEqual(['early', 'late']);
    expect(errors).toEqual(['broken.yaml: класс «Эконом» не из списка: Стандарт, Комфорт, Бизнес, Первый']);
  });

  it('сломанный справочник категорий — ошибка всего каталога', () => {
    expect(() => buildCatalog('id: medical', [])).toThrow('ожидается список категорий');
  });
});
