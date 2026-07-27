/**
 * Jornada 10 — O administrador fecha a semana financeira.
 * Cobre: [FI07], [FI03], [FI04] (e [RF-021] no login).
 * Persona: ADMINISTRADOR · Roberto Lima.
 *
 * A pergunta que este vídeo responde: "de onde saiu o valor que cada
 * profissional tem a receber?". Por isso a jornada nunca mostra só o número
 * final — ela abre a prestação de contas dos DOIS tipos de contrato que
 * convivem na clínica (percentual sobre o bruto e aluguel fixo por turno) e,
 * no fim, confere o que está na tela contra o que o servidor recalcula na
 * hora.
 *
 * Nada aqui é encenado: os repasses, os profissionais e os procedimentos são
 * lidos do próprio sistema pela API antes de virarem legenda.
 */
import {
  test,
  expect,
  brl,
  ELENCO,
  entrarComo,
  lerJson,
  numeroBR,
} from "./_support";

type Modalidade = "percentual" | "aluguel_fixo";

interface RepasseApi {
  id: string;
  profissionalId: string;
  periodoInicio: string;
  periodoFim: string;
  receitaBruta: string;
  valorRepasse: string;
  status: "aberto" | "pago";
  profissional: {
    id: string;
    nome: string;
    especialidade: string;
    modalidadeContrato: Modalidade;
  };
  atendimentos: { id: string }[];
}

interface DetalheRepasseApi {
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
    turnosUtilizados: { data: string; turno: string }[];
    detalhes: {
      atendimentoId: string;
      valorConsulta: string;
      /** FI04 — soma dos procedimentos extras do atendimento. */
      valorProcedimentos: string;
      /** FI04 — valorConsulta + valorProcedimentos. */
      valorTotal: string;
      procedimentos: { descricao: string; valor: string }[];
    }[];
  };
}

interface ContratoApi {
  id: string;
  nome: string;
  email: string;
  modalidadeContrato: Modalidade;
  percentualRepasse: string | null;
  valorAluguelPorTurno: string | null;
}

const soma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

test("10 — Administrador fecha a semana financeira", async ({
  page,
  jornada,
}) => {
  await jornada.abrir({
    persona: ELENCO.admin.persona,
    objetivo:
      "Roberto vai fechar a semana: conferir quanto cada profissional tem a receber e provar de onde saiu cada número.",
    ids: ["FI07", "FI03", "FI04"],
    precondicoes: [
      "As semanas anteriores já foram calculadas pelo servidor, toda segunda de manhã",
      "Os contratos são diferentes: uns pagam percentual sobre o bruto, outros aluguel fixo por turno",
      "Alguns atendimentos tiveram procedimentos extras além da consulta",
    ],
  });

  await entrarComo(page, jornada, "admin");

  // ---------------------------------------------------------------------
  // Tudo que vira legenda é lido do sistema antes — o spec não inventa
  // número nenhum.
  // ---------------------------------------------------------------------
  const { repasses } = await lerJson<{ repasses: RepasseApi[] }>(
    page,
    "/api/repasses",
  );
  expect(
    repasses.length,
    "a seed precisa ter repasses fechados — rode 'npm run db:seed'",
  ).toBeGreaterThan(0);

  const abertos = repasses.filter((r) => r.status === "aberto");
  const pagos = repasses.filter((r) => r.status === "pago");
  const semanas = new Set(
    repasses.map(
      (r) => `${r.periodoInicio.slice(0, 10)}|${r.periodoFim.slice(0, 10)}`,
    ),
  );
  const totalEmAberto = soma(abertos.map((r) => Number(r.valorRepasse)));

  await jornada.passo(
    `[FI07] Roberto abre o fechamento semanal: ${repasses.length} repasses agrupados em ${semanas.size} semanas, de segunda a domingo`,
    async () => {
      await page.goto("/financeiro/repasses");
      await expect(
        page.getByRole("heading", { name: /^Repasses$/ }),
      ).toBeVisible();

      // Esperar o botão de ação garante que a lista terminou de carregar —
      // o esqueleto de loading não tem botão nenhum.
      const botoesPagar = page.getByRole("button", { name: /^Pagar$/ });
      await expect(botoesPagar.first()).toBeVisible({ timeout: 20_000 });

      // O fechamento não é feito no clique de ninguém: a tela avisa que o
      // cálculo é agendado e que aqui só se exibe e se dá baixa.
      await expect(
        page.getByText("Geração automática toda segunda-feira"),
      ).toBeVisible();

      // Uma tabela por semana — é isso que "agrupado por semana" quer dizer.
      expect(await page.getByRole("table").count()).toBeGreaterThanOrEqual(2);

      // Os dois lados do fechamento convivem na mesma tela: quem já recebeu
      // e quem ainda tem valor a receber.
      expect(await botoesPagar.count()).toBeGreaterThan(0);
      expect(
        await page.getByRole("row").filter({ hasText: /Pago/ }).count(),
      ).toBeGreaterThan(0);

      await jornada.validar(
        page.getByRole("table").first(),
        `${pagos.length} repasses já pagos e ${abertos.length} em aberto — ${brl(totalEmAberto)} a pagar`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [FI03] parte 1 — contrato por PERCENTUAL
  // ---------------------------------------------------------------------
  const doPercentual = repasses.find(
    (r) =>
      r.profissional.modalidadeContrato === "percentual" &&
      Number(r.valorRepasse) > 0,
  );
  expect(
    doPercentual,
    "a seed precisa ter repasse de profissional percentual",
  ).toBeTruthy();

  const detPercentual = await lerJson<DetalheRepasseApi>(
    page,
    `/api/repasses/${doPercentual!.id}`,
  );
  const percentual = Number(detPercentual.repasse.profissional.percentualRepasse);
  const brutoPercentual = Number(detPercentual.breakdown.receitaBruta);
  const valorPercentual = Number(detPercentual.breakdown.valorRepasse);
  const rotuloPercentual = `${(percentual * 100).toFixed(0)}%`;

  await jornada.passo(
    `[FI03] A prestação de contas de ${doPercentual!.profissional.nome}: receita bruta × ${rotuloPercentual} = valor do repasse`,
    async () => {
      await page.goto(`/financeiro/repasses/${doPercentual!.id}`);
      await expect(
        page.getByRole("heading", { name: /^Repasse ·/ }),
      ).toBeVisible({ timeout: 20_000 });

      // O bloco "Cálculo" é a conta aberta, linha por linha. (CardTitle
      // renderiza <div>, não heading — por isso getByText.)
      await expect(page.getByText("Cálculo", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Receita bruta", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Percentual", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Valor do repasse", { exact: true }),
      ).toBeVisible();
      // A própria tela declara onde a conta acontece.
      await expect(
        page.getByText(/Cálculo realizado no servidor/),
      ).toBeVisible();

      // "Cálculo" é o CardTitle: ancestor::div[1] é o CardHeader, [2] o Card.
      const blocoCalculo = page
        .getByText("Cálculo", { exact: true })
        .locator("xpath=ancestor::div[2]");
      await jornada.validar(
        blocoCalculo,
        `${brl(brutoPercentual)} de receita bruta × ${rotuloPercentual} = ${brl(valorPercentual)} — a conta é feita no servidor, nunca no navegador`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [FI04] — a base do repasse soma consulta + procedimentos extras
  //
  // Nem todo repasse tem procedimento: a seed espalha extras por ~25% dos
  // atendimentos realizados e pagos. A busca abaixo é a mesma que uma pessoa
  // faria na mão — percorre os repasses percentuais e abre o detalhamento de
  // cada um até achar. Só entra quem aparece nos DOIS lados (breakdown e
  // tabela da tela), senão a legenda apontaria para uma linha invisível.
  // ---------------------------------------------------------------------
  let comExtra: { repasse: RepasseApi; detalhe: DetalheRepasseApi } | undefined;
  for (const r of repasses.filter(
    (x) => x.profissional.modalidadeContrato === "percentual",
  )) {
    const detalhe =
      r.id === doPercentual!.id
        ? detPercentual
        : await lerJson<DetalheRepasseApi>(page, `/api/repasses/${r.id}`);
    const naTela = new Set(detalhe.repasse.atendimentos.map((a) => a.id));
    const temExtra = detalhe.breakdown.detalhes.some(
      (d) => Number(d.valorProcedimentos) > 0 && naTela.has(d.atendimentoId),
    );
    if (temExtra) {
      comExtra = { repasse: r, detalhe };
      break;
    }
  }

  if (comExtra) {
    const { repasse: repasseExtra, detalhe: detExtra } = comExtra;
    const totalComExtras = soma(
      detExtra.breakdown.detalhes.map((d) => Number(d.valorTotal)),
    );
    const totalSoConsultas = soma(
      detExtra.breakdown.detalhes.map((d) => Number(d.valorConsulta)),
    );

    await jornada.passo(
      `[FI04] O que entra na base: consulta + procedimentos extras — detalhamento de ${repasseExtra.profissional.nome}`,
      async () => {
        await page.goto(`/financeiro/repasses/${repasseExtra.id}`);
        await expect(
          page.getByRole("heading", { name: /^Repasse ·/ }),
        ).toBeVisible({ timeout: 20_000 });

        // A tabela separa o que é consulta, o que é procedimento e o total.
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

        // A linha secundária lista cada procedimento cobrado, com o valor.
        // (`exact` porque a nota do bloco "Cálculo" também fala em
        // procedimentos extras.)
        const linhaExtras = page
          .getByText("Procedimentos extras", { exact: true })
          .first()
          .locator("xpath=ancestor::tr[1]");
        await expect(linhaExtras).toBeVisible();
        await jornada.validar(
          linhaExtras,
          "Os procedimentos cobrados dentro da consulta aparecem um a um, com o valor de cada",
        );

        // A linha imediatamente acima é o atendimento a que eles pertencem:
        // os números da legenda saem da própria tela.
        const linhaAtendimento = linhaExtras.locator(
          "xpath=preceding-sibling::tr[1]",
        );
        const celulas = linhaAtendimento.locator("td");
        const consulta = numeroBR(await celulas.nth(4).innerText());
        const procedimentos = numeroBR(await celulas.nth(5).innerText());
        const total = numeroBR(await celulas.nth(6).innerText());
        expect(total).toBeCloseTo(consulta + procedimentos, 2);

        await jornada.validar(
          linhaAtendimento,
          `Consulta ${brl(consulta)} + procedimentos ${brl(procedimentos)} = ${brl(total)} — é o total que entra na base do repasse`,
        );

        // E a base do repasse inteiro é a soma desses totais: com os extras
        // ela é estritamente maior do que só as consultas.
        expect(totalComExtras).toBeCloseTo(
          Number(detExtra.breakdown.receitaBruta),
          2,
        );
        expect(totalComExtras).toBeGreaterThan(totalSoConsultas);
      },
    );
  } else {
    // Ressalva honesta: sem dado, não há o que mostrar. O vídeo diz isso em
    // vez de encenar um procedimento que não existe nesta base.
    await jornada.passo(
      "[FI04] Nenhum repasse desta base tem procedimento extra — a coluna existe, mas está sem dado para mostrar",
      async () => {
        await page.goto(`/financeiro/repasses/${doPercentual!.id}`);
        await expect(
          page.getByRole("heading", { name: /^Repasse ·/ }),
        ).toBeVisible({ timeout: 20_000 });
        await jornada.validar(
          page.getByRole("columnheader", {
            name: "Procedimentos",
            exact: true,
          }),
          "A composição consulta + procedimentos é prevista na prestação de contas; nesta base nenhum atendimento teve procedimento extra",
        );
      },
    );
  }

  // ---------------------------------------------------------------------
  // [FI03] parte 2 — contrato por ALUGUEL FIXO
  // ---------------------------------------------------------------------
  const { profissionais } = await lerJson<{ profissionais: ContratoApi[] }>(
    page,
    "/api/profissionais?ativo=all",
  );
  const helena = profissionais.find(
    (p) => p.email === ELENCO.psicologa.email,
  );
  expect(
    helena,
    `${ELENCO.psicologa.persona.nome} precisa existir na base`,
  ).toBeTruthy();
  expect(helena!.modalidadeContrato).toBe("aluguel_fixo");
  const aluguelPorTurno = Number(helena!.valorAluguelPorTurno);

  const { repasses: repassesHelena } = await lerJson<{
    repasses: RepasseApi[];
  }>(page, `/api/repasses?profissionalId=${helena!.id}`);
  const repasseHelena = repassesHelena.find((r) => Number(r.valorRepasse) > 0);
  expect(
    repasseHelena,
    `${helena!.nome} precisa ter repasse fechado na seed`,
  ).toBeTruthy();

  const detHelena = await lerJson<DetalheRepasseApi>(
    page,
    `/api/repasses/${repasseHelena!.id}`,
  );
  const turnos = detHelena.breakdown.turnosUtilizados.length;
  const valorHelena = Number(detHelena.breakdown.valorRepasse);

  await jornada.passo(
    `[FI03] O mesmo fechamento com outro contrato: ${helena!.nome} paga aluguel fixo de ${brl(aluguelPorTurno)} por turno usado`,
    async () => {
      await page.goto(`/financeiro/repasses/${repasseHelena!.id}`);
      await expect(
        page.getByRole("heading", { name: /^Repasse ·/ }),
      ).toBeVisible({ timeout: 20_000 });

      // Aqui não existe percentual: o que conta é quantos turnos a sala foi
      // ocupada. Turnos repetidos no mesmo dia não cobram duas vezes.
      await expect(page.getByText("Turnos cobrados")).toBeVisible();
      await expect(page.getByText("Aluguel/turno")).toBeVisible();
      await expect(page.getByText("Turnos", { exact: true })).toBeVisible();
      await expect(page.getByText("Percentual", { exact: true })).toHaveCount(0);
      await expect(
        page.locator("ul li").filter({ hasText: /Manhã|Tarde|Noite/ }),
      ).toHaveCount(turnos);

      const blocoCalculo = page
        .getByText("Cálculo", { exact: true })
        .locator("xpath=ancestor::div[2]");
      await jornada.validar(
        blocoCalculo,
        `${turnos} turnos usados × ${brl(aluguelPorTurno)} = ${brl(valorHelena)} — no aluguel fixo o bruto não muda o repasse`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // A conferência final: a tela não é fonte da verdade, é reflexo dela.
  // ---------------------------------------------------------------------
  await jornada.passo(
    "[FI03] Roberto confere: o valor da tela é exatamente o que o servidor recalcula agora",
    async () => {
      // Ainda estamos na prestação de contas do aluguel fixo — lemos o
      // número que está impresso na tela.
      const valorNaTela = numeroBR(
        await page
          .getByText("Valor do repasse", { exact: true })
          .locator("xpath=following-sibling::span[1]")
          .innerText(),
      );

      // `GET /api/repasses/[id]` não devolve o valor guardado: ele refaz a
      // conta e devolve o `breakdown`. Se batesse só com o registro salvo,
      // provaria pouco.
      const recalculo = await lerJson<DetalheRepasseApi>(
        page,
        `/api/repasses/${repasseHelena!.id}`,
      );
      expect(Number(recalculo.breakdown.valorRepasse)).toBeCloseTo(
        turnos * aluguelPorTurno,
        2,
      );
      expect(Number(recalculo.repasse.valorRepasse)).toBeCloseTo(
        Number(recalculo.breakdown.valorRepasse),
        2,
      );
      expect(valorNaTela).toBeCloseTo(Number(recalculo.repasse.valorRepasse), 2);

      // O mesmo vale para o contrato por percentual visto antes.
      expect(Number(detPercentual.breakdown.valorRepasse)).toBeCloseTo(
        brutoPercentual * percentual,
        2,
      );
      expect(Number(detPercentual.repasse.valorRepasse)).toBeCloseTo(
        Number(detPercentual.breakdown.valorRepasse),
        2,
      );

      await jornada.validar(
        page
          .getByText("Valor do repasse", { exact: true })
          .locator("xpath=parent::div"),
        `Tela: ${brl(valorNaTela)} · recálculo do servidor: ${brl(Number(recalculo.breakdown.valorRepasse))} — mesmo número`,
      );
    },
  );

  await jornada.encerrar(
    `${repasses.length} repasses em ${semanas.size} semanas · percentual: ${brl(brutoPercentual)} × ${rotuloPercentual} = ${brl(valorPercentual)} · aluguel fixo: ${turnos} turnos × ${brl(aluguelPorTurno)} = ${brl(valorHelena)} — todos conferidos contra o recálculo do servidor`,
  );
});
