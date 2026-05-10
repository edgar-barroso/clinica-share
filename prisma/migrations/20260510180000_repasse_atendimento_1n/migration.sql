-- Refatora Repasse↔Atendimento de N:N para 1:N.
--
-- Bug pré-existente: a tabela associativa payout_appointments tinha PK
-- composta (repasse_id, atendimento_id) que impedia par duplicado mas
-- NÃO impedia o mesmo atendimento aparecer em dois repasses diferentes
-- — violando a invariante financeira RNF-104 ("um atendimento só pode
-- ser pago em um único repasse").
--
-- Estratégia da migração:
-- 1. Adiciona `repasse_id` em appointments (FK 1:N nullable, SetNull)
-- 2. Migra dados existentes: atendimento.repasse_id := MIN(repasse_id) da join
-- 3. Drop tabela payout_appointments

-- 1. Adiciona coluna FK + índice (segue convenção Prisma de quoted PascalCase)
ALTER TABLE "appointments"
  ADD COLUMN "repasseId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_repasseId_idx" ON "appointments"("repasseId");

-- AddForeignKey
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_repasseId_fkey"
  FOREIGN KEY ("repasseId") REFERENCES "payouts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Migra dados: para cada atendimento, escolhe o repasse mais antigo
--    (o "verdadeiro" — qualquer duplicata era bug latente)
UPDATE "appointments" a
SET "repasseId" = sub."repasseId"
FROM (
  SELECT DISTINCT ON ("atendimentoId")
    "atendimentoId",
    "repasseId"
  FROM "payout_appointments"
  ORDER BY "atendimentoId", "createdAt" ASC
) sub
WHERE a."id" = sub."atendimentoId";

-- 3. Drop tabela associativa
DROP TABLE "payout_appointments";
