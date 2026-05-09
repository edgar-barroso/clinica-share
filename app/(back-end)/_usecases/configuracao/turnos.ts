import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

export interface TurnoConfig {
  inicio: string; // "HH:mm"
  fim: string;
}
export interface TurnosConfig {
  manha: TurnoConfig;
  tarde: TurnoConfig;
  noite: TurnoConfig;
}

export const TURNOS_DEFAULT: TurnosConfig = {
  manha: { inicio: "07:00", fim: "12:59" },
  tarde: { inicio: "13:00", fim: "17:59" },
  noite: { inicio: "18:00", fim: "19:59" },
};

const CHAVE = "turnos";

/**
 * Lê a configuração de turnos do DB. Retorna defaults se não houver
 * registro ainda (PEND-014 — confirmar com Dr. Edson em R2).
 */
export async function getTurnos(): Promise<TurnosConfig> {
  const row = await prisma.configuracao.findUnique({
    where: { chave: CHAVE },
  });
  if (!row) return TURNOS_DEFAULT;
  return row.valor as unknown as TurnosConfig;
}

/**
 * Atualiza a configuração. Audit log gravado (RNF-102 — toda alteração
 * em configuração financeira/operacional é auditada).
 */
export async function setTurnos(
  novo: TurnosConfig,
  user: UserSnapshot,
): Promise<TurnosConfig> {
  const anterior = await getTurnos();

  await prisma.$transaction(async (tx) => {
    await tx.configuracao.upsert({
      where: { chave: CHAVE },
      update: { valor: novo as unknown as Prisma.InputJsonValue },
      create: {
        chave: CHAVE,
        valor: novo as unknown as Prisma.InputJsonValue,
      },
    });
    await audit(
      {
        user,
        entidade: "Configuracao",
        entidadeId: CHAVE,
        campo: "turnos",
        valorAntes: JSON.stringify(anterior),
        valorDepois: JSON.stringify(novo),
        motivo: "Configuração de turnos atualizada (PEND-014)",
      },
      tx,
    );
  });

  return novo;
}
