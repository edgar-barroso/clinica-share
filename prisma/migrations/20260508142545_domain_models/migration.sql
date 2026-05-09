-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'auxiliar', 'profissional', 'atendente', 'paciente');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('manha', 'tarde', 'noite');

-- CreateEnum
CREATE TYPE "ModalidadeContrato" AS ENUM ('aluguel-fixo', 'percentual');

-- CreateEnum
CREATE TYPE "CargoStaff" AS ENUM ('atendente', 'auxiliar');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F', 'outro');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pago', 'pendente', 'gratuito');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('agendado', 'em_atendimento', 'realizado', 'cancelado', 'nao_compareceu');

-- CreateEnum
CREATE TYPE "StatusRepasse" AS ENUM ('aberto', 'pago');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetTokenExpiresAt" TIMESTAMP(3),
    "profissionalId" TEXT,
    "pacienteId" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_rooms" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "equipamentos" TEXT[],
    "especialidadesCompativeis" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "conselho" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "modalidadeContrato" "ModalidadeContrato" NOT NULL,
    "percentualRepasse" DECIMAL(5,4),
    "valorAluguelPorTurno" DECIMAL(10,2),
    "duracaoConsultaMinutos" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_shifts" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "consultorioId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "turno" "Turno" NOT NULL,

    CONSTRAINT "fixed_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" "CargoStaff" NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "senhaDefinida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "dataNascimento" DATE,
    "sexo" "Sexo",
    "endereco" JSONB,
    "plano" JSONB,
    "senhaDefinida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "hora" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "consultorioId" TEXT NOT NULL,
    "valorConsulta" DECIMAL(10,2) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'agendado',
    "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "motivoCancelamento" TEXT,
    "motivoDescontoOuGratuidade" TEXT,
    "usaProntuarioExterno" BOOLEAN NOT NULL DEFAULT false,
    "prontuarioInterno" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "periodoInicio" DATE NOT NULL,
    "periodoFim" DATE NOT NULL,
    "receitaBruta" DECIMAL(12,2) NOT NULL,
    "valorRepasse" DECIMAL(12,2) NOT NULL,
    "status" "StatusRepasse" NOT NULL DEFAULT 'aberto',
    "dataPagamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_appointments" (
    "repasseId" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_appointments_pkey" PRIMARY KEY ("repasseId","atendimentoId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userNome" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAntes" TEXT NOT NULL,
    "valorDepois" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_profissionalId_key" ON "users"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "users_pacienteId_key" ON "users"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "users_staffId_key" ON "users"("staffId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_email_key" ON "professionals"("email");

-- CreateIndex
CREATE INDEX "professionals_ativo_idx" ON "professionals"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_shifts_profissionalId_diaSemana_turno_key" ON "fixed_shifts"("profissionalId", "diaSemana", "turno");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_shifts_consultorioId_diaSemana_turno_key" ON "fixed_shifts"("consultorioId", "diaSemana", "turno");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_email_key" ON "staff_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE INDEX "appointments_profissionalId_data_idx" ON "appointments"("profissionalId", "data");

-- CreateIndex
CREATE INDEX "appointments_pacienteId_idx" ON "appointments"("pacienteId");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_statusPagamento_idx" ON "appointments"("statusPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_data_hora_consultorioId_key" ON "appointments"("data", "hora", "consultorioId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_profissionalId_periodoInicio_periodoFim_key" ON "payouts"("profissionalId", "periodoInicio", "periodoFim");

-- CreateIndex
CREATE INDEX "payout_appointments_atendimentoId_idx" ON "payout_appointments"("atendimentoId");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidadeId_idx" ON "audit_logs"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_shifts" ADD CONSTRAINT "fixed_shifts_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_shifts" ADD CONSTRAINT "fixed_shifts_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "consulting_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "consulting_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_appointments" ADD CONSTRAINT "payout_appointments_repasseId_fkey" FOREIGN KEY ("repasseId") REFERENCES "payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_appointments" ADD CONSTRAINT "payout_appointments_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
