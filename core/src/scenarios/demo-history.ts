import { Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { config } from '../config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { applyChoice, applyTimeout, type Decision, type RunState, startState } from './engine.js';
import { RunsService } from './runs.service.js';
import type { Choice, Outcome, Script } from './script.js';
import { ScenariosService } from './scenarios.service.js';

const DAY_MS = 86_400_000;
// История растянута на три недели: так у репутации есть тренд «за неделю»
const HISTORY_DAYS = 21;
// Сколько в среднем длится одно решение — для правдоподобной длительности прохождения
const DECISION_MS = 40_000;

export interface SimulatedRun {
  state: RunState;
  outcome: Outcome;
  decisions: Decision[];
}

// Сумма влияния на обе шкалы: у «лучшего» варианта она максимальна
const score = (choice: Choice) => (choice.effects.loyalty ?? 0) + (choice.effects.safety ?? 0);

// Прохождение «за сотрудника» по тем же правилам, что и живое (engine.ts). С вероятностью skill он выбирает
// вариант с лучшим влиянием на шкалы, иначе — случайный; на узлах с таймером слабый чаще не успевает
export function simulateRun(script: Script, random: () => number, skill: number): SimulatedRun {
  let state = startState(script);
  const decisions: Decision[] = [];
  // Защита от зацикленного графа: живой сценарий укладывается в несколько решений
  for (let step = 0; step < 50; step += 1) {
    const node = script.nodes[state.nodeId];
    if (node.final) return { state, outcome: node.final, decisions };

    let result;
    if (node.timeout && random() < (1 - skill) * 0.3) {
      result = applyTimeout(script, state);
    } else {
      const best = node.choices.reduce((top, choice) => (score(choice) > score(top) ? choice : top));
      const choice = random() < skill ? best : node.choices[Math.floor(random() * node.choices.length)];
      result = applyChoice(script, state, choice.id);
    }
    decisions.push(result.decision);
    state = result.state;
  }
  throw new Error('сценарий не дошёл до финала за 50 решений');
}

// Демо-история для синтетического штата: прохождения настоящих сценариев с датами за последние три недели.
// Каждое прохождение публикует scenario.completed, поэтому геймификация получает данные штатным путём
@Injectable()
export class DemoHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly scenarios: ScenariosService,
    private readonly runs: RunsService,
  ) {}

  // Повтор безопасен: сотрудников, у которых уже есть прохождения, пропускаем
  async generate(): Promise<{ users: number; runs: number }> {
    if (!config.auth.seedDemoUsers) {
      throw new ApiError(404, 'DEMO_DISABLED', 'Демо-данные выключены: SEED_DEMO_USERS=false');
    }
    const catalog = await this.scenarios.catalog();
    if (catalog.length === 0) throw new ApiError(409, 'CATALOG_EMPTY', 'В каталоге нет сценариев — проходить нечего');

    let users = 0;
    let runs = 0;
    for (const member of await this.users.listStaff()) {
      const done = await this.prisma.scenarioRun.count({ where: { userId: member.id, finishedAt: { not: null } } });
      if (done > 0) continue;

      // У каждого свой уровень: от него разный опыт и разные места в рейтинге
      const skill = 0.35 + Math.random() * 0.55;
      const count = 3 + Math.floor(Math.random() * 7);
      // Сначала старые прохождения — журнал и уровни растут в естественном порядке
      const finishes = Array.from({ length: count }, () => Date.now() - Math.random() * HISTORY_DAYS * DAY_MS).sort((a, b) => a - b);

      for (const finishedTime of finishes) {
        const scenario = catalog[Math.floor(Math.random() * catalog.length)];
        const simulated = simulateRun(scenario.script, Math.random, skill);
        const startedAt = new Date(finishedTime - simulated.decisions.length * DECISION_MS);
        const finishedAt = new Date(finishedTime);
        const run = await this.prisma.scenarioRun.create({
          data: {
            userId: member.id,
            scenarioId: scenario.meta.id,
            nodeId: simulated.state.nodeId,
            nodeShownAt: finishedAt,
            loyalty: simulated.state.loyalty,
            safety: simulated.state.safety,
            outcome: simulated.outcome,
            startedAt,
            finishedAt,
            decisions: {
              create: simulated.decisions.map((decision, index) => ({
                ...decision,
                decidedAt: new Date(startedAt.getTime() + (index + 1) * DECISION_MS),
              })),
            },
          },
          include: { decisions: { orderBy: { decidedAt: 'asc' } } },
        });
        await this.runs.publishCompleted(scenario, run);
        runs += 1;
      }
      users += 1;
    }
    return { users, runs };
  }
}
