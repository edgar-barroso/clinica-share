-- FI06: desconto parcial com justificativa.
--
-- Antes só existia gratuidade total: `motivoDescontoOuGratuidade` era forçado
-- a NULL sempre que o pagamento não fosse "gratuito", e não havia como saber
-- que um atendimento tinha sido cobrado abaixo do preço de tabela. Sem valor
-- de referência, desconto era indetectável e nunca aparecia no relatório RE04.
--
-- `valorOriginal` guarda o preço de tabela no momento do atendimento.
-- NULL = cobrado sem desconto (é o caso da maioria das linhas existentes).
ALTER TABLE "appointments" ADD COLUMN "valorOriginal" DECIMAL(10,2);

-- Índice parcial: o relatório de gratuidades e descontos procura justamente
-- as linhas com desconto, que são a minoria.
CREATE INDEX "appointments_valorOriginal_idx"
    ON "appointments"("valorOriginal")
    WHERE "valorOriginal" IS NOT NULL;
