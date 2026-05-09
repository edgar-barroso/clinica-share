-- Remove a tabela health_checks. Estava no init do projeto como
-- placeholder e nunca foi referenciada por código (`/api/hello` usa
-- `SELECT 1` via $queryRaw em vez do model).
DROP TABLE IF EXISTS "health_checks";
