/**
 * Smoke tests: garante que cada página carrega sem erro + renderiza
 * o título esperado. Não cobre interação — cada fluxo crítico tem
 * spec dedicada (auth-flow, agenda-flow, atendimento-flow,
 * repasse-flow, dashboard-relatorios-flow, portal-auditoria-flow).
 *
 * Garantia: nenhuma tela quebra silenciosamente em produção.
 */
import { test, expect } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-smoke-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "admin-smoke-12345";
const PACIENTE_EMAIL = `pac-smoke-${Date.now()}@example.com`;
const PACIENTE_PASSWORD = "pac-smoke-12345";
const PROF_EMAIL = `prof-smoke-${Date.now()}@example.com`;
const PROF_PASSWORD = "prof-smoke-12345";

let consultorioId = "";
let profissionalId = "";
let staffId = "";
let agendamentoId = "";
let atendimentoRealizadoId = "";
let repasseId = "";

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

  // Admin
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    },
  });

  // Paciente com User
  const paciente = await prisma.paciente.create({
    data: {
      nome: "Paciente Smoke",
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

  // Profissional com User
  const prof = await prisma.profissional.create({
    data: {
      nome: "Dr. Smoke",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 99000",
      email: `prof-smoke-data-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      percentualRepasse: new Prisma.Decimal(0.3),
      duracaoConsultaMinutos: 30,
    },
  });
  profissionalId = prof.id;
  await prisma.user.create({
    data: {
      email: PROF_EMAIL,
      passwordHash: await bcrypt.hash(PROF_PASSWORD, 10),
      role: "profissional",
      profissionalId: prof.id,
    },
  });

  // Consultório
  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala Smoke",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  consultorioId = cons.id;

  // Staff
  const staff = await prisma.staff.create({
    data: {
      nome: "Staff Smoke",
      cargo: "atendente",
      email: `staff-smoke-${Date.now()}@e2e.com`,
      telefone: "11988880011",
    },
  });
  staffId = staff.id;

  // Agendamento futuro
  const futuro = new Date();
  futuro.setDate(futuro.getDate() + 5);
  const ag = await prisma.atendimento.create({
    data: {
      pacienteId: paciente.id,
      profissionalId: prof.id,
      consultorioId: cons.id,
      data: futuro,
      hora: "10:00",
      valorConsulta: new Prisma.Decimal(0),
    },
  });
  agendamentoId = ag.id;

  // Atendimento realizado
  const passado = new Date();
  passado.setDate(passado.getDate() - 5);
  const realizado = await prisma.atendimento.create({
    data: {
      pacienteId: paciente.id,
      profissionalId: prof.id,
      consultorioId: cons.id,
      data: passado,
      hora: "10:00",
      valorConsulta: new Prisma.Decimal(200),
      status: "realizado",
      statusPagamento: "pago",
    },
  });
  atendimentoRealizadoId = realizado.id;

  // Repasse
  const inicioSemana = new Date(passado);
  inicioSemana.setDate(passado.getDate() - 3);
  const fimSemana = new Date(passado);
  fimSemana.setDate(passado.getDate() + 3);
  const r = await prisma.repasse.create({
    data: {
      profissionalId: prof.id,
      periodoInicio: inicioSemana,
      periodoFim: fimSemana,
      receitaBruta: new Prisma.Decimal(200),
      valorRepasse: new Prisma.Decimal(60),
      atendimentos: { create: [{ atendimentoId: realizado.id }] },
    },
  });
  repasseId = r.id;
});

test.afterAll(async () => {
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

test.describe("Smoke — telas admin/aux/atendente", () => {
  test("dashboard renderiza KPIs", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText(/Repasses total/i)).toBeVisible();
  });

  test("agenda lista renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/agenda");
    await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  });

  test("atendimentos lista renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/atendimentos");
    await expect(
      page.getByRole("heading", { name: /Atendimentos/i }),
    ).toBeVisible();
  });

  test("atendimento detalhe renderiza com info", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto(`/atendimentos/${atendimentoRealizadoId}`);
    await expect(page.getByText("Informações do atendimento")).toBeVisible();
  });

  test("atendimento editar (admin) renderiza form FI11", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto(`/atendimentos/${atendimentoRealizadoId}/editar`);
    await expect(page.getByText(/Edição pós-realizado/i)).toBeVisible();
    await expect(page.getByLabel(/Valor cobrado/i)).toBeVisible();
  });

  test("consultorios lista renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/consultorios");
    await expect(
      page.getByRole("heading", { name: /Consultórios/i }),
    ).toBeVisible();
  });

  test("profissionais lista renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/profissionais");
    await expect(
      page.getByRole("heading", { name: /Profissionais/i }),
    ).toBeVisible();
  });

  test("equipe lista renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/equipe");
    await expect(page.getByRole("heading", { name: /Equipe/i })).toBeVisible();
  });

  test("repasse detalhe renderiza com cálculo", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto(`/financeiro/repasses/${repasseId}`);
    await expect(page.getByText("Receita bruta")).toBeVisible();
    await expect(page.getByText("Valor do repasse")).toBeVisible();
  });

  test("/financeiro redireciona para /financeiro/repasses", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/financeiro");
    await page.waitForURL("**/financeiro/repasses", { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Repasses/i }),
    ).toBeVisible();
  });

  test("relatórios hub renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/relatorios");
    await expect(page.getByRole("heading", { name: /Relatórios/i })).toBeVisible();
  });

  test("relatório financeiro renderiza tabela", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/relatorios/financeiro");
    await expect(page.getByText("Por profissional", { exact: true })).toBeVisible();
  });

  test("relatório consultórios renderiza ranking", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/relatorios/consultorios");
    await expect(page.getByRole("heading", { name: /Ranking/i })).toBeVisible();
  });

  test("relatório gratuitas renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/relatorios/gratuitas-descontos");
    await expect(
      page.getByRole("heading", { name: /Gratuidades/i }),
    ).toBeVisible();
  });

  test("relatório cancelamentos renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/relatorios/cancelamentos");
    await expect(
      page.getByRole("heading", { name: /Cancelamentos/i }),
    ).toBeVisible();
  });

  test("auditoria renderiza com filtros", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/auditoria");
    await expect(page.getByRole("heading", { name: /Auditoria/i })).toBeVisible();
    await expect(page.getByLabel(/Entidade/i)).toBeVisible();
  });

  test("configurações hub renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/configuracoes");
    await expect(
      page.getByRole("heading", { name: /Configurações/i }),
    ).toBeVisible();
  });

  test("configurações turnos renderiza defaults", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/configuracoes/turnos");
    await expect(page.getByText("Manhã", { exact: true })).toBeVisible();
    await expect(page.getByText("07:00 – 12:59")).toBeVisible();
  });

  test("configurações integrações renderiza", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/configuracoes/integracoes");
    await expect(
      page.getByRole("heading", { name: /Integrações/i }),
    ).toBeVisible();
  });
});

test.describe("Smoke — telas profissional", () => {
  test("minha-agenda renderiza para profissional logado", async ({ page }) => {
    await loginAs(page, PROF_EMAIL, PROF_PASSWORD, "/dashboard");
    await page.goto("/minha-agenda");
    await expect(
      page.getByRole("heading", { name: /Minha agenda/i }),
    ).toBeVisible();
  });
});

test.describe("Smoke — portal paciente", () => {
  test("/p (home) renderiza próximas + histórico", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await expect(page.getByText(/Próximas consultas/i)).toBeVisible();
  });

  test("/p/consultas renderiza lista", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/consultas");
    await expect(
      page.getByRole("heading", { name: /Minhas consultas/i }),
    ).toBeVisible();
  });

  test("/p/consultas/[id] renderiza detalhe", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto(`/p/consultas/${agendamentoId}`);
    await expect(page.getByText(/Detalhes da consulta/i)).toBeVisible();
  });

  test("/p/agendar renderiza wizard", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/agendar");
    await expect(
      page.getByRole("heading", { name: /Agendar consulta/i }),
    ).toBeVisible();
  });

  test("/p/perfil renderiza dados do paciente", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/perfil");
    await expect(
      page.getByRole("main").getByText("Paciente Smoke"),
    ).toBeVisible();
    await expect(page.getByText(PACIENTE_EMAIL)).toBeVisible();
  });

  test("/p/perfil/editar renderiza form", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/perfil/editar");
    await expect(page.getByLabel(/Nome completo/i)).toBeVisible();
  });
});
