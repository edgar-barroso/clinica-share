/**
 * COMPROVAÇÃO EM VÍDEO — bloco "Atendimentos" da planilha de custos
 * (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * 1 `test()` = 1 requisito = 1 vídeo (`video: "on"` no playwright.config.ts).
 *
 * IMPORTANTE — estes specs NÃO limpam o banco: rodam sobre o cenário já
 * aplicado pela seed (`npm run db:seed`). Os atendimentos criados aqui usam
 * datas bem antigas (400+ dias atrás), fora da janela semeada (-45 → +14
 * dias), para não distorcer os números filmados em `relatorios.spec.ts`.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";
import { login, irPara, mostrar } from "./_helpers";

// ---------------------------------------------------------------------------
// Tipos da API (só o que os testes leem)
// ---------------------------------------------------------------------------

interface ProcedimentoApi {
  id: string;
  descricao: string;
  /** Decimal(10,2) — chega como string no JSON (RNF-101 / DEC-A03). */
  valor: string;
}

interface AtendimentoApi {
  id: string;
  data: string;
  hora: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  status: string;
  statusPagamento: string;
  valorConsulta: string;
  /** AT04 — campo estruturado (coluna indexada), não marcador dentro do Json */
  usaProntuarioExterno: boolean;
  /** AT04 — obrigatória quando `usaProntuarioExterno` é true */
  referenciaProntuarioExterno: string | null;
  prontuarioInterno: unknown;
  paciente: { id: string; nome: string };
  profissional: { id: string; nome: string; especialidade: string };
  consultorio: { id: string; nome: string };
  procedimentos: ProcedimentoApi[];
  /** Só na listagem (FI04) */
  valorProcedimentos?: string;
  valorTotal?: string;
}

// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

/** ISO `YYYY-MM-DD` de N dias atrás, em data local (mesmo cálculo da UI). */
function isoDiasAtras(dias: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** `page.request` herda o cookie de sessão do login feito na página. */
async function listarAtendimentos(
  page: Page,
  filtro: Record<string, string> = {},
): Promise<AtendimentoApi[]> {
  const qs = new URLSearchParams(filtro).toString();
  const res = await page.request.get(
    `/api/atendimentos${qs ? `?${qs}` : ""}`,
  );
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { atendimentos: AtendimentoApi[] };
  return body.atendimentos;
}

async function obterAtendimento(
  page: Page,
  id: string,
): Promise<AtendimentoApi> {
  const res = await page.request.get(`/api/atendimentos/${id}`);
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { atendimento: AtendimentoApi };
  return body.atendimento;
}

/**
 * Devolve um horário livre no par (data, consultório). `(data, hora,
 * consultorioId)` é UNIQUE no schema (AG05), então re-executar o spec contra
 * a mesma seed exigiria um slot novo — sem isto o POST volta 409.
 */
async function horaLivre(
  page: Page,
  data: string,
  consultorioId: string,
): Promise<string> {
  const doDia = await listarAtendimentos(page, { data });
  const ocupadas = new Set(
    doDia.filter((a) => a.consultorioId === consultorioId).map((a) => a.hora),
  );
  for (let minutos = 8 * 60; minutos < 20 * 60; minutos += 5) {
    const hora = `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(
      minutos % 60,
    ).padStart(2, "0")}`;
    if (!ocupadas.has(hora)) return hora;
  }
  throw new Error(`Sem horário livre em ${data} para o consultório escolhido`);
}

/**
 * Normaliza a lista de procedimentos para comparação: ordena por descrição
 * e converte o Decimal (string) em número. Os itens são criados na mesma
 * transação, então `orderBy createdAt` pode empatar — a asserção não pode
 * depender da ordem de retorno.
 */
function porDescricao(
  procedimentos: ProcedimentoApi[],
): { descricao: string; valor: number }[] {
  return procedimentos
    .map((p) => ({ descricao: p.descricao, valor: Number(p.valor) }))
    .sort((a, b) => a.descricao.localeCompare(b.descricao));
}

/** Abre o detalhe do atendimento e espera o h1 `Atendimento #xxxxxxxx`. */
async function abrirDetalhe(page: Page, id: string): Promise<void> {
  await page.goto(`/atendimentos/${id}`);
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Atendimento #${id.slice(0, 8)}`) }),
  ).toBeVisible({ timeout: 20_000 });
  await mostrar(page);
}

/**
 * Textarea do prontuário no formulário de finalização. O `ProntuarioField`
 * de `/atendimentos/[id]` usa `<Label>` SEM `htmlFor`, então `getByLabel`
 * não enxerga o campo — ancoramos no texto do rótulo e pegamos o irmão.
 */
function campoProntuario(escopo: Locator, rotulo: string): Locator {
  return escopo
    .getByText(rotulo, { exact: true })
    .locator("xpath=following-sibling::textarea[1]");
}

// Em dev o Next compila cada rota no primeiro acesso; o default de 60s fica
// apertado para testes que passam por 3-4 telas diferentes.
test.beforeEach(() => {
  test.setTimeout(120_000);
});

// ---------------------------------------------------------------------------

test.describe("Planilha de custos — Atendimentos", () => {
  test("AT01 — registro de atendimento realizado (data, profissional, consultório)", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/atendimentos", /^Atendimentos$/);

    // (1) O que a seed já tem: todo atendimento `realizado` carrega os três
    // eixos exigidos pela planilha — data, profissional e consultório.
    const realizados = await listarAtendimentos(page, { status: "realizado" });
    expect(realizados.length).toBeGreaterThan(0);

    const referencia = realizados[0];
    expect(referencia.data.slice(0, 10)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(referencia.hora).toMatch(/^\d{2}:\d{2}$/);
    expect(referencia.profissional.nome.length).toBeGreaterThan(0);
    expect(referencia.consultorio.nome.length).toBeGreaterThan(0);

    // Mesma informação na tela de detalhe (é o frame que vale no vídeo).
    await abrirDetalhe(page, referencia.id);
    await expect(page.getByText("Data", { exact: true })).toBeVisible();
    await expect(page.getByText("Profissional", { exact: true })).toBeVisible();
    await expect(page.getByText("Consultório", { exact: true })).toBeVisible();
    await expect(
      page.getByText(referencia.profissional.nome).first(),
    ).toBeVisible();
    await expect(
      page.getByText(referencia.consultorio.nome).first(),
    ).toBeVisible();
    await mostrar(page);

    // (2) O caminho de registro avulso (walk-in). Filmamos o formulário real
    // e gravamos pela API: a UI exige combo de paciente + slot livre no
    // calendário do turno fixo, encenação que não é o objeto desta prova.
    await irPara(page, "/atendimentos/novo", /Registrar atendimento avulso/i);

    const data = isoDiasAtras(400);
    const hora = await horaLivre(page, data, referencia.consultorioId);
    const res = await page.request.post("/api/atendimentos", {
      data: {
        pacienteId: referencia.pacienteId,
        profissionalId: referencia.profissionalId,
        consultorioId: referencia.consultorioId,
        data,
        hora,
        valorConsulta: 250,
        statusPagamento: "pago",
        observacoes: "Walk-in da comprovação AT01",
      },
    });
    expect(res.status()).toBe(201);
    const { atendimento: criado } = (await res.json()) as {
      atendimento: AtendimentoApi;
    };

    // Nasce já `realizado` (AT01) e com os três eixos preenchidos.
    expect(criado.status).toBe("realizado");
    expect(criado.data.slice(0, 10)).toBe(data);
    expect(criado.hora).toBe(hora);
    expect(criado.profissionalId).toBe(referencia.profissionalId);
    expect(criado.consultorioId).toBe(referencia.consultorioId);

    const persistido = await obterAtendimento(page, criado.id);
    expect(persistido.status).toBe("realizado");
    expect(persistido.profissional.nome).toBe(referencia.profissional.nome);
    expect(persistido.consultorio.nome).toBe(referencia.consultorio.nome);

    await abrirDetalhe(page, criado.id);
    await expect(page.getByText(hora).first()).toBeVisible();
    await expect(
      page.getByText(referencia.consultorio.nome).first(),
    ).toBeVisible();
    await mostrar(page);
  });

  test("AT02 — registro de procedimentos adicionais por atendimento", async ({
    page,
  }) => {
    await login(page, "admin");

    // (1) A TELA: `/atendimentos/novo` tem o editor de procedimentos extras —
    // uma linha por procedimento (descrição + valor próprio), com o total
    // recalculado ao vivo. É o caso que o cliente descreveu: "+R$ 350 de
    // endoscopia" em cima da consulta.
    await irPara(page, "/atendimentos/novo", /Registrar atendimento avulso/i);

    // O combo de profissionais só renderiza depois do fetch, e é ele que
    // preenche os valores padrão — preencher antes seria sobrescrito.
    await expect(page.locator("#profissional")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByLabel("Valor de tabela (R$)").fill("250");
    await page.getByLabel("Valor cobrado (R$)").fill("250");
    const totalProcedimentos = page.getByTestId("total-procedimentos");
    const totalGeral = page.getByTestId("total-geral");
    await expect(totalProcedimentos).toHaveText(/0,00/);

    const adicionar = page.getByRole("button", {
      name: "Adicionar procedimento",
    });
    await adicionar.click();
    await page
      .getByLabel("Descrição do procedimento 1")
      .fill("Endoscopia digestiva alta");
    await page.getByLabel("Valor do procedimento 1").fill("350");
    // Total ao vivo: consulta 250 + procedimento 350.
    await expect(totalProcedimentos).toHaveText(/350,00/);
    await expect(totalGeral).toHaveText(/600,00/);

    await adicionar.click();
    await page.getByLabel("Descrição do procedimento 2").fill("Cauterização");
    await page.getByLabel("Valor do procedimento 2").fill("120.5");
    await expect(totalProcedimentos).toHaveText(/470,50/);
    await expect(totalGeral).toHaveText(/720,50/);
    await mostrar(page);

    // Remover uma linha renumera as restantes e refaz o total na hora.
    await page
      .getByRole("button", { name: "Remover procedimento 1" })
      .click();
    await expect(page.getByLabel("Descrição do procedimento 1")).toHaveValue(
      "Cauterização",
    );
    await expect(page.getByLabel("Descrição do procedimento 2")).toHaveCount(0);
    await expect(totalProcedimentos).toHaveText(/120,50/);
    await expect(totalGeral).toHaveText(/370,50/);
    await mostrar(page);

    // (2) Gravação PELA TELA. O atendimento-base é criado por API (a data
    // 401 dias atrás fica fora da janela semeada, para não distorcer os
    // números filmados em relatorios.spec.ts) e SEM procedimento nenhum —
    // os dois procedimentos são lançados no editor de
    // `/atendimentos/[id]/editar`, que é UI de verdade.
    const base = (await listarAtendimentos(page, { status: "realizado" }))[0];
    expect(base).toBeTruthy();

    const data = isoDiasAtras(401);
    const hora = await horaLivre(page, data, base.consultorioId);

    const res = await page.request.post("/api/atendimentos", {
      data: {
        pacienteId: base.pacienteId,
        profissionalId: base.profissionalId,
        consultorioId: base.consultorioId,
        data,
        hora,
        valorConsulta: 250,
        statusPagamento: "pago",
        observacoes: "Walk-in da comprovação AT02",
      },
    });
    expect(res.status()).toBe(201);
    const { atendimento: criado } = (await res.json()) as {
      atendimento: AtendimentoApi;
    };
    expect(criado.procedimentos).toHaveLength(0);

    await page.goto(`/atendimentos/${criado.id}/editar`);
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`^Editar atendimento #${criado.id.slice(0, 8)}`),
      }),
    ).toBeVisible({ timeout: 20_000 });
    await mostrar(page);

    const adicionarNaEdicao = page.getByRole("button", {
      name: "Adicionar procedimento",
    });
    await adicionarNaEdicao.click();
    await page
      .getByLabel("Descrição do procedimento 1")
      .fill("Endoscopia digestiva alta");
    await page.getByLabel("Valor do procedimento 1").fill("350");
    await adicionarNaEdicao.click();
    await page
      .getByLabel("Descrição do procedimento 2")
      .fill("Curativo especial");
    await page.getByLabel("Valor do procedimento 2").fill("80.25");

    await expect(page.getByTestId("total-procedimentos")).toHaveText(
      /430,25/,
    );
    await expect(page.getByTestId("total-geral")).toHaveText(/680,25/);
    await page
      .getByLabel("Motivo da edição")
      .fill("Lançamento dos procedimentos realizados (comprovação AT02)");
    await mostrar(page);

    await Promise.all([
      page.waitForURL(`**/atendimentos/${criado.id}`, { timeout: 30_000 }),
      page.getByRole("button", { name: "Salvar alterações" }).click(),
    ]);

    // (3) Releitura: voltam individualizados, com id próprio e valor próprio.
    const lido = await obterAtendimento(page, criado.id);
    expect(lido.procedimentos).toHaveLength(2);
    expect(new Set(lido.procedimentos.map((p) => p.id)).size).toBe(2);
    expect(porDescricao(lido.procedimentos)).toEqual([
      { descricao: "Curativo especial", valor: 80.25 },
      { descricao: "Endoscopia digestiva alta", valor: 350 },
    ]);

    // FI04: a listagem deriva a soma dos extras e o total do atendimento.
    const doDia = await listarAtendimentos(page, { data });
    const naListagem = doDia.find((a) => a.id === criado.id);
    expect(naListagem).toBeTruthy();
    expect(Number(naListagem!.valorProcedimentos)).toBeCloseTo(430.25, 2);
    expect(Number(naListagem!.valorTotal)).toBeCloseTo(680.25, 2);

    // (4) E a tela de detalhe lista os dois procedimentos separadamente, cada
    // um com o seu valor.
    //
    // RESSALVA HONESTA (verificada aqui): o card "Valores" desta tela soma só
    // a consulta — `GET /api/atendimentos/[id]` devolve os procedimentos, mas
    // não os campos derivados `valorProcedimentos`/`valorTotal`, que só
    // existem na listagem. Por isso o total consolidado é conferido acima,
    // pela API de listagem, e não neste frame.
    await abrirDetalhe(page, criado.id);
    await expect(
      page.getByText("Endoscopia digestiva alta").first(),
    ).toBeVisible();
    await expect(page.getByText(/350,00/).first()).toBeVisible();
    await expect(page.getByText("Curativo especial").first()).toBeVisible();
    await expect(page.getByText(/80,25/).first()).toBeVisible();
    await expect(page.getByText("Total do atendimento")).toBeVisible();
    await mostrar(page);
  });

  test("AT03 — prontuário eletrônico integrado (gravação e leitura)", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/atendimentos", /^Atendimentos$/);

    // Pega um agendamento da seed para percorrer o fluxo real:
    // agendado → em_atendimento → realizado com prontuário.
    const agendados = await listarAtendimentos(page, { status: "agendado" });
    expect(agendados.length).toBeGreaterThan(0);
    const alvo = agendados[0];

    await abrirDetalhe(page, alvo.id);
    await expect(
      page.getByText("Prontuário ainda não preenchido"),
    ).toBeVisible();

    await page.getByRole("button", { name: /Iniciar atendimento/ }).click();
    const botaoFinalizar = page.getByRole("button", {
      name: /Finalizar e registrar/,
    });
    await expect(botaoFinalizar).toBeVisible({ timeout: 20_000 });
    await mostrar(page);

    await botaoFinalizar.click();
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Marcador único: distingue o que este teste gravou do texto da seed.
    const marcador = `AT03-${Date.now()}`;
    await campoProntuario(form, "Anamnese").fill(
      `Queixa de cefaleia há 3 dias, sem febre. [${marcador}]`,
    );
    await campoProntuario(form, "Evolução").fill(
      "Melhora parcial com analgésico simples; exame neurológico sem alterações.",
    );
    await campoProntuario(form, "Conduta").fill(
      "Solicitado hemograma. Orientada hidratação e higiene do sono.",
    );
    await campoProntuario(form, "Retorno").fill("15 dias");
    await mostrar(page);

    await page.getByRole("button", { name: /Confirmar finalização/ }).click();

    // Leitura: o card "Prontuário registrado" passa a exibir o que foi gravado.
    await expect(page.getByText("Prontuário registrado")).toBeVisible();
    await expect(page.getByText(marcador)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Solicitado hemograma")).toBeVisible();
    await expect(page.getByText("15 dias")).toBeVisible();
    await mostrar(page);

    // E o mesmo conteúdo persistido no campo Json `prontuarioInterno`.
    const persistido = await obterAtendimento(page, alvo.id);
    expect(persistido.status).toBe("realizado");
    const prontuario = persistido.prontuarioInterno as Record<string, string>;
    expect(prontuario.anamnese).toContain(marcador);
    expect(prontuario.evolucao).toContain("Melhora parcial");
    expect(prontuario.conduta).toContain("hemograma");
    expect(prontuario.retorno).toBe("15 dias");
  });

  test("AT04 — registro de ocorrência para profissional com prontuário externo", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/atendimentos/novo", /Registrar atendimento avulso/i);

    // (1) A tela de registro avulso: alternar para "Prontuário externo" troca
    // o formulário clínico pelo campo de referência, que é obrigatório.
    const toggleExterno = page.getByRole("button", {
      name: /Prontuário externo/,
    });
    await toggleExterno.click();
    await expect(toggleExterno).toHaveAttribute("aria-pressed", "true");

    const referencia = `Pasta nº 42 · sistema próprio do profissional (AT04-${Date.now()})`;
    const campoReferencia = page.getByLabel(
      "Referência do prontuário externo",
    );
    await expect(campoReferencia).toBeVisible();
    await campoReferencia.fill(referencia);
    await mostrar(page);

    const base = (await listarAtendimentos(page, { status: "realizado" }))[0];
    expect(base).toBeTruthy();
    const data = isoDiasAtras(402);
    const hora = await horaLivre(page, data, base.consultorioId);
    const payloadBase = {
      pacienteId: base.pacienteId,
      profissionalId: base.profissionalId,
      consultorioId: base.consultorioId,
      data,
      hora,
      valorConsulta: 250,
      statusPagamento: "pago",
    };

    // (2) Marcar "externo" SEM dizer onde o registro está é RECUSADO (422):
    // a ocorrência não pode ficar sem rastro de onde encontrá-la.
    const semReferencia = await page.request.post("/api/atendimentos", {
      data: { ...payloadBase, usaProntuarioExterno: true },
    });
    expect(
      semReferencia.status(),
      "prontuário externo sem referência deve ser 422",
    ).toBe(422);
    expect(JSON.stringify(await semReferencia.json())).toMatch(
      /refer[êe]ncia do prontuário externo/i,
    );

    // (3) COM referência, o registro é aceito e grava os CAMPOS REAIS —
    // `usaProntuarioExterno` (boolean indexado) e
    // `referenciaProntuarioExterno`. Nada de marcador escondido dentro do
    // Json `prontuarioInterno`.
    const res = await page.request.post("/api/atendimentos", {
      data: {
        ...payloadBase,
        usaProntuarioExterno: true,
        referenciaProntuarioExterno: referencia,
      },
    });
    expect(res.status()).toBe(201);
    const { atendimento: criado } = (await res.json()) as {
      atendimento: AtendimentoApi;
    };
    expect(criado.usaProntuarioExterno).toBe(true);

    const persistido = await obterAtendimento(page, criado.id);
    expect(persistido.usaProntuarioExterno).toBe(true);
    expect(persistido.referenciaProntuarioExterno).toBe(referencia);
    expect(persistido.prontuarioInterno).toBeNull();

    // (4) O campo é consultável como coluna, não como texto dentro de Json:
    // a listagem devolve o boolean por atendimento e a seed tem ocorrências.
    const realizados = await listarAtendimentos(page, { status: "realizado" });
    const externos = realizados.filter((a) => a.usaProntuarioExterno);
    expect(
      externos.length,
      "seed registra atendimentos com prontuário externo",
    ).toBeGreaterThan(0);
    expect(
      externos.every(
        (a) => (a.referenciaProntuarioExterno ?? "").trim().length >= 3,
      ),
      "todo prontuário externo tem referência preenchida",
    ).toBe(true);

    // (5) Leitura na tela: o card "Prontuário registrado" mostra o selo
    // "Prontuário externo" e a referência de onde o registro está guardado.
    await abrirDetalhe(page, criado.id);
    await expect(page.getByText("Prontuário registrado")).toBeVisible();
    await expect(page.getByText("Prontuário externo")).toBeVisible();
    await expect(page.getByText(referencia)).toBeVisible();
    await mostrar(page);

    // (6) E a mesma marcação pode ser feita PELA TELA: o radiogroup
    // "Registro do prontuário" em `/atendimentos/[id]/editar` alterna um
    // atendimento interno para externo, com referência obrigatória.
    const horaInterno = await horaLivre(page, data, base.consultorioId);
    const resInterno = await page.request.post("/api/atendimentos", {
      data: {
        ...payloadBase,
        hora: horaInterno,
        prontuarioInterno: {
          anamnese: "Registro inicial feito no ClinicaShare (AT04).",
        },
      },
    });
    expect(resInterno.status()).toBe(201);
    const { atendimento: interno } = (await resInterno.json()) as {
      atendimento: AtendimentoApi;
    };
    expect(interno.usaProntuarioExterno).toBe(false);

    await page.goto(`/atendimentos/${interno.id}/editar`);
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`^Editar atendimento #${interno.id.slice(0, 8)}`),
      }),
    ).toBeVisible({ timeout: 20_000 });

    const registroProntuario = page.getByRole("radiogroup", {
      name: "Registro do prontuário",
    });
    await expect(
      registroProntuario.getByLabel("Prontuário interno"),
    ).toBeChecked();
    await registroProntuario.getByLabel("Prontuário externo").check();
    await expect(
      registroProntuario.getByLabel("Prontuário externo"),
    ).toBeChecked();

    const referenciaEdicao = `Sistema próprio do profissional · ficha ${Date.now()}`;
    await page
      .getByLabel("Referência do prontuário externo")
      .fill(referenciaEdicao);
    await page
      .getByLabel("Motivo da edição")
      .fill("Profissional mantém o prontuário fora do sistema (AT04)");
    await mostrar(page);

    await Promise.all([
      page.waitForURL(`**/atendimentos/${interno.id}`, { timeout: 30_000 }),
      page.getByRole("button", { name: "Salvar alterações" }).click(),
    ]);

    const depois = await obterAtendimento(page, interno.id);
    expect(depois.usaProntuarioExterno).toBe(true);
    expect(depois.referenciaProntuarioExterno).toBe(referenciaEdicao);
    await expect(page.getByText(referenciaEdicao)).toBeVisible({
      timeout: 20_000,
    });
    await mostrar(page);
  });
});
