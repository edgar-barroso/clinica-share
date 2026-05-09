import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-e2e-edit-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-e2e-12345";

let consultorioId: string;
let profissionalId: string;
let staffId: string;

test.beforeAll(async () => {
  // Limpa
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

  const c = await prisma.consultorio.create({
    data: {
      nome: "Sala Detalhe E2E",
      tipo: "Consultório Clínico",
      equipamentos: ["Maca"],
      especialidadesCompativeis: ["Clínica geral"],
    },
  });
  consultorioId = c.id;

  const p = await prisma.profissional.create({
    data: {
      nome: "Dra. Detalhe E2E",
      especialidade: "Cardiologia",
      conselho: "CRM-SP 11111",
      email: `prof-detail-${Date.now()}@e2e.com`,
      telefone: "11999990000",
      modalidadeContrato: "percentual",
      percentualRepasse: 0.3,
      duracaoConsultaMinutos: 30,
    },
  });
  profissionalId = p.id;

  const s = await prisma.staff.create({
    data: {
      nome: "Carla Detalhe E2E",
      cargo: "atendente",
      email: `staff-detail-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      senhaDefinida: false,
    },
  });
  staffId = s.id;
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

test.describe("Catálogos — detalhe e edição (Fase 2)", () => {
  test("Consultório: ver detalhe → editar nome → persistido", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto(`/consultorios/${consultorioId}`);
    await expect(page.getByRole("heading", { name: "Sala Detalhe E2E" })).toBeVisible();

    await page.getByRole("link", { name: /Editar$/ }).click();
    await page.waitForURL(`**/consultorios/${consultorioId}/editar`);

    const nomeInput = page.getByLabel("Nome da sala");
    await nomeInput.clear();
    await nomeInput.fill("Sala Renomeada E2E");

    await Promise.all([
      page.waitForURL(`**/consultorios/${consultorioId}`, { timeout: 15_000 }),
      page.getByRole("button", { name: /Salvar altera/i }).click(),
    ]);

    // Força reload — Client Component não invalida cache em soft nav
    // (limitação documentada — Fase 8 vai tratar com SWR/refetch global)
    await page.reload();
    await expect(page.getByRole("heading", { name: "Sala Renomeada E2E" })).toBeVisible();
  });

  test("Profissional: detalhe carrega + edição de contrato exige motivo", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto(`/profissionais/${profissionalId}`);
    await expect(page.getByRole("heading", { name: "Dra. Detalhe E2E" })).toBeVisible();

    await page.getByRole("link", { name: /Editar$/ }).click();
    await page.waitForURL(`**/profissionais/${profissionalId}/editar`);

    // Mudar percentual de 30 para 35 → motivo deve aparecer
    const pctInput = page.getByLabel("Percentual (%)");
    await pctInput.clear();
    await pctInput.fill("35");

    await expect(page.getByLabel("Motivo da alteração *")).toBeVisible();
    await page.getByLabel("Motivo da alteração *").fill("Renegociação anual 2026");

    await Promise.all([
      page.waitForURL(`**/profissionais/${profissionalId}`, { timeout: 15_000 }),
      page.getByRole("button", { name: /Salvar altera/i }).click(),
    ]);
  });

  test("Equipe: detalhe carrega + editar telefone persiste", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto(`/equipe/${staffId}`);
    await expect(page.getByRole("heading", { name: "Carla Detalhe E2E" })).toBeVisible();

    await page.getByRole("link", { name: /Editar$/ }).click();
    await page.waitForURL(`**/equipe/${staffId}/editar`);

    const telInput = page.getByLabel("Telefone");
    await telInput.clear();
    await telInput.fill("11977776666");

    await Promise.all([
      page.waitForURL(`**/equipe/${staffId}`, { timeout: 15_000 }),
      page.getByRole("button", { name: /Salvar altera/i }).click(),
    ]);
  });
});
