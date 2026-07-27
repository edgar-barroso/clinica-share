/**
 * FI04 — "Repasse inclui consultas E procedimentos extras realizados no
 * atendimento" (requisito Confirmado, R1).
 *
 * Escrito ANTES da implementação (TDD estrito exigido para código financeiro
 * pelo fluxo do projeto — RNF-104 / DEC-A04).
 *
 * Invariante sob teste: a base do repasse percentual é
 *   Σ (valorConsulta + Σ procedimentos.valor)
 * dos atendimentos `realizado` + `pago` no período — e não só valorConsulta.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateRepasse } from "@/app/(back-end)/_usecases/repasse/calculate";
import { cleanDb } from "../helpers/db";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const PERIODO_INICIO = "2026-06-01"; // segunda
const PERIODO_FIM = "2026-06-07"; // domingo

async function fixture(opts: {
  modalidade: "percentual" | "aluguel_fixo";
  percentual?: number;
  aluguel?: number;
}) {
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. Proc",
      especialidade: "Dermatologia",
      conselho: "CRM-SP 900",
      email: "proc@e.com",
      telefone: "11955554444",
      modalidadeContrato: opts.modalidade,
      valorConsultaBase: 200,
      percentualRepasse:
        opts.percentual !== undefined
          ? new Prisma.Decimal(opts.percentual)
          : null,
      valorAluguelPorTurno:
        opts.aluguel !== undefined ? new Prisma.Decimal(opts.aluguel) : null,
      duracaoConsultaMinutos: 30,
    },
  });
  const paciente = await prisma.paciente.create({
    data: { nome: "PP", email: "pp@e.com", telefone: "11900000009" },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "SP",
      tipo: "Procedimentos",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  return { profissional, paciente, consultorio };
}

/** Cria atendimento realizado+pago com N procedimentos extras. */
async function atendimentoComProcedimentos(
  ids: { profissional: { id: string }; paciente: { id: string }; consultorio: { id: string } },
  hora: string,
  valorConsulta: number,
  procedimentos: { descricao: string; valor: number }[],
) {
  return prisma.atendimento.create({
    data: {
      data: new Date("2026-06-03"),
      hora,
      pacienteId: ids.paciente.id,
      profissionalId: ids.profissional.id,
      consultorioId: ids.consultorio.id,
      valorConsulta: new Prisma.Decimal(valorConsulta),
      status: "realizado",
      statusPagamento: "pago",
      procedimentos: {
        create: procedimentos.map((p) => ({
          descricao: p.descricao,
          valor: new Prisma.Decimal(p.valor),
        })),
      },
    },
  });
}

describe("FI04 — procedimentos extras na base do repasse (percentual)", () => {
  it("soma valorConsulta + procedimentos na receita bruta", async () => {
    const ids = await fixture({ modalidade: "percentual", percentual: 0.3 });
    // Consulta 200 + procedimentos 50 e 30 = base 280
    await atendimentoComProcedimentos(ids, "09:00", 200, [
      { descricao: "Cauterização", valor: 50 },
      { descricao: "Curativo especial", valor: 30 },
    ]);

    const out = await calculateRepasse({
      profissionalId: ids.profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(out.receitaBruta.toString()).toBe("280");
    // 280 × 0.30 = 84
    expect(out.valorRepasse.toString()).toBe("84");
  });

  it("atendimento sem procedimentos continua valendo só a consulta", async () => {
    const ids = await fixture({ modalidade: "percentual", percentual: 0.3 });
    await atendimentoComProcedimentos(ids, "10:00", 200, []);

    const out = await calculateRepasse({
      profissionalId: ids.profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(out.receitaBruta.toString()).toBe("200");
    expect(out.valorRepasse.toString()).toBe("60");
  });

  it("expõe o total de procedimentos no breakdown por atendimento", async () => {
    const ids = await fixture({ modalidade: "percentual", percentual: 0.3 });
    await atendimentoComProcedimentos(ids, "11:00", 100, [
      { descricao: "Biópsia", valor: 120.5 },
    ]);

    const out = await calculateRepasse({
      profissionalId: ids.profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(out.detalhes).toHaveLength(1);
    expect(out.detalhes[0].valorProcedimentos.toString()).toBe("120.5");
    expect(out.detalhes[0].valorTotal.toString()).toBe("220.5");
    expect(out.receitaBruta.toString()).toBe("220.5");
  });

  it("arredonda half-up sobre a base já somada com procedimentos", async () => {
    const ids = await fixture({ modalidade: "percentual", percentual: 0.3 });
    // 100.05 + 0.10 = 100.15 → ×0.3 = 30.045 → half-up = 30.05
    await atendimentoComProcedimentos(ids, "12:00", 100.05, [
      { descricao: "Taxa material", valor: 0.1 },
    ]);

    const out = await calculateRepasse({
      profissionalId: ids.profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(out.receitaBruta.toString()).toBe("100.15");
    expect(out.valorRepasse.toString()).toBe("30.05");
  });

  it("procedimento de atendimento gratuito NAO entra na base", async () => {
    const ids = await fixture({ modalidade: "percentual", percentual: 0.3 });
    await prisma.atendimento.create({
      data: {
        data: new Date("2026-06-04"),
        hora: "14:00",
        pacienteId: ids.paciente.id,
        profissionalId: ids.profissional.id,
        consultorioId: ids.consultorio.id,
        valorConsulta: new Prisma.Decimal(0),
        status: "realizado",
        statusPagamento: "gratuito",
        motivoDescontoOuGratuidade: "Cortesia",
        procedimentos: {
          create: [{ descricao: "Curativo", valor: new Prisma.Decimal(80) }],
        },
      },
    });

    const out = await calculateRepasse({
      profissionalId: ids.profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(out.receitaBruta.toString()).toBe("0");
    expect(out.valorRepasse.toString()).toBe("0");
  });
});

describe("FI04 — aluguel fixo nao muda com procedimentos", () => {
  it("aluguel segue contando turnos, mas receitaBruta informa procedimentos", async () => {
    const ids = await fixture({ modalidade: "aluguel_fixo", aluguel: 250 });
    await atendimentoComProcedimentos(ids, "09:00", 300, [
      { descricao: "Ultrassom", valor: 100 },
    ]);

    const out = await calculateRepasse({
      profissionalId: ids.profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    // 1 turno usado × 250 — procedimentos não alteram o aluguel
    expect(out.valorRepasse.toString()).toBe("250");
    // mas a receita informativa reflete consulta + procedimento
    expect(out.receitaBruta.toString()).toBe("400");
  });
});
