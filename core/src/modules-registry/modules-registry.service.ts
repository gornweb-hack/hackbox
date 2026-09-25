import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { Subject } from 'rxjs';
import { config, moduleUrl } from '../config.js';

export type ModuleStatus = 'up' | 'down';

export interface ModuleState {
  name: string;
  url: string;
  status: ModuleStatus;
  failures: number;
  checkedAt: string | null;
  checking: boolean;
}

// Сколько неудачных проверок подряд, прежде чем считать модуль лежащим
const FAILURES_TO_DOWN = 2;

// Реестр модулей: опрашивает /health каждого модуля и помнит, кто жив
@Injectable()
export class ModulesRegistry implements OnModuleInit, OnModuleDestroy {
  // Смена статуса модуля — уходит в SSE, фронт сразу скрывает или показывает блок
  readonly changes = new Subject<{ name: string; status: ModuleStatus }>();

  private readonly logger = new Logger(ModulesRegistry.name);
  private readonly states = new Map<string, ModuleState>();
  private timer?: NodeJS.Timeout;

  constructor() {
    for (const name of config.modules) {
      this.states.set(name, {
        name,
        url: moduleUrl(name),
        status: 'down',
        failures: 0,
        checkedAt: null,
        checking: false,
      });
    }
  }

  onModuleInit(): void {
    void this.checkAll();
    this.timer = setInterval(() => void this.checkAll(), config.healthIntervalMs);
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  get(name: string): ModuleState | undefined {
    return this.states.get(name);
  }

  list(): Pick<ModuleState, 'name' | 'status' | 'checkedAt'>[] {
    return [...this.states.values()].map(({ name, status, checkedAt }) => ({ name, status, checkedAt }));
  }

  // Прокси не смог подключиться — модуль точно недоступен, не ждём следующей проверки
  markDown(name: string): void {
    const state = this.states.get(name);
    if (state) this.setStatus(state, 'down');
  }

  async checkAll(): Promise<void> {
    await Promise.all([...this.states.values()].map((state) => this.check(state)));
  }

  private async check(state: ModuleState): Promise<void> {
    // Предыдущая проверка ещё идёт: не запускаем новую, иначе зависшие DNS-запросы копятся
    if (state.checking) return;
    state.checking = true;
    let ok: boolean;
    try {
      ok = await probe(state.url);
    } finally {
      state.checking = false;
    }

    state.checkedAt = new Date().toISOString();
    if (ok) {
      state.failures = 0;
      this.setStatus(state, 'up');
    } else {
      state.failures += 1;
      if (state.failures >= FAILURES_TO_DOWN) this.setStatus(state, 'down');
    }
  }

  private setStatus(state: ModuleState, status: ModuleStatus): void {
    if (state.status === status) return;
    this.logger.log(`модуль ${state.name}: ${state.status} → ${status}`);
    state.status = status;
    this.changes.next({ name: state.name, status });
  }
}

// Имя незапущенного сервиса Docker DNS ищет ~4 с, и таймаут fetch этот поиск не прерывает.
// Поэтому сначала ждём DNS отдельно (не дольше одного поиска на модуль), потом делаем запрос
async function probe(url: string): Promise<boolean> {
  try {
    await lookup(new URL(url).hostname);
  } catch {
    return false;
  }
  return fetch(`${url}/health`, { signal: AbortSignal.timeout(config.healthTimeoutMs) }).then(
    async (res) => {
      await res.body?.cancel();
      return res.ok;
    },
    () => false,
  );
}
