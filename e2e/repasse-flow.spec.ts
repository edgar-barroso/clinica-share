import { test, expect } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-rep-e2e-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-rep-12345";

let profissionalId = "";

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
      nome: "Paciente Repasse",
      email: `pac-rep-${Date.now()}@e2e.com`,
      telefone: "11999990000",
    },
  });
  const prof = await prisma.profissional.create({
    data: {
      nome: "Dr. Repasse E2E",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 33333",
      email: `rep-prof-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: new Prisma.Decimal(0.3),
      duracaoConsultaMinutos: 30,
    },
  });
  profissionalId = prof.id;
  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala Repasse",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });

  // 2 atendimentos pagos no período
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
        data: new Date("2026-06-04"),
        hora: "14:00",
        valorConsulta: new Prisma.Decimal(300),
        status: "realizado",
        statusPagamento: "pago",
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

test.describe("Repasses — Fase 5", () => {
  test("admin gera repasse → cálculo correto e idempotente", async ({ page }) => {
    await loginAsAdmin(page);

    // Gera via API
    const res1 = await page.request.post("/api/repasses/gerar", {
      data: {
        profissionalId,
        periodoInicio: "2026-06-01",
        periodoFim: "2026-06-07",
      },
    });
    expect(res1.status()).toBe(201);
    const body1 = await res1.json();
    expect(body1.repasse.receitaBruta).toBe("500");
    expect(body1.repasse.valorRepasse).toBe("150");
    expect(body1.repasse.atendimentos).toHaveLength(2);

    // Idempotência
    const res2 = await page.request.post("/api/repasses/gerar", {
      data: {
        profissionalId,
        periodoInicio: "2026-06-01",
        periodoFim: "2026-06-07",
      },
    });
    const body2 = await res2.json();
    expect(body2.repasse.id).toBe(body1.repasse.id);

    const count = await prisma.repasse.count({ where: { profissionalId } });
    expect(count).toBe(1);
  });

  test("admin marca repasse como pago → audit log gravado", async ({ page }) => {
    await loginAsAdmin(page);

    const r = await prisma.repasse.findFirstOrThrow({
      where: { profissionalId, status: "aberto" },
    });

    const res = await page.request.post(
      `/api/repasses/${r.id}/marcar-pago`,
      { data: { motivo: "PIX confirmado" } },
    );
    expect(res.status()).toBe(200);

    const updated = await prisma.repasse.findUnique({ where: { id: r.id } });
    expect(updated?.status).toBe("pago");
    expect(updated?.dataPagamento).toBeTruthy();

    const log = await prisma.auditLog.findFirst({
      where: { entidadeId: r.id, campo: "status" },
    });
    expect(log?.valorAntes).toBe("aberto");
    expect(log?.valorDepois).toBe("pago");
    expect(log?.motivo).toBe("PIX confirmado");
  });

  test("UI lista repasses + acessa detalhe", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/financeiro/repasses");

    // Verifica que o repasse criado aparece
    await expect(page.getByText("Dr. Repasse E2E")).toBeVisible();

    // Clica e abre detalhe
    await page.getByText("Dr. Repasse E2E").first().click();
    await page.waitForURL("**/financeiro/repasses/**");

    await expect(page.getByText("Receita bruta")).toBeVisible();
    await expect(page.getByText("Valor do repasse")).toBeVisible();
  });
});
