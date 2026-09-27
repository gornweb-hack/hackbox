import { describe, expect, it } from 'vitest';
import { contentOf, recipientsOf } from './notification.js';

describe('recipientsOf', () => {
  const everyone = ['a', 'b', 'c'];

  it('адресное уведомление — только адресату', () => {
    expect(recipientsOf({ userId: 'b' }, everyone)).toEqual(['b']);
  });

  it('broadcast — всем сотрудникам', () => {
    expect(recipientsOf({ broadcast: true }, everyone)).toEqual(everyone);
  });

  it('без адресата — никому', () => {
    expect(recipientsOf({}, everyone)).toEqual([]);
  });
});

describe('contentOf', () => {
  it('берёт заголовок, текст и уровень из события', () => {
    expect(contentOf({ title: 'Новый уровень', message: 'Проводник', level: 'success' })).toEqual({
      title: 'Новый уровень',
      message: 'Проводник',
      level: 'success',
    });
  });

  it('пустой заголовок и неизвестный уровень заменяет значениями по умолчанию', () => {
    expect(contentOf({ title: ' ', level: 'panic' })).toEqual({ title: 'Уведомление', message: '', level: 'info' });
    expect(contentOf(null)).toEqual({ title: 'Уведомление', message: '', level: 'info' });
  });
});
