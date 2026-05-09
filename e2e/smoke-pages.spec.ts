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
      valorConsultaBase: 200,
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

  // Helper: data local sem hora (evita drift de timezone com @db.Date)
  const dataAt = (offset: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  };

  // Agendamento futuro (+5 dias, pulando FDS pra bater com a logica do teste)
  const futuro = dataAt(5);
  if (futuro.getDay() === 0) futuro.setDate(futuro.getDate() + 1);
  if (futuro.getDay() === 6) futuro.setDate(futuro.getDate() + 2);
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
  const passado = dataAt(-5);
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

  test("configurações turnos — admin edita Manhã e persiste no DB", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");
    await page.goto("/configuracoes/turnos");
    await expect(page.getByText("Manhã", { exact: true })).toBeVisible();
    // Estado inicial: defaults
    await expect(page.getByText("07:00 – 12:59")).toBeVisible();

    // Edita via API direta (page.request herda cookie do login)
    const res = await page.request.put("/api/configuracoes/turnos", {
      data: {
        manha: { inicio: "08:00", fim: "11:59" },
        tarde: { inicio: "13:00", fim: "17:59" },
        noite: { inicio: "18:00", fim: "19:59" },
      },
    });
    expect(res.status()).toBe(200);

    // Persistência no DB
    const cfg = await prisma.configuracao.findUnique({
      where: { chave: "turnos" },
    });
    expect(cfg).not.toBeNull();
    const valor = cfg?.valor as { manha: { inicio: string } };
    expect(valor.manha.inicio).toBe("08:00");

    // Audit log
    const log = await prisma.auditLog.findFirst({
      where: { entidade: "Configuracao", campo: "turnos" },
    });
    expect(log).not.toBeNull();
    expect(log?.motivo).toContain("Configuração de turnos");
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

test.describe("Portal paciente — fluxos reais", () => {
  test("/p home — paciente vê próxima consulta com profissional certo", async ({
    page,
  }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");

    // Verifica via DB que paciente tem agendamentos
    const dbAgendados = await prisma.atendimento.count({
      where: {
        paciente: { email: PACIENTE_EMAIL },
        status: { in: ["agendado", "em_atendimento"] },
      },
    });

    // Aguarda saída do estado "Carregando…"
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Carregando"),
      undefined,
      { timeout: 10_000 },
    );
    // KPI "Próximas consultas" (label do MetricStat)
    await expect(page.getByText("Próximas consultas").first()).toBeVisible();
    await expect(page.getByText("Histórico recente")).toBeVisible();

    if (dbAgendados > 0) {
      await expect(page.getByText(/Sua próxima consulta/i)).toBeVisible();
      await expect(page.getByText("Dr. Smoke").first()).toBeVisible();
    } else {
      // Empty state quando não há próximas
      await expect(page.getByText(/Nenhuma consulta agendada/i)).toBeVisible();
    }
  });

  test("/p/consultas — tabs Próximas / Histórico exibem agendamento + realizado", async ({
    page,
  }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/consultas");
    await expect(
      page.getByRole("heading", { name: /Minhas consultas/i }),
    ).toBeVisible();

    // Tab "Próximas" (default) — espera 1 row do agendamento futuro
    await page.getByText("Dr. Smoke").first().waitFor({ timeout: 5000 });

    // Tab Histórico — espera 1 row do atendimento realizado
    await page.getByRole("button", { name: /Histórico/i }).click();
    await page.getByText("Dr. Smoke").first().waitFor({ timeout: 5000 });

    // DB confirma fixtures
    const dbCount = await prisma.atendimento.count({
      where: {
        paciente: { email: PACIENTE_EMAIL },
        status: { in: ["agendado", "realizado", "em_atendimento"] },
      },
    });
    expect(dbCount).toBeGreaterThanOrEqual(2);
  });

  test("/p/consultas/[id] — paciente cancela próprio agendamento com motivo", async ({
    page,
  }) => {
    // Cria agendamento dedicado pra esse teste (não toca no do fixture)
    const dataParaCancelar = new Date();
    dataParaCancelar.setHours(0, 0, 0, 0);
    dataParaCancelar.setDate(dataParaCancelar.getDate() + 12);
    if (dataParaCancelar.getDay() === 0)
      dataParaCancelar.setDate(dataParaCancelar.getDate() + 1);
    if (dataParaCancelar.getDay() === 6)
      dataParaCancelar.setDate(dataParaCancelar.getDate() + 2);

    const paciente = await prisma.paciente.findFirstOrThrow({
      where: { email: PACIENTE_EMAIL },
    });
    const agCancelavel = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId,
        consultorioId,
        data: dataParaCancelar,
        hora: "15:00",
        valorConsulta: new Prisma.Decimal(0),
      },
    });

    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto(`/p/consultas/${agCancelavel.id}`);
    await expect(page.getByText(/Detalhes da consulta/i)).toBeVisible();

    // Botão Cancelar disponível pra status agendado
    await page.getByRole("button", { name: /Cancelar consulta/i }).click();

    // Form de motivo aparece — preenche e confirma
    await page
      .getByLabel("Motivo")
      .fill("Conflito com viagem de trabalho confirmada hoje");
    await page
      .getByRole("button", { name: /Confirmar cancelamento/i })
      .click();

    // Aguarda o status atualizar na UI (re-fetch após cancel)
    await expect(page.getByText("Cancelado", { exact: false })).toBeVisible({
      timeout: 5000,
    });

    // Persistência: status no DB + audit log com motivo
    const ag = await prisma.atendimento.findUnique({
      where: { id: agCancelavel.id },
    });
    expect(ag?.status).toBe("cancelado");
    expect(ag?.motivoCancelamento).toContain("Conflito com viagem");

    const log = await prisma.auditLog.findFirst({
      where: { entidadeId: agCancelavel.id, campo: "status" },
    });
    expect(log?.valorDepois).toBe("cancelado");
    expect(log?.motivo).toContain("Conflito com viagem");
  });

  test("/p/agendar — wizard 4 etapas: especialidade → profissional → data → horário", async ({
    page,
  }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/agendar");

    // Wizard carregou (fim do bootstrapping)
    await expect(page.getByText(/Etapa 1 de 4/i)).toBeVisible();

    // Etapa 1: Especialidade
    await expect(page.getByText(/Qual especialidade/i)).toBeVisible();
    await page
      .getByRole("button", { name: "Clínica geral", exact: true })
      .click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 2: Profissional
    await expect(page.getByText(/Escolha o profissional/i)).toBeVisible();
    await page.getByRole("button", { name: /Dr\. Smoke/i }).click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 3: Data — clica o 8º dia útil disponível
    await expect(page.getByText(/Qual data prefere/i)).toBeVisible();
    // O wizard renderiza 14 dias úteis. Cada botão tem o nome do dia +
    // a data por extenso ("Quarta-feira" + "13 de mai..."). Pegamos o 8º
    // botão dentro do grid de datas.
    const botoesGrid = page.locator(
      'button:has-text("de "):has(p:has-text("de "))',
    );
    // Fallback simples: pega botões cuja primeira <p> tem dia da semana
    // (todos os 14 cards). Usa o índice 7 (= 8º botão).
    const dataBtns = page
      .locator("button")
      .filter({ hasText: /-feira|sábado|domingo|segunda|terça|quarta|quinta|sexta/i });
    await dataBtns.nth(7).click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 4: Horário
    await expect(page.getByText(/Escolha o horário/i)).toBeVisible();
    await page.getByRole("button", { name: "09:30", exact: true }).click();

    // Resumo na sidebar
    await expect(
      page.getByText("Clínica geral", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Dr. Smoke").first()).toBeVisible();

    // Confirma
    await Promise.all([
      page.waitForURL("**/p/consultas", { timeout: 15_000 }),
      page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
    ]);

    // Persistência no DB
    const ag = await prisma.atendimento.findFirst({
      where: {
        profissionalId,
        hora: "09:30",
        paciente: { email: PACIENTE_EMAIL },
      },
    });
    expect(ag).not.toBeNull();
    expect(ag?.status).toBe("agendado");
  });

  test("/p/agendar — bloqueia horário ocupado pelo mesmo profissional", async ({
    page,
  }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/agendar");

    await expect(page.getByText(/Etapa 1 de 4/i)).toBeVisible();

    // Avança até a etapa Data
    await page
      .getByRole("button", { name: "Clínica geral", exact: true })
      .click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();
    await page.getByRole("button", { name: /Dr\. Smoke/i }).click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Calcula índice do dia que tem agendamento (+5 dias úteis do fixture)
    // — mesma lógica usada no fixture pra criar o agendamento ocupado
    const dataBtns = page
      .locator("button")
      .filter({ hasText: /-feira|sábado|domingo|segunda|terça|quarta|quinta|sexta/i });
    // 5 dias úteis a frente = índice 4 (0=hoje, 1=+1 útil, ..., 4=+5)
    // Mas o wizard pula FDS, então o 5º dia útil é index 4.
    // Para ser consistente com o fixture (dataAt(5) + skip FDS), usamos o
    // mesmo cálculo que o fixture
    const ocupada = new Date();
    ocupada.setHours(0, 0, 0, 0);
    ocupada.setDate(ocupada.getDate() + 5);
    if (ocupada.getDay() === 0) ocupada.setDate(ocupada.getDate() + 1);
    if (ocupada.getDay() === 6) ocupada.setDate(ocupada.getDate() + 2);
    // O wizard renderiza só dias úteis a partir de hoje. Calcula posição:
    let posicao = 0;
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    while (cur.getTime() < ocupada.getTime()) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) posicao++;
      cur.setDate(cur.getDate() + 1);
    }
    await dataBtns.nth(posicao).click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Aguarda fetch de ocupados
    await page.waitForTimeout(800);
    const horario10 = page.getByRole("button", { name: "10:00", exact: true });
    await expect(horario10).toBeDisabled();
  });

  test("/p/perfil — paciente vê próprios dados", async ({ page }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/perfil");
    await expect(
      page.getByRole("main").getByText("Paciente Smoke"),
    ).toBeVisible();
    await expect(page.getByText(PACIENTE_EMAIL)).toBeVisible();
    await expect(page.getByText("11999990000")).toBeVisible();
  });

  test("/p/perfil/editar — paciente atualiza telefone e persiste", async ({
    page,
  }) => {
    await loginAs(page, PACIENTE_EMAIL, PACIENTE_PASSWORD, "/p");
    await page.goto("/p/perfil/editar");
    await expect(page.getByLabel(/Nome completo/i)).toHaveValue(
      "Paciente Smoke",
    );

    const novoTel = "11955554444";
    await page.getByLabel(/Celular/i).fill(novoTel);
    await Promise.all([
      page.waitForURL("**/p/perfil", { timeout: 15_000 }),
      page.getByRole("button", { name: /Salvar alterações/i }).click(),
    ]);

    await expect(page.getByText(novoTel)).toBeVisible();

    const persisted = await prisma.paciente.findFirst({
      where: { email: PACIENTE_EMAIL },
    });
    expect(persisted?.telefone).toBe(novoTel);
  });
});
