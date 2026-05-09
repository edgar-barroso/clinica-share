import { prisma } from "@/lib/db";
import { sendLembreteConsultaEmail } from "@/app/(back-end)/_lib/mailer";
import { sendWhatsApp } from "@/app/(back-end)/_lib/whatsapp";

interface ResultDetalhe {
  atendimentoId: string;
  pacienteEmail: string;
  pacienteTelefone: string;
  emailOk: boolean;
  whatsappOk: boolean;
  emailErro?: string;
  whatsappErro?: string;
}

export interface ResultLembretes {
  /** ISO YYYY-MM-DD do dia alvo (amanhã, relativo a `referencia`). */
  dataAlvo: string;
  /** Quantos atendimentos elegíveis foram encontrados. */
  total: number;
  /** Quantos foram efetivamente notificados nesta execução. */
  enviados: number;
  /** Já tinham sido notificados em execução anterior do cron. */
  jaNotificados: number;
  detalhes: ResultDetalhe[];
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dataLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${String(d).padStart(2, "0")} de ${meses[m - 1]} de ${y}`;
}

/**
 * Envia lembrete (email + WhatsApp) para todos os pacientes com consulta
 * agendada no dia seguinte à data de referência. Idempotente: marca
 * `Atendimento.lembreteEnviadoEm` para evitar reenvio se o cron rodar
 * mais de uma vez no mesmo dia.
 *
 * Critério: `status === "agendado"` e `lembreteEnviadoEm IS NULL`.
 * (Cancelados e os já realizados/em-atendimento não recebem.)
 */
export async function enviarLembretesAmanha(
  referencia: Date = new Date(),
): Promise<ResultLembretes> {
  const alvo = new Date(referencia);
  alvo.setHours(0, 0, 0, 0);
  alvo.setDate(alvo.getDate() + 1);
  const dataAlvoIso = isoDate(alvo);
  const dataAlvoLong = dataLong(dataAlvoIso);

  const elegíveis = await prisma.atendimento.findMany({
    where: {
      data: alvo,
      status: "agendado",
      lembreteEnviadoEm: null,
    },
    include: {
      paciente: { select: { nome: true, email: true, telefone: true } },
      profissional: { select: { nome: true, especialidade: true } },
      consultorio: { select: { nome: true } },
    },
  });

  // Conta também os que já foram notificados (para visibilidade no cron output)
  const jaNotificados = await prisma.atendimento.count({
    where: {
      data: alvo,
      status: "agendado",
      lembreteEnviadoEm: { not: null },
    },
  });

  const detalhes: ResultDetalhe[] = [];
  for (const a of elegíveis) {
    const message =
      `Olá, ${a.paciente.nome}! Lembrete da sua consulta amanhã (${dataAlvoLong}) ` +
      `às ${a.hora} com ${a.profissional.nome} (${a.profissional.especialidade}) ` +
      `no ${a.consultorio.nome}. Chegue 10 minutos antes. ` +
      `Pagamento é presencial. — ClinicaShare`;

    let emailOk = false;
    let emailErro: string | undefined;
    let whatsappOk = false;
    let whatsappErro: string | undefined;

    try {
      await sendLembreteConsultaEmail({
        to: a.paciente.email,
        pacienteNome: a.paciente.nome,
        dataLong: dataAlvoLong,
        hora: a.hora,
        profissionalNome: a.profissional.nome,
        especialidade: a.profissional.especialidade,
        consultorioNome: a.consultorio.nome,
      });
      emailOk = true;
    } catch (err) {
      emailErro = err instanceof Error ? err.message : String(err);
    }

    try {
      const r = await sendWhatsApp({ to: a.paciente.telefone, message });
      whatsappOk = r.ok;
      if (!r.ok) whatsappErro = r.error;
    } catch (err) {
      whatsappErro = err instanceof Error ? err.message : String(err);
    }

    // Só marca como enviado se PELO MENOS um canal funcionou.
    if (emailOk || whatsappOk) {
      await prisma.atendimento.update({
        where: { id: a.id },
        data: { lembreteEnviadoEm: new Date() },
      });
    }

    detalhes.push({
      atendimentoId: a.id,
      pacienteEmail: a.paciente.email,
      pacienteTelefone: a.paciente.telefone,
      emailOk,
      whatsappOk,
      emailErro,
      whatsappErro,
    });
  }

  return {
    dataAlvo: dataAlvoIso,
    total: elegíveis.length + jaNotificados,
    enviados: detalhes.filter((d) => d.emailOk || d.whatsappOk).length,
    jaNotificados,
    detalhes,
  };
}
