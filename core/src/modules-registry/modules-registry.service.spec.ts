import { lookup } from 'node:dns/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config.js';
import { ModulesRegistry } from './modules-registry.service.js';

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

describe('ModulesRegistry', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let registry: ModulesRegistry;

  const healthy = () => fetchMock.mockResolvedValueOnce(new Response('{"status":"ok"}', { status: 200 }));
  const failing = () => fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

  beforeEach(() => {
    config.modules = ['demo'];
    vi.mocked(lookup).mockReset().mockResolvedValue({ address: '127.0.0.1', family: 4 } as never);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    registry = new ModulesRegistry();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('до первой проверки модуль считается лежащим', () => {
    expect(registry.get('demo')?.status).toBe('down');
  });

  it('одного успешного ответа достаточно, чтобы модуль стал up', async () => {
    healthy();
    await registry.checkAll();
    expect(registry.get('demo')?.status).toBe('up');
    expect(fetchMock).toHaveBeenCalledWith('http://demo:8080/health', expect.anything());
  });

  it('одна неудача не роняет модуль, две подряд — роняют', async () => {
    healthy();
    await registry.checkAll();
    failing();
    await registry.checkAll();
    expect(registry.get('demo')?.status).toBe('up');
    failing();
    await registry.checkAll();
    expect(registry.get('demo')?.status).toBe('down');
  });

  it('ответ 503 тоже считается неудачей', async () => {
    healthy();
    await registry.checkAll();
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));
    await registry.checkAll();
    await registry.checkAll();
    expect(registry.get('demo')?.status).toBe('down');
  });

  it('несуществующее имя в DNS — неудача без HTTP-запроса', async () => {
    vi.mocked(lookup).mockRejectedValue(Object.assign(new Error('not found'), { code: 'ENOTFOUND' }));
    await registry.checkAll();
    await registry.checkAll();
    expect(registry.get('demo')?.status).toBe('down');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('пока проверка идёт, новая не запускается (медленный DNS не копится)', async () => {
    let finishLookup!: () => void;
    vi.mocked(lookup).mockReturnValueOnce(
      new Promise((resolve) => (finishLookup = () => resolve({ address: '127.0.0.1', family: 4 } as never))),
    );
    healthy();
    const first = registry.checkAll();
    await registry.checkAll();
    await registry.checkAll();
    expect(lookup).toHaveBeenCalledTimes(1);
    finishLookup();
    await first;
    expect(registry.get('demo')?.status).toBe('up');
  });

  it('markDown роняет модуль сразу', async () => {
    healthy();
    await registry.checkAll();
    registry.markDown('demo');
    expect(registry.get('demo')?.status).toBe('down');
  });
});
