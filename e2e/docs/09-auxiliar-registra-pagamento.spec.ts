/**
 * Jornada 09 — A auxiliar registra as cobranças do dia.
 * Cobre: [FI05] status de pagamento (pago / pendente / gratuito) e
 * [FI06] desconto e gratuidade com justificativa obrigatória.
 * (e [RF-021] no login).
 * Persona: AUXILIAR · Carla Nogueira.
 *
 * DUAS COISAS QUE O VÍDEO PRECISA DEIXAR CLARAS:
 *
 * 1. Quem opera o financeiro é a AUXILIAR. O atendente marca chegada e mexe
 *    na agenda, mas não fecha valor — por isso a jornada inteira é da Carla.
 *
 * 2. O pagamento é registrado À MÃO pela clínica. O ClinicaShare não recebe
 *    dinheiro: ele anota o que a recepção recebeu. Não existe pagamento
 *    online no sistema, e nenhum passo aqui finge que existe.
 */
import {
  test,
  expect,
  ELENCO,
  brl,
  entrarComo,
  lerJson,
  moedaBR,
  type AtendimentoApi,
} from "./_support";

/**
 * FI06 — o valor de tabela NÃO é digitado pela auxiliar: vem do cadastro do
 * profissional (`Profissional.valorConsultaBase`) e a tela só o exibe. Cada
 * atendimento tem o seu, então a jornada lê o número real de cada um em vez
 * de chumbar um valor aqui.
 */
const VALOR_COM_DESCONTO = 150;
const JUSTIFICATIVA_DESCONTO = "Desconto de retorno em 30 dias";
const JUSTIFICATIVA_GRATUIDADE =
  "Cortesia institucional — paciente encaminhado pela ONG parceira";

test("09 — Auxiliar registra pagamento, desconto e gratuidade", async ({
  page,
  jornada,
}) => {
  await jornada.abrir({
    persona: ELENCO.auxiliar.persona,
    objetivo:
      "Carla precisa fechar as cobranças do dia: um atendimento pago, um com desconto e um gratuito — tudo lançado à mão, com justificativa onde a regra exige.",
    ids: ["FI05", "FI06"],
    precondicoes: [
      "Carla Nogueira é auxiliar — é o papel que responde pelo financeiro da clínica",
      "A clínica tem atendimentos agendados esperando para serem realizados e cobrados",
      "O dinheiro é recebido na recepção: o sistema só registra o que aconteceu",
    ],
  });

  await entrarComo(page, jornada, "auxiliar");

  /** A mesma lista que a tela carrega — a auxiliar enxerga a clínica inteira. */
  const { atendimentos } = await lerJson<{ atendimentos: AtendimentoApi[] }>(
    page,
    "/api/atendimentos",
  );
  const contagem = { pago: 0, pendente: 0, gratuito: 0 };
  for (const a of atendimentos) contagem[a.statusPagamento] += 1;
  expect(contagem.pago, "a seed precisa de atendimentos pagos").toBeGreaterThan(0);
  expect(contagem.pendente, "a seed precisa de pagamentos pendentes").toBeGreaterThan(0);
  expect(contagem.gratuito, "a seed precisa de atendimentos gratuitos").toBeGreaterThan(0);

  // Três atendimentos agendados de pacientes diferentes: um vira pago, um vira
  // desconto e um vira gratuidade. Nomes distintos deixam a busca da tela
  // apontar sempre para uma linha só.
  const escolhidos: AtendimentoApi[] = [];
  const jaEscolhidos = new Set<string>();
  for (const a of atendimentos) {
    if (a.status !== "agendado") continue;
    if (jaEscolhidos.has(a.paciente.nome)) continue;
    jaEscolhidos.add(a.paciente.nome);
    escolhidos.push(a);
    if (escolhidos.length === 3) break;
  }
  expect(
    escolhidos.length,
    "a seed precisa de 3 atendimentos agendados de pacientes diferentes",
  ).toBe(3);

  /**
   * Abre um atendimento AGENDADO pela busca da lista e devolve o id que a
   * navegação realmente alcançou — a jornada nunca "adivinha" a tela em que
   * está, ela lê da URL e confere pelo dado. Devolve também o valor de tabela
   * do profissional (FI06), que a jornada não digita em lugar nenhum.
   */
  async function abrirAgendadoPelaBusca(
    nome: string,
  ): Promise<{ id: string; tabela: number }> {
    await page.getByLabel("Buscar atendimentos").fill(nome);
    const linha = page
      .getByRole("link", { name: `Ver atendimento de ${nome}` })
      .filter({ hasText: "Agendado" })
      .first();
    await expect(linha).toBeVisible({ timeout: 20_000 });
    await linha.click();
    await page.waitForURL(/\/atendimentos\/[^/]+$/, { timeout: 20_000 });
    const id = new URL(page.url()).pathname.split("/").filter(Boolean).pop()!;
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`^Atendimento #${id.slice(0, 8)}`),
      }),
    ).toBeVisible({ timeout: 20_000 });
    const { atendimento } = await lerJson<{ atendimento: AtendimentoApi }>(
      page,
      `/api/atendimentos/${id}`,
    );
    expect(atendimento.status, "a jornada precisa abrir um agendado").toBe(
      "agendado",
    );
    const tabela = Number(atendimento.profissional.valorConsultaBase);
    expect(
      Number.isFinite(tabela) && tabela > VALOR_COM_DESCONTO,
      "o cadastro do profissional precisa ter valor de consulta acima do desconto encenado",
    ).toBe(true);
    return { id, tabela };
  }

  /** Agendado → em atendimento → tela de finalização, do jeito da clínica. */
  async function abrirFinalizacao(): Promise<void> {
    await page.getByRole("button", { name: /Iniciar atendimento/i }).click();
    await page.getByRole("button", { name: /Finalizar e registrar/i }).click();
  }

  // -------------------------------------------------------------------------

  await jornada.passo(
    "[FI05] Carla abre a lista de atendimentos da clínica",
    async () => {
      await page.goto("/atendimentos");
      await expect(
        page.getByRole("heading", { name: /^Atendimentos$/ }),
      ).toBeVisible({ timeout: 20_000 });
    },
  );

  await jornada.passo(
    "[FI05] Existem exatamente três situações de pagamento — e nenhuma delas é cobrança online",
    async () => {
      await jornada.validar(
        page.getByRole("button", { name: "Pago", exact: true }),
        `Pago — a recepção já recebeu o dinheiro (${contagem.pago} atendimentos hoje na lista)`,
      );
      await jornada.validar(
        page.getByRole("button", { name: "Pendente", exact: true }),
        `Pendente — o atendimento aconteceu, o valor ainda não entrou (${contagem.pendente} na lista)`,
      );
      await jornada.validar(
        page.getByRole("button", { name: "Gratuito", exact: true }),
        `Gratuito — atendimento sem cobrança, sempre justificado (${contagem.gratuito} na lista)`,
      );
    },
  );

  await jornada.passo(
    "[FI05] Carla filtra só os gratuitos para conferir — o status é um filtro de verdade, não um enfeite",
    async () => {
      await page.getByRole("button", { name: "Pago", exact: true }).click();
      await page.getByRole("button", { name: "Pendente", exact: true }).click();
      await jornada.validar(
        page.getByRole("link", { name: /^Ver atendimento de / }).first(),
        "Sobram só os atendimentos marcados como Gratuito",
      );
      await page.getByRole("button", { name: /Limpar filtros/i }).first().click();
    },
  );

  // --- FI05: cobrança normal, marcada como paga ----------------------------

  let idPago = "";
  let valorCheio = 0;
  await jornada.passo(
    `[FI05] Carla abre o atendimento de ${escolhidos[0].paciente.nome} para lançar a cobrança`,
    async () => {
      const aberto = await abrirAgendadoPelaBusca(escolhidos[0].paciente.nome);
      idPago = aberto.id;
      valorCheio = aberto.tabela;
    },
  );

  await jornada.passo(
    `[FI05] Ela registra ${brl(valorCheio)} recebido na recepção e marca o atendimento como PAGO`,
    async () => {
      await abrirFinalizacao();
      // O valor de tabela não é digitado: a tela mostra o preço do cadastro.
      await expect(page.getByTestId("valor-tabela")).toHaveText(
        moedaBR(valorCheio),
      );
      await page.getByLabel("Valor cobrado (R$)").fill(String(valorCheio));
      // O sistema não recebe dinheiro: quem marca "pago" é a clínica, à mão.
      await page.getByRole("button", { name: /^pago$/i }).click();
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/atendimentos/${idPago}/finalizar`) &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar finalização/i }).click(),
      ]);
      expect(resposta.status()).toBe(200);
      await jornada.validar(
        page.getByText("Pago", { exact: true }),
        `${brl(valorCheio)} cobrados integralmente — pagamento registrado pela clínica`,
      );
    },
  );

  // --- FI06: desconto parcial com justificativa obrigatória ----------------

  let idDesconto = "";
  let tabelaDesconto = 0;
  let descontoConcedido = 0;
  await jornada.passo(
    `[FI06] Agora o atendimento de ${escolhidos[1].paciente.nome}, que sai com desconto`,
    async () => {
      await page.getByRole("link", { name: /Voltar para atendimentos/i }).click();
      await page.waitForURL("**/atendimentos", { timeout: 20_000 });
      const aberto = await abrirAgendadoPelaBusca(escolhidos[1].paciente.nome);
      idDesconto = aberto.id;
      tabelaDesconto = aberto.tabela;
      descontoConcedido = tabelaDesconto - VALOR_COM_DESCONTO;
    },
  );

  await jornada.passo(
    `[FI06] A tabela do cadastro é ${brl(tabelaDesconto)}; Carla lança ${brl(VALOR_COM_DESCONTO)} de valor cobrado`,
    async () => {
      await abrirFinalizacao();
      // Só o valor cobrado é digitado. A tabela vem do cadastro do
      // profissional — é o que impede erro de digitação no preço cheio.
      await expect(page.getByTestId("valor-tabela")).toHaveText(
        moedaBR(tabelaDesconto),
      );
      await page
        .getByLabel("Valor cobrado (R$)")
        .fill(String(VALOR_COM_DESCONTO));
      await expect(page.getByTestId("desconto-concedido")).toHaveText(
        moedaBR(descontoConcedido),
      );
      await jornada.validar(
        page.getByTestId("desconto-concedido"),
        `O sistema calcula sozinho: ${brl(descontoConcedido)} de desconto sobre a tabela`,
      );
    },
  );

  await jornada.passo(
    "[FI06] Sem justificativa, o sistema não deixa concluir — desconto sem motivo não entra",
    async () => {
      const justificativa = page.getByLabel("Justificativa do desconto");
      await expect(justificativa).toHaveValue("");
      await page.getByRole("button", { name: /Confirmar finalização/i }).click();

      // Campo obrigatório: o envio nem sai do formulário.
      const bloqueado = await justificativa.evaluate(
        (el) => !(el as HTMLInputElement).checkValidity(),
      );
      expect(bloqueado, "justificativa vazia bloqueia o envio").toBe(true);
      await jornada.validar(
        justificativa,
        "Em branco: a finalização é barrada e nada é gravado",
      );

      // Texto curto também é recusado — a regra é no mínimo 3 caracteres.
      await justificativa.fill("ok");
      await page.getByRole("button", { name: /Confirmar finalização/i }).click();
      await jornada.validar(
        page.getByText(/Informe a justificativa do desconto/i).first(),
        "Recusado de novo: a justificativa precisa ter no mínimo 3 caracteres",
      );

      // A regra é do servidor, não só da tela: pular o formulário dá 400
      // (RegraNegocio) — o usecase compara o cobrado com o valor de tabela do
      // cadastro, sem depender de nada que o cliente mande.
      const recusaDoServidor = await page.request.post(
        `/api/atendimentos/${idDesconto}/finalizar`,
        {
          data: {
            valorConsulta: VALOR_COM_DESCONTO,
            statusPagamento: "pago",
          },
        },
      );
      expect(
        recusaDoServidor.status(),
        "servidor recusa desconto sem justificativa (FI06)",
      ).toBe(400);
      expect(
        ((await recusaDoServidor.json()) as { error: string }).error,
      ).toMatch(/exige justificativa/i);
    },
  );

  await jornada.passo(
    `[FI06] Com a justificativa "${JUSTIFICATIVA_DESCONTO}", a cobrança com desconto é aceita`,
    async () => {
      await page
        .getByLabel("Justificativa do desconto")
        .fill(JUSTIFICATIVA_DESCONTO);
      await page.getByRole("button", { name: /^pago$/i }).click();
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/atendimentos/${idDesconto}/finalizar`) &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar finalização/i }).click(),
      ]);
      expect(resposta.status()).toBe(200);
    },
  );

  await jornada.passo(
    "[FI06] A ficha guarda os três dados juntos: valor de tabela, valor cobrado e o motivo do desconto",
    async () => {
      await jornada.validar(
        page.getByText("Desconto concedido"),
        `Tabela ${brl(tabelaDesconto)} · cobrado ${brl(VALOR_COM_DESCONTO)} · desconto ${brl(descontoConcedido)}`,
      );
      await jornada.validar(
        page.getByText(JUSTIFICATIVA_DESCONTO),
        `Motivo registrado: "${JUSTIFICATIVA_DESCONTO}"`,
      );

      // Prova pelo dado: o desconto não vira "valor menor" sem explicação.
      const { atendimento } = await lerJson<{ atendimento: AtendimentoApi }>(
        page,
        `/api/atendimentos/${idDesconto}`,
      );
      expect(atendimento.status).toBe("realizado");
      expect(atendimento.statusPagamento).toBe("pago");
      // Derivado pelo servidor a partir do cadastro — a tela não mandou.
      expect(Number(atendimento.valorOriginal)).toBe(tabelaDesconto);
      expect(Number(atendimento.valorConsulta)).toBe(VALOR_COM_DESCONTO);
      expect(atendimento.motivoDescontoOuGratuidade).toBe(
        JUSTIFICATIVA_DESCONTO,
      );
    },
  );

  // --- FI06: gratuidade, também com justificativa obrigatória --------------

  let idGratuito = "";
  let tabelaGratuito = 0;
  await jornada.passo(
    `[FI06] Por último, o atendimento de ${escolhidos[2].paciente.nome}, que a clínica não vai cobrar`,
    async () => {
      await page.getByRole("link", { name: /Voltar para atendimentos/i }).click();
      await page.waitForURL("**/atendimentos", { timeout: 20_000 });
      const aberto = await abrirAgendadoPelaBusca(escolhidos[2].paciente.nome);
      idGratuito = aberto.id;
      tabelaGratuito = aberto.tabela;
    },
  );

  await jornada.passo(
    `[FI06] Carla marca GRATUITO: tabela ${brl(tabelaGratuito)}, cobrado ${brl(0)} — e o campo de justificativa troca de nome`,
    async () => {
      await abrirFinalizacao();
      await expect(page.getByTestId("valor-tabela")).toHaveText(
        moedaBR(tabelaGratuito),
      );
      await page.getByLabel("Valor cobrado (R$)").fill("0");
      await expect(page.getByLabel("Justificativa do desconto")).toBeVisible();
      await page.getByRole("button", { name: /^gratuito$/i }).click();
      await jornada.validar(
        page.getByLabel("Justificativa da gratuidade"),
        "Mesmo campo, outro nome: gratuidade também é obrigatoriamente justificada",
      );
    },
  );

  await jornada.passo(
    `[FI06] Ela escreve o motivo da cortesia e conclui o atendimento gratuito`,
    async () => {
      await page
        .getByLabel("Justificativa da gratuidade")
        .fill(JUSTIFICATIVA_GRATUIDADE);
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/atendimentos/${idGratuito}/finalizar`) &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar finalização/i }).click(),
      ]);
      expect(resposta.status()).toBe(200);
      await jornada.validar(
        page.getByText("Gratuito", { exact: true }),
        `Atendimento gratuito registrado com o motivo: "${JUSTIFICATIVA_GRATUIDADE}"`,
      );

      const { atendimento } = await lerJson<{ atendimento: AtendimentoApi }>(
        page,
        `/api/atendimentos/${idGratuito}`,
      );
      expect(atendimento.statusPagamento).toBe("gratuito");
      expect(Number(atendimento.valorConsulta)).toBe(0);
      expect(atendimento.motivoDescontoOuGratuidade).toBe(
        JUSTIFICATIVA_GRATUIDADE,
      );
    },
  );

  await jornada.encerrar(
    `Três cobranças fechadas à mão pela auxiliar: ${brl(valorCheio)} pago integralmente; ` +
      `${brl(VALOR_COM_DESCONTO)} cobrados sobre tabela de ${brl(tabelaDesconto)} ` +
      `(desconto de ${brl(descontoConcedido)} justificado como "${JUSTIFICATIVA_DESCONTO}"); ` +
      `e 1 atendimento gratuito justificado. Nenhum valor entra sozinho — ` +
      `a clínica registra o que recebeu.`,
  );
});
