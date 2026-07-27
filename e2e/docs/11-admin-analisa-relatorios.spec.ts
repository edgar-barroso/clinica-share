/**
 * Jornada 11 — O administrador revisa os números do mês.
 * Cobre: [RE01], [CO04], [RE03], [RE02], [RE04], [RE05] (e [RF-021] no login).
 * Persona: ADMINISTRADOR · Roberto Lima.
 *
 * Um passo por relatório. Cada passo mostra a tela, confere o que está nela
 * contra a resposta da API que a alimentou e destaca o número que responde à
 * pergunta do gestor.
 *
 * DETALHE DE PERÍODO: todas essas telas nascem no MÊS ATUAL e a base cobre de
 * 45 dias atrás até 14 dias à frente. No começo de um mês o mês atual quase
 * não tem movimento — por isso a jornada amplia o período para a janela com
 * dados antes de conferir qualquer número, e isso é narrado.
 */
import type { Locator, Page } from "@playwright/test";
import {
  test,
  expect,
  brl,
  ELENCO,
  entrarComo,
  isoInicioJanelaSemeada,
  lerJson,
  numeroBR,
} from "./_support";

interface DashboardStatsApi {
  receitaBruta: string;
  repassesAbertos: string;
  repassesPagos: string;
  repassesTotal: string;
  qtdRepassesAbertos: number;
  qtdRepassesPagos: number;
  qtdAtendimentosRealizados: number;
  receitaPorDia: { data: string; receita: string }[];
}

interface ConsultorioRankApi {
  consultorioId: string;
  nome: string;
  tipo: string;
  qtdAtendimentos: number;
  receitaTotal: string;
  taxaOcupacao: number;
}

interface DashboardConsultoriosApi {
  kpis: {
    totalAtendimentos: number;
    receitaTotal: string;
    taxaOcupacaoMedia: number;
  };
  linhas: ConsultorioRankApi[];
}

interface FinanceiroApi {
  linhas: {
    profissionalId: string;
    profissionalNome: string;
    modalidade: string;
    qtdAtendimentos: number;
    receitaBruta: string;
    repasseEstimado: string;
    margemClinica: string;
  }[];
  totais: {
    qtdAtendimentos: number;
    receitaBruta: string;
    repasseEstimado: string;
    margemClinica: string;
  };
}

interface GratuitasApi {
  linhas: {
    tipo: "gratuidade" | "desconto";
    motivo: string;
    valorOriginal: string;
    valorCobrado: string;
    valorDesconto: string;
  }[];
  totalAtendimentos: number;
  totalGratuidades: number;
  totalDescontos: number;
  valorTotalConcedido: string;
}

interface CancelamentosApi {
  linhas: {
    status: "cancelado" | "nao_compareceu";
    profissional: string;
    paciente: string;
    motivo: string;
  }[];
  totais: { cancelados: number; naoCompareceu: number; total: number };
}

// ---------------------------------------------------------------------------
// Leitura dos KPIs direto da tela — é o número que o vídeo mostra, então é
// esse que precisa bater com a API.
// ---------------------------------------------------------------------------

/** `<MetricStat>` do /dashboard: `<div><p>rótulo</p><ícone></div><p>valor</p>`. */
function blocoMetrica(page: Page, rotulo: string): Locator {
  return page.getByText(rotulo, { exact: true }).first().locator("xpath=../..");
}

async function valorMetrica(page: Page, rotulo: string): Promise<number> {
  const label = page.getByText(rotulo, { exact: true }).first();
  await expect(label).toBeVisible();
  return numeroBR(
    (await label.locator("xpath=../following-sibling::p[1]").innerText()).trim(),
  );
}

/** Card simples dos relatórios: `<p>rótulo</p><p>valor</p>` dentro do Card. */
function blocoKpi(page: Page, rotulo: string): Locator {
  return page.getByText(rotulo, { exact: true }).first().locator("xpath=..");
}

async function valorKpi(page: Page, rotulo: string): Promise<number> {
  const label = page.getByText(rotulo, { exact: true }).first();
  await expect(label).toBeVisible();
  return numeroBR(
    (await label.locator("xpath=following-sibling::p[1]").innerText()).trim(),
  );
}

/** Rodapé consolidado do relatório financeiro (a última linha do tbody). */
function linhaTotal(page: Page): Locator {
  return page
    .getByRole("cell", { name: "Total", exact: true })
    .locator("xpath=ancestor::tr[1]");
}

/**
 * Amplia o período de uma tela de relatório mexendo SÓ no campo "Início".
 * Mexer nos dois campos dispara dois fetches concorrentes e quem responde por
 * último é quem fica na tela — os KPIs poderiam divergir do período pedido.
 * Devolve o "Fim" que a tela já trazia, para conferir a API com o mesmo par.
 */
async function ampliarPeriodo(
  page: Page,
  rotaApi: string,
  inicio: string,
): Promise<string> {
  const fim = await page.getByLabel("Fim").inputValue();
  const resposta = page.waitForResponse(
    (r) =>
      r.url().includes(rotaApi) &&
      r.url().includes(`dataInicio=${inicio}`) &&
      r.url().includes(`dataFim=${fim}`) &&
      r.ok(),
  );
  await page.getByLabel("Início").fill(inicio);
  await resposta;
  return fim;
}

test("11 — Administrador analisa os relatórios do período", async ({
  page,
  jornada,
}) => {
  await jornada.abrir({
    persona: ELENCO.admin.persona,
    objetivo:
      "Roberto quer o retrato do período: quanto entrou, para onde foi, quais salas se pagam e o que a clínica deixou de faturar.",
    ids: ["RE01", "CO04", "RE03", "RE02", "RE04", "RE05"],
    precondicoes: [
      "A clínica já tem semanas de atendimentos registrados, com repasses pagos e em aberto",
      "Houve cancelamentos, faltas, cortesias e descontos — todos com motivo registrado",
    ],
  });

  await entrarComo(page, jornada, "admin");

  const inicio = isoInicioJanelaSemeada();

  // Preenchido no passo [RE01] e reaproveitado nos passos seguintes do
  // /dashboard (o "Fim" é o que a própria tela traz).
  const periodo = { inicio, fim: "" };
  const resumo = {
    receitaBruta: 0,
    atendimentos: 0,
    repassesAbertos: 0,
    repassesPagos: 0,
    consultorioLider: "",
    receitaLider: 0,
    gratuidades: 0,
    descontos: 0,
    concedido: 0,
    cancelamentos: 0,
  };

  // =====================================================================
  // [RE01] — o painel da clínica
  // =====================================================================
  await jornada.passo(
    "[RE01] Roberto abre o painel da clínica: receita bruta, repasses em aberto e repasses pagos",
    async () => {
      // O login já deixou Roberto no painel — nada de recarregar a página.
      await expect(
        page.getByRole("heading", { name: /^Dashboard$/ }),
      ).toBeVisible();

      for (const rotulo of [
        "Receita bruta",
        "Repasses total",
        "Repasses em aberto",
        "Repasses pagos",
        "Profissionais ativos",
      ]) {
        await expect(page.getByText(rotulo, { exact: true })).toBeVisible({
          timeout: 20_000,
        });
      }
      // "Receita por dia" é CardTitle (<div>), não heading.
      await expect(page.getByText("Receita por dia")).toBeVisible();

      // O painel nasce no mês atual. Roberto amplia para o período que tem
      // movimento — os dois endpoints do painel refazem a consulta.
      await page.getByRole("button", { name: /^Personalizado$/ }).click();
      const fim = await page.getByLabel("Fim").inputValue();
      periodo.fim = fim;

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

      const { stats } = await lerJson<{ stats: DashboardStatsApi }>(
        page,
        `/api/dashboard?dataInicio=${inicio}&dataFim=${fim}`,
      );
      resumo.receitaBruta = Number(stats.receitaBruta);
      resumo.atendimentos = stats.qtdAtendimentosRealizados;
      resumo.repassesAbertos = Number(stats.repassesAbertos);
      resumo.repassesPagos = Number(stats.repassesPagos);

      expect(resumo.receitaBruta).toBeGreaterThan(0);
      expect(resumo.repassesAbertos).toBeGreaterThan(0);
      expect(resumo.repassesPagos).toBeGreaterThan(0);
      // Invariante do painel: o total é a soma dos dois lados.
      expect(Number(stats.repassesTotal)).toBeCloseTo(
        resumo.repassesAbertos + resumo.repassesPagos,
        2,
      );
      // E é exatamente isso que está impresso na tela.
      expect(await valorMetrica(page, "Receita bruta")).toBeCloseTo(
        resumo.receitaBruta,
        2,
      );
      expect(await valorMetrica(page, "Repasses em aberto")).toBeCloseTo(
        resumo.repassesAbertos,
        2,
      );
      expect(await valorMetrica(page, "Repasses pagos")).toBeCloseTo(
        resumo.repassesPagos,
        2,
      );

      await jornada.validar(
        blocoMetrica(page, "Receita bruta"),
        `${brl(resumo.receitaBruta)} de receita bruta em ${resumo.atendimentos} atendimentos realizados`,
      );
      await jornada.validar(
        blocoMetrica(page, "Repasses em aberto"),
        `${brl(resumo.repassesAbertos)} ainda a pagar (${stats.qtdRepassesAbertos} repasses) contra ${brl(resumo.repassesPagos)} já liquidados`,
      );
    },
  );

  // =====================================================================
  // [CO04][RE03] — ocupação e receita por consultório
  // =====================================================================
  await jornada.passo(
    "[CO04][RE03] Ocupação e receita por consultório: o ranking mostra quais salas sustentam a clínica",
    async () => {
      await expect(
        page.getByRole("heading", {
          name: /^Ocupação e receita por consultório$/,
        }),
      ).toBeVisible();
      // "Ranking por receita" é CardTitle (<div>), não heading.
      await expect(page.getByText("Ranking por receita")).toBeVisible();
      // O gestor consegue recortar por modalidade de contrato e levar embora.
      await expect(page.getByLabel("Modalidade de contrato")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Exportar CSV/ }),
      ).toBeEnabled();

      for (const coluna of [
        "#",
        "Consultório",
        "Tipo",
        "Atendimentos",
        "Receita",
        "Média/atend.",
        "Ocupação",
      ]) {
        await expect(
          page.getByRole("columnheader", { name: coluna, exact: true }),
        ).toBeVisible();
      }

      const dados = await lerJson<DashboardConsultoriosApi>(
        page,
        `/api/consultorios/dashboard?dataInicio=${periodo.inicio}&dataFim=${periodo.fim}`,
      );
      expect(dados.linhas.length).toBeGreaterThan(1);
      resumo.consultorioLider = dados.linhas[0].nome;
      resumo.receitaLider = Number(dados.linhas[0].receitaTotal);

      // Ordem decrescente lida da TELA, não só da API: é a ordem que o vídeo
      // mostra. Colunas: # | Consultório | Tipo | Atendimentos | Receita | …
      const linhas = page.locator("table tbody tr");
      await expect(linhas).toHaveCount(dados.linhas.length);
      const nomes: string[] = [];
      const receitas: number[] = [];
      for (let i = 0; i < dados.linhas.length; i++) {
        const celulas = linhas.nth(i).locator("td");
        expect((await celulas.nth(0).innerText()).trim()).toBe(String(i + 1));
        nomes.push((await celulas.nth(1).innerText()).trim());
        receitas.push(numeroBR(await celulas.nth(4).innerText()));
      }
      expect(nomes).toEqual(dados.linhas.map((l) => l.nome));
      for (let i = 1; i < receitas.length; i++) {
        expect(receitas[i]).toBeLessThanOrEqual(receitas[i - 1]);
      }
      expect(receitas[0]).toBeCloseTo(resumo.receitaLider, 2);

      await jornada.validar(
        linhas.first(),
        `1º lugar: ${resumo.consultorioLider} com ${brl(resumo.receitaLider)} — a lista vem ordenada da maior para a menor receita`,
      );
    },
  );

  // =====================================================================
  // [RE02] — relatório financeiro por profissional
  // =====================================================================
  const financeiro = {
    profissional: "",
    profissionalId: "",
    totalGeral: 0,
    /** "Fim" que a própria tela do relatório trazia. */
    fim: "",
  };

  await jornada.passo(
    "[RE02] Da central de relatórios ao financeiro: receita, repasse estimado e margem por profissional",
    async () => {
      await page.goto("/relatorios");
      await expect(
        page.getByRole("heading", { name: /^Relatórios$/ }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: /Financeiro por profissional/ })
        .click();
      await page.waitForURL("**/relatorios/financeiro", { timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: /^Relatório financeiro$/ }),
      ).toBeVisible();

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

      financeiro.fim = await ampliarPeriodo(
        page,
        "/api/relatorios/financeiro",
        inicio,
      );
      const semFiltro = await lerJson<FinanceiroApi>(
        page,
        `/api/relatorios/financeiro?dataInicio=${inicio}&dataFim=${financeiro.fim}`,
      );
      expect(
        semFiltro.linhas.length,
        "o filtro por profissional só prova algo com mais de um na lista",
      ).toBeGreaterThan(1);
      financeiro.profissional = semFiltro.linhas[0].profissionalNome;
      financeiro.profissionalId = semFiltro.linhas[0].profissionalId;
      financeiro.totalGeral = Number(semFiltro.totais.receitaBruta);

      // +1 no tbody: a última linha é o rodapé "Total".
      await expect(page.locator("tbody tr")).toHaveCount(
        semFiltro.linhas.length + 1,
      );

      await jornada.validar(
        linhaTotal(page),
        `${semFiltro.linhas.length} profissionais no período: ${brl(financeiro.totalGeral)} de receita bruta, ${brl(Number(semFiltro.totais.repasseEstimado))} de repasse e ${brl(Number(semFiltro.totais.margemClinica))} de margem`,
      );
    },
  );

  await jornada.passo(
    `[RE02] Roberto filtra um profissional — ${financeiro.profissional} — e o relatório inteiro muda`,
    async () => {
      const resposta = page.waitForResponse(
        (r) =>
          r.url().includes("/api/relatorios/financeiro") &&
          r.url().includes(`profissionalId=${financeiro.profissionalId}`) &&
          r.ok(),
      );
      await page
        .getByLabel("Profissional")
        .selectOption(financeiro.profissionalId);
      await resposta;

      // Sobra uma linha de profissional + o rodapé "Total".
      await expect(page.locator("tbody tr")).toHaveCount(2);
      await expect(
        page.getByRole("cell", {
          name: financeiro.profissional,
          exact: true,
        }),
      ).toBeVisible();

      const comFiltro = await lerJson<FinanceiroApi>(
        page,
        `/api/relatorios/financeiro?dataInicio=${inicio}&dataFim=${financeiro.fim}&profissionalId=${financeiro.profissionalId}`,
      );
      expect(comFiltro.linhas).toHaveLength(1);
      expect(comFiltro.linhas[0].profissionalId).toBe(
        financeiro.profissionalId,
      );
      // Filtrar de fato recorta: o consolidado encolhe.
      expect(Number(comFiltro.totais.receitaBruta)).toBeLessThan(
        financeiro.totalGeral,
      );

      await jornada.validar(
        linhaTotal(page),
        `Só ${financeiro.profissional}: ${brl(Number(comFiltro.totais.receitaBruta))} de ${brl(financeiro.totalGeral)} — o total acompanha o filtro`,
      );
    },
  );

  // =====================================================================
  // [RE04] — gratuidades e descontos
  // =====================================================================
  await jornada.passo(
    "[RE04] Gratuidades e descontos: quanto a clínica deixou de faturar, e por quê",
    async () => {
      await page.goto("/relatorios/gratuitas-descontos");
      await expect(
        page.getByRole("heading", { name: /^Gratuidades & descontos$/ }),
      ).toBeVisible();

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

      const fim = await ampliarPeriodo(
        page,
        "/api/relatorios/gratuitas",
        inicio,
      );
      const dados = await lerJson<GratuitasApi>(
        page,
        `/api/relatorios/gratuitas?dataInicio=${inicio}&dataFim=${fim}`,
      );
      resumo.gratuidades = dados.totalGratuidades;
      resumo.descontos = dados.totalDescontos;
      resumo.concedido = Number(dados.valorTotalConcedido);

      expect(dados.linhas.length).toBeGreaterThan(0);
      // Os dois tipos de concessão convivem: cortesia integral e abatimento.
      expect(resumo.gratuidades).toBeGreaterThan(0);
      expect(resumo.descontos).toBeGreaterThan(0);
      // Nenhuma concessão é anônima: toda linha carrega justificativa.
      for (const linha of dados.linhas) {
        expect(linha.motivo.trim().length).toBeGreaterThan(0);
        expect(linha.motivo).not.toBe("—");
      }

      expect(await valorKpi(page, "Gratuidades")).toBe(resumo.gratuidades);
      expect(await valorKpi(page, "Descontos")).toBe(resumo.descontos);
      expect(await valorKpi(page, "Valor total concedido")).toBeCloseTo(
        resumo.concedido,
        2,
      );

      // Escopo no tbody: "Desconto" também é nome de coluna no cabeçalho.
      const corpo = page.locator("tbody");
      await expect(
        corpo.getByText("Gratuidade", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        corpo.getByText("Desconto", { exact: true }).first(),
      ).toBeVisible();

      await jornada.validar(
        blocoKpi(page, "Valor total concedido"),
        `${resumo.gratuidades} cortesias e ${resumo.descontos} descontos = ${brl(resumo.concedido)} que a clínica deixou de faturar`,
      );
    },
  );

  // =====================================================================
  // [RE05] — cancelamentos e não comparecimentos
  // =====================================================================
  await jornada.passo(
    "[RE05] Cancelamentos e não comparecimentos: quantos foram e o motivo de cada um",
    async () => {
      await page.goto("/relatorios/cancelamentos");
      await expect(
        page.getByRole("heading", {
          name: /^Cancelamentos & não comparecimentos$/,
        }),
      ).toBeVisible();

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

      const fim = await ampliarPeriodo(
        page,
        "/api/relatorios/cancelamentos",
        inicio,
      );
      const dados = await lerJson<CancelamentosApi>(
        page,
        `/api/relatorios/cancelamentos?dataInicio=${inicio}&dataFim=${fim}`,
      );
      resumo.cancelamentos = dados.totais.total;

      expect(dados.totais.total).toBeGreaterThan(0);
      expect(dados.totais.cancelados).toBeGreaterThan(0);
      expect(dados.totais.total).toBe(
        dados.totais.cancelados + dados.totais.naoCompareceu,
      );

      // O motivo é o coração do requisito: todo cancelamento tem justificativa.
      const cancelados = dados.linhas.filter((l) => l.status === "cancelado");
      expect(cancelados.length).toBeGreaterThan(0);
      for (const linha of cancelados) {
        expect(linha.motivo.trim().length).toBeGreaterThan(0);
        expect(linha.motivo).not.toBe("—");
      }

      expect(await valorKpi(page, "Total")).toBe(dados.totais.total);
      expect(await valorKpi(page, "Cancelados")).toBe(dados.totais.cancelados);
      expect(await valorKpi(page, "Não compareceu")).toBe(
        dados.totais.naoCompareceu,
      );
      await expect(page.locator("tbody tr")).toHaveCount(dados.linhas.length);

      // Os motivos da base se repetem entre linhas → .first().
      await jornada.validar(
        page.getByText(cancelados[0].motivo).first(),
        `${dados.totais.total} ausências no período: ${dados.totais.cancelados} cancelamentos com motivo e ${dados.totais.naoCompareceu} faltas sem aviso`,
      );

      // Ressalva honesta: "não compareceu" não coleta justificativa em lugar
      // nenhum do fluxo (a rota /nao-compareceu não recebe motivo), então
      // essas linhas aparecem com "—". O motivo obrigatório existe de fato
      // só no cancelamento.
    },
  );

  await jornada.encerrar(
    `${brl(resumo.receitaBruta)} de receita em ${resumo.atendimentos} atendimentos · ${brl(resumo.repassesAbertos)} de repasse em aberto e ${brl(resumo.repassesPagos)} pagos · sala líder ${resumo.consultorioLider} com ${brl(resumo.receitaLider)} · ${brl(resumo.concedido)} concedidos em ${resumo.gratuidades} cortesias e ${resumo.descontos} descontos · ${resumo.cancelamentos} cancelamentos e faltas`,
  );
});
