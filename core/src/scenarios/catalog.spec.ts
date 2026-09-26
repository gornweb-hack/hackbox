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
start: ask
nodes:
  ask:
    text: Пассажиру плохо
    timer: 15
    timeout: {review: Медлили, to: done}
    choices:
      - {id: help, text: Помочь, review: Верно, to: done}
  done: {text: Помогли, final: good}
${fields}`;

describe('parseScenario', () => {
  it('правильный файл: описание для каталога и граф для прохождения', () => {
    const { meta, script } = parseScenario('sick-passenger', scenario('new: true'), categories);
    expect(meta).toEqual({
      id: 'sick-passenger',
      title: 'Пассажиру плохо на 400 км/ч',
      summary: 'Пассажиру стало плохо на полном ходу.',
      category: { id: 'medical', title: 'Медицина и безопасность' },
      carClass: 'Комфорт',
      durationMin: 4,
      order: 3,
      isNew: true,
      hasTimers: true,
    });
    expect(script.start).toBe('ask');
  });

  it('без new сценарий не новый, без timer — без таймеров', () => {
    const text = scenario('').replace(/ {4}timer: 15\n {4}timeout: .*\n/, '');
    const { meta } = parseScenario('sick-passenger', text, categories);
    expect(meta.isNew).toBe(false);
    expect(meta.hasTimers).toBe(false);
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

  it('без диалога сценарий не проходится', () => {
    const text = scenario('').replace('start: ask', '');
    expect(() => parseScenario('sick-passenger', text, categories)).toThrow('нет поля start');
  });

  it('имя файла попадает в адрес страницы', () => {
    expect(() => parseScenario('Sick Passenger', scenario(''), categories)).toThrow('имя файла');
    expect(() => parseScenario('runs', scenario(''), categories)).toThrow('не runs');
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
    expect(items.map((item) => item.meta.id)).toEqual(['early', 'late']);
    expect(errors).toEqual(['broken.yaml: класс «Эконом» не из списка: Стандарт, Комфорт, Бизнес, Первый']);
  });

  it('сломанный справочник категорий — ошибка всего каталога', () => {
    expect(() => buildCatalog('id: medical', [])).toThrow('ожидается список категорий');
  });
});
