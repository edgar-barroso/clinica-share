/**
 * Jornada 06 — A paciente desmarca a própria consulta pelo portal.
 * Cobre: [AG06] (e [RF-021] no login).
 * Persona: PACIENTE · Maria Silva.
 *
 * O ponto do vídeo não é só "deu para cancelar": é mostrar que a clínica
 * nunca fica sem saber POR QUE a agenda abriu um buraco. O motivo é
 * obrigatório — a jornada tenta cancelar sem ele de propósito, mostra a
 * recusa, e só então cancela de verdade.
 */
import {
  test,
  expect,
  ELENCO,
  diaDe,
  entrarComo,
  isoHoje,
  lerJson,
  porExtenso,
  type AtendimentoApi,
} from "./_support";

/** Justificativa real que Maria escreve — fica gravada no histórico. */
const MOTIVO = "Vou viajar a trabalho nessa semana";

test("06 — Paciente cancela a própria consulta", async ({ page, jornada }) => {
  await jornada.abrir({
    persona: ELENCO.paciente.persona,
    objetivo:
      "Maria precisa desmarcar uma consulta que já está marcada — e a clínica precisa saber o motivo.",
    ids: ["AG06"],
    precondicoes: [
      "Maria já tem cadastro e senha no portal do paciente",
      "Maria tem uma consulta futura marcada, ainda não realizada",
    ],
  });

  await entrarComo(page, jornada, "paciente");

  // O servidor já devolve só o que é dela (RF-023): a lista de um paciente
  // nunca inclui consulta de outro. Pegamos a próxima consulta futura.
  const { agendamentos } = await lerJson<{ agendamentos: AtendimentoApi[] }>(
    page,
    "/api/agendamentos?status=agendado",
  );
  const hoje = isoHoje();
  const futuras = agendamentos
    .filter((a) => diaDe(a) > hoje)
    .sort((a, b) =>
      `${diaDe(a)}T${a.hora}`.localeCompare(`${diaDe(b)}T${b.hora}`),
    );
  expect(
    futuras.length,
    "a seed precisa de pelo menos uma consulta futura de Maria",
  ).toBeGreaterThan(0);

  const alvo = futuras[0];
  const dia = diaDe(alvo);
  const dataTexto = porExtenso(dia);

  await jornada.passo(
    "[AG06] Maria abre a lista das próprias consultas no portal",
    async () => {
      await page.goto("/p/consultas");
      await expect(
        page.getByRole("heading", { name: /Minhas consultas/i }),
      ).toBeVisible({ timeout: 20_000 });
      const linha = page
        .getByRole("link")
        .filter({ hasText: dataTexto })
        .filter({ hasText: alvo.hora })
        .first();
      await jornada.validar(
        linha,
        `Consulta de ${dataTexto} às ${alvo.hora} com ${alvo.profissional.nome} — é esta que Maria precisa desmarcar`,
      );
    },
  );

  await jornada.passo(
    `[AG06] Maria abre os detalhes da consulta de ${dataTexto} às ${alvo.hora}`,
    async () => {
      await page
        .getByRole("link")
        .filter({ hasText: dataTexto })
        .filter({ hasText: alvo.hora })
        .first()
        .click();
      await page.waitForURL(`**/p/consultas/${alvo.id}`, { timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: /Detalhes da consulta/i }),
      ).toBeVisible({ timeout: 20_000 });
      await jornada.validar(
        page.getByText("Agendado", { exact: true }),
        "Hoje esta consulta está como Agendado — ocupando sala, horário e a agenda da profissional",
      );
    },
  );

  await jornada.passo(
    "[AG06] Maria pede para cancelar e o sistema abre a confirmação pedindo o motivo",
    async () => {
      await page.getByRole("button", { name: /Cancelar consulta/i }).click();
      // "Confirmar cancelamento" aparece duas vezes na tela: como título do
      // card e como rótulo do botão. Ancorar no título do card evita a
      // ambiguidade e é o que de fato prova que o painel abriu.
      await expect(
        page.getByText("Confirmar cancelamento", { exact: true }).first(),
      ).toBeVisible();
      await jornada.validar(
        page.getByLabel("Motivo"),
        "Cancelar não é um clique só: o sistema exige que Maria diga o motivo",
      );
    },
  );

  await jornada.passo(
    "[AG06] Sem motivo, o cancelamento é recusado — a consulta continua de pé",
    async () => {
      // Campo em branco de propósito: é a recusa que precisa aparecer no vídeo.
      await expect(page.getByLabel("Motivo")).toHaveValue("");
      await page
        .getByRole("button", { name: /Confirmar cancelamento/i })
        .click();
      await jornada.validar(
        page.getByText(/Informe um motivo/i).first(),
        "Recusado: o motivo é obrigatório e tem no mínimo 3 caracteres",
      );
      await jornada.validar(
        page.getByText("Agendado", { exact: true }),
        "Nada mudou — a consulta continua Agendado",
      );

      // A regra não vive só na tela: o servidor devolve 422 para motivo vazio,
      // mesmo que alguém tente pular o formulário.
      const recusaDoServidor = await page.request.post(
        `/api/agendamentos/${alvo.id}/cancelar`,
        { data: { motivo: "" } },
      );
      expect(
        recusaDoServidor.status(),
        "servidor recusa cancelamento sem motivo (AG06)",
      ).toBe(422);
    },
  );

  await jornada.passo(
    `[AG06] Maria escreve a justificativa real — "${MOTIVO}" — e confirma`,
    async () => {
      await page.getByLabel("Motivo").fill(MOTIVO);
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/agendamentos/${alvo.id}/cancelar`) &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar cancelamento/i }).click(),
      ]);
      expect(resposta.status()).toBe(200);
    },
  );

  await jornada.passo(
    "[AG06] A consulta fica cancelada e o motivo fica registrado na ficha",
    async () => {
      await jornada.validar(
        page.getByText("Cancelado", { exact: true }),
        `Consulta de ${dataTexto} às ${alvo.hora}: status Cancelado`,
      );
      await jornada.validar(
        page.getByText(MOTIVO),
        `Motivo registrado e visível para a clínica: "${MOTIVO}"`,
      );

      // Prova pelo dado: é isso que o servidor guardou.
      const { agendamento } = await lerJson<{ agendamento: AtendimentoApi }>(
        page,
        `/api/agendamentos/${alvo.id}`,
      );
      expect(agendamento.status).toBe("cancelado");
      expect(agendamento.motivoCancelamento).toBe(MOTIVO);
    },
  );

  await jornada.encerrar(
    `Consulta de ${dataTexto} às ${alvo.hora} com ${alvo.profissional.nome} ` +
      `cancelada pela própria paciente — status "Cancelado" e motivo ` +
      `"${MOTIVO}" gravados; o horário volta a ficar livre na agenda`,
  );
});
