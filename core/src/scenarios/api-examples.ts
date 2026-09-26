// Примеры ответов для Swagger (common/swagger.ts) — сокращённые ответы на демо-данных

export const CATALOG_EXAMPLE = {
  items: [
    {
      id: 'sick-passenger',
      title: 'Пассажиру плохо на 400 км/ч',
      summary: 'Пассажиру в салоне стало плохо на полном ходу, до ближайшей станции ещё далеко.',
      category: { id: 'medical', title: 'Медицина и безопасность' },
      carClass: 'Комфорт',
      durationMin: 4,
      order: 3,
      isNew: false,
      hasTimers: true,
      completed: true,
    },
  ],
  total: 1,
};

// Прохождение в процессе: текущий узел, варианты и таймер
export const ACTIVE_RUN_EXAMPLE = {
  id: '01a0dedf-f3d9-77da-825c-3bb05e5e20e9',
  scenarioId: 'sick-passenger',
  title: 'Пассажиру плохо на 400 км/ч',
  status: 'active',
  loyalty: 50,
  safety: 50,
  node: {
    id: 'alarm',
    text: 'Вагон 3, класс «Комфорт». Поезд идёт 400 км/ч, до Твери ещё 25 минут. Пассажирка машет вам: её соседу плохо.',
    choices: [
      { id: 'call-chief', text: 'Подойти: «Я рядом, сейчас приглашу начальника поезда» — и вызвать начальника по рации' },
      { id: 'own-pills', text: 'Предложить пассажиру свою таблетку от давления' },
    ],
    timer: { seconds: 15, remainingMs: 14200 },
  },
};

// Завершённое прохождение: исход и разбор каждого решения
export const FINISHED_RUN_EXAMPLE = {
  id: '01a0df05-4e17-777a-bfff-bf2fbaf31f18',
  scenarioId: 'minute-stop',
  title: 'Минутная стоянка',
  status: 'finished',
  loyalty: 95,
  safety: 75,
  last: { answer: 'Принести воды, а через десять минут уточнить самочувствие', timedOut: false, loyaltyDelta: 15, safetyDelta: 5 },
  outcome: 'good',
  finalText: 'Пассажирке стало легче, она благодарит за заботу. Поезд ушёл по расписанию, никто не отстал.',
  decisions: [
    {
      prompt: 'Пассажирка подходит к вам: «Мне душно, откройте, пожалуйста, окно!»',
      answer: '«Понимаю, что вам некомфортно. Окна в поезде не открываются, но я передам просьбу бортинженеру»',
      timedOut: false,
      loyaltyDelta: 15,
      safetyDelta: 10,
      review: 'По памятке: признали ситуацию, объяснили правило и предложили решение.',
    },
  ],
};

export const HISTORY_EXAMPLE = {
  items: [
    {
      id: '01a0df05-4e17-777a-bfff-bf2fbaf31f18',
      scenarioId: 'minute-stop',
      title: 'Минутная стоянка',
      outcome: 'good',
      loyalty: 95,
      safety: 75,
      finishedAt: '2026-09-26T18:41:12.861Z',
    },
  ],
  total: 1,
};
