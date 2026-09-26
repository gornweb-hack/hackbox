#!/usr/bin/env bash
# Создаёт роль ядра и отдаёт ей базу. Запускается сервисом db-init при каждом
# `docker compose up`: повторный запуск безопасен, пароль синхронизируется с docker-compose.yml.
set -euo pipefail

export PGHOST="${PGHOST:-postgres}" PGUSER="$POSTGRES_USER" PGPASSWORD="$POSTGRES_PASSWORD" PGDATABASE="$POSTGRES_DB"
export PGOPTIONS="-c client_min_messages=warning"

# Переменные psql (:'x' — строка, :"x" — имя) подставляются только во входе из stdin,
# поэтому SQL передаём через heredoc, а не через psql -c.
sql() {
  psql -X -q -v ON_ERROR_STOP=1 "$@"
}

# Создаёт роль, если её нет, и выставляет пароль (так применяется и смена пароля).
ensure_role() {
  sql -v role="$1" -v pw="$2" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN', :'role')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'role') \gexec
ALTER ROLE :"role" WITH LOGIN PASSWORD :'pw';
SQL
}

# Ядро работает в схеме public и владеет базой: `prisma migrate reset` пересоздаёт схему,
# а без владения это падает. CREATEDB нужен для shadow-базы `prisma migrate dev`.
ensure_role core_svc "$CORE_DB_PASSWORD"
sql -v db="$POSTGRES_DB" <<'SQL'
ALTER ROLE core_svc CREATEDB;
ALTER DATABASE :"db" OWNER TO core_svc;
SQL
echo "db-init: ядро — роль core_svc, схема public"

echo "db-init: готово"
