/**
 * E2E do cadastro de paciente pelo atendente/admin via dialog.
 *
 * Cobre:
 * - admin pela tela /pacientes (botão no header)
 * - atendente pela tela /agenda/novo (PacienteCombobox → "Cadastrar novo paciente")
 *
 * Em ambos: dialog abre, form submete, API retorna 201, tela final
 * exibe a senha temporária no formato esperado, paciente + User ficam
 * no DB e a senha realmente loga.
 */
import { test, expect } from "@playwright/test";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-cadpac-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-cadpac-12345";
const ATENDENTE_EMAIL = `atend-cadpac-${Date.now()}@example.com`;
const ATENDENTE_PASSWORD = "atend-cadpac-12345";

let temProfissional = false;
let temConsultorio = false;

test.beforeAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: "cadpac-" } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: "novo-paciente-e2e-" } },
  });
  await prisma.paciente.deleteMany({
    where: { email: { contains: "novo-paciente-e2e-" } },
  });
  await prisma.staff.deleteMany({
    where: { email: { contains: "cadpac-" } },
  });

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    },
  });

  const staff = await prisma.staff.create({
    data: {
      nome: "Atendente Cadpac",
      cargo: "atendente",
      email: ATENDENTE_EMAIL,
      telefone: "11900000000",
    },
  });
  await prisma.user.create({
    data: {
      email: ATENDENTE_EMAIL,
      passwordHash: await bcrypt.hash(ATENDENTE_PASSWORD, 10),
      role: "atendente",
      staffId: staff.id,
    },
  });

  temProfissional = !!(await prisma.profissional.findFirst());
  temConsultorio = !!(await prisma.consultorio.findFirst());
});

test.afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [ADMIN_EMAIL, ATENDENTE_EMAIL] } },
  });
  await prisma.staff.deleteMany({ where: { email: ATENDENTE_EMAIL } });
  await prisma.$disconnect();
});

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  expectedUrl: string,
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await Promise.all([
    page.waitForURL(`**${expectedUrl}`, { timeout: 15_000 }),
    page.getByRole("button", { name: /^Entrar$/ }).click(),
  ]);
}

test.describe("Cadastro de paciente via dialog", () => {
  test("admin via /pacientes — POST 201 + senha temporária + user logável", async ({
    page,
  }) => {
    const novoEmail = `novo-paciente-e2e-admin-${Date.now()}@example.com`;
    const novoNome = "Paciente E2E Admin";
    const novoTelefone = "11999991111";

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/pacientes");
    await expect(
      page.getByRole("heading", { name: /^Pacientes$/ }),
    ).toBeVisible();

    // Abre dialog
    await page
      .getByRole("button", { name: /Cadastrar paciente/i })
      .first()
      .click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    // Preenche e submete
    await dialog.getByLabel(/Nome completo/i).fill(novoNome);
    await dialog.getByLabel(/Celular/i).fill(novoTelefone);
    await dialog.getByLabel(/E-mail/i).fill(novoEmail);
    const submit = dialog.locator('button[type="submit"]');
    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/pacientes") &&
          r.request().method() === "POST",
      ),
      submit.click(),
    ]);
    expect(resp.status()).toBe(201);

    // Tela de senha aparece
    await expect(page.getByText(/anote a senha temporária/i)).toBeVisible();
    const senha = (await page.locator("code").first().textContent())?.trim();
    expect(senha).toMatch(/^[A-Za-z2-9]{8}$/);

    // DB: paciente + User
    const paciente = await prisma.paciente.findUnique({
      where: { email: novoEmail },
    });
    expect(paciente?.nome).toBe(novoNome);
    const user = await prisma.user.findUnique({ where: { email: novoEmail } });
    expect(user?.role).toBe("paciente");
    expect(user?.pacienteId).toBe(paciente?.id);
    expect(await bcrypt.compare(senha!, user!.passwordHash!)).toBe(true);

    // Conclui dialog
    await page.getByRole("button", { name: /Já anotei/i }).click();
    // Confirma via busca pelo email (cai em qualquer página da paginação)
    await page.getByLabel(/Buscar pacientes/i).fill(novoEmail);
    await expect(page.getByText(novoNome).first()).toBeVisible({
      timeout: 10_000,
    });

    // Cleanup
    await prisma.user.deleteMany({ where: { email: novoEmail } });
    await prisma.paciente.deleteMany({ where: { email: novoEmail } });
  });

  test("atendente via /agenda/novo (PacienteCombobox)", async ({ page }) => {
    test.skip(
      !temProfissional || !temConsultorio,
      "DB sem profissional/consultório para abrir /agenda/novo",
    );

    const novoEmail = `novo-paciente-e2e-atend-${Date.now()}@example.com`;
    const novoNome = "Paciente E2E Atendente";
    const novoTelefone = "11999992222";

    await loginAs(page, ATENDENTE_EMAIL, ATENDENTE_PASSWORD, "/agenda");
    await page.goto("/agenda/novo");
    await expect(page.getByText(/Novo agendamento/i)).toBeVisible();

    // Abre o combobox (botão com id="paciente")
    await page.locator("#paciente").click();

    // No dropdown do combobox, clica em "Cadastrar novo paciente"
    await page
      .getByRole("button", { name: /Cadastrar novo paciente/i })
      .click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Nome completo/i).fill(novoNome);
    await dialog.getByLabel(/Celular/i).fill(novoTelefone);
    await dialog.getByLabel(/E-mail/i).fill(novoEmail);

    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/pacientes") &&
          r.request().method() === "POST",
      ),
      dialog.locator('button[type="submit"]').click(),
    ]);
    expect(resp.status()).toBe(201);

    await expect(page.getByText(/anote a senha temporária/i)).toBeVisible();
    const senha = (await page.locator("code").first().textContent())?.trim();
    expect(senha).toMatch(/^[A-Za-z2-9]{8}$/);

    const paciente = await prisma.paciente.findUnique({
      where: { email: novoEmail },
    });
    expect(paciente?.nome).toBe(novoNome);
    const user = await prisma.user.findUnique({ where: { email: novoEmail } });
    expect(user?.role).toBe("paciente");
    expect(await bcrypt.compare(senha!, user!.passwordHash!)).toBe(true);

    // Após "Já anotei", o combobox deve fechar e o paciente passar a ser
    // o selecionado (botão do combobox mostra "Nome — Telefone").
    await page.getByRole("button", { name: /Já anotei/i }).click();
    await expect(page.locator("#paciente")).toContainText(novoNome, {
      timeout: 5_000,
    });

    // Cleanup — também precisa garantir que não tem agendamento residual
    await prisma.atendimento.deleteMany({
      where: { paciente: { email: novoEmail } },
    });
    await prisma.user.deleteMany({ where: { email: novoEmail } });
    await prisma.paciente.deleteMany({ where: { email: novoEmail } });
  });

  // Suprime warning de Prisma não usado nos imports (usado pra Decimal eventualmente).
  test.skip("__noop__", () => {
    void Prisma;
  });
});
