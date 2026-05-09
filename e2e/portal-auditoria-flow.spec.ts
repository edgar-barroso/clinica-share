import { test, expect } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-aud-e2e-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-aud-12345";
const PACIENTE_EMAIL = `pac-portal-e2e-${Date.now()}@example.com`;
const PACIENTE_PASSWORD = "paciente-12345";

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

  // Cria paciente vinculado a User com senha
  const paciente = await prisma.paciente.create({
    data: {
      nome: "Paciente Portal",
      email: PACIENTE_EMAIL,
      telefone: "11999990000",
    },
  });
  await prisma.user.create({
    data: {
      email: PACIENTE_EMAIL,
      passwordHash: await bcrypt.hash(PACIENTE_PASSWORD, 10),
      role: "paciente",
      pacienteId: paciente.id,
    },
  });

  // 1 atendimento realizado pago para gerar audit
  const prof = await prisma.profissional.create({
    data: {
      nome: "Dr. Aud",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 55555",
      email: `prof-aud-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      percentualRepasse: new Prisma.Decimal(0.3),
      duracaoConsultaMinutos: 30,
    },
  });
  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala Aud",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  await prisma.atendimento.create({
    data: {
      pacienteId: paciente.id,
      profissionalId: prof.id,
      consultorioId: cons.id,
      data: new Date("2026-06-02"),
      hora: "10:00",
      valorConsulta: new Prisma.Decimal(200),
      status: "realizado",
      statusPagamento: "pago",
    },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Portal paciente — Fase 7", () => {
  test("paciente lê próprio perfil + lista próprias consultas via API", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(PACIENTE_EMAIL);
    await page.getByLabel("Senha").fill(PACIENTE_PASSWORD);
    await Promise.all([
      page.waitForURL("**/p", { timeout: 15_000 }),
      page.getByRole("button", { name: /^Entrar$/ }).click(),
    ]);

    // Perfil
    const resPerfil = await page.request.get("/api/p/perfil");
    expect(resPerfil.status()).toBe(200);
    const bodyPerfil = await resPerfil.json();
    expect(bodyPerfil.paciente.nome).toBe("Paciente Portal");

    // Consultas: GET /api/agendamentos com filtro automático por paciente
    const resAg = await page.request.get("/api/agendamentos");
    expect(resAg.status()).toBe(200);
    const bodyAg = await resAg.json();
    expect(bodyAg.agendamentos).toHaveLength(1);
  });

  test("paciente atualiza próprio telefone via PATCH", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(PACIENTE_EMAIL);
    await page.getByLabel("Senha").fill(PACIENTE_PASSWORD);
    await Promise.all([
      page.waitForURL("**/p", { timeout: 15_000 }),
      page.getByRole("button", { name: /^Entrar$/ }).click(),
    ]);

    const res = await page.request.patch("/api/p/perfil", {
      data: { telefone: "11900000999" },
    });
    expect(res.status()).toBe(200);

    const persisted = await prisma.paciente.findFirst({
      where: { email: PACIENTE_EMAIL },
    });
    expect(persisted?.telefone).toBe("11900000999");
  });
});

test.describe("Auditoria — Fase 8", () => {
  test("admin lista AuditLog com filtros", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 15_000 }),
      page.getByRole("button", { name: /^Entrar$/ }).click(),
    ]);

    // Gera atividade auditável: edita o atendimento via PATCH
    const a = await prisma.atendimento.findFirstOrThrow();
    const res = await page.request.patch(`/api/atendimentos/${a.id}`, {
      data: {
        valorConsulta: 180,
        motivo: "Teste auditoria E2E",
      },
    });
    expect(res.status()).toBe(200);

    const auditRes = await page.request.get(
      "/api/auditoria?entidade=Atendimento",
    );
    expect(auditRes.status()).toBe(200);
    const body = await auditRes.json();
    expect(body.logs.length).toBeGreaterThan(0);
    expect(body.logs.some((l: { motivo: string }) => l.motivo === "Teste auditoria E2E")).toBe(true);
  });

  test("paciente é negado em /api/auditoria → 403", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(PACIENTE_EMAIL);
    await page.getByLabel("Senha").fill(PACIENTE_PASSWORD);
    await Promise.all([
      page.waitForURL("**/p", { timeout: 15_000 }),
      page.getByRole("button", { name: /^Entrar$/ }).click(),
    ]);

    const res = await page.request.get("/api/auditoria");
    expect(res.status()).toBe(403);
  });
});
