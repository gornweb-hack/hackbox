import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCatalog } from './catalog.js';

// Страховка для правок контента: тесты запускаются из core/, контент лежит рядом, в ../content
const contentDir = join(process.cwd(), '..', 'content');

describe('content/', () => {
  it('все сценарии проходят проверку формата', async () => {
    const dir = join(contentDir, 'scenarios');
    const names = (await readdir(dir)).filter((name) => name.endsWith('.yaml'));
    const files = await Promise.all(
      names.map(async (name) => ({ id: name.slice(0, -'.yaml'.length), text: await readFile(join(dir, name), 'utf8') })),
    );

    const { items, errors } = buildCatalog(await readFile(join(contentDir, 'categories.yaml'), 'utf8'), files);
    expect(errors).toEqual([]);
    expect(items).toHaveLength(names.length);
  });
});
