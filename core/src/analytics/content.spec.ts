import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../scenarios/catalog.js';
import { parseSkills } from './skills.js';

// Страховка для правок контента: метки навыков в сценариях должны быть из content/skills.yaml
const contentDir = join(process.cwd(), '..', 'content');

describe('content/skills.yaml', () => {
  it('метки у вариантов — из списка навыков, и не «таймерные»', async () => {
    const { skills } = parseSkills(await readFile(join(contentDir, 'skills.yaml'), 'utf8'));
    const taggable = new Set(skills.filter((skill) => !skill.timers).map((skill) => skill.id));

    const dir = join(contentDir, 'scenarios');
    const names = (await readdir(dir)).filter((name) => name.endsWith('.yaml'));
    const files = await Promise.all(
      names.map(async (name) => ({ id: name.slice(0, -'.yaml'.length), text: await readFile(join(dir, name), 'utf8') })),
    );
    const { items } = buildCatalog(await readFile(join(contentDir, 'categories.yaml'), 'utf8'), files);

    const unknown = items.flatMap(({ meta, script }) =>
      Object.entries(script.nodes).flatMap(([nodeId, node]) =>
        node.choices.flatMap((choice) =>
          choice.skills.filter((skill) => !taggable.has(skill)).map((skill) => `${meta.id}/${nodeId}/${choice.id}: ${skill}`),
        ),
      ),
    );
    expect(unknown).toEqual([]);
  });
});
