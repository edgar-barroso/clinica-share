import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type UserSnapshot = {
  id: string;
  email: string;
  paciente?: { nome: string } | null;
  profissional?: { nome: string } | null;
  staff?: { nome: string } | null;
};

export interface AuditInput {
  user: UserSnapshot;
  entidade: string;
  entidadeId: string;
  campo: string;
  valorAntes: string;
  valorDepois: string;
  /**
   * Justificativa fornecida pelo usuário no body da requisição.
   * Em mutações financeiras o usecase deve exigir motivo no schema Zod
   * antes de chegar aqui (RNF-102 / RF-025).
   */
  motivo: string;
}

function userNomeFrom(user: UserSnapshot): string {
  return (
    user.paciente?.nome ??
    user.profissional?.nome ??
    user.staff?.nome ??
    user.email
  );
}

/**
 * Grava um registro em `AuditLog`. Chamada obrigatória em todo usecase que
 * altera valor monetário, status financeiro ou contrato (RNF-102, RF-025).
 *
 * Snapshot do nome no momento da ação — sobrevive a renomeações posteriores.
 *
 * Aceita `tx` (cliente Prisma de uma transação) opcionalmente para amarrar
 * o audit ao mesmo commit da mutação que ele audita.
 */
export async function audit(
  input: AuditInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: input.user.id,
      userNome: userNomeFrom(input.user),
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      campo: input.campo,
      valorAntes: input.valorAntes,
      valorDepois: input.valorDepois,
      motivo: input.motivo,
    },
  });
}
