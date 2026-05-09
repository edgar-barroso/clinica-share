-- Adiciona valorConsultaBase em Profissional. Coluna é NOT NULL: cria
-- com default 0 só para o ALTER passar, faz backfill por especialidade
-- (mesmos valores do antigo VALOR_POR_ESPECIALIDADE do front), e
-- depois remove o default para evitar inserir 0 acidentalmente em
-- novos registros.
ALTER TABLE "professionals"
  ADD COLUMN IF NOT EXISTS "valorConsultaBase" DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE "professionals"
SET "valorConsultaBase" = CASE "especialidade"
  WHEN 'Cardiologia'  THEN 350
  WHEN 'Oftalmologia' THEN 280
  WHEN 'Ginecologia'  THEN 300
  WHEN 'Psicologia'   THEN 260
  WHEN 'Fisioterapia' THEN 180
  ELSE 220
END
WHERE "valorConsultaBase" = 0;

ALTER TABLE "professionals"
  ALTER COLUMN "valorConsultaBase" DROP DEFAULT;
