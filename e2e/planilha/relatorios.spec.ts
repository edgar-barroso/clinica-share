/**
 * COMPROVAÇÃO EM VÍDEO — bloco "Relatórios" da planilha de custos
 * (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * 1 `test()` = 1 requisito = 1 vídeo (`video: "on"` no playwright.config.ts).
 *
 * IMPORTANTE — estes specs NÃO limpam o banco: rodam sobre o cenário já
 * aplicado pela seed (`npm run db:seed`).
 *
 * Todas as telas de relatório fazem fetch automático (useEffect) e nascem
 * com o MÊS ATUAL. Como a seed cobre de 45 dias atrás até 14 dias à frente
 * — e os repasses semanais fechados ficam todos no passado —, cada teste
 * troca o período para a janela semeada antes de conferir os números. Isso
 * deixa o vídeo com valores reais mesmo quando o mês atual está no começo.
 */
import { test, expect, type Page } from "@playwright/test";
import { login, irPara, mostrar } from "./_helpers";

// ---------------------------------------------------------------------------
// Tipos das respostas de API usadas como referência de conferência
// ---------------------------------------------------------------------------

interface DashboardStats {
  receitaBruta: string;
  repassesAbertos: string;
  repassesPagos: string;
  repassesTotal: string;
  qtdRepassesAbertos: number;
  qtdRepassesPagos: number;
  qtdAtendimentosRealizados: number;
  receitaPorDia: { data: string; receita: string }[];
}

interface FinanceiroLinha {
  profissionalId: string;
  profissionalNome: string;
  modalidade: string;
  qtdAtendimentos: number;
  receitaBruta: string;
}

interface FinanceiroResposta {
  linhas: FinanceiroLinha[];
  totais: { qtdAtendimentos: number; receitaBruta: string };
}

interface ConsultorioLinha {
  consultorioId: string;
  nome: string;
  qtdAtendimentos: number;
  receitaTotal: string;
}

interface GratuitaLinha {
  id: string;
  profissional: string;
  paciente: string;
  motivo: string;
  /** RE04/FI06 — cortesia integral vs. abatimento parcial na tabela */
  tipo: "gratuidade" | "desconto";
  /** Preço de tabela */
  valorOriginal: string;
  /** O que foi efetivamente cobrado */
  valorCobrado: string;
  /** valorOriginal − valorCobrado */
  valorDesconto: string;
  gratuito: boolean;
}

interface GratuitasResposta {
  linhas: GratuitaLinha[];
  totalAtendimentos: number;
  totalGratuidades: number;
  totalDescontos: number;
  valorTotalConcedido: string;
}

interface CancelamentoLinha {
  id: string;
  status: "cancelado" | "nao_compareceu";
  profissional: string;
  paciente: string;
  motivo: string;
}

// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function isoHoje(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return iso(d);
}

/** Início da janela semeada: 45 dias atrás (ver prisma/seed.ts). */
function isoInicioJanelaSemeada(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 45);
  return iso(d);
}

/** "R$ 1.234,56" → 1234.56 · "17" → 17 */
function parseNumeroBR(texto: string): number {
  const limpo = texto
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const numero = Number(limpo);
  expect(Number.isFinite(numero), `valor não numérico: "${texto}"`).toBe(true);
  return numero;
}

/**
 * Valor de um KPI do componente `MetricStat` (usado no /dashboard).
 * Estrutura: `<div><p>rótulo</p><div>ícone</div></div><p>valor</p>`.
 */
async function lerMetricStat(page: Page, rotulo: string): Promise<number> {
  const label = page.getByText(rotulo, { exact: true }).first();
  await expect(label).toBeVisible();
  const valor = label.locator("xpath=../following-sibling::p[1]");
  return parseNumeroBR((await valor.innerText()).trim());
}

/**
 * Valor de um KPI dos cards simples dos relatórios.
 * Estrutura: `<p>rótulo</p><p>valor</p>` direto dentro do Card.
 */
async function lerKpiSimples(page: Page, rotulo: string): Promise<number> {
  const label = page.getByText(rotulo, { exact: true }).first();
  await expect(label).toBeVisible();
  const valor = label.locator("xpath=following-sibling::p[1]");
  return parseNumeroBR((await valor.innerText()).trim());
}

/**
 * Preenche Início/Fim de uma página de relatório e espera a resposta da API
 * com o período final. O waiter é armado ANTES do primeiro `fill` porque um
 * dos campos pode já estar no valor desejado (sem `change`, sem refetch).
 */
async function aplicarPeriodo(
  page: Page,
  rotaApi: string,
  inicio: string,
  fim: string,
): Promise<void> {
  const resposta = page.waitForResponse(
    (r) =>
      r.url().includes(rotaApi) &&
      r.url().includes(`dataInicio=${inicio}`) &&
      r.url().includes(`dataFim=${fim}`) &&
      r.ok(),
  );
  await page.getByLabel("Início").fill(inicio);
  await page.getByLabel("Fim").fill(fim);
  await resposta;
  await mostrar(page);
}

/**
 * Troca o /dashboard para "Personalizado" começando na janela semeada.
 * Mantém o Fim que a tela já traz (fim do mês atual) — só um campo muda,
 * logo só um par de refetches. Espera os DOIS endpoints do dashboard.
 */
async function periodoSemeadoNoDashboard(
  page: Page,
): Promise<{ inicio: string; fim: string }> {
  await page.getByRole("button", { name: /^Personalizado$/ }).click();
  const fim = await page.getByLabel("Fim").inputValue();
  const inicio = isoInicioJanelaSemeada();

  const casa = (url: string, base: string) =>
    url.includes(base) &&
    url.includes(`dataInicio=${inicio}`) &&
    url.includes(`dataFim=${fim}`);

  const respostas = Promise.all([
    page.waitForResponse((r) => casa(r.url(), "/api/dashboard?") && r.ok()),
    page.waitForResponse(
      (r) => casa(r.url(), "/api/consultorios/dashboard?") && r.ok(),
    ),
  ]);
  await page.getByLabel("Início").fill(inicio);
  await respostas;
  await mostrar(page);

  return { inicio, fim };
}

async function obterJson<T>(page: Page, url: string): Promise<T> {
  const res = await page.request.get(url);
  expect(res.status(), `GET ${url}`).toBe(200);
  return (await res.json()) as T;
}

// Em dev o Next compila cada rota no primeiro acesso; o default de 60s fica
// apertado para testes que trocam filtros e esperam refetch.
test.beforeEach(() => {
  test.setTimeout(120_000);
});

// ---------------------------------------------------------------------------

test.describe("Planilha de custos — Relatórios", () => {
  test("RE01 — dashboard admin: receita total, repasses em aberto e repasses pagos", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/dashboard", /^Dashboard$/);

    // Os cinco KPIs do painel, com destaque para os três do requisito.
    for (const rotulo of [
      "Receita bruta",
      "Repasses total",
      "Repasses em aberto",
      "Repasses pagos",
      "Profissionais ativos",
    ]) {
      await expect(page.getByText(rotulo, { exact: true })).toBeVisible();
    }
    // CardTitle renderiza <div>, não heading — por isso getByText.
    await expect(page.getByText("Receita por dia")).toBeVisible();
    await mostrar(page);

    const { inicio, fim } = await periodoSemeadoNoDashboard(page);

    const { stats } = await obterJson<{ stats: DashboardStats }>(
      page,
      `/api/dashboard?dataInicio=${inicio}&dataFim=${fim}`,
    );

    // Os três números existem e são maiores que zero na janela semeada.
    expect(Number(stats.receitaBruta)).toBeGreaterThan(0);
    expect(Number(stats.repassesAbertos)).toBeGreaterThan(0);
    expect(Number(stats.repassesPagos)).toBeGreaterThan(0);
    expect(stats.qtdAtendimentosRealizados).toBeGreaterThan(0);
    expect(stats.qtdRepassesAbertos).toBeGreaterThan(0);
    expect(stats.qtdRepassesPagos).toBeGreaterThan(0);
    // Invariante do painel: total = em aberto + pagos.
    expect(Number(stats.repassesTotal)).toBeCloseTo(
      Number(stats.repassesAbertos) + Number(stats.repassesPagos),
      2,
    );

    // E é exatamente isso que a tela mostra (o que o vídeo comprova).
    expect(await lerMetricStat(page, "Receita bruta")).toBeCloseTo(
      Number(stats.receitaBruta),
      2,
    );
    expect(await lerMetricStat(page, "Repasses em aberto")).toBeCloseTo(
      Number(stats.repassesAbertos),
      2,
    );
    expect(await lerMetricStat(page, "Repasses pagos")).toBeCloseTo(
      Number(stats.repassesPagos),
      2,
    );
    expect(await lerMetricStat(page, "Repasses total")).toBeCloseTo(
      Number(stats.repassesTotal),
      2,
    );

    // O gráfico "Receita por dia" tem série no período (não está vazio).
    expect(stats.receitaPorDia.length).toBeGreaterThan(0);
    await expect(
      page.getByText("Sem receita registrada no período."),
    ).toHaveCount(0);
    await mostrar(page);
  });

  test("RE02 — relatório financeiro com filtros por profissional e período", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/relatorios/financeiro", /^Relatório financeiro$/);

    // Colunas do relatório (TableHead é <th> → role columnheader).
    for (const coluna of [
      "Profissional",
      "Modalidade",
      "Atendimentos",
      "Receita bruta",
      "Repasse estimado",
      "Margem clínica",
    ]) {
      await expect(
        page.getByRole("columnheader", { name: coluna, exact: true }),
      ).toBeVisible();
    }

    // Filtros disponíveis: período (Início/Fim) + profissional + consultório.
    await expect(page.locator("#profissional")).toContainText(
      "Todos os profissionais",
    );
    await expect(page.getByLabel("Consultório")).toBeVisible();
    await expect(page.getByLabel("Profissional")).toHaveValue("");

    // (1) Filtro de PERÍODO: janela semeada.
    const inicio = isoInicioJanelaSemeada();
    const fim = isoHoje();
    await aplicarPeriodo(page, "/api/relatorios/financeiro", inicio, fim);

    const semFiltro = await obterJson<FinanceiroResposta>(
      page,
      `/api/relatorios/financeiro?dataInicio=${inicio}&dataFim=${fim}`,
    );
    expect(semFiltro.linhas.length).toBeGreaterThan(1);

    const linhasTabela = page.locator("tbody tr");
    // +1 porque a tabela tem a linha de "Total" no rodapé do tbody.
    await expect(linhasTabela).toHaveCount(semFiltro.linhas.length + 1);
    await mostrar(page);

    // (2) Filtro de PROFISSIONAL: o resultado muda — passa a ter 1 linha.
    const alvo = semFiltro.linhas[0];
    const respostaFiltrada = page.waitForResponse(
      (r) =>
        r.url().includes("/api/relatorios/financeiro") &&
        r.url().includes(`profissionalId=${alvo.profissionalId}`) &&
        r.ok(),
    );
    await page.getByLabel("Profissional").selectOption(alvo.profissionalId);
    await respostaFiltrada;
    await mostrar(page);

    await expect(linhasTabela).toHaveCount(2); // 1 profissional + Total
    await expect(
      page.getByRole("cell", { name: alvo.profissionalNome, exact: true }),
    ).toBeVisible();

    const comFiltro = await obterJson<FinanceiroResposta>(
      page,
      `/api/relatorios/financeiro?dataInicio=${inicio}&dataFim=${fim}&profissionalId=${alvo.profissionalId}`,
    );
    expect(comFiltro.linhas).toHaveLength(1);
    expect(comFiltro.linhas[0].profissionalId).toBe(alvo.profissionalId);
    expect(comFiltro.totais.qtdAtendimentos).toBe(alvo.qtdAtendimentos);
    // Filtrar de fato reduz o consolidado (havia mais de um profissional).
    expect(Number(comFiltro.totais.receitaBruta)).toBeLessThan(
      Number(semFiltro.totais.receitaBruta),
    );
    await mostrar(page);
  });

  test("RE03 — ranking de consultórios por receita (ordem decrescente)", async ({
    page,
  }) => {
    await login(page, "admin");
    // A rota /relatorios/consultorios NÃO existe mais (removida no commit
    // c3effed): o ranking vive na seção de consultórios do /dashboard.
    await irPara(page, "/dashboard", /^Dashboard$/);

    await expect(
      page.getByRole("heading", {
        name: /^Ocupação e receita por consultório$/,
      }),
    ).toBeVisible();
    // "Ranking por receita" é CardTitle (<div>), não heading.
    await expect(page.getByText("Ranking por receita")).toBeVisible();

    const { inicio, fim } = await periodoSemeadoNoDashboard(page);

    const dados = await obterJson<{ linhas: ConsultorioLinha[] }>(
      page,
      `/api/consultorios/dashboard?dataInicio=${inicio}&dataFim=${fim}`,
    );
    expect(dados.linhas.length).toBeGreaterThan(1);

    // A API já entrega ordenado por receita decrescente.
    const receitasApi = dados.linhas.map((l) => Number(l.receitaTotal));
    expect(receitasApi).toEqual([...receitasApi].sort((a, b) => b - a));
    expect(receitasApi[0]).toBeGreaterThan(0);

    // E a tabela na tela reflete a mesma ordem, com a coluna "#" numerada
    // por posição. Só existe uma <table> no /dashboard: o ranking.
    await expect(
      page.getByRole("columnheader", { name: "#", exact: true }),
    ).toBeVisible();
    const linhas = page.locator("table tbody tr");
    await expect(linhas).toHaveCount(dados.linhas.length);

    const posicoes: string[] = [];
    const receitasTela: number[] = [];
    const nomes: string[] = [];
    for (let i = 0; i < dados.linhas.length; i++) {
      const celulas = linhas.nth(i).locator("td");
      posicoes.push((await celulas.nth(0).innerText()).trim());
      nomes.push((await celulas.nth(1).innerText()).trim());
      // Colunas: # | Consultório | Tipo | Atendimentos | Receita | Média | Ocupação
      receitasTela.push(parseNumeroBR(await celulas.nth(4).innerText()));
    }

    expect(posicoes).toEqual(
      Array.from({ length: dados.linhas.length }, (_, i) => String(i + 1)),
    );
    expect(nomes).toEqual(dados.linhas.map((l) => l.nome));
    for (let i = 1; i < receitasTela.length; i++) {
      expect(receitasTela[i]).toBeLessThanOrEqual(receitasTela[i - 1]);
    }
    expect(receitasTela[0]).toBeCloseTo(Number(dados.linhas[0].receitaTotal), 2);
    await mostrar(page);
  });

  test("RE04 — relatório de gratuidades E descontos com motivo registrado", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(
      page,
      "/relatorios/gratuitas-descontos",
      /^Gratuidades & descontos$/,
    );

    // Colunas: o relatório separa preço de tabela, valor cobrado e o quanto
    // foi concedido — desconto parcial deixou de ser invisível.
    for (const coluna of [
      "Data",
      "Tipo",
      "Profissional",
      "Paciente",
      "Motivo",
      "Valor de tabela",
      "Valor cobrado",
      "Desconto",
    ]) {
      await expect(
        page.getByRole("columnheader", { name: coluna, exact: true }),
      ).toBeVisible();
    }

    // Só o Início muda (o Fim que a tela já traz é mantido): dois campos
    // mudando disparam dois fetches concorrentes e o último a responder é
    // quem fica na tela — o que faria os KPIs divergirem do período pedido.
    const inicio = isoInicioJanelaSemeada();
    const fim = await page.getByLabel("Fim").inputValue();
    const resposta = page.waitForResponse(
      (r) =>
        r.url().includes("/api/relatorios/gratuitas") &&
        r.url().includes(`dataInicio=${inicio}`) &&
        r.url().includes(`dataFim=${fim}`) &&
        r.ok(),
    );
    await page.getByLabel("Início").fill(inicio);
    await resposta;
    await mostrar(page);

    const dados = await obterJson<GratuitasResposta>(
      page,
      `/api/relatorios/gratuitas?dataInicio=${inicio}&dataFim=${fim}`,
    );

    expect(dados.linhas.length).toBeGreaterThan(0);
    expect(dados.totalAtendimentos).toBe(dados.linhas.length);

    // Os DOIS tipos de concessão aparecem no mesmo relatório.
    const gratuidades = dados.linhas.filter((l) => l.tipo === "gratuidade");
    const descontos = dados.linhas.filter((l) => l.tipo === "desconto");
    expect(gratuidades.length, "sem gratuidade no período").toBeGreaterThan(0);
    expect(descontos.length, "sem desconto parcial no período").toBeGreaterThan(
      0,
    );
    expect(dados.totalGratuidades).toBe(gratuidades.length);
    expect(dados.totalDescontos).toBe(descontos.length);

    // Todo registro tem motivo textual — "—" é o placeholder de ausência.
    for (const linha of dados.linhas) {
      expect(linha.motivo.trim().length).toBeGreaterThan(0);
      expect(linha.motivo).not.toBe("—");
      expect(linha.profissional.length).toBeGreaterThan(0);
      expect(linha.paciente.length).toBeGreaterThan(0);
    }

    // No desconto parcial o valor concedido é a diferença entre o preço de
    // tabela e o que o paciente pagou (> 0, senão não seria desconto).
    for (const linha of descontos) {
      expect(Number(linha.valorOriginal)).toBeGreaterThan(
        Number(linha.valorCobrado),
      );
      expect(Number(linha.valorDesconto)).toBeCloseTo(
        Number(linha.valorOriginal) - Number(linha.valorCobrado),
        2,
      );
      expect(Number(linha.valorDesconto)).toBeGreaterThan(0);
    }

    // E o total concedido é a soma do que a clínica deixou de faturar.
    const somaConcedida = dados.linhas.reduce(
      (acc, l) => acc + Number(l.valorDesconto),
      0,
    );
    expect(Number(dados.valorTotalConcedido)).toBeCloseTo(somaConcedida, 2);

    // A tela mostra exatamente esses números.
    expect(await lerKpiSimples(page, "Gratuidades")).toBe(
      dados.totalGratuidades,
    );
    expect(await lerKpiSimples(page, "Descontos")).toBe(dados.totalDescontos);
    expect(await lerKpiSimples(page, "Valor total concedido")).toBeCloseTo(
      Number(dados.valorTotalConcedido),
      2,
    );

    await expect(page.locator("tbody tr")).toHaveCount(dados.linhas.length);
    await expect(
      page.getByText(
        `${dados.linhas.length} atendimentos com gratuidade ou desconto`,
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Nenhuma gratuidade ou desconto no período"),
    ).toHaveCount(0);

    // Os dois selos convivem na mesma tabela (é o frame que vale no vídeo).
    // Escopo no tbody: "Desconto" também é nome de coluna no cabeçalho.
    const corpo = page.locator("tbody");
    await expect(
      corpo.getByText("Gratuidade", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      corpo.getByText("Desconto", { exact: true }).first(),
    ).toBeVisible();
    // Os motivos da seed se repetem entre linhas → .first().
    await expect(page.getByText(descontos[0].motivo).first()).toBeVisible();
    await expect(page.getByText(gratuidades[0].motivo).first()).toBeVisible();
    await mostrar(page);
  });

  test("RE05 — relatório de cancelamentos e não comparecimentos com motivos", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/relatorios/cancelamentos", /^Cancelamentos/);

    const inicio = isoInicioJanelaSemeada();
    const fim = isoHoje();
    await aplicarPeriodo(page, "/api/relatorios/cancelamentos", inicio, fim);

    for (const coluna of [
      "Data",
      "Status",
      "Profissional",
      "Paciente",
      "Motivo",
    ]) {
      await expect(
        page.getByRole("columnheader", { name: coluna, exact: true }),
      ).toBeVisible();
    }

    const dados = await obterJson<{
      linhas: CancelamentoLinha[];
      totais: { cancelados: number; naoCompareceu: number; total: number };
    }>(
      page,
      `/api/relatorios/cancelamentos?dataInicio=${inicio}&dataFim=${fim}`,
    );

    expect(dados.totais.total).toBeGreaterThan(0);
    expect(dados.totais.cancelados).toBeGreaterThan(0);
    expect(dados.totais.total).toBe(
      dados.totais.cancelados + dados.totais.naoCompareceu,
    );

    // O motivo é o coração do requisito: todo CANCELADO tem justificativa.
    const cancelados = dados.linhas.filter((l) => l.status === "cancelado");
    expect(cancelados.length).toBeGreaterThan(0);
    for (const linha of cancelados) {
      expect(linha.motivo.trim().length).toBeGreaterThan(0);
      expect(linha.motivo).not.toBe("—");
    }

    // KPIs da tela batem com os totais da API.
    expect(await lerKpiSimples(page, "Total")).toBe(dados.totais.total);
    expect(await lerKpiSimples(page, "Cancelados")).toBe(
      dados.totais.cancelados,
    );
    expect(await lerKpiSimples(page, "Não compareceu")).toBe(
      dados.totais.naoCompareceu,
    );

    await expect(page.locator("tbody tr")).toHaveCount(dados.linhas.length);
    // Motivos da seed se repetem entre linhas → .first().
    await expect(page.getByText(cancelados[0].motivo).first()).toBeVisible();
    await mostrar(page);

    // Nota honesta: `nao_compareceu` não coleta justificativa em lugar
    // nenhum do fluxo (a rota /api/agendamentos/[id]/nao-compareceu não
    // recebe motivo), então essas linhas aparecem com "—". O motivo
    // obrigatório existe de fato só no cancelamento.
  });
});
