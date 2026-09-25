// Признаки того, что база недоступна, а не что запрос неверный: коды сетевых ошибок,
// «admin shutdown» Postgres (57P01) и «не достучаться до сервера» Prisma (P1001)
const DB_DOWN_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', '57P01', 'P1001']);

// Смотрим ошибку и цепочку её причин (Prisma оборачивает ошибку драйвера pg)
export function isDatabaseDown(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current instanceof Error; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && DB_DOWN_CODES.has(code)) return true;
    if (/connection terminated|connection timeout/i.test(current.message)) return true;
    current = current.cause;
  }
  return false;
}
