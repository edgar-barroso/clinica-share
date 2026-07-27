-- AT02 / FI04: procedimentos extras por atendimento.
-- Tabela separada (não Json) porque `valor` precisa ser agregável em Decimal
-- para entrar na base do repasse — RNF-101 / DEC-A03 proíbem float e
-- um blob Json não é somável em SQL.
CREATE TABLE "appointment_procedures" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_procedures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_procedures_atendimentoId_idx" ON "appointment_procedures"("atendimentoId");

-- Cascade: apagar o atendimento apaga seus procedimentos (não existem sozinhos).
ALTER TABLE "appointment_procedures"
    ADD CONSTRAINT "appointment_procedures_atendimentoId_fkey"
    FOREIGN KEY ("atendimentoId") REFERENCES "appointments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
