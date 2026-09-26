import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApiError } from '../common/api-error.js';
import { config } from '../config.js';
import type { EventEnvelope } from '../events/envelope.js';
import { EventsConsumer } from '../events/events.consumer.js';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type LevelState, levelFor, type Reputation, reputation, xpOf } from './progress.js';
import { type Level, parseRules, type Rules } from './rules.js';

// Что геймификации нужно из scenario.completed (docs/events.md)
interface ScenarioCompleted {
  runId: string;
  scenarioId: string;
  outcome: string;
  loyalty: number;
  safety: number;
  finishedAt: string;
}

// Прогресс сотрудника для главной и шапки
export interface Progress extends LevelState {
  xp: number;
  // Сколько опыта дало последнее прохождение
  lastRunXp: number | null;
  levels: Level[];
  reputation: Reputation | null;
}

@Injectable()
export class GamificationService implements OnModuleInit {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly consumer: EventsConsumer,
  ) {}

  onModuleInit(): void {
    this.consumer.on('scenario.completed', (event) => this.record(event));
  }

  // Правила читаются при каждом запросе: правка content/gamification.yaml видна сразу, без перезапуска
  async rules(): Promise<Rules> {
    try {
      return parseRules(await readFile(join(config.contentDir, 'gamification.yaml'), 'utf8'));
    } catch (error) {
      throw new ApiError(500, 'CONTENT_INVALID', `Правила геймификации не читаются: ${(error as Error).message}`);
    }
  }

  // Обработчик scenario.completed: прохождение попадает в журнал, повтор события отсекается уникальным runId.
  // Сначала запись, потом события — так они не сообщат о том, чего в базе нет
  async record(event: EventEnvelope): Promise<void> {
    const userId = event.userId;
    if (!userId) return;
    const run = event.data as ScenarioCompleted;
    const earlier = await this.journal(userId);

    const { count } = await this.prisma.gamificationRun.createMany({
      data: [
        {
          runId: run.runId,
          userId,
          scenarioId: run.scenarioId,
          outcome: run.outcome,
          loyalty: run.loyalty,
          safety: run.safety,
          finishedAt: new Date(run.finishedAt),
        },
      ],
      skipDuplicates: true,
    });
    if (count === 0) return;
    await this.events.publish('progress.updated', { runId: run.runId }, { userId });

    // Правила нужны только для тоста о новом уровне: сломанный файл не должен терять прохождение
    let rules: Rules;
    try {
      rules = await this.rules();
    } catch (error) {
      this.logger.warn(`тост о новом уровне пропущен: ${(error as Error).message}`);
      return;
    }
    const before = earlier.reduce((sum, item) => sum + xpOf(item, rules), 0);
    const was = levelFor(before, rules.levels).level;
    const now = levelFor(before + xpOf(run, rules), rules.levels).level;
    if (now.speed > was.speed) {
      await this.events.publish(
        'notification.requested',
        { title: `Новый уровень: ${now.speed} км/ч`, message: now.title, level: 'success' },
        { userId },
      );
    }
  }

  async progress(userId: string): Promise<Progress> {
    const rules = await this.rules();
    const runs = await this.journal(userId);
    const xp = runs.reduce((sum, run) => sum + xpOf(run, rules), 0);
    return {
      xp,
      lastRunXp: runs[0] ? xpOf(runs[0], rules) : null,
      ...levelFor(xp, rules.levels),
      levels: rules.levels,
      reputation: reputation(runs, rules.reputation.window, new Date()),
    };
  }

  // Прохождения сотрудника, последние — первыми
  private journal(userId: string) {
    return this.prisma.gamificationRun.findMany({ where: { userId }, orderBy: { finishedAt: 'desc' } });
  }
}
