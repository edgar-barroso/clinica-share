import { prisma } from "@/lib/db";
import { ConflitoRecurso } from "@/app/(back-end)/_lib/errors";
import type { CreateProfissionalInput } from "@/app/(back-end)/api/profissionais/_schemas";

export async function createProfissional(input: CreateProfissionalInput) {
  const exists = await prisma.profissional.findUnique({ where: { email: input.email } });
  if (exists) throw new ConflitoRecurso("E-mail já cadastrado para outro profissional");

  return prisma.profissional.create({
    data: {
      nome: input.nome,
      especialidade: input.especialidade,
      conselho: input.conselho,
      email: input.email,
      telefone: input.telefone,
      modalidadeContrato: input.modalidadeContrato,
      percentualRepasse: input.percentualRepasse ?? null,
      valorAluguelPorTurno: input.valorAluguelPorTurno ?? null,
      duracaoConsultaMinutos: input.duracaoConsultaMinutos,
    },
  });
}
