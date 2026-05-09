import { test, expect } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-rel-e2e-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-rel-12345";

test.beforeAll(async () => {
  await prisma.repasseAtendimento.deleteMany();
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
      nome: "Paciente Rel",
      email: `pac-rel-${Date.now()}@e2e.com`,
      telefone: "11999990000",
    },
  });
  const prof = await prisma.profissional.create({
    data: {
      nome: "Dr. Rel",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 44444",
      email: `prof-rel-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: new Prisma.Decimal(0.3),
      duracaoConsultaMinutos: 30,
    },
  });
  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala Rel",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });

  // Cobre os 4 relatórios
  await prisma.atendimento.createMany({
    data: [
      {
        pacienteId: paciente.id,
        profissionalId: prof.id,
        consultorioId: cons.id,
        data: new Date("2026-06-02"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(200),
        status: "realizado",
        statusPagamento: "pago",
      },
      {
        pacienteId: paciente.id,
        profissionalId: prof.id,
        consultorioId: cons.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(0),
        status: "realizado",
        statusPagamento: "gratuito",
        motivoDescontoOuGratuidade: "Cortesia funcional",
      },
      {
        pacienteId: paciente.id,
        profissionalId: prof.id,
        consultorioId: cons.id,
        data: new Date("2026-06-04"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(150),
        status: "cancelado",
        statusPagamento: "pendente",
        motivoCancelamento: "Paciente desistiu",
      },
    ],
  });
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

test.describe("Dashboard + Relatórios — Fase 6", () => {
  test("Dashboard API agrega stats corretamente", async ({ page }) => {
    await loginAsAdmin(page);

    const res = await page.request.get(
      "/api/dashboard?dataInicio=2026-06-01&dataFim=2026-06-07",
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.stats.profissionaisAtivos).toBe(1);
    expect(body.stats.receitaPorDia.length).toBeGreaterThan(0);
  });

  test("Relatório financeiro retorna shape esperado", async ({ page }) => {
    await loginAsAdmin(page);

    const res = await page.request.get(
      "/api/relatorios/financeiro?dataInicio=2026-06-01&dataFim=2026-06-07",
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.linhas).toHaveLength(1);
    expect(body.totais.receitaBruta).toBe("200.00");
    expect(body.totais.repasseEstimado).toBe("60.00");
  });

  test("Relatório consultórios retorna ranking", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.request.get(
      "/api/relatorios/consultorios?dataInicio=2026-06-01&dataFim=2026-06-07",
    );
    const body = await res.json();
    expect(body.linhas).toHaveLength(1);
    expect(body.linhas[0].receita).toBe("200.00");
  });

  test("Relatório gratuitas captura cortesias", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.request.get(
      "/api/relatorios/gratuitas?dataInicio=2026-06-01&dataFim=2026-06-07",
    );
    const body = await res.json();
    expect(body.totalAtendimentos).toBe(1);
    expect(body.linhas[0].motivo).toBe("Cortesia funcional");
  });

  test("Relatório cancelamentos lista cancelados + nao_compareceu", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const res = await page.request.get(
      "/api/relatorios/cancelamentos?dataInicio=2026-06-01&dataFim=2026-06-07",
    );
    const body = await res.json();
    expect(body.totais.cancelados).toBe(1);
    expect(body.totais.naoCompareceu).toBe(0);
  });
});
