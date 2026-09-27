import { Injectable } from '@nestjs/common';
import { readContent } from '../common/content.js';
import { RunsService } from '../scenarios/runs.service.js';
import { ScenariosService } from '../scenarios/scenarios.service.js';
import { parseSkills, recommend, type SkillScore, type SkillsConfig, skillScores, weakest } from './skills.js';

// Навыки сотрудника для радара и рекомендация, что потренировать
export interface SkillsSummary {
  skills: SkillScore[];
  // По скольким последним прохождениям посчитано
  runs: number;
  // id слабого навыка; null — навыки ещё не проверялись или все проверенные на 100%
  weakest: string | null;
  // Сценарий, где слабый навык проверяется чаще всего
  recommendation: { scenarioId: string } | null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly scenarios: ScenariosService,
    private readonly runs: RunsService,
  ) {}

  config(): Promise<SkillsConfig> {
    return readContent('skills.yaml', 'Навыки', parseSkills);
  }

  // Своей таблицы у аналитики нет: решения берутся у модуля сценариев, метки — из текущего YAML
  async skills(userId: string): Promise<SkillsSummary> {
    const [settings, catalog] = await Promise.all([this.config(), this.scenarios.catalog()]);
    const runs = await this.runs.recentFinished(userId, settings.window);
    const scores = skillScores(runs, new Map(catalog.map(({ meta, script }) => [meta.id, script])), settings.skills);

    const weak = weakest(scores);
    const skill = settings.skills.find((item) => item.id === weak?.id);
    // Прохождения идут от новых к старым: первое по сценарию — последнее по времени
    const lastPlayed = new Map<string, Date>();
    for (const run of runs) {
      if (run.finishedAt && !lastPlayed.has(run.scenarioId)) lastPlayed.set(run.scenarioId, run.finishedAt);
    }
    const scenarioId = skill
      ? recommend(skill, catalog.map(({ meta, script }) => ({ id: meta.id, script })), lastPlayed)
      : null;

    return { skills: scores, runs: runs.length, weakest: weak?.id ?? null, recommendation: scenarioId ? { scenarioId } : null };
  }
}
