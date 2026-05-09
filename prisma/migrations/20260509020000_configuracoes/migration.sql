-- Tabela de configurações chave-valor JSON
CREATE TABLE "configuracoes" (
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("chave")
);
