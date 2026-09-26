// Статичные данные экранов тренажёра, пока у модулей gamification, analytics и scenarios нет API.
// Компоненты получают их пропсами: когда появятся эндпоинты, этот файл заменяется запросами, вёрстка не меняется

export interface ProfileSummary {
  /** Название текущего уровня (gamification) */
  title: string;
  /** Бригада и депо */
  crew: string;
  /** Непрочитанные уведомления */
  unread: number;
}

export const DEMO_PROFILE: ProfileSummary = {
  title: "Старший проводник",
  crew: "Бригада 3 · Депо Москва-ВСМ",
  unread: 1,
};
