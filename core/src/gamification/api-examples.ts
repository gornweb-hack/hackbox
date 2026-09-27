// Примеры ответов для Swagger (common/swagger.ts) — сокращённые ответы на демо-данных

export const PROGRESS_EXAMPLE = {
  xp: 750,
  lastRunXp: 150,
  level: { speed: 120, title: 'Проводник', xp: 300 },
  next: { speed: 200, title: 'Старший проводник', xp: 800 },
  progress: 0.9,
  levels: [
    { speed: 60, title: 'Стажёр', xp: 0 },
    { speed: 120, title: 'Проводник', xp: 300 },
  ],
  reputation: { loyalty: { value: 92, weekDelta: 3 }, safety: { value: 85, weekDelta: null }, runs: 5 },
  achievements: {
    earned: 5,
    total: 8,
    latest: { id: 'cold-head', title: 'Холодная голова', description: 'Сценарий с таймерами без единого таймаута', isNew: true },
    next: { id: 'all-rounder', title: 'Универсал', description: 'Пройдите сценарии всех четырёх категорий', share: 0.5, text: '2 из 4 категорий' },
  },
};

export const RATING_EXAMPLE = {
  scope: 'crew',
  title: 'Бригада 3',
  month: '2026-09',
  items: [
    { place: 1, userId: '01a0de5c-0d5b-716d-8c06-f5f8e7a3c640', name: 'Наталья Громова', xp: 750, isMe: false },
    { place: 2, userId: '01a0dd90-2f7e-7c3a-9b1e-4d2a6f8c0b11', name: 'Демо-сотрудник', xp: 600, isMe: true },
  ],
  total: 2,
  me: { place: 2, xp: 600, gap: { place: 1, xp: 150 } },
};
