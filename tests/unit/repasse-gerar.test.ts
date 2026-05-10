import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { gerarRepasse } from "@/app/(back-end)/_usecases/repasse/gerar";
import { cleanDb } from "../helpers/db";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const PERIODO_INICIO = "2026-06-01";
const PERIODO_FIM = "2026-06-07";

async function fixtureBase() {
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. Gerar",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 1",
      email: "g@e.com",
      telefone: "11999990000",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: new Prisma.Decimal(0.3),
      duracaoConsultaMinutos: 30,
    },
  });
  const paciente = await prisma.paciente.create({
    data: { nome: "P", email: "p@e.com", telefone: "11900000000" },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "S1",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  return { profissional, paciente, consultorio };
}

describe("gerarRepasse — invariante 1:N", () => {
  it("vincula atendimento via Atendimento.repasseId", async () => {
    const { profissional, paciente, consultorio } = await fixtureBase();
    const a = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
    });

    const repasse = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    const after = await prisma.atendimento.findUniqueOrThrow({
      where: { id: a.id },
    });
    expect(after.repasseId).toBe(repasse.id);
    expect(repasse.atendimentos).toHaveLength(1);
  });

  it("INVARIANT: atendimento já vinculado NÃO é movido por novo repasse", async () => {
    const { profissional, paciente, consultorio } = await fixtureBase();
    const a = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
    });

    const r1 = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    // Período sobreposto que tentaria capturar o mesmo atendimento
    const r2 = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: "2026-06-02",
      periodoFim: "2026-06-08",
    });

    expect(r1.id).not.toBe(r2.id);
    const after = await prisma.atendimento.findUniqueOrThrow({
      where: { id: a.id },
    });
    expect(after.repasseId).toBe(r1.id);
  });

  it("idempotência: 2ª chamada para mesmo período retorna o mesmo Repasse", async () => {
    const { profissional, paciente, consultorio } = await fixtureBase();
    await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
    });

    const r1 = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    const r2 = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    expect(r1.id).toBe(r2.id);

    const total = await prisma.repasse.count({
      where: { profissionalId: profissional.id },
    });
    expect(total).toBe(1);
  });

  it("período sem atendimentos elegíveis cria Repasse vazio (receita 0)", async () => {
    const { profissional } = await fixtureBase();

    const r = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(r.atendimentos).toHaveLength(0);
    expect(r.receitaBruta.toString()).toBe("0");
    expect(r.valorRepasse.toString()).toBe("0");
  });

  it("DELETE Repasse libera atendimento (SetNull)", async () => {
    const { profissional, paciente, consultorio } = await fixtureBase();
    const a = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
    });

    const r = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    await prisma.repasse.delete({ where: { id: r.id } });

    const after = await prisma.atendimento.findUniqueOrThrow({
      where: { id: a.id },
    });
    expect(after.repasseId).toBeNull();
    expect(after.id).toBe(a.id);
  });

  it("após DELETE, regerar mesmo período cria Repasse novo + revincula", async () => {
    const { profissional, paciente, consultorio } = await fixtureBase();
    const a = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
    });

    const r1 = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    await prisma.repasse.delete({ where: { id: r1.id } });

    const r2 = await gerarRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(r2.id).not.toBe(r1.id);
    const after = await prisma.atendimento.findUniqueOrThrow({
      where: { id: a.id },
    });
    expect(after.repasseId).toBe(r2.id);
  });
});
