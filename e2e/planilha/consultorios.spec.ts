/**
 * COMPROVAÇÃO EM VÍDEO — bloco CONSULTÓRIOS da planilha de custos
 * (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * 1 `test()` = 1 requisito = 1 vídeo (o config já grava tudo com `video: "on"`).
 *
 * IMPORTANTE — estes specs NÃO limpam o banco. Rodam sobre o cenário do
 * `npm run db:seed` (12 consultórios — 11 ativos + "Sala 12" desativada,
 * 5 profissionais, 10 turnos fixos, 241 atendimentos). Ver `_helpers.ts`.
 *
 * O que não é observável direto na tela é comprovado via `page.request`
 * (o cookie de sessão é herdado do login), sempre com uma tela real navegada
 * antes pro vídeo não ficar em branco.
 */
import { test, expect, type Page } from "@playwright/test";
import { login, irPara, mostrar } from "./_helpers";

// ---------------------------------------------------------------------------
// Tipos mínimos das respostas de API usadas aqui
// ---------------------------------------------------------------------------

type Turno = "manha" | "tarde" | "noite";

interface ConsultorioApi {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  equipamentos: string[];
  especialidadesCompativeis: string[];
}

interface TurnoFixoApi {
  id: string;
  diaSemana: number; // 1=seg ... 5=sex
  turno: Turno;
  consultorioId: string;
  consultorio: { id: string; nome: string };
}

interface ProfissionalApi {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  duracaoConsultaMinutos: number;
  turnosFixos: TurnoFixoApi[];
}

interface TurnosConfigApi {
  manha: { inicio: string; fim: string };
  tarde: { inicio: string; fim: string };
  noite: { inicio: string; fim: string };
}

interface LinhaDashboard {
  consultorioId: string;
  nome: string;
  tipo: string;
  qtdAtendimentos: number;
  receitaTotal: string;
  receitaMediaPorAtendimento: string;
  taxaOcupacao: number;
}

interface DashboardConsultoriosApi {
  kpis: {
    totalAtendimentos: number;
    receitaTotal: string;
    taxaOcupacaoMedia: number;
  };
  linhas: LinhaDashboard[];
}

// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

async function getJson<T>(page: Page, url: string): Promise<T> {
  const res = await page.request.get(url);
  expect(res.status(), `GET ${url}`).toBe(200);
  return (await res.json()) as T;
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Card do design system (`components/ui/card.tsx`) que contém um texto.
 *  Usado porque CardTitle/CardDescription renderizam <div>, não heading. */
function cardComTexto(page: Page, texto: string | RegExp) {
  return page.locator("div.rounded-2xl").filter({ hasText: texto }).first();
}

const DIAS_UTEIS = [1, 2, 3, 4, 5];
const TURNOS: Turno[] = ["manha", "tarde", "noite"];

test.describe("Planilha de custos — Consultórios", () => {
  /**
   * CO01 — Cadastro dos 12 consultórios com tipo e equipamentos.
   *
   * A listagem é paginada, então o total é comprovado pelo dado
   * (`GET /api/consultorios` = 12, sendo 11 ativos + a Sala 12 desativada) e a
   * tela confirma o mesmo número no subtítulo, além de mostrar tipo e
   * equipamentos de cada sala no card.
   */
  test("CO01 — 12 consultórios cadastrados com tipo e equipamentos", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/consultorios", /Consultórios/i);

    const { consultorios } = await getJson<{ consultorios: ConsultorioApi[] }>(
      page,
      "/api/consultorios",
    );
    expect(consultorios).toHaveLength(12);

    const ativos = consultorios.filter((c) => c.ativo);
    expect(ativos).toHaveLength(11);

    // Toda sala em operação tem tipo e ao menos um equipamento cadastrado.
    for (const c of ativos) {
      expect(c.tipo, `${c.nome} sem tipo`).toBeTruthy();
      expect(
        c.equipamentos.length,
        `${c.nome} sem equipamentos`,
      ).toBeGreaterThan(0);
    }

    // A tela confirma o total e mostra tipo + equipamentos da primeira sala.
    await expect(page.getByText(/12 salas cadastradas/i)).toBeVisible();
    const primeira = consultorios[0];
    const cardPrimeira = cardComTexto(page, primeira.nome);
    await expect(cardPrimeira).toContainText(primeira.tipo);
    await expect(cardPrimeira).toContainText(primeira.equipamentos[0]);
    await expect(page.getByText("Equipamentos").first()).toBeVisible();
    await mostrar(page);
  });

  /**
   * CO02 — Turnos fixos e horários por profissional.
   *
   * Duas telas, porque o requisito tem duas metades:
   *  1. `/profissionais/[id]/editar` → card "Turnos fixos": lista os turnos do
   *     profissional (dia da semana · turno · consultório) e tem os três
   *     selects (dia, turno, consultório) para alocar um novo.
   *  2. `/configuracoes/turnos` → as faixas HH:mm de manhã/tarde/noite da
   *     clínica, que são o que alimenta a grade de horários do agendamento.
   *     O diálogo de edição é aberto e FECHADO sem salvar — a comprovação é a
   *     existência dos campos, não uma alteração de configuração real.
   */
  test("CO02 — turnos fixos e horários configuráveis por profissional", async ({
    page,
  }) => {
    await login(page, "admin");

    const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
      page,
      "/api/profissionais?ativo=true",
    );
    const prof = profissionais.find((p) => p.turnosFixos.length > 0);
    expect(prof, "seed precisa de profissional com turno fixo").toBeTruthy();
    const alvo = prof!;

    // --- 1. Turnos fixos do profissional ---
    await irPara(page, `/profissionais/${alvo.id}/editar`, /^Editar/);

    const cardTurnos = cardComTexto(page, "Turnos fixos");
    await cardTurnos.scrollIntoViewIfNeeded();
    await expect(cardTurnos).toBeVisible();

    // A asserção é escopada na <ul> (e não no card inteiro) porque o <select>
    // de consultórios do formulário lista TODAS as salas — dentro da lista, o
    // nome da sala só aparece se o turno estiver mesmo alocado nela.
    const listaTurnos = cardTurnos.locator("ul");
    const itens = listaTurnos.locator("li");
    await expect(itens).toHaveCount(alvo.turnosFixos.length);
    // Cada item traz dia da semana + turno + a sala daquele turno.
    await expect(itens.first()).toContainText(/Seg|Ter|Qua|Qui|Sex/);
    await expect(listaTurnos).toContainText(alvo.turnosFixos[0].consultorio.nome);

    // Os três selects (dia, turno, consultório) que alocam um novo turno.
    await expect(cardTurnos.locator("select")).toHaveCount(3);
    await expect(cardTurnos.getByRole("button", { name: /Add/i })).toBeVisible();
    await mostrar(page);

    // --- 2. Faixas horárias da clínica ---
    await irPara(page, "/configuracoes/turnos", /^Turnos$/);

    const { turnos } = await getJson<{ turnos: TurnosConfigApi }>(
      page,
      "/api/configuracoes/turnos",
    );
    for (const id of TURNOS) {
      expect(turnos[id].inicio, `${id}.inicio`).toMatch(/^\d{2}:\d{2}$/);
      expect(turnos[id].fim, `${id}.fim`).toMatch(/^\d{2}:\d{2}$/);
    }

    for (const [rotulo, faixa] of [
      ["Manhã", turnos.manha],
      ["Tarde", turnos.tarde],
      ["Noite", turnos.noite],
    ] as const) {
      const card = cardComTexto(page, rotulo);
      await expect(card).toContainText(faixa.inicio);
      await expect(card).toContainText(faixa.fim);
    }
    await mostrar(page);

    // Diálogo de edição (só admin vê o lápis) — abre, mostra Início/Fim em
    // HH:mm e é fechado sem salvar, pra não alterar a configuração da seed.
    await cardComTexto(page, "Manhã").getByRole("button").first().click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toBeVisible();
    await expect(page.getByLabel("Início")).toHaveValue(/^\d{2}:\d{2}$/);
    await expect(page.getByLabel("Fim")).toHaveValue(/^\d{2}:\d{2}$/);
    await mostrar(page);
    await dialogo.getByRole("button", { name: /^Cancelar$/ }).click();
    await expect(dialogo).toBeHidden();
  });

  /**
   * CO03 — Profissional aloca múltiplos turnos em consultórios diferentes.
   *
   * A seed já dá 2 turnos fixos por profissional, mas ambos na MESMA sala —
   * então o teste comprova as duas coisas: (a) o profissional tem ≥2 turnos e
   * (b) o modelo aceita esses turnos em salas diferentes, criando um turno
   * numa outra sala via `POST /api/profissionais/[id]/turnos-fixos` e vendo o
   * resultado na tela de edição.
   *
   * O turno criado é removido no `finally` — o cenário da seed volta ao
   * estado original para os demais vídeos da mesma execução.
   */
  test("CO03 — profissional com turnos em consultórios diferentes", async ({
    page,
  }) => {
    await login(page, "admin");

    const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
      page,
      "/api/profissionais?ativo=true",
    );
    const { consultorios } = await getJson<{ consultorios: ConsultorioApi[] }>(
      page,
      "/api/consultorios?ativo=true",
    );

    const alvo = profissionais.find((p) => p.turnosFixos.length >= 2);
    expect(alvo, "seed precisa de profissional com ≥2 turnos fixos").toBeTruthy();
    const prof = alvo!;
    expect(prof.turnosFixos.length).toBeGreaterThanOrEqual(2);

    // Mapa de ocupação global: uma sala só aceita um profissional por
    // (dia, turno) — a constraint é `@@unique([consultorioId, diaSemana, turno])`.
    const salaOcupada = new Set<string>();
    const slotDoProf = new Set<string>();
    for (const p of profissionais) {
      for (const tf of p.turnosFixos) {
        salaOcupada.add(`${tf.consultorioId}|${tf.diaSemana}|${tf.turno}`);
        if (p.id === prof.id) slotDoProf.add(`${tf.diaSemana}|${tf.turno}`);
      }
    }
    const salasAtuais = new Set(prof.turnosFixos.map((tf) => tf.consultorioId));

    // Procura (outra sala, dia, turno) livre para os dois lados.
    let escolha: { sala: ConsultorioApi; diaSemana: number; turno: Turno } | null =
      null;
    for (const sala of consultorios) {
      if (salasAtuais.has(sala.id)) continue; // precisa ser OUTRA sala
      for (const diaSemana of DIAS_UTEIS) {
        for (const turno of TURNOS) {
          if (slotDoProf.has(`${diaSemana}|${turno}`)) continue;
          if (salaOcupada.has(`${sala.id}|${diaSemana}|${turno}`)) continue;
          escolha ??= { sala, diaSemana, turno };
        }
      }
    }
    expect(escolha, "não há (sala, dia, turno) livre no cenário").not.toBeNull();
    const novo = escolha!;

    const criado = await page.request.post(
      `/api/profissionais/${prof.id}/turnos-fixos`,
      {
        data: {
          consultorioId: novo.sala.id,
          diaSemana: novo.diaSemana,
          turno: novo.turno,
        },
      },
    );
    expect(
      criado.status(),
      `POST turno fixo: ${await criado.text()}`,
    ).toBe(201);
    const turnoCriadoId = ((await criado.json()) as { turno: { id: string } })
      .turno.id;

    try {
      // Prova pelo dado: o profissional agora tem turnos em ≥2 salas distintas.
      const { profissional } = await getJson<{ profissional: ProfissionalApi }>(
        page,
        `/api/profissionais/${prof.id}`,
      );
      expect(profissional.turnosFixos.length).toBeGreaterThanOrEqual(3);
      const salasDistintas = new Set(
        profissional.turnosFixos.map((tf) => tf.consultorioId),
      );
      expect(salasDistintas.size).toBeGreaterThanOrEqual(2);

      // Prova na tela: a lista de turnos fixos passa a citar DUAS salas.
      // (escopado na <ul>: o <select> do formulário lista todas as salas)
      await irPara(page, `/profissionais/${prof.id}/editar`, /^Editar/);
      const cardTurnos = cardComTexto(page, "Turnos fixos");
      await cardTurnos.scrollIntoViewIfNeeded();
      const listaTurnos = cardTurnos.locator("ul");
      await expect(listaTurnos.locator("li")).toHaveCount(
        profissional.turnosFixos.length,
      );
      await expect(listaTurnos).toContainText(novo.sala.nome);
      await expect(listaTurnos).toContainText(
        prof.turnosFixos[0].consultorio.nome,
      );
      await mostrar(page);
    } finally {
      // Devolve o cenário da seed ao estado original. Sem `expect` aqui de
      // propósito: uma falha na limpeza não pode mascarar a falha real do teste.
      const removido = await page.request.delete(
        `/api/profissionais/${prof.id}/turnos-fixos/${turnoCriadoId}`,
      );
      if (!removido.ok()) {
        test.info().annotations.push({
          type: "aviso",
          description: `turno fixo ${turnoCriadoId} não foi removido (HTTP ${removido.status()}) — remova manualmente antes de regravar`,
        });
      }
    }
  });

  /**
   * CO04 — Dashboard de ocupação e receita por consultório.
   *
   * Seção `<h2>` "Ocupação e receita por consultório" do `/dashboard` (UC002):
   * KPIs, tabela "Ranking por receita" (#, Consultório, Tipo, Atendimentos,
   * Receita, Média/atend., Ocupação), filtro por modalidade de contrato e
   * exportação CSV.
   *
   * O período é trocado para os últimos 45 dias — a janela em que a seed tem
   * atendimentos realizados e pagos — para que a prova de que RECEITA e
   * OCUPAÇÃO aparecem com valores reais não dependa do dia do mês em que o
   * vídeo for gravado.
   */
  test("CO04 — dashboard de ocupação e receita por consultório", async ({
    page,
  }) => {
    await login(page, "admin"); // admin cai direto no /dashboard
    await expect(page.getByRole("heading", { name: /^Dashboard$/ })).toBeVisible();
    await mostrar(page);

    const secao = page.getByRole("heading", {
      name: /Ocupação e receita por consultório/i,
    });
    await secao.scrollIntoViewIfNeeded();
    await expect(secao).toBeVisible();
    await mostrar(page);

    // Período personalizado: últimos 45 dias (janela de dados da seed).
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 45);
    const inicioIso = isoLocal(inicio);

    await page.getByRole("button", { name: /^Personalizado$/ }).click();
    await mostrar(page, 800); // deixa o refetch da troca de modo terminar

    const [respostaPeriodo] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/consultorios/dashboard") &&
          r.url().includes(`dataInicio=${inicioIso}`),
        { timeout: 20_000 },
      ),
      page.locator("#custom-ini").fill(inicioIso),
    ]);
    expect(respostaPeriodo.status()).toBe(200);
    const dados = (await respostaPeriodo.json()) as DashboardConsultoriosApi;

    // Receita e ocupação existem de fato no período.
    expect(dados.linhas.length).toBeGreaterThan(0);
    expect(Number(dados.kpis.receitaTotal)).toBeGreaterThan(0);
    expect(dados.kpis.taxaOcupacaoMedia).toBeGreaterThan(0);
    expect(dados.kpis.totalAtendimentos).toBeGreaterThan(0);

    // KPIs na tela: um em R$, outro em %.
    await secao.scrollIntoViewIfNeeded();
    await expect(cardComTexto(page, "Receita dos consultórios")).toContainText(
      /R\$/,
    );
    await expect(cardComTexto(page, "Taxa de ocupação média")).toContainText(/%/);
    await mostrar(page);

    // Tabela "Ranking por receita" — colunas exigidas pela planilha.
    const cardRanking = cardComTexto(page, "Ranking por receita");
    await cardRanking.scrollIntoViewIfNeeded();
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
        cardRanking.getByRole("columnheader", { name: coluna, exact: true }),
      ).toBeVisible();
    }

    const linhas = cardRanking.locator("tbody tr");
    await expect(linhas).toHaveCount(dados.linhas.length);

    // A 1ª linha é o consultório de maior receita (a API já ordena por receita).
    const primeira = linhas.first();
    await expect(primeira).toContainText(dados.linhas[0].nome);
    await expect(primeira.locator("td").nth(4)).toContainText(/R\$/); // Receita
    await expect(primeira.locator("td").nth(6)).toContainText(/%/); // Ocupação
    await mostrar(page);

    // Filtro por modalidade de contrato (aluguel fixo × percentual).
    const [respostaFiltro] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/consultorios/dashboard") &&
          r.url().includes("modalidade=aluguel_fixo"),
        { timeout: 20_000 },
      ),
      page.locator("#modalidade").selectOption("aluguel_fixo"),
    ]);
    expect(respostaFiltro.status()).toBe(200);
    const filtrado = (await respostaFiltro.json()) as DashboardConsultoriosApi;
    // Recorte de um subconjunto: nunca pode somar mais que o total geral.
    expect(filtrado.kpis.totalAtendimentos).toBeLessThanOrEqual(
      dados.kpis.totalAtendimentos,
    );
    await expect(page.locator("#modalidade")).toHaveValue("aluguel_fixo");
    await mostrar(page);

    // Volta pra visão completa e confirma a exportação disponível.
    await page.locator("#modalidade").selectOption("todos");
    await expect(
      page.getByRole("button", { name: /Exportar CSV/i }),
    ).toBeEnabled();
    await mostrar(page);
  });
});
