import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { GET as dashboardGet } from "@/app/(back-end)/api/dashboard/route";
import { GET as relFinGet } from "@/app/(back-end)/api/relatorios/financeiro/route";
import { GET as relConsGet } from "@/app/(back-end)/api/relatorios/consultorios/route";
import { GET as relGratGet } from "@/app/(back-end)/api/relatorios/gratuitas/route";
import { GET as relCancGet } from "@/app/(back-end)/api/relatorios/cancelamentos/route";
import { prisma } from "@/lib/db";
import { cleanDb } from "../helpers/db";
import { createUserWithRole } from "../helpers/auth";
import { getRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const PERIODO = "?dataInicio=2026-06-01&dataFim=2026-06-07";

async function fixtureCenario() {
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. R",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 1",
      email: "drR@e.com",
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
  await prisma.atendimento.createMany({
    data: [
      {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-02"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
      {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(100),
        status: "realizado",
        statusPagamento: "gratuito",
        motivoDescontoOuGratuidade: "Cortesia",
      },
      {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-04"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(150),
        status: "cancelado",
        statusPagamento: "pendente",
        motivoCancelamento: "Paciente cancelou",
      },
      {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-05"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(0),
        status: "nao_compareceu",
        statusPagamento: "pendente",
      },
      // Atendimentos realizados aguardando cobrança — esses entram em
      // "atendimentos pendentes" (fila de cobrança, não pendência de
      // agenda). Implementação em dashboard/stats.ts: status=realizado
      // AND statusPagamento=pendente.
      {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-06"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(180),
        status: "realizado",
        statusPagamento: "pendente",
      },
      {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-06"),
        hora: "11:00",
        valorConsulta: new Prisma.Decimal(220),
        status: "realizado",
        statusPagamento: "pendente",
      },
    ],
  });
  return { profissional, paciente, consultorio };
}

describe("GET /api/dashboard", () => {
  it("admin recebe stats agregados", async () => {
    const { token } = await createUserWithRole("admin");
    await fixtureCenario();

    const res = await dashboardGet(
      withAuthCookie(getRequest(`/api/dashboard${PERIODO}`), token),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.profissionaisAtivos).toBe(1);
    // Fila de cobrança: realizado + statusPagamento=pendente (não inclui
    // cancelado/nao_compareceu, esses são "pendência de agenda")
    expect(body.stats.atendimentosPendentes).toBe(2);
    expect(body.stats.receitaPorDia).toHaveLength(1); // só 1 dia com pago
    expect(body.stats.receitaPorDia[0].receita).toBe("200.00");
  });

  it("paciente é negado (403)", async () => {
    const { token } = await createUserWithRole("paciente");
    const res = await dashboardGet(
      withAuthCookie(getRequest(`/api/dashboard${PERIODO}`), token),
    );
    expect(res.status).toBe(403);
  });

  it("período inválido → 422", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await dashboardGet(
      withAuthCookie(
        getRequest("/api/dashboard?dataInicio=2026-06-07&dataFim=2026-06-01"),
        token,
      ),
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /api/relatorios/financeiro", () => {
  it("admin recebe linhas agrupadas por profissional", async () => {
    const { token } = await createUserWithRole("admin");
    await fixtureCenario();

    const res = await relFinGet(
      withAuthCookie(getRequest(`/api/relatorios/financeiro${PERIODO}`), token),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.linhas).toHaveLength(1);
    expect(body.linhas[0].receitaBruta).toBe("200.00");
    expect(body.linhas[0].repasseEstimado).toBe("60.00");
    expect(body.totais.margemClinica).toBe("140.00");
  });

  it("profissional é negado (só admin/aux) → 403", async () => {
    const { token } = await createUserWithRole("profissional");
    const res = await relFinGet(
      withAuthCookie(getRequest(`/api/relatorios/financeiro${PERIODO}`), token),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/relatorios/consultorios", () => {
  it("admin recebe ranking de consultórios", async () => {
    const { token } = await createUserWithRole("admin");
    await fixtureCenario();

    const res = await relConsGet(
      withAuthCookie(getRequest(`/api/relatorios/consultorios${PERIODO}`), token),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.linhas).toHaveLength(1);
    expect(body.linhas[0].receita).toBe("200.00");
    expect(body.linhas[0].qtdAtendimentos).toBe(1);
  });
});

describe("GET /api/relatorios/gratuitas", () => {
  it("admin recebe lista de atendimentos gratuitos com motivo", async () => {
    const { token } = await createUserWithRole("admin");
    await fixtureCenario();

    const res = await relGratGet(
      withAuthCookie(getRequest(`/api/relatorios/gratuitas${PERIODO}`), token),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalAtendimentos).toBe(1);
    expect(body.linhas[0].motivo).toBe("Cortesia");
  });
});

describe("GET /api/relatorios/cancelamentos", () => {
  it("admin recebe cancelados + não-comparecidos com totais", async () => {
    const { token } = await createUserWithRole("admin");
    await fixtureCenario();

    const res = await relCancGet(
      withAuthCookie(
        getRequest(`/api/relatorios/cancelamentos${PERIODO}`),
        token,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totais.cancelados).toBe(1);
    expect(body.totais.naoCompareceu).toBe(1);
    expect(body.totais.total).toBe(2);
    expect(body.linhas).toHaveLength(2);
  });
});
