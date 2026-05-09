import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * FI08: marca repasse como pago. Audit log gravado (RNF-102).
 *
 * Só é possível marcar repasse `aberto` como `pago` — repasses já
 * pagos retornam 400.
 */
export async function marcarRepassePago(
  id: string,
  user: UserSnapshot,
  motivo?: string,
) {
  const before = await prisma.repasse.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Repasse");

  if (before.status === "pago") {
    throw new RegraNegocio("Repasse já está marcado como pago");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.repasse.update({
      where: { id },
      data: { status: "pago", dataPagamento: new Date() },
      // Mesmo shape de `listRepasses` — o frontend substitui o item da
      // lista pelo retorno; sem `profissional`/`atendimentos`, o render
      // seguinte estoura `repasse.profissional.nome` e cai no error.tsx.
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
            especialidade: true,
            modalidadeContrato: true,
          },
        },
        atendimentos: { select: { atendimentoId: true } },
      },
    });

    await audit(
      {
        user,
        entidade: "Repasse",
        entidadeId: id,
        campo: "status",
        valorAntes: "aberto",
        valorDepois: "pago",
        motivo: motivo ?? "Repasse pago ao profissional (FI08)",
      },
      tx,
    );

    return updated;
  });
}
