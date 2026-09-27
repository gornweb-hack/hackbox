import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateMeDto } from './dto.js';

const errorsOf = async (body: object) => (await validate(plainToInstance(UpdateMeDto, body))).map((error) => error.property);

describe('UpdateMeDto', () => {
  it('принимает портрет из набора и null — вернуть инициалы', async () => {
    expect(await errorsOf({ avatar: 'doctor' })).toEqual([]);
    expect(await errorsOf({ avatar: null })).toEqual([]);
  });

  it('отклоняет неизвестный портрет', async () => {
    expect(await errorsOf({ avatar: 'https://example.com/me.png' })).toEqual(['avatar']);
  });
});
