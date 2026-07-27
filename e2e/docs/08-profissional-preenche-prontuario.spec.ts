/**
 * Jornada 08 — A profissional escreve o registro clínico no prontuário interno.
 * Cobre: [AT03] (e [RF-021] no login).
 * Persona: PROFISSIONAL · Dra. Nirmala Azalea (Clínica geral, percentual 30%).
 *
 * ESCOPO HONESTO (R2): o prontuário de hoje são QUATRO campos de texto livre —
 * anamnese, evolução, conduta e retorno. Não existe campo estruturado de
 * diagnóstico, CID, prescrição ou exame: a estrutura definitiva do prontuário
 * ainda será desenhada na R2, com o cliente. Esta jornada mostra exatamente o
 * que existe hoje, sem prometer tela que não foi construída.
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

/** Os quatro — e únicos — campos do prontuário interno hoje. */
const PRONTUARIO = {
  anamnese:
    "Paciente relata dor de cabeça há 4 dias, pior no fim da tarde, sem febre e sem náusea.",
  evolucao:
    "Pressão arterial 120/80. Exame físico sem alterações. Melhora parcial com analgésico simples.",
  conduta:
    "Solicitado hemograma completo. Orientada hidratação, pausa de tela e higiene do sono.",
  retorno: "Retorno em 30 dias com o resultado do exame.",
};

interface ProfissionalValor {
  id: string;
  nome: string;
  valorConsultaBase: string;
}

test("08 — Profissional preenche o prontuário do atendimento", async ({
  page,
  request,
  jornada,
}) => {
  await jornada.abrir({
    persona: ELENCO.clinicaGeral.persona,
    objetivo:
      "A Dra. Nirmala acabou de atender e precisa deixar o registro clínico gravado no prontuário da clínica.",
    ids: ["AT03"],
    precondicoes: [
      "Dra. Nirmala Azalea é profissional ativa, de Clínica geral, com agenda semanal fixa",
      "Ela tem uma consulta agendada na própria agenda",
      "O prontuário dela é o interno — o registro clínico fica dentro do ClinicaShare",
    ],
  });

  await entrarComo(page, jornada, "clinicaGeral");

  const { user } = await lerJson<{ user: { profissionalId: string | null } }>(
    page,
    "/api/auth/me",
  );
  expect(
    user.profissionalId,
    "a conta da Dra. Nirmala precisa estar ligada ao cadastro de profissional",
  ).toBeTruthy();
  const profissionalId = user.profissionalId!;

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
      "Pré-condição preparada nos bastidores: a agenda da Dra. Nirmala estava vazia, então um agendamento foi criado por fora para a jornada ter o que registrar",
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
  const nirmala = profissionais.find((p) => p.id === profissionalId);
  expect(nirmala, "cadastro da Dra. Nirmala").toBeTruthy();
  const valorConsulta = Number(nirmala!.valorConsultaBase);

  await jornada.passo(
    `[AT03] Dra. Nirmala abre a própria agenda e localiza ${alvo.paciente.nome}, das ${alvo.hora}`,
    async () => {
      await page.goto("/minha-agenda");
      await expect(
        page.getByRole("heading", { name: /Minha agenda/i }),
      ).toBeVisible({ timeout: 20_000 });
      await jornada.validar(
        page
          .locator(`a[href="/atendimentos/${alvo.id}"]`)
          .filter({ hasText: "Iniciar" }),
        `${alvo.paciente.nome}, ${dataTexto} às ${alvo.hora} — pronta para iniciar`,
      );
    },
  );

  await jornada.passo(
    "[AT03] Ela inicia o atendimento — sem consulta iniciada não existe prontuário para escrever",
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
        "O prontuário nasce vazio e só é preenchido na finalização do atendimento",
      );
      await page.getByRole("button", { name: /Iniciar atendimento/i }).click();
      await expect(page.getByText("Em atendimento", { exact: true })).toBeVisible();
    },
  );

  await jornada.passo(
    `[AT03] Terminada a consulta, ela abre a finalização e confirma o prontuário interno (valor da consulta: ${brl(valorConsulta)})`,
    async () => {
      await page
        .getByRole("button", { name: /Finalizar e registrar/i })
        .click();
      await page.getByLabel("Valor de tabela (R$)").fill(String(valorConsulta));
      await page.getByLabel("Valor cobrado (R$)").fill(String(valorConsulta));

      const registro = page.getByRole("radiogroup", {
        name: "Registro do prontuário",
      });
      await registro.getByLabel("Prontuário interno").check();
      await jornada.validar(
        registro,
        "Prontuário interno: o registro clínico fica gravado aqui dentro, não no sistema pessoal da profissional",
      );
    },
  );

  await jornada.passo(
    "[AT03] Escopo de hoje, dito na cara: o prontuário são estes quatro campos livres — a estrutura definitiva fica para a R2",
    async () => {
      // Nada de campo inventado: anamnese, evolução, conduta e retorno é tudo
      // o que existe. Diagnóstico estruturado, CID, prescrição e anexos ainda
      // não foram desenhados — entram na conversa da R2 com o cliente.
      await jornada.validar(
        page.getByLabel("Anamnese"),
        "1 de 4 — Anamnese (texto livre)",
      );
      await jornada.validar(
        page.getByLabel("Evolução"),
        "2 de 4 — Evolução (texto livre)",
      );
      await jornada.validar(
        page.getByLabel("Conduta"),
        "3 de 4 — Conduta (texto livre)",
      );
      await jornada.validar(
        page.getByLabel("Retorno"),
        "4 de 4 — Retorno (texto livre). A estrutura definitiva do prontuário será definida na R2.",
      );
    },
  );

  await jornada.passo(
    "[AT03] Dra. Nirmala escreve a anamnese e a evolução da consulta",
    async () => {
      await page.getByLabel("Anamnese").fill(PRONTUARIO.anamnese);
      await page.getByLabel("Evolução").fill(PRONTUARIO.evolucao);
      await jornada.validar(
        page.getByLabel("Evolução"),
        "O que a paciente contou e o que foi observado no exame",
      );
    },
  );

  await jornada.passo(
    "[AT03] E fecha com a conduta e o retorno",
    async () => {
      await page.getByLabel("Conduta").fill(PRONTUARIO.conduta);
      await page.getByLabel("Retorno").fill(PRONTUARIO.retorno);
      await jornada.validar(
        page.getByLabel("Retorno"),
        "Conduta e retorno: o que foi prescrito e quando a paciente volta",
      );
    },
  );

  await jornada.passo(
    "[AT03] Ela confirma a finalização e o prontuário é gravado",
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
        "Atendimento realizado",
      );
    },
  );

  await jornada.passo(
    "[AT03] O card “Prontuário registrado” relê o que foi escrito — o registro clínico ficou na ficha da paciente",
    async () => {
      await expect(page.getByText("Prontuário registrado")).toBeVisible();
      await jornada.validar(
        page.getByText(PRONTUARIO.anamnese),
        "Anamnese, como a profissional escreveu",
      );
      await jornada.validar(
        page.getByText(PRONTUARIO.conduta),
        "Conduta, relida direto da ficha",
      );
      await jornada.validar(
        page.getByText(PRONTUARIO.retorno),
        "Retorno em 30 dias — registrado",
      );

      // Prova pelo dado: os quatro campos, e só eles, foram persistidos.
      const { atendimento } = await lerJson<{ atendimento: AtendimentoApi }>(
        page,
        `/api/atendimentos/${alvo.id}`,
      );
      expect(atendimento.status).toBe("realizado");
      expect(atendimento.usaProntuarioExterno).toBe(false);
      const gravado = atendimento.prontuarioInterno as Record<string, string>;
      expect(gravado.anamnese).toBe(PRONTUARIO.anamnese);
      expect(gravado.evolucao).toBe(PRONTUARIO.evolucao);
      expect(gravado.conduta).toBe(PRONTUARIO.conduta);
      expect(gravado.retorno).toBe(PRONTUARIO.retorno);
    },
  );

  await jornada.encerrar(
    `Atendimento de ${alvo.paciente.nome} (${dataTexto}, ${alvo.hora}, ${brl(valorConsulta)}) ` +
      `finalizado com os 4 campos do prontuário interno gravados e relidos na tela: ` +
      `anamnese, evolução, conduta e retorno em 30 dias. ` +
      `A estrutura definitiva do prontuário será desenhada na R2.`,
  );
});
