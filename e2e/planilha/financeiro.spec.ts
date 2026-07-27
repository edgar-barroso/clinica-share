/**
 * COMPROVAÇÃO EM VÍDEO — bloco FINANCEIRO (FI01–FI09) da planilha de custos
 * (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * Um `test()` = um requisito = um vídeo (`video: "on"` no playwright.config.ts).
 *
 * REGRA DESTES SPECS: **não limpam o banco**. Rodam sobre o cenário da seed
 * (`npm run db:seed`) — ver `_helpers.ts`. As únicas mutações aqui são as do
 * próprio requisito sendo comprovado (iniciar/finalizar atendimento, gerar
 * repasse) e nenhuma delas destrói o cenário: elas consomem agendamentos
 * futuros e são idempotentes onde a API permite.
 *
 * Rodar isolado — os specs de `e2e/*.spec.ts` (raiz) fazem `deleteMany` no
 * `beforeAll` e apagariam a seed antes destes rodarem:
 *   npx playwright test e2e/planilha
 */
import { test, expect, type Page } from "@playwright/test";
import { login, irPara, mostrar, CONTAS } from "./_helpers";

// ---------------------------------------------------------------------------
// Tipos mínimos das respostas da API (Decimal chega como string — RNF-101).
// ---------------------------------------------------------------------------

type Modalidade = "aluguel_fixo" | "percentual";
type StatusPagamento = "pago" | "pendente" | "gratuito";

interface ProfissionalApi {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  modalidadeContrato: Modalidade;
  percentualRepasse: string | null;
  valorAluguelPorTurno: string | null;
  valorConsultaBase: string;
}

interface RepasseApi {
  id: string;
  profissionalId: string;
  periodoInicio: string;
  periodoFim: string;
  receitaBruta: string;
  valorRepasse: string;
  status: "aberto" | "pago";
  profissional: { id: string; nome: string; modalidadeContrato: Modalidade };
  atendimentos: { id: string }[];
}

interface BreakdownDetalhe {
  atendimentoId: string;
  data: string;
  hora: string;
  turno: "manha" | "tarde" | "noite";
  valorConsulta: string;
  /** FI04 — soma dos procedimentos extras do atendimento */
  valorProcedimentos: string;
  /** FI04 — valorConsulta + valorProcedimentos */
  valorTotal: string;
  procedimentos: { descricao: string; valor: string }[];
  statusPagamento: StatusPagamento;
}

interface RepasseDetalheApi {
  repasse: RepasseApi & {
    profissional: RepasseApi["profissional"] & {
      percentualRepasse: string | null;
      valorAluguelPorTurno: string | null;
    };
  };
  breakdown: {
    modalidade: Modalidade;
    receitaBruta: string;
    valorRepasse: string;
    atendimentosIds: string[];
    turnosUtilizados: { data: string; turno: string }[];
    detalhes: BreakdownDetalhe[];
  };
}

interface AgendamentoApi {
  id: string;
  data: string;
  hora: string;
  profissionalId: string;
  status: string;
  statusPagamento: StatusPagamento;
}

interface AtendimentoApi extends AgendamentoApi {
  valorConsulta: string;
  /** FI06 — preço de tabela; null quando cobrado cheio */
  valorOriginal: string | null;
  motivoDescontoOuGratuidade: string | null;
  procedimentos?: { descricao: string; valor: string }[];
}

// ---------------------------------------------------------------------------
// Helpers locais. `page.request` herda o cookie `auth-token` do login pela UI.
// ---------------------------------------------------------------------------

async function getJson<T>(page: Page, url: string): Promise<T> {
  const res = await page.request.get(url);
  expect(res.status(), `GET ${url}`).toBe(200);
  return (await res.json()) as T;
}

async function listarProfissionais(page: Page): Promise<ProfissionalApi[]> {
  const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
    page,
    "/api/profissionais?ativo=all",
  );
  return profissionais;
}

function porEmail(lista: ProfissionalApi[], email: string): ProfissionalApi {
  const p = lista.find((x) => x.email === email);
  if (!p) {
    throw new Error(
      `Profissional ${email} não existe no banco — rode 'npm run db:seed' antes.`,
    );
  }
  return p;
}

async function listarRepasses(page: Page): Promise<RepasseApi[]> {
  const { repasses } = await getJson<{ repasses: RepasseApi[] }>(
    page,
    "/api/repasses",
  );
  return repasses;
}

/**
 * Pega o próximo agendamento em `agendado` (ordenado por data/hora asc) e
 * transiciona para `em_atendimento` — pré-condição de AT06 (`finalizar`).
 * Cada teste consome um agendamento diferente porque busca o estado atual.
 */
async function abrirProximoAtendimento(page: Page): Promise<string> {
  const { agendamentos } = await getJson<{ agendamentos: AgendamentoApi[] }>(
    page,
    "/api/agendamentos?status=agendado",
  );
  const alvo = agendamentos[0];
  expect(
    alvo,
    "seed precisa ter ao menos um agendamento em 'agendado'",
  ).toBeTruthy();

  const iniciar = await page.request.post(
    `/api/agendamentos/${alvo.id}/iniciar`,
  );
  expect(iniciar.status(), "POST /iniciar (AT05)").toBe(200);
  return alvo.id;
}

const soma = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

// ===========================================================================
// FI01 — Cadastro de contrato por profissional (aluguel fixo OU percentual)
// ===========================================================================

test("FI01 — cadastro de contrato por profissional: aluguel fixo OU percentual", async ({
  page,
}) => {
  await login(page, "admin");

  // 1) O formulário de cadastro tem seletor de modalidade com campo
  //    condicional: percentual → "Percentual (%)"; aluguel → "Aluguel por turno".
  await irPara(page, "/profissionais/novo", /^Novo profissional$/);

  const campoPercentual = page.getByLabel(
    "Percentual (%) de repasse ao profissional",
  );
  const campoAluguel = page.getByLabel("Aluguel por turno (R$)");

  // Estado inicial do formulário: modalidade percentual.
  await expect(campoPercentual).toBeVisible();
  await expect(campoAluguel).toHaveCount(0);
  await mostrar(page);

  // Troca para aluguel fixo → o campo condicional é substituído.
  await page.getByRole("button", { name: /^Aluguel fixo/ }).click();
  await expect(campoAluguel).toBeVisible();
  await expect(campoPercentual).toHaveCount(0);
  await mostrar(page);

  // E volta, provando que as DUAS modalidades são oferecidas no cadastro.
  await page.getByRole("button", { name: /^Percentual/ }).click();
  await expect(campoPercentual).toBeVisible();
  await mostrar(page);

  // 2) Persistência: `GET /api/profissionais` devolve modalidade + o campo
  //    de contrato correspondente preenchido, para as duas modalidades.
  const profs = await listarProfissionais(page);
  const percentuais = profs.filter((p) => p.modalidadeContrato === "percentual");
  const alugueis = profs.filter((p) => p.modalidadeContrato === "aluguel_fixo");

  expect(percentuais.length, "seed tem 3 profissionais percentual").toBeGreaterThan(0);
  expect(alugueis.length, "seed tem 2 profissionais aluguel_fixo").toBeGreaterThan(0);

  for (const p of percentuais) {
    expect(p.percentualRepasse, `${p.nome} sem percentualRepasse`).not.toBeNull();
    expect(Number(p.percentualRepasse)).toBeGreaterThan(0);
  }
  for (const p of alugueis) {
    expect(
      p.valorAluguelPorTurno,
      `${p.nome} sem valorAluguelPorTurno`,
    ).not.toBeNull();
    expect(Number(p.valorAluguelPorTurno)).toBeGreaterThan(0);
  }

  // 3) O contrato persistido aparece na tela de edição de cada modalidade.
  const prof1 = porEmail(profs, CONTAS.profissional.email); // percentual 30%
  const prof3 = porEmail(profs, CONTAS.profissionalAluguel.email); // R$250/turno

  await irPara(page, `/profissionais/${prof1.id}/editar`, /^Editar /);
  await expect(
    page.getByLabel("Percentual (%) de repasse ao profissional"),
  ).toHaveValue("30");
  await mostrar(page);

  await irPara(page, `/profissionais/${prof3.id}/editar`, /^Editar /);
  // Decimal(10,2) pode chegar como "250" ou "250.00" — ambos são o mesmo valor.
  await expect(page.getByLabel("Aluguel por turno (R$)")).toHaveValue(
    /^250(\.0+)?$/,
  );
  await mostrar(page);
});

// ===========================================================================
// FI02 — Configuração de percentual individual por profissional
// ===========================================================================

test("FI02 — percentual individual por profissional e alteração exige motivo", async ({
  page,
}) => {
  await login(page, "admin");

  // 1) Percentuais são INDIVIDUAIS: a seed tem 0.30 (prof1/prof2) e 0.25 (prof5).
  const profs = await listarProfissionais(page);
  const prof1 = porEmail(profs, CONTAS.profissional.email);
  const distintos = [
    ...new Set(
      profs
        .filter((p) => p.modalidadeContrato === "percentual")
        .map((p) => Number(p.percentualRepasse)),
    ),
  ];
  expect(
    distintos.length,
    "percentual precisa variar por profissional, não ser global",
  ).toBeGreaterThan(1);
  expect(distintos).toEqual(expect.arrayContaining([0.3, 0.25]));

  // 2) O rótulo do campo foi CORRIGIDO: agora diz "de repasse ao profissional"
  //    (antes dizia, erradamente, que o percentual era da clínica).
  await irPara(page, `/profissionais/${prof1.id}/editar`, /^Editar /);
  const campoPercentual = page.getByLabel(
    "Percentual (%) de repasse ao profissional",
  );
  await expect(campoPercentual).toHaveValue("30");
  await expect(page.getByText(/de repasse ao profissional/)).toBeVisible();
  await expect(page.getByText(/repasse à clínica/i)).toHaveCount(0);
  await mostrar(page);

  // 3) A UI exige justificativa assim que o contrato muda (nada é submetido
  //    aqui — o campo aparecer já é a prova da regra na camada de tela).
  await campoPercentual.fill("40");
  await expect(page.getByLabel("Motivo da alteração")).toBeVisible();
  await expect(page.getByText(/Contrato mudou — motivo obrigatório/)).toBeVisible();
  await mostrar(page);

  // 4) E o servidor não confia na tela: PATCH de campo de contrato SEM
  //    `motivo` é recusado por regra de negócio (400), sem gravar nada.
  const semMotivo = await page.request.patch(
    `/api/profissionais/${prof1.id}`,
    { data: { percentualRepasse: 0.4 } },
  );
  expect(semMotivo.status(), "PATCH sem motivo deve ser recusado").toBe(400);
  expect(((await semMotivo.json()) as { error: string }).error).toMatch(/motivo/i);

  // Confirma que o percentual continua 0.30 — a recusa aconteceu antes do write.
  const depois = porEmail(await listarProfissionais(page), prof1.email);
  expect(Number(depois.percentualRepasse)).toBeCloseTo(0.3, 4);
  await irPara(page, `/profissionais/${prof1.id}/editar`, /^Editar /);
  await expect(
    page.getByLabel("Percentual (%) de repasse ao profissional"),
  ).toHaveValue("30");
  await mostrar(page);
});

// ===========================================================================
// FI03 — Cálculo automático de repasse por profissional
// ===========================================================================

test("FI03 — cálculo automático do repasse é feito pelo servidor", async ({
  page,
}) => {
  await login(page, "admin");

  const repasses = await listarRepasses(page);
  const alvo = repasses.find(
    (r) => r.profissional.modalidadeContrato === "percentual" && Number(r.valorRepasse) > 0,
  );
  if (!alvo) throw new Error("seed sem repasse percentual — rode 'npm run db:seed'");

  // 1) Prestação de contas na tela: bloco "Cálculo" com bruto → % → valor final.
  //    (CardTitle renderiza <div>, não heading — por isso getByText.)
  await irPara(page, `/financeiro/repasses/${alvo.id}`, /^Repasse ·/);
  await expect(page.getByText("Cálculo", { exact: true })).toBeVisible();
  // `exact` porque a nota de rodapé do card ("A receita bruta soma consulta +
  // procedimentos extras…") também contém o termo.
  await expect(page.getByText("Receita bruta", { exact: true })).toBeVisible();
  await expect(page.getByText("Percentual", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Valor do repasse", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Cálculo realizado no servidor/)).toBeVisible();
  await mostrar(page);

  // 2) O cálculo é do SERVIDOR: `GET /api/repasses/[id]` recalcula o breakdown
  //    (calculate.ts) e ele bate com o valor gravado no Repasse.
  const det = await getJson<RepasseDetalheApi>(page, `/api/repasses/${alvo.id}`);
  expect(det.breakdown.modalidade).toBe("percentual");

  const percentual = Number(det.repasse.profissional.percentualRepasse);
  const bruto = Number(det.breakdown.receitaBruta);
  expect(percentual).toBeGreaterThan(0);
  expect(bruto).toBeGreaterThan(0);

  // bruto × percentual, arredondado em 2 casas (ROUND_HALF_UP no servidor)
  expect(Number(det.breakdown.valorRepasse)).toBeCloseTo(bruto * percentual, 2);
  // valor persistido == valor recalculado agora → nada é calculado no cliente
  expect(Number(det.repasse.valorRepasse)).toBeCloseTo(
    Number(det.breakdown.valorRepasse),
    2,
  );
  expect(Number(det.repasse.receitaBruta)).toBeCloseTo(bruto, 2);

  // 3) A base é a soma dos atendimentos do período (consulta + procedimentos).
  const somaAtendimentos = soma(
    det.breakdown.detalhes.map((d) => Number(d.valorTotal)),
  );
  expect(det.breakdown.detalhes.length).toBeGreaterThan(0);
  expect(somaAtendimentos).toBeCloseTo(bruto, 2);
  await mostrar(page);
});

// ===========================================================================
// FI04 — Repasse inclui consultas E procedimentos extras
// ===========================================================================

test("FI04 — repasse inclui consultas e procedimentos extras na base", async ({
  page,
}) => {
  await login(page, "admin");

  // Procura o primeiro repasse percentual cujo breakdown tenha procedimento.
  const repasses = (await listarRepasses(page)).filter(
    (r) => r.profissional.modalidadeContrato === "percentual",
  );
  let alvo: RepasseApi | undefined;
  let det: RepasseDetalheApi | undefined;
  for (const r of repasses.slice(0, 15)) {
    const d = await getJson<RepasseDetalheApi>(page, `/api/repasses/${r.id}`);
    if (d.breakdown.detalhes.some((x) => Number(x.valorProcedimentos) > 0)) {
      alvo = r;
      det = d;
      break;
    }
  }
  if (!alvo || !det) {
    throw new Error(
      "nenhum repasse com procedimento extra — a seed cria ~35; rode 'npm run db:seed'",
    );
  }

  // 1) Cada atendimento traz procedimentos e as somas derivadas:
  //    valorTotal = valorConsulta + valorProcedimentos.
  const comProcedimento = det.breakdown.detalhes.filter(
    (d) => Number(d.valorProcedimentos) > 0,
  );
  expect(comProcedimento.length).toBeGreaterThan(0);

  for (const d of comProcedimento) {
    expect(d.procedimentos.length).toBeGreaterThan(0);
    const somaItens = soma(d.procedimentos.map((p) => Number(p.valor)));
    expect(somaItens).toBeCloseTo(Number(d.valorProcedimentos), 2);
    expect(Number(d.valorTotal)).toBeCloseTo(
      Number(d.valorConsulta) + Number(d.valorProcedimentos),
      2,
    );
  }

  // 2) E os procedimentos ENTRAM na base: a receita bruta do repasse é a soma
  //    dos `valorTotal`, estritamente maior que a soma só das consultas.
  const totalComProcedimentos = soma(
    det.breakdown.detalhes.map((d) => Number(d.valorTotal)),
  );
  const totalSoConsultas = soma(
    det.breakdown.detalhes.map((d) => Number(d.valorConsulta)),
  );
  expect(totalComProcedimentos).toBeCloseTo(Number(det.breakdown.receitaBruta), 2);
  expect(totalComProcedimentos).toBeGreaterThan(totalSoConsultas);

  // 3) A prestação de contas na TELA agora abre a composição: a tabela tem
  //    colunas Consulta | Procedimentos | Total, e cada atendimento com extra
  //    ganha uma linha "Procedimentos extras" listando descrição e valor.
  await irPara(page, `/financeiro/repasses/${alvo.id}`, /^Repasse ·/);
  for (const coluna of [
    "Data",
    "Paciente",
    "Consultório",
    "Turno",
    "Consulta",
    "Procedimentos",
    "Total",
    "Pagamento",
  ]) {
    await expect(
      page.getByRole("columnheader", { name: coluna, exact: true }),
    ).toBeVisible();
  }

  // A tabela é montada a partir de `repasse.atendimentos`; o breakdown é quem
  // carrega os procedimentos. Só conta quem está nos dois lados.
  const idsNaTabela = new Set(det.repasse.atendimentos.map((a) => a.id));
  const extrasNaTela = comProcedimento.filter((d) =>
    idsNaTabela.has(d.atendimentoId),
  );
  expect(extrasNaTela.length).toBeGreaterThan(0);
  // `exact` porque a nota do card "Cálculo" também fala em procedimentos
  // extras — aqui interessa só o rótulo da linha secundária da tabela.
  await expect(
    page.getByText("Procedimentos extras", { exact: true }),
  ).toHaveCount(extrasNaTela.length);

  // O primeiro procedimento extra aparece nominalmente, com o valor próprio.
  const exemplo = extrasNaTela[0].procedimentos[0];
  await expect(page.getByText(exemplo.descricao).first()).toBeVisible();

  // Atendimento sem procedimento mostra "—" na coluna (e não R$ 0,00).
  const semProcedimento = det.breakdown.detalhes.filter(
    (d) => Number(d.valorProcedimentos) === 0 && idsNaTabela.has(d.atendimentoId),
  );
  if (semProcedimento.length > 0) {
    await expect(page.getByText("—", { exact: true }).first()).toBeVisible();
  }

  await expect(page.getByText("Cálculo", { exact: true })).toBeVisible();
  await mostrar(page);
});

// ===========================================================================
// FI05 — Status de pagamento (pago, pendente, gratuito)
// ===========================================================================

test("FI05 — status de pagamento pago, pendente e gratuito", async ({ page }) => {
  await login(page, "admin");

  // 1) A tela de atendimentos filtra pelos três status de pagamento.
  await irPara(page, "/atendimentos", /^Atendimentos$/);
  await expect(page.getByText("Pagamento:")).toBeVisible();
  for (const label of ["Pendente", "Pago", "Gratuito"]) {
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  }
  await mostrar(page);

  // 2) Os três valores existem de fato nos dados (filtro server-side).
  for (const status of ["pago", "pendente", "gratuito"] as const) {
    const { atendimentos } = await getJson<{ atendimentos: AtendimentoApi[] }>(
      page,
      `/api/atendimentos?statusPagamento=${status}`,
    );
    expect(atendimentos.length, `nenhum atendimento ${status}`).toBeGreaterThan(0);
    expect(atendimentos.every((a) => a.statusPagamento === status)).toBe(true);
  }

  // 3) Transição real de status: agendado → em_atendimento → realizado/pendente,
  //    e depois pendente → pago (FI11, admin/auxiliar, com motivo auditado).
  const atendimentoId = await abrirProximoAtendimento(page);

  const finalizar = await page.request.post(
    `/api/atendimentos/${atendimentoId}/finalizar`,
    { data: { valorConsulta: 220, statusPagamento: "pendente" } },
  );
  expect(finalizar.status(), "POST /finalizar (AT06)").toBe(200);
  const finalizado = (await finalizar.json()) as { atendimento: AtendimentoApi };
  expect(finalizado.atendimento.status).toBe("realizado");
  expect(finalizado.atendimento.statusPagamento).toBe("pendente");

  const pagar = await page.request.patch(`/api/atendimentos/${atendimentoId}`, {
    data: {
      statusPagamento: "pago",
      motivo: "Pagamento presencial confirmado no caixa (comprovação FI05)",
    },
  });
  expect(pagar.status(), "PATCH statusPagamento (FI11)").toBe(200);
  expect(
    ((await pagar.json()) as { atendimento: AtendimentoApi }).atendimento
      .statusPagamento,
  ).toBe("pago");

  // 4) A tela do atendimento reflete o status final.
  await irPara(page, `/atendimentos/${atendimentoId}`, /^Atendimento #/);
  await expect(page.getByText("Pago", { exact: true })).toBeVisible();
  await mostrar(page);
});

// ===========================================================================
// FI06 — Registro de descontos com justificativa
// ===========================================================================

test("FI06 — gratuidade e desconto parcial só são registrados com justificativa", async ({
  page,
}) => {
  await login(page, "admin");
  await irPara(page, "/atendimentos", /^Atendimentos$/);

  const atendimentoId = await abrirProximoAtendimento(page);

  // 1) Finalizar como `gratuito` SEM motivo é recusado na validação (422).
  const semMotivo = await page.request.post(
    `/api/atendimentos/${atendimentoId}/finalizar`,
    { data: { valorConsulta: 0, statusPagamento: "gratuito" } },
  );
  expect(semMotivo.status(), "gratuito sem motivo deve ser 422").toBe(422);
  const erro = (await semMotivo.json()) as {
    error: string;
    issues?: Record<string, string[]>;
  };
  expect(JSON.stringify(erro)).toMatch(/[Mm]otivo é obrigatório/);

  // 2) COM motivo, a gratuidade é aceita e a justificativa fica persistida.
  const justificativa =
    "Cortesia institucional — paciente em situação de vulnerabilidade (FI06)";
  const comMotivo = await page.request.post(
    `/api/atendimentos/${atendimentoId}/finalizar`,
    {
      data: {
        valorConsulta: 0,
        statusPagamento: "gratuito",
        motivoDescontoOuGratuidade: justificativa,
      },
    },
  );
  expect(comMotivo.status(), "gratuito com motivo deve ser 200").toBe(200);
  const salvo = (await comMotivo.json()) as { atendimento: AtendimentoApi };
  expect(salvo.atendimento.statusPagamento).toBe("gratuito");
  expect(salvo.atendimento.motivoDescontoOuGratuidade).toBe(justificativa);

  // 3) A justificativa aparece na tela do atendimento.
  await irPara(page, `/atendimentos/${atendimentoId}`, /^Atendimento #/);
  await expect(page.getByText("Justificativa")).toBeVisible();
  await expect(page.getByText(justificativa)).toBeVisible();
  await mostrar(page);

  // ---------------------------------------------------------------------
  // DESCONTO PARCIAL — cobrar abaixo do preço de tabela (`valorOriginal`)
  // ---------------------------------------------------------------------
  const descontoId = await abrirProximoAtendimento(page);

  // 4) Valor de tabela MENOR que o cobrado é incoerente (desconto negativo)
  //    e o servidor recusa antes de gravar (422).
  const tabelaMenor = await page.request.post(
    `/api/atendimentos/${descontoId}/finalizar`,
    {
      data: {
        valorConsulta: 220,
        valorOriginal: 150,
        statusPagamento: "pago",
        motivoDescontoOuGratuidade: "Tentativa incoerente (comprovação FI06)",
      },
    },
  );
  expect(tabelaMenor.status(), "tabela < cobrado deve ser 422").toBe(422);
  expect(JSON.stringify(await tabelaMenor.json())).toMatch(
    /[Vv]alor de tabela não pode ser menor/,
  );

  // 5) Cobrar abaixo da tabela SEM justificativa também é recusado (422) —
  //    é exatamente a regra que a gratuidade já tinha, agora valendo para o
  //    desconto parcial.
  const descontoSemMotivo = await page.request.post(
    `/api/atendimentos/${descontoId}/finalizar`,
    {
      data: {
        valorConsulta: 150, // consulta de tabela R$ 220
        valorOriginal: 220,
        statusPagamento: "pago",
      },
    },
  );
  expect(
    descontoSemMotivo.status(),
    "desconto parcial sem motivo deve ser 422",
  ).toBe(422);
  expect(JSON.stringify(await descontoSemMotivo.json())).toMatch(
    /[Mm]otivo é obrigatório/,
  );

  // 6) Pela TELA: o formulário de finalização separa "Valor de tabela" de
  //    "Valor cobrado", calcula o desconto ao vivo e passa a exigir a
  //    "Justificativa do desconto" (mesmo campo da gratuidade, outro rótulo).
  await irPara(page, `/atendimentos/${descontoId}`, /^Atendimento #/);
  await page.getByRole("button", { name: /Finalizar e registrar/ }).click();

  const campoTabela = page.getByLabel("Valor de tabela (R$)");
  await expect(campoTabela).toBeVisible({ timeout: 20_000 });
  await campoTabela.fill("220");
  await page.getByLabel("Valor cobrado (R$)").fill("150");
  await expect(page.getByTestId("desconto-concedido")).toHaveText(/70,00/);
  // Os botões de status vêm em minúsculas no DOM (capitalize é só CSS).
  // A classe `border-primary` é o único indicador de seleção — esperar por ela
  // garante que o clique registrou antes de submeter.
  const botaoPago = page.getByRole("button", { name: /^pago$/i });
  await botaoPago.click();
  await expect(botaoPago).toHaveClass(/border-primary/);

  const justificativaDesconto =
    "Desconto de retorno dentro de 30 dias (comprovação FI06)";
  await expect(page.getByLabel("Justificativa da gratuidade")).toHaveCount(0);
  await page
    .getByLabel("Justificativa do desconto")
    .fill(justificativaDesconto);
  await mostrar(page);

  const [respostaFinalizar] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes(`/api/atendimentos/${descontoId}/finalizar`) &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: /Confirmar finalização/ }).click(),
  ]);
  expect(respostaFinalizar.status(), "finalizar com desconto").toBe(200);
  await expect(
    page.getByRole("button", { name: /Confirmar finalização/ }),
  ).toHaveCount(0, { timeout: 20_000 });

  // 7) A justificativa do desconto é PRESERVADA (antes o servidor jogava
  //    fora tudo que não fosse gratuidade), junto com o preço de tabela.
  const { atendimento: comDesconto } = await getJson<{
    atendimento: AtendimentoApi;
  }>(page, `/api/atendimentos/${descontoId}`);
  expect(comDesconto.statusPagamento).toBe("pago");
  expect(Number(comDesconto.valorConsulta)).toBeCloseTo(150, 2);
  expect(Number(comDesconto.valorOriginal)).toBeCloseTo(220, 2);
  expect(comDesconto.motivoDescontoOuGratuidade).toBe(justificativaDesconto);

  // 8) E a tela do atendimento presta contas do abatimento concedido.
  await expect(page.getByText("Valor de tabela")).toBeVisible();
  await expect(page.getByText("Desconto concedido")).toBeVisible();
  await expect(page.getByText(justificativaDesconto)).toBeVisible();
  await mostrar(page);
});

// ===========================================================================
// FI07 — Fechamento financeiro semanal com prestação de contas
// ===========================================================================

test("FI07 — fechamento semanal com prestação de contas", async ({ page }) => {
  await login(page, "admin");

  // 1) A lista de repasses é agrupada por semana (segunda → domingo) e avisa
  //    que a geração é automática toda segunda-feira.
  await irPara(page, "/financeiro/repasses", /^Repasses$/);
  await expect(
    page.getByText("Geração automática toda segunda-feira"),
  ).toBeVisible();
  const grupos = page.getByText(/^Semana de \d{2}\/\d{2} a \d{2}\/\d{2}/);
  expect(
    await grupos.count(),
    "a seed tem 4 semanas de repasses agrupadas",
  ).toBeGreaterThanOrEqual(2);
  await mostrar(page);

  // 2) O agendador semanal existe e é protegido por Bearer secret
  //    (vercel.json: "0 3 * * 1" = segunda 00:00 BRT). Sem header → 401.
  const semHeader = await page.request.post("/api/cron/gerar-repasses");
  expect(semHeader.status(), "cron sem Authorization deve ser 401").toBe(401);

  const segredoErrado = await page.request.post("/api/cron/gerar-repasses", {
    headers: { authorization: "Bearer segredo-invalido-para-o-teste" },
  });
  expect(segredoErrado.status(), "cron com secret errado deve ser 401").toBe(401);

  // 3) O fechamento em si (`POST /api/repasses/gerar`, admin/auxiliar) é
  //    idempotente: chamado para um período já fechado, devolve o MESMO
  //    repasse em vez de duplicar (constraint @@unique por período).
  const repasses = await listarRepasses(page);
  const alvo = repasses[0];
  if (!alvo) throw new Error("seed sem repasses — rode 'npm run db:seed'");

  const gerar = await page.request.post("/api/repasses/gerar", {
    data: {
      profissionalId: alvo.profissionalId,
      periodoInicio: alvo.periodoInicio.slice(0, 10),
      periodoFim: alvo.periodoFim.slice(0, 10),
    },
  });
  expect(gerar.status(), "POST /api/repasses/gerar").toBe(201);
  const gerado = (await gerar.json()) as { repasse: { id: string } };
  expect(gerado.repasse.id, "deve reaproveitar o repasse da semana").toBe(alvo.id);

  // 4) A prestação de contas da semana: modalidade, atendimentos do período,
  //    tabela de atendimentos e o bloco de cálculo.
  await irPara(page, `/financeiro/repasses/${alvo.id}`, /^Repasse ·/);
  await expect(page.getByText("Modalidade")).toBeVisible();
  await expect(page.getByText("Atendimentos no período")).toBeVisible();
  await expect(page.getByText("Atendimentos do período")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Paciente" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Pagamento" })).toBeVisible();
  await expect(page.getByText("Cálculo", { exact: true })).toBeVisible();
  await mostrar(page);
});

// ===========================================================================
// FI08 — Aluguel fixo por turno utilizado
// ===========================================================================

test("FI08 — aluguel fixo cobrado por turno utilizado", async ({ page }) => {
  await login(page, "admin");

  // Dra. Helena Jacarandá (prof3): aluguel fixo de R$ 250,00 por turno.
  const prof3 = porEmail(
    await listarProfissionais(page),
    CONTAS.profissionalAluguel.email,
  );
  const aluguelPorTurno = Number(prof3.valorAluguelPorTurno);
  expect(prof3.modalidadeContrato).toBe("aluguel_fixo");
  expect(aluguelPorTurno).toBeCloseTo(250, 2);

  const { repasses } = await getJson<{ repasses: RepasseApi[] }>(
    page,
    `/api/repasses?profissionalId=${prof3.id}`,
  );
  const alvo = repasses[0];
  if (!alvo) {
    throw new Error("prof3 sem repasses na seed — rode 'npm run db:seed'");
  }

  // 1) API: valor do repasse = turnos utilizados × aluguel por turno.
  const det = await getJson<RepasseDetalheApi>(page, `/api/repasses/${alvo.id}`);
  expect(det.breakdown.modalidade).toBe("aluguel_fixo");
  const turnos = det.breakdown.turnosUtilizados.length;
  expect(turnos, "repasse de aluguel precisa ter turnos cobrados").toBeGreaterThan(0);
  expect(Number(det.breakdown.valorRepasse)).toBeCloseTo(turnos * aluguelPorTurno, 2);
  // O valor gravado é o mesmo que o servidor recalcula agora.
  expect(Number(det.repasse.valorRepasse)).toBeCloseTo(turnos * aluguelPorTurno, 2);

  // Turnos são únicos por (data, turno) — vários atendimentos no mesmo turno
  // não cobram aluguel duas vezes.
  const chaves = det.breakdown.turnosUtilizados.map((t) => `${t.data}|${t.turno}`);
  expect(new Set(chaves).size).toBe(turnos);
  expect(det.breakdown.detalhes.length).toBeGreaterThanOrEqual(turnos);

  // 2) Tela: prestação de contas mostra os turnos cobrados e o cálculo
  //    turnos × aluguel (em vez de bruto × percentual).
  await irPara(page, `/financeiro/repasses/${alvo.id}`, /^Repasse ·/);
  await expect(page.getByText("Turnos cobrados")).toBeVisible();
  await expect(page.getByText("Aluguel/turno")).toBeVisible();
  await expect(page.getByText("Turnos", { exact: true })).toBeVisible();
  await expect(page.getByText("Percentual", { exact: true })).toHaveCount(0);
  await expect(
    page.locator("ul li").filter({ hasText: /Manhã|Tarde|Noite/ }),
  ).toHaveCount(turnos);
  await mostrar(page);
});

// ===========================================================================
// FI09 — Pagamento online do paciente (Pix, cartão) — FORA DE ESCOPO
// ===========================================================================

/**
 * FI09 NÃO É IMPLEMENTADO E NÃO TEM VÍDEO — por decisão de escopo, não por
 * falha de execução.
 *
 * Registro documental:
 *   - `IMPLEMENTACAO-PLANO.md`, linha 621:
 *       | FI09 | ~~Pagamento online~~ | **REMOVIDO** (DEC-E09) |
 *   - `IMPLEMENTACAO-PLANO.md`, linha 385:
 *       - [x] FI09 (pagamento online) NÃO implementado (DEC-E09)
 *   - DEC-E09 (estado-decisoes-tomadas.md): "Pagamento online (PIX/cartão/
 *     boleto) removido do MVP — pagamentos passam a ser exclusivamente
 *     presenciais no atendimento (FI10 promovido a único modelo). Sistema
 *     apenas registra status pago/pendente/gratuito (FI05)".
 *   - PEND-045: confirmação do Dr. Edson em R2 (decisão técnica de
 *     2026-05-08 já fixou FI09 fora do MVP).
 *
 * Consequência técnica, verificada no código: NÃO existe gateway de
 * pagamento, checkout, integração Asaas/Pix/cartão, webhook de transação
 * nem qualquer tela de cobrança online no projeto. Portanto NÃO há o que
 * filmar — qualquer vídeo aqui seria encenação de uma funcionalidade
 * inexistente. Se o cliente reativar FI09 em R2, este teste deixa de ser
 * `skip` e passa a exigir a arquitetura de split de pagamento descrita
 * como fallback na DEC-E09.
 */
test.skip("FI09 — pagamento online (Pix, cartão): REMOVIDO do escopo por DEC-E09", async () => {
  // Intencionalmente vazio: sem gateway/checkout no produto, não há
  // comprovação possível. Ver comentário acima.
});
