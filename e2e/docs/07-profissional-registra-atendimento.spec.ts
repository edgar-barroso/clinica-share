/**
 * Jornada 07 — A profissional atende e registra o que foi feito.
 * Cobre: [AT01] iniciar o atendimento agendado, [AT02] procedimentos extras,
 * [AT04] prontuário mantido fora do sistema (e [RF-021] no login).
 * Persona: PROFISSIONAL · Dra. Helena Braga (Psicologia, aluguel fixo).
 *
 * Por que procedimento extra importa: o valor de cada procedimento entra na
 * base do repasse do profissional. Um procedimento não lançado é dinheiro que
 * some do acerto do fim da semana — por isso cada um é uma linha própria, com
 * descrição e valor separados, e não um número solto somado na consulta.
 */
import {
  test,
  expect,
  ELENCO,
  brl,
  criarAgendadoNosBastidores,
  diaDe,
  entrarComo,
  isoHoje,
  lerJson,
  porExtenso,
  type AtendimentoApi,
} from "./_support";

const PROCEDIMENTO_1 = { descricao: "Aplicação de escala de ansiedade", valor: 80 };
const PROCEDIMENTO_2 = { descricao: "Relatório psicológico", valor: 150 };
const TOTAL_PROCEDIMENTOS = PROCEDIMENTO_1.valor + PROCEDIMENTO_2.valor;

/** Onde o registro clínico realmente está — AT04 exige dizer isso. */
const REFERENCIA_EXTERNA =
  "Sistema próprio da Dra. Helena Braga — ficha 4821";

/** Só a parte numérica do `formatBRL`, para casar com o texto da tela. */
function moeda(valor: number): RegExp {
  const texto = valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return new RegExp(texto.replace(/\./g, "\\."));
}

interface ProfissionalValor {
  id: string;
  nome: string;
  valorConsultaBase: string;
}

test("07 — Profissional registra o atendimento com procedimentos extras", async ({
  page,
  request,
  jornada,
}) => {
  await jornada.abrir({
    persona: ELENCO.psicologa.persona,
    objetivo:
      "A Dra. Helena atendeu a paciente e agora precisa registrar a sessão, os procedimentos extras e onde ficou o prontuário.",
    ids: ["AT01", "AT02", "AT04"],
    precondicoes: [
      "Dra. Helena Braga é profissional ativa, de Psicologia, com agenda semanal fixa",
      "Ela tem uma consulta agendada na própria agenda",
      "O prontuário clínico dela é mantido no sistema próprio, fora do ClinicaShare",
    ],
  });

  await entrarComo(page, jornada, "psicologa");

  const { user } = await lerJson<{ user: { profissionalId: string | null } }>(
    page,
    "/api/auth/me",
  );
  expect(
    user.profissionalId,
    "a conta da Dra. Helena precisa estar ligada ao cadastro de profissional",
  ).toBeTruthy();
  const profissionalId = user.profissionalId!;

  // A agenda que ela vê já vem filtrada pelo servidor: profissional só
  // enxerga os próprios atendimentos (RF-023).
  const hoje = isoHoje();
  async function agendadosDela(): Promise<AtendimentoApi[]> {
    const { agendamentos } = await lerJson<{ agendamentos: AtendimentoApi[] }>(
      page,
      "/api/agendamentos?status=agendado",
    );
    return agendamentos
      .filter((a) => diaDe(a) >= hoje)
      .sort((a, b) =>
        `${diaDe(a)}T${a.hora}`.localeCompare(`${diaDe(b)}T${b.hora}`),
      );
  }

  let agendados = await agendadosDela();
  if (agendados.length === 0) {
    await jornada.passo(
      "Pré-condição preparada nos bastidores: a agenda da Dra. Helena estava vazia, então um agendamento foi criado por fora para a jornada ter o que registrar",
      async () => {
        await criarAgendadoNosBastidores(request, profissionalId);
        agendados = await agendadosDela();
        expect(
          agendados.length,
          "pré-condição deveria ter criado um agendamento",
        ).toBeGreaterThan(0);
      },
    );
  }
  const alvo = agendados[0];
  const dataTexto = porExtenso(diaDe(alvo));

  const { profissionais } = await lerJson<{
    profissionais: ProfissionalValor[];
  }>(page, "/api/profissionais?ativo=true");
  const helena = profissionais.find((p) => p.id === profissionalId);
  expect(helena, "cadastro da Dra. Helena").toBeTruthy();
  const valorConsulta = Number(helena!.valorConsultaBase);
  const totalGeralEsperado = valorConsulta + TOTAL_PROCEDIMENTOS;

  await jornada.passo(
    "[AT01] Dra. Helena abre a própria agenda e vê os atendimentos que ainda precisa fazer",
    async () => {
      await page.goto("/minha-agenda");
      await expect(
        page.getByRole("heading", { name: /Minha agenda/i }),
      ).toBeVisible({ timeout: 20_000 });
      await jornada.validar(
        page
          .locator(`a[href="/atendimentos/${alvo.id}"]`)
          .filter({ hasText: "Iniciar" }),
        `${alvo.paciente.nome}, ${dataTexto} às ${alvo.hora} — a agenda oferece iniciar o atendimento`,
      );
    },
  );

  await jornada.passo(
    `[AT01] Ela abre o atendimento de ${alvo.paciente.nome} das ${alvo.hora} direto da agenda`,
    async () => {
      await page
        .locator(`a[href="/atendimentos/${alvo.id}"]`)
        .filter({ hasText: "Iniciar" })
        .click();
      await page.waitForURL(`**/atendimentos/${alvo.id}`, { timeout: 20_000 });
      await expect(
        page.getByRole("heading", {
          name: new RegExp(`^Atendimento #${alvo.id.slice(0, 8)}`),
        }),
      ).toBeVisible({ timeout: 20_000 });
      await jornada.validar(
        page.getByText("Prontuário ainda não preenchido"),
        "Antes de começar, o atendimento não tem registro clínico nenhum",
      );
    },
  );

  await jornada.passo(
    "[AT01] Dra. Helena inicia o atendimento — a consulta sai de Agendado e entra Em atendimento",
    async () => {
      await page.getByRole("button", { name: /Iniciar atendimento/i }).click();
      await jornada.validar(
        page.getByText("Em atendimento", { exact: true }),
        "Sessão em andamento: o sistema registra que o atendimento começou",
      );
    },
  );

  await jornada.passo(
    `[AT02] Terminada a sessão, ela abre a tela de finalização e confirma o valor da consulta: ${brl(valorConsulta)}`,
    async () => {
      await page
        .getByRole("button", { name: /Finalizar e registrar/i })
        .click();
      await page.getByLabel("Valor de tabela (R$)").fill(String(valorConsulta));
      await page.getByLabel("Valor cobrado (R$)").fill(String(valorConsulta));
      await jornada.validar(
        page.getByTestId("total-geral"),
        `Só a consulta, por enquanto: ${brl(valorConsulta)}`,
      );
    },
  );

  await jornada.passo(
    `[AT02] Ela lança o 1º procedimento extra: ${PROCEDIMENTO_1.descricao} — ${brl(PROCEDIMENTO_1.valor)}`,
    async () => {
      await page
        .getByRole("button", { name: "Adicionar procedimento" })
        .click();
      await page
        .getByLabel("Descrição do procedimento 1")
        .fill(PROCEDIMENTO_1.descricao);
      await page
        .getByLabel("Valor do procedimento 1")
        .fill(String(PROCEDIMENTO_1.valor));
      await expect(page.getByTestId("total-procedimentos")).toHaveText(
        moeda(PROCEDIMENTO_1.valor),
      );
      await jornada.validar(
        page.getByTestId("total-geral"),
        `Total sobe na hora para ${brl(valorConsulta + PROCEDIMENTO_1.valor)} — cada procedimento entra na base do repasse dela`,
      );
    },
  );

  await jornada.passo(
    `[AT02] E o 2º procedimento: ${PROCEDIMENTO_2.descricao} — ${brl(PROCEDIMENTO_2.valor)}`,
    async () => {
      await page
        .getByRole("button", { name: "Adicionar procedimento" })
        .click();
      await page
        .getByLabel("Descrição do procedimento 2")
        .fill(PROCEDIMENTO_2.descricao);
      await page
        .getByLabel("Valor do procedimento 2")
        .fill(String(PROCEDIMENTO_2.valor));
      await expect(page.getByTestId("total-procedimentos")).toHaveText(
        moeda(TOTAL_PROCEDIMENTOS),
      );
      await jornada.validar(
        page.getByTestId("total-geral"),
        `${brl(valorConsulta)} de consulta + ${brl(TOTAL_PROCEDIMENTOS)} de procedimentos = ${brl(totalGeralEsperado)}`,
      );
    },
  );

  await jornada.passo(
    "[AT04] Dra. Helena declara que o prontuário dela fica fora do sistema e informa onde o registro está",
    async () => {
      const registro = page.getByRole("radiogroup", {
        name: "Registro do prontuário",
      });
      await registro.getByLabel("Prontuário externo").check();
      await expect(registro.getByLabel("Prontuário externo")).toBeChecked();
      await page
        .getByLabel("Referência do prontuário externo")
        .fill(REFERENCIA_EXTERNA);
      await jornada.validar(
        page.getByLabel("Referência do prontuário externo"),
        "O conteúdo clínico continua no sistema dela — mas o ClinicaShare guarda ONDE ele está, sem buraco na trilha",
      );
    },
  );

  await jornada.passo(
    "[AT02] Dra. Helena confirma a finalização do atendimento",
    async () => {
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/atendimentos/${alvo.id}/finalizar`) &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar finalização/i }).click(),
      ]);
      expect(resposta.status()).toBe(200);
      await jornada.validar(
        page.getByText("Realizado", { exact: true }),
        "Atendimento realizado e fechado",
      );
    },
  );

  await jornada.passo(
    "[AT04] A ficha passa a mostrar que o prontuário é externo, com a referência salva",
    async () => {
      await expect(page.getByText("Prontuário registrado")).toBeVisible();
      await jornada.validar(
        page.getByText(REFERENCIA_EXTERNA),
        `Prontuário externo: "${REFERENCIA_EXTERNA}"`,
      );
    },
  );

  await jornada.passo(
    "[AT02] Os dois procedimentos ficam individualizados no valor do atendimento",
    async () => {
      await jornada.validar(
        page.getByText(PROCEDIMENTO_1.descricao).first(),
        `${PROCEDIMENTO_1.descricao} — ${brl(PROCEDIMENTO_1.valor)}, linha própria`,
      );
      await jornada.validar(
        page.getByText(PROCEDIMENTO_2.descricao).first(),
        `${PROCEDIMENTO_2.descricao} — ${brl(PROCEDIMENTO_2.valor)}, linha própria`,
      );

      // Prova pelo dado: procedimentos separados (não somados na consulta) e
      // prontuário externo marcado com a referência.
      const { atendimento } = await lerJson<{ atendimento: AtendimentoApi }>(
        page,
        `/api/atendimentos/${alvo.id}`,
      );
      expect(atendimento.status).toBe("realizado");
      expect(atendimento.usaProntuarioExterno).toBe(true);
      expect(atendimento.referenciaProntuarioExterno).toBe(REFERENCIA_EXTERNA);

      const registrados = (atendimento.procedimentos ?? [])
        .map((p) => ({ descricao: p.descricao, valor: Number(p.valor) }))
        .sort((a, b) => a.descricao.localeCompare(b.descricao));
      expect(registrados).toEqual([
        { descricao: PROCEDIMENTO_1.descricao, valor: PROCEDIMENTO_1.valor },
        { descricao: PROCEDIMENTO_2.descricao, valor: PROCEDIMENTO_2.valor },
      ]);
      expect(Number(atendimento.valorProcedimentos)).toBe(TOTAL_PROCEDIMENTOS);
      expect(Number(atendimento.valorTotal)).toBe(totalGeralEsperado);
    },
  );

  await jornada.encerrar(
    `Atendimento de ${alvo.paciente.nome} (${dataTexto}, ${alvo.hora}) finalizado: ` +
      `consulta ${brl(valorConsulta)} + ${PROCEDIMENTO_1.descricao} ${brl(PROCEDIMENTO_1.valor)} ` +
      `+ ${PROCEDIMENTO_2.descricao} ${brl(PROCEDIMENTO_2.valor)} = ${brl(totalGeralEsperado)} ` +
      `na base do repasse da Dra. Helena, com prontuário externo em "${REFERENCIA_EXTERNA}"`,
  );
});
