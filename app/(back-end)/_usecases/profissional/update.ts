import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";
import type { UpdateProfissionalInput } from "@/app/(back-end)/api/profissionais/_schemas";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * Campos de contrato/repasse (FI01/FI02). Toda alteração aqui exige `motivo`
 * e gera audit log — e, na rota, só o admin pode enviá-los.
 */
export const CONTRACT_FIELDS = [
  "modalidadeContrato",
  "percentualRepasse",
  "valorAluguelPorTurno",
  "valorConsultaBase",
] as const satisfies readonly (keyof UpdateProfissionalInput)[];

/**
 * Atualiza profissional. **Alterações em campos de contrato**
 * (modalidade, percentualRepasse, valorAluguelPorTurno) geram audit
 * log obrigatório (RNF-102 / FI01) e exigem `motivo` no input.
 */
export async function updateProfissional(
  id: string,
  input: UpdateProfissionalInput,
  user: UserSnapshot,
) {
  const before = await prisma.profissional.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Profissional");

  const contractChanges = CONTRACT_FIELDS.filter((field) => {
    const novo = input[field];
    if (novo === undefined) return false;
    return novo !== (before as unknown as Record<string, unknown>)[field];
  });

  if (contractChanges.length > 0 && !input.motivo) {
    throw new RegraNegocio(
      "Alteração de contrato exige campo `motivo` (RNF-102 / FI01)",
    );
  }

  return prisma.$transaction(async (tx) => {
    const data: Prisma.ProfissionalUpdateInput = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.especialidade !== undefined) data.especialidade = input.especialidade;
    if (input.conselho !== undefined) data.conselho = input.conselho;
    if (input.email !== undefined) data.email = input.email;
    if (input.telefone !== undefined) data.telefone = input.telefone;
    if (input.modalidadeContrato !== undefined) data.modalidadeContrato = input.modalidadeContrato;
    if (input.percentualRepasse !== undefined) data.percentualRepasse = input.percentualRepasse;
    if (input.valorAluguelPorTurno !== undefined)
      data.valorAluguelPorTurno = input.valorAluguelPorTurno;
    if (input.valorConsultaBase !== undefined)
      data.valorConsultaBase = input.valorConsultaBase;
    if (input.duracaoConsultaMinutos !== undefined)
      data.duracaoConsultaMinutos = input.duracaoConsultaMinutos;
    if (input.ativo !== undefined) data.ativo = input.ativo;

    const updated = await tx.profissional.update({ where: { id }, data });

    for (const field of contractChanges) {
      await audit(
        {
          user,
          entidade: "Profissional",
          entidadeId: id,
          campo: field,
          valorAntes: String(
            (before as unknown as Record<string, unknown>)[field] ?? "",
          ),
          valorDepois: String(input[field] ?? ""),
          motivo: input.motivo!,
        },
        tx,
      );
    }

    return updated;
  });
}
