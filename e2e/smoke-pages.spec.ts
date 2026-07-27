/**
 * Smoke tests: garante que cada página carrega sem erro + renderiza
 * o título esperado. Não cobre interação — cada fluxo crítico tem
 * spec dedicada (auth-flow, agenda-flow, atendimento-flow,
 * repasse-flow, dashboard-relatorios-flow, portal-auditoria-flow).
 *
 * Garantia: nenhuma tela quebra silenciosamente em produção.
 */
import { test, expect, type Page } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import {
  escolherDiaNoCalendario,
  horariosLivres,
  isoLocal,
  primeiroDiaUtilDoMesSeguinte,
  rotuloDiaCalendario,
} from "./helpers/calendario";

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
/** Data (YYYY-MM-DD) do agendamento de 10:00 criado no fixture. */
let dataOcupadaIso = "";

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

  // Turnos fixos (seg–sex, manhã) na Sala Smoke.
  // Sem turno fixo o `<MonthlyCalendar>` do /p/agendar desabilita TODOS os
  // dias (`diasUteisAtende` fica vazio) e o backend recusa o POST — os dois
  // testes do wizard dependem disso.
  await prisma.turnoFixo.createMany({
    data: [1, 2, 3, 4, 5].map((diaSemana) => ({
      profissionalId: prof.id,
      consultorioId: cons.id,
      diaSemana,
      turno: "manha" as const,
    })),
  });

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
  dataOcupadaIso = isoLocal(futuro);
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
      atendimentos: { connect: [{ id: realizado.id }] },
    },
  });
  repasseId = r.id;
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAs(
  page: Page,
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
    // `exact`: a nota do card ("A receita bruta soma consulta + procedimentos
    // extras…") também contém o termo.
    await expect(page.getByText("Receita bruta", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Valor do repasse", { exact: true }),
    ).toBeVisible();
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

  // A rota /relatorios/consultorios foi removida no commit c3effed: o ranking
  // de consultórios (UC002) passou a viver dentro do /dashboard, na seção
  // "Ocupação e receita por consultório".
  test("dashboard renderiza ranking de consultórios (UC002)", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/dashboard");

    await expect(
      page.getByRole("heading", { name: "Ocupação e receita por consultório" }),
    ).toBeVisible({ timeout: 20_000 });
    // O CardTitle do ranking é uma <div>, não um heading — daí o getByText.
    await expect(page.getByText("Ranking por receita")).toBeVisible();
    // KPIs e filtro da seção: provam que os dados de ocupação carregaram,
    // não só que o título estático foi pintado.
    await expect(page.getByText("Taxa de ocupação média")).toBeVisible();
    await expect(page.getByText("Receita dos consultórios")).toBeVisible();
    await expect(page.getByLabel("Modalidade de contrato")).toBeVisible();

    // A rota antiga não existe mais.
    const resp = await page.request.get("/relatorios/consultorios");
    expect(resp.status()).toBe(404);
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

  // Não existe smoke de "/configuracoes/integracoes": essa tela nunca foi
  // construída. O diretório `configuracoes/` tem só `page.tsx` (o hub) e
  // `turnos/`, e o hub não linka nada além de turnos. O teste que existia
  // aqui cobria uma rota inexistente — foi removido em vez de virar um
  // mock de tela que não é produto.
});

test.describe("Smoke — telas profissional", () => {
  test("minha-agenda renderiza para profissional logado", async ({ page }) => {
    await loginAs(page, PROF_EMAIL, PROF_PASSWORD, "/minha-agenda");
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

    // Etapa 3: Data — calendário mensal. Escolhe o primeiro dia útil do mês
    // SEGUINTE: lá não há nenhum fixture, então nada disputa o slot.
    await expect(page.getByText(/Qual data prefere/i)).toBeVisible();
    const dataAlvo = primeiroDiaUtilDoMesSeguinte();
    await escolherDiaNoCalendario(page, dataAlvo);
    // O wizard ecoa a data escolhida ("Selecionado: …" e no Resumo).
    await expect(
      page.getByText(rotuloDiaCalendario(dataAlvo)).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 4: Horário — a grade sai da duração do profissional cruzada com
    // os blocos de /configuracoes/turnos, então cravar "09:30" quebra a cada
    // mudança de faixa. Pega o primeiro slot realmente habilitado.
    await expect(page.getByText(/Escolha o horário/i)).toBeVisible();
    const slots = horariosLivres(page);
    await expect(slots.first()).toBeVisible();
    const horaEscolhida = (await slots.first().innerText()).trim();
    await slots.first().click();

    // Resumo na sidebar
    await expect(
      page.getByText("Clínica geral", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Dr. Smoke").first()).toBeVisible();
    await expect(
      page.locator("aside").getByText(horaEscolhida, { exact: true }),
    ).toBeVisible();

    const antes = await prisma.atendimento.count({
      where: { paciente: { email: PACIENTE_EMAIL } },
    });

    // Confirma
    await Promise.all([
      page.waitForURL("**/p/consultas", { timeout: 15_000 }),
      page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
    ]);

    // Persistência no DB
    const ag = await prisma.atendimento.findFirst({
      where: {
        profissionalId,
        hora: horaEscolhida,
        status: "agendado",
        paciente: { email: PACIENTE_EMAIL },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(ag).not.toBeNull();
    expect(ag?.status).toBe("agendado");
    // A sala não é escolhida pelo paciente: vem do turno fixo do profissional.
    expect(ag?.consultorioId).toBe(consultorioId);
    // E é uma consulta NOVA, não a do fixture.
    const depois = await prisma.atendimento.count({
      where: { paciente: { email: PACIENTE_EMAIL } },
    });
    expect(depois).toBe(antes + 1);
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

    // Etapa 3: Data — vai no calendário mensal exatamente no dia em que o
    // fixture já deixou um agendamento às 10:00 para este profissional.
    await expect(page.getByText(/Qual data prefere/i)).toBeVisible();
    await escolherDiaNoCalendario(page, dataOcupadaIso);
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 4: o slot ocupado vem desabilitado…
    await expect(page.getByText(/Escolha o horário/i)).toBeVisible();
    const horario10 = page.getByRole("button", { name: "10:00", exact: true });
    await expect(horario10).toBeDisabled({ timeout: 10_000 });
    // …e o bloqueio é só dele: o resto da grade continua clicável (senão o
    // teste passaria mesmo se a grade inteira estivesse travada).
    await expect(horariosLivres(page).first()).toBeVisible();
    expect(await horariosLivres(page).count()).toBeGreaterThan(0);
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
