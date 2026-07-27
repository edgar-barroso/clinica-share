-- AT04: registro de ocorrência para profissional que usa prontuário externo.
--
-- `usaProntuarioExterno` já existia mas era código morto (só recebia `false`).
-- Aqui ele ganha a coluna que faltava para virar um registro de verdade: onde
-- o prontuário externo está. Antes disso o marcador era gravado dentro do Json
-- de `prontuarioInterno`, o que impedia qualquer filtro ou relatório em SQL.
ALTER TABLE "appointments" ADD COLUMN "referenciaProntuarioExterno" TEXT;

-- Índice para o relatório de atendimentos documentados fora do sistema.
CREATE INDEX "appointments_usaProntuarioExterno_idx"
    ON "appointments"("usaProntuarioExterno");

-- Recupera as marcações antigas que ficaram presas no blob Json, para não
-- perder o histórico já registrado pela tela de atendimento avulso.
UPDATE "appointments"
SET "usaProntuarioExterno" = true,
    "referenciaProntuarioExterno" = COALESCE(
        NULLIF("prontuarioInterno" ->> 'referencia', ''),
        'Migrado: marcação antiga sem referência informada'
    )
WHERE "prontuarioInterno" ->> 'tipo' = 'externo';
