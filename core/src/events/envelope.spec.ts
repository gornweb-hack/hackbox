import { describe, expect, it } from 'vitest';
import { createEnvelope, fromStreamFields, isFor, toStreamFields } from './envelope.js';

describe('envelope', () => {
  it('конверт переживает запись в стрим и чтение обратно', () => {
    const envelope = createEnvelope('points.awarded', { points: 50 }, 'points', { userId: 'u1', requestId: 'r1' });
    expect(fromStreamFields(toStreamFields(envelope))).toEqual(envelope);
    expect(envelope.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(envelope.time).toMatch(/Z$/);
  });

  it('пустые опции не попадают в конверт', () => {
    expect(Object.keys(createEnvelope('x.done', {}, 'core'))).toEqual(['id', 'type', 'source', 'time', 'data']);
  });

  it('битая запись — исключение', () => {
    expect(() => fromStreamFields(null)).toThrow();
    expect(() => fromStreamFields(['type', 'x'])).toThrow();
    expect(() => fromStreamFields(['event', '{"data":1}'])).toThrow();
    expect(() => fromStreamFields(['event', 'not json'])).toThrow();
  });

  it('событие видит только адресат, broadcast — все', () => {
    const personal = createEnvelope('a.b', {}, 'm', { userId: 'u1' });
    const everyone = createEnvelope('a.b', {}, 'm', { broadcast: true });
    const nobody = createEnvelope('a.b', {}, 'm');
    expect(isFor(personal, 'u1')).toBe(true);
    expect(isFor(personal, 'u2')).toBe(false);
    expect(isFor(everyone, 'u2')).toBe(true);
    expect(isFor(nobody, 'u1')).toBe(false);
  });
});
