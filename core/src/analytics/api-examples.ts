// Пример ответа для Swagger (common/swagger.ts) — навыки демо-сотрудника

export const SKILLS_EXAMPLE = {
  skills: [
    { id: 'acknowledge', title: 'Признать ситуацию', value: 100, hits: 10, tests: 10 },
    { id: 'rule', title: 'Обозначить правило', value: 67, hits: 4, tests: 6 },
    { id: 'solution', title: 'Предложить решение', value: 63, hits: 5, tests: 8 },
    { id: 'reassure', title: 'Заверить', value: 100, hits: 7, tests: 7 },
    { id: 'safety', title: 'Безопасность', value: 83, hits: 10, tests: 12 },
    { id: 'composure', title: 'Хладнокровие', value: 86, hits: 6, tests: 7 },
  ],
  runs: 8,
  weakest: 'solution',
  recommendation: { scenarioId: 'minute-stop' },
};
