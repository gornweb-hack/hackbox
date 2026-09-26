import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApiError } from '../common/api-error.js';
import { config } from '../config.js';
import type { EventEnvelope } from '../events/envelope.js';
import { EventsConsumer } from '../events/events.consumer.js';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type AchievementProgress, achievementsOfRun, earned, progressOf } from './achievements.js';
import { type LevelState, levelFor, type Reputation, reputation, xpOf } from './progress.js';
import { type Level, parseRules, type Rules } from './rules.js';

// Что геймификации нужно из scenario.completed (docs/events.md)
interface ScenarioCompleted {
  runId: string;
  scenarioId: string;
  category?: string;
  outcome: string;
  loyalty: number;
  safety: number;
  timeouts?: number;
  timedDecisions?: number;
  finishedAt: string;
}

interface AchievementCard {
  id: string;
  title: string;
  description: string;
}

// Ачивки на главной: сколько получено, последняя и следующая с прогрессом
export interface AchievementsSummary {
  earned: number;
  total: number;
  // isNew — получена последним прохождением
  latest: (AchievementCard & { isNew: boolean }) | null;
  next: (AchievementCard & AchievementProgress) | null;
}

// Прогресс сотрудника для главной и шапки
export interface Progress extends LevelState {
  xp: number;
  // Сколько опыта дало последнее прохождение
  lastRunXp: number | null;
  levels: Level[];
  reputation: Reputation | null;
  achievements: AchievementsSummary;
}

// Награда за одно прохождение — для разбора
export interface Reward {
  xp: number;
  achievements: AchievementCard[];
}

const card = ({ id, title, description }: AchievementCard): AchievementCard => ({ id, title, description });

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
          category: run.category ?? '',
          outcome: run.outcome,
          loyalty: run.loyalty,
          safety: run.safety,
          timeouts: run.timeouts ?? 0,
          timedDecisions: run.timedDecisions ?? 0,
          finishedAt: new Date(run.finishedAt),
        },
      ],
      skipDuplicates: true,
    });
    if (count === 0) return;
    await this.events.publish('progress.updated', { runId: run.runId }, { userId });

    // Правила нужны только для тостов: сломанный файл не должен терять прохождение
    let rules: Rules;
    try {
      rules = await this.rules();
    } catch (error) {
      this.logger.warn(`тосты о новом уровне и ачивках пропущены: ${(error as Error).message}`);
      return;
    }

    const before = earlier.reduce((sum, item) => sum + xpOf(item, rules), 0);
    const was = levelFor(before, rules.levels).level;
    const now = levelFor(before + xpOf(run, rules), rules.levels).level;
    if (now.speed > was.speed) {
      await this.notify(userId, `Новый уровень: ${now.speed} км/ч`, now.title);
    }

    const journal = await this.journal(userId);
    const shelf = earned(journal, rules.achievements).length;
    for (const achievement of achievementsOfRun(run.runId, journal, rules.achievements)) {
      await this.notify(userId, `Ачивка: ${achievement.title}`, `${shelf} из ${rules.achievements.length} на полке`);
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
      achievements: this.summary(runs, rules),
    };
  }

  // Опыт и ачивки именно за это прохождение. Пока событие не обработано, награды ещё нет
  async reward(userId: string, runId: string): Promise<Reward> {
    const rules = await this.rules();
    const runs = await this.journal(userId);
    const run = runs.find((item) => item.runId === runId);
    if (!run) throw new ApiError(404, 'REWARD_PENDING', 'Награда за прохождение ещё не начислена');
    return { xp: xpOf(run, rules), achievements: achievementsOfRun(runId, runs, rules.achievements).map(card) };
  }

  private summary(runs: Awaited<ReturnType<GamificationService['journal']>>, rules: Rules): AchievementsSummary {
    const got = earned(runs, rules.achievements);
    const latest = got.reduce<(typeof got)[number] | null>(
      (top, item) => (!top || item.run.finishedAt > top.run.finishedAt ? item : top),
      null,
    );
    // Следующая — та, до которой ближе всего; без прогресса («категория на отлично») — в конце
    const earnedIds = new Set(got.map((item) => item.achievement.id));
    const next = rules.achievements
      .filter((achievement) => !earnedIds.has(achievement.id))
      .map((achievement) => ({ ...card(achievement), ...progressOf(achievement, runs) }))
      .reduce<(AchievementCard & AchievementProgress) | null>(
        (top, item) => (!top || (item.share ?? -1) > (top.share ?? -1) ? item : top),
        null,
      );
    return {
      earned: got.length,
      total: rules.achievements.length,
      latest: latest && { ...card(latest.achievement), isNew: latest.run.runId === runs[0]?.runId },
      next,
    };
  }

  private notify(userId: string, title: string, message: string): Promise<void> {
    return this.events.publish('notification.requested', { title, message, level: 'success' }, { userId });
  }

  // Прохождения сотрудника, последние — первыми
  private journal(userId: string) {
    return this.prisma.gamificationRun.findMany({ where: { userId }, orderBy: { finishedAt: 'desc' } });
  }
}
