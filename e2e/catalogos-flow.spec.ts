import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-e2e-cat-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-e2e-12345";

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

test.describe("Catálogos — fluxo CRUD (Fase 2)", () => {
  test("Admin cria consultório → aparece na lista", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/consultorios/novo");
    await page.getByLabel("Nome da sala").fill("Sala E2E Teste");
    await page.getByRole("button", { name: "Clínica geral", exact: true }).click();

    await Promise.all([
      page.waitForURL("**/consultorios", { timeout: 15_000 }),
      page.getByRole("button", { name: /Cadastrar consultório/i }).click(),
    ]);

    await expect(page.getByText("Sala E2E Teste")).toBeVisible();
  });

  test("Admin cria profissional percentual → aparece na lista", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/profissionais/novo");
    await page.getByLabel("Nome completo").fill("Dr. E2E Tester");
    await page.getByLabel("Conselho profissional").fill("CRM-SP 99999");
    await page.getByLabel("E-mail").fill(`prof-${Date.now()}@e2e.com`);
    await page.getByLabel("Telefone").fill("11999990000");

    await Promise.all([
      page.waitForURL("**/profissionais", { timeout: 15_000 }),
      page.getByRole("button", { name: /Cadastrar profissional/i }).click(),
    ]);

    await expect(page.getByText("Dr. E2E Tester")).toBeVisible();
  });

  test("Admin cria membro da equipe → aparece com 'Acesso pendente'", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/equipe/novo");
    await page.getByLabel("Nome completo").fill("Carla E2E Atendente");
    await page.getByLabel("E-mail").fill(`staff-${Date.now()}@e2e.com`);
    await page.getByLabel("Telefone").fill("11988887777");

    await Promise.all([
      page.waitForURL("**/equipe", { timeout: 15_000 }),
      page.getByRole("button", { name: /Cadastrar membro/i }).click(),
    ]);

    await expect(page.getByText("Carla E2E Atendente")).toBeVisible({ timeout: 15_000 });
  });
});
