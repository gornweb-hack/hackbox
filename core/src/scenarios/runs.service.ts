import { Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error.js';
import { EventsService } from '../events/events.service.js';
import type { ScenarioDecision, ScenarioRun } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Scenario } from './catalog.js';
import { applyChoice, applyTimeout, currentNode, resolveAction, startState, timerState } from './engine.js';
import { ScenariosService } from './scenarios.service.js';

type RunWithDecisions = ScenarioRun & { decisions: ScenarioDecision[] };

// Прохождение для фронта: текущий узел и шкалы, последнее решение, после финала — разбор
export interface RunView {
  id: string;
  scenarioId: string;
  title: string;
  status: 'active' | 'finished';
  loyalty: number;
  safety: number;
  node?: {
    id: string;
    text: string;
    choices: { id: string; text: string }[];
    timer?: { seconds: number; remainingMs: number };
  };
  last?: { answer: string; timedOut: boolean; loyaltyDelta: number; safetyDelta: number };
  outcome?: string;
  finalText?: string;
  decisions?: { prompt: string; answer: string; timedOut: boolean; loyaltyDelta: number; safetyDelta: number; review: string }[];
}

const withDecisions = { decisions: { orderBy: { decidedAt: 'asc' } } } as const;

@Injectable()
export class RunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly scenarios: ScenariosService,
  ) {}

  async start(userId: string, scenarioId: string): Promise<RunView> {
    const scenario = await this.scenarios.find(scenarioId);
    const state = startState(scenario.script);
    const run = await this.prisma.scenarioRun.create({
      data: { userId, scenarioId, ...state, nodeShownAt: new Date() },
      include: withDecisions,
    });
    return this.view(scenario, run);
  }

  async get(userId: string, runId: string): Promise<RunView> {
    const run = await this.load(userId, runId);
    return this.view(await this.scenarios.find(run.scenarioId), run);
  }

  // Решение в текущем узле: выбор варианта или, без choiceId, «время вышло»
  async choose(userId: string, runId: string, choiceId: string | undefined): Promise<RunView> {
    const run = await this.load(userId, runId);
    if (run.finishedAt) throw new ApiError(409, 'RUN_FINISHED', 'Прохождение уже завершено');
    const scenario = await this.scenarios.find(run.scenarioId);
    const state = { nodeId: run.nodeId, loyalty: run.loyalty, safety: run.safety };
    const node = currentNode(scenario.script, state);

    const now = new Date();
    const action = resolveAction(node, run.nodeShownAt.getTime(), now.getTime(), choiceId);
    const step = action === null ? applyTimeout(scenario.script, state) : applyChoice(scenario.script, state, action);
    const outcome = scenario.script.nodes[step.state.nodeId].final ?? null;

    await this.prisma.$transaction(async (tx) => {
      // Условие по времени показа узла: при двойном клике второй запрос ничего не обновит
      const { count } = await tx.scenarioRun.updateMany({
        where: { id: run.id, nodeShownAt: run.nodeShownAt, finishedAt: null },
        data: { ...step.state, nodeShownAt: now, outcome, finishedAt: outcome ? now : null },
      });
      if (count === 0) throw new ApiError(409, 'RUN_CONFLICT', 'Решение уже принято — обновите страницу');
      await tx.scenarioDecision.create({ data: { runId: run.id, ...step.decision, decidedAt: now } });
    });

    const updated = await this.load(userId, runId);
    if (outcome) await this.publishCompleted(scenario, updated);
    return this.view(scenario, updated);
  }

  // Сценарии, которые пользователь хоть раз прошёл до финала
  async completedIds(userId: string): Promise<Set<string>> {
    const runs = await this.prisma.scenarioRun.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { scenarioId: true },
      distinct: ['scenarioId'],
    });
    return new Set(runs.map((run) => run.scenarioId));
  }

  // Чужое прохождение отвечает так же, как несуществующее: не выдаём, что оно есть
  private async load(userId: string, runId: string): Promise<RunWithDecisions> {
    const run = await this.prisma.scenarioRun.findUnique({ where: { id: runId }, include: withDecisions });
    if (!run || run.userId !== userId) throw new ApiError(404, 'RUN_NOT_FOUND', 'Прохождение не найдено');
    return run;
  }

  // Публикуется после коммита в базу (docs/events.md). Прочитают геймификация и аналитика, браузер получит по SSE
  private async publishCompleted(scenario: Scenario, run: RunWithDecisions): Promise<void> {
    const finishedAt = run.finishedAt ?? new Date();
    await this.events.publish(
      'scenario.completed',
      {
        runId: run.id,
        scenarioId: run.scenarioId,
        category: scenario.meta.category.id,
        outcome: run.outcome,
        loyalty: run.loyalty,
        safety: run.safety,
        timeouts: run.decisions.filter((decision) => decision.choiceId === null).length,
        durationSec: Math.round((finishedAt.getTime() - run.startedAt.getTime()) / 1000),
        finishedAt: finishedAt.toISOString(),
        decisions: run.decisions.map((decision) => ({
          nodeId: decision.nodeId,
          choiceId: decision.choiceId,
          timedOut: decision.choiceId === null,
          loyaltyDelta: decision.loyaltyDelta,
          safetyDelta: decision.safetyDelta,
        })),
      },
      { userId: run.userId },
    );
  }

  private view(scenario: Scenario, run: RunWithDecisions): RunView {
    const view: RunView = {
      id: run.id,
      scenarioId: run.scenarioId,
      title: scenario.meta.title,
      status: run.finishedAt ? 'finished' : 'active',
      loyalty: run.loyalty,
      safety: run.safety,
    };
    const last = run.decisions.at(-1);
    if (last) {
      view.last = { answer: last.answer, timedOut: last.choiceId === null, loyaltyDelta: last.loyaltyDelta, safetyDelta: last.safetyDelta };
    }

    if (!run.finishedAt) {
      const node = currentNode(scenario.script, run);
      view.node = {
        id: run.nodeId,
        text: node.text,
        choices: node.choices.map(({ id, text }) => ({ id, text })),
        timer: timerState(node, run.nodeShownAt.getTime(), Date.now()),
      };
      return view;
    }

    // Разбор — только после финала, чтобы не подсказывать во время прохождения
    view.outcome = run.outcome ?? undefined;
    view.finalText = scenario.script.nodes[run.nodeId]?.text;
    view.decisions = run.decisions.map((decision) => ({
      prompt: decision.prompt,
      answer: decision.answer,
      timedOut: decision.choiceId === null,
      loyaltyDelta: decision.loyaltyDelta,
      safetyDelta: decision.safetyDelta,
      review: decision.review,
    }));
    return view;
  }
}
