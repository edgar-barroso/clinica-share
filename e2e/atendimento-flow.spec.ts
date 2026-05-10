import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-at-e2e-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-at-12345";

let pacienteId = "";
let profissionalId = "";
let consultorioId = "";

test.beforeAll(async () => {
  await prisma.repasse.deleteMany();
  await prisma.atendimento.deleteMany();
  await prisma.turnoFixo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.consultorio.deleteMany();

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    },
  });

  const paciente = await prisma.paciente.create({
    data: {
      nome: "Paciente AT E2E",
      email: `pac-at-${Date.now()}@e2e.com`,
      telefone: "11999990000",
    },
  });
  pacienteId = paciente.id;

  const prof = await prisma.profissional.create({
    data: {
      nome: "Dr. AT E2E",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 77777",
      email: `prof-at-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: 0.3,
      duracaoConsultaMinutos: 30,
    },
  });
  profissionalId = prof.id;

  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala AT E2E",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  consultorioId = cons.id;
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 15_000 }),
    page.getByRole("button", { name: /^Entrar$/ }).click(),
  ]);
}

test.describe("Atendimentos — fluxo completo (Fase 4)", () => {
  test("agendado → em_atendimento → realizado com prontuário e pagamento", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Cria agendamento via API direta (UI já testada na Fase 3)
    const ag = await prisma.atendimento.create({
      data: {
        pacienteId,
        profissionalId,
        consultorioId,
        data: new Date("2026-07-01"),
        hora: "10:00",
        valorConsulta: 0,
      },
    });

    // Iniciar via API
    let res = await page.request.post(
      `/api/agendamentos/${ag.id}/iniciar`,
      { data: {} },
    );
    expect(res.status()).toBe(200);

    let persisted = await prisma.atendimento.findUnique({ where: { id: ag.id } });
    expect(persisted?.status).toBe("em_atendimento");

    // Finalizar via API
    res = await page.request.post(`/api/atendimentos/${ag.id}/finalizar`, {
      data: {
        valorConsulta: 250,
        statusPagamento: "pago",
        prontuarioInterno: { evolucao: "Sem queixas", conduta: "Retorno em 30 dias" },
      },
    });
    expect(res.status()).toBe(200);

    persisted = await prisma.atendimento.findUnique({ where: { id: ag.id } });
    expect(persisted?.status).toBe("realizado");
    expect(persisted?.statusPagamento).toBe("pago");
    expect(Number(persisted?.valorConsulta)).toBe(250);

    // 4 logs: chegada (não, fizemos via iniciar) — então: status agendado→em_atendimento (iniciar)
    // + 3 da finalização (status, valorConsulta, statusPagamento)
    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: ag.id },
    });
    const campos = logs.map((l) => l.campo);
    expect(campos).toContain("valorConsulta");
    expect(campos).toContain("statusPagamento");
    expect(campos.filter((c) => c === "status").length).toBeGreaterThanOrEqual(2);
  });

  test("walk-in via UI cria atendimento já realizado", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/atendimentos/novo");

    await page.getByLabel("Paciente").click();
    await page
      .getByPlaceholder("Nome, e-mail, CPF ou telefone")
      .fill("Paciente AT E2E");
    await page.getByRole("option", { name: /Paciente AT E2E/i }).click();

    await page.getByLabel("Valor da consulta (R$)").fill("180");

    await Promise.all([
      page.waitForURL("**/atendimentos", { timeout: 15_000 }),
      page.getByRole("button", { name: /Registrar atendimento/i }).click(),
    ]);

    const recent = await prisma.atendimento.findFirst({
      where: { pacienteId, status: "realizado" },
      orderBy: { createdAt: "desc" },
    });
    expect(recent).not.toBeNull();
    expect(Number(recent?.valorConsulta)).toBe(180);
  });

  test("FI11: admin edita pós-realizado com motivo → audit log capturado", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const a = await prisma.atendimento.create({
      data: {
        pacienteId,
        profissionalId,
        consultorioId,
        data: new Date("2026-07-15"),
        hora: "14:00",
        valorConsulta: 200,
        status: "realizado",
        statusPagamento: "pago",
      },
    });

    const res = await page.request.patch(`/api/atendimentos/${a.id}`, {
      data: {
        valorConsulta: 150,
        motivo: "Cliente alegou cobrança duplicada",
      },
    });
    expect(res.status()).toBe(200);

    const updated = await prisma.atendimento.findUnique({ where: { id: a.id } });
    expect(Number(updated?.valorConsulta)).toBe(150);

    const log = await prisma.auditLog.findFirst({
      where: { entidadeId: a.id, campo: "valorConsulta" },
    });
    expect(log?.valorAntes).toBe("200");
    expect(log?.valorDepois).toBe("150");
    expect(log?.motivo).toBe("Cliente alegou cobrança duplicada");
  });

  test("AT06: gratuito sem motivo retorna 422", async ({ page }) => {
    await loginAsAdmin(page);

    const ag = await prisma.atendimento.create({
      data: {
        pacienteId,
        profissionalId,
        consultorioId,
        data: new Date("2026-07-20"),
        hora: "11:00",
        valorConsulta: 0,
        status: "em_atendimento",
      },
    });

    const res = await page.request.post(
      `/api/atendimentos/${ag.id}/finalizar`,
      {
        data: {
          valorConsulta: 0,
          statusPagamento: "gratuito",
        },
      },
    );
    expect(res.status()).toBe(422);
  });
});
