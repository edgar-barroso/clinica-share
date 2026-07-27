/**
 * Jornada 03 — A atendente marca a consulta pelo telefone, em nome do paciente.
 * Cobre: [AG02] (e [RF-021] no login).
 * Persona: ATENDENTE · Júlia Nunes.
 *
 * É o caminho de quem liga para a recepção em vez de usar o portal: quem digita
 * é a Júlia, mas a consulta é do paciente. A sala não é escolhida por ninguém —
 * ela vem do turno fixo do profissional.
 */
import {
  test,
  expect,
  ELENCO,
  entrarComo,
  escolherDia,
  horariosLivres,
  lerJson,
  porExtenso,
  primeiraDataAtendida,
  regexDe,
  type ProfissionalApi,
} from "./_support";

interface PacienteApi {
  id: string;
  nome: string;
  telefone: string;
}

interface AgendamentoApi {
  id: string;
  data: string;
  hora: string;
  status: string;
  paciente: { id: string; nome: string };
  consultorio: { id: string; nome: string };
}

test("03 — Atendente agenda consulta em nome do paciente", async ({
  page,
  jornada,
}) => {
  test.setTimeout(240_000);

  await jornada.abrir({
    persona: ELENCO.atendente.persona,
    objetivo:
      "Um paciente ligou na recepção pedindo consulta. Júlia marca por ele, direto no sistema da clínica.",
    ids: ["AG02"],
    precondicoes: [
      "Júlia é atendente e tem login próprio",
      "O paciente já está cadastrado na clínica",
      "A profissional escolhida já tem turnos fixos, com sala definida",
    ],
  });

  await entrarComo(page, jornada, "atendente");

  // -----------------------------------------------------------------------
  // Cenário lido do sistema real — nada aqui é chute.
  // -----------------------------------------------------------------------
  const { profissionais } = await lerJson<{ profissionais: ProfissionalApi[] }>(
    page,
    "/api/profissionais?ativo=true",
  );
  const escolhido = profissionais.find((p) => p.turnosFixos.length > 0);
  expect(escolhido, "a seed precisa de um profissional com agenda").toBeTruthy();
  const prof = escolhido!;

  // Mês seguinte de propósito: a seed só popula até +14 dias, então lá a
  // agenda está limpa e a jornada não disputa horário com o passado.
  const dia = primeiraDataAtendida(
    new Set(prof.turnosFixos.map((t) => t.diaSemana)),
  );
  const dow = new Date(`${dia}T12:00:00`).getDay();
  const salasDoDia = new Set(
    prof.turnosFixos.filter((t) => t.diaSemana === dow).map((t) => t.consultorio.id),
  );

  // O unique do banco é (data, hora, consultório) e vale para QUALQUER status.
  // A tela mostra horário de consulta cancelada como livre, mas o servidor
  // recusa com 409 — por isso a hora é escolhida a partir da API, não da tela.
  const { agendamentos } = await lerJson<{ agendamentos: AgendamentoApi[] }>(
    page,
    `/api/agendamentos?dataInicio=${dia}&dataFim=${dia}`,
  );
  const horasOcupadas = new Set(
    agendamentos
      .filter((a) => salasDoDia.has(a.consultorio.id))
      .map((a) => a.hora),
  );

  // A ficha do paciente lista só as 5 próximas consultas; escolhendo quem tem
  // menos agendamentos em aberto, a consulta deste vídeo aparece na tela.
  const { agendamentos: emAberto } = await lerJson<{
    agendamentos: AgendamentoApi[];
  }>(page, "/api/agendamentos?status=agendado");
  const carga = new Map<string, number>();
  for (const a of emAberto) {
    carga.set(a.paciente.id, (carga.get(a.paciente.id) ?? 0) + 1);
  }
  const { pacientes } = await lerJson<{ pacientes: PacienteApi[] }>(
    page,
    "/api/pacientes",
  );
  expect(pacientes.length, "a seed precisa de pacientes").toBeGreaterThan(0);
  const paciente = [...pacientes].sort(
    (a, b) => (carga.get(a.id) ?? 0) - (carga.get(b.id) ?? 0),
  )[0];

  let hora = "";
  let sala = "";

  // -----------------------------------------------------------------------
  // A ligação
  // -----------------------------------------------------------------------
  await jornada.passo(
    "[AG02] Júlia atende o telefone e abre um novo agendamento na agenda da clínica",
    async () => {
      await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
      await page.getByRole("link", { name: /Novo agendamento/i }).click();
      await page.waitForURL("**/agenda/novo", { timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: "Novo agendamento" }),
      ).toBeVisible();
    },
  );

  await jornada.passo(
    `[AG02] Júlia procura o paciente que está na linha: ${paciente.nome}`,
    async () => {
      await page.locator("#paciente").click();
      await page
        .getByPlaceholder("Nome, e-mail, CPF ou telefone")
        .fill(paciente.nome);
      // A busca é server-side com 300ms de debounce: espera a lista assentar
      // antes de clicar (e dá tempo de quem assiste ler o resultado).
      await page.waitForTimeout(600);
      await page
        .getByRole("option", { name: regexDe(paciente.nome) })
        .first()
        .click();
      await jornada.validar(
        page.locator("#paciente"),
        `Paciente selecionado: ${paciente.nome} — a consulta é dele, mesmo quem digita sendo a atendente`,
      );
    },
  );

  await jornada.passo(
    `[AG02] Júlia escolhe a profissional pedida: ${prof.nome} (${prof.especialidade})`,
    async () => {
      await expect(page.locator("#profissional")).toBeVisible();
      await page.selectOption("#profissional", prof.id);
    },
  );

  await jornada.passo(
    `[AG02] Júlia escolhe o dia ${porExtenso(dia)} — o calendário só libera os dias em que ${prof.nome} atende`,
    async () => {
      await escolherDia(page, dia);
    },
  );

  await jornada.passo(
    `[AG02] Júlia lê para o paciente os horários vagos — intervalos de ${prof.duracaoConsultaMinutos} minutos, a duração da consulta dela`,
    async () => {
      const slots = horariosLivres(page);
      await expect(slots.first()).toBeVisible();
      const total = await slots.count();
      for (let i = 0; i < total; i++) {
        const candidato = (await slots.nth(i).innerText()).trim();
        if (horasOcupadas.has(candidato)) continue;
        hora = candidato;
        await slots.nth(i).click();
        break;
      }
      expect(hora, "precisa sobrar um horário livre nesse dia").not.toBe("");
    },
  );

  await jornada.passo(
    "[AG02] A sala não é escolhida pela atendente: o sistema resolve pelo turno fixo da profissional",
    async () => {
      const linhaSala = page.locator("p").filter({ hasText: /Sala:/ }).first();
      sala = (await linhaSala.innerText()).replace(/^Sala:\s*/, "").trim();
      await jornada.validar(
        linhaSala,
        `O resumo já traz a sala: ${sala}. Júlia não escolheu consultório — ele veio do turno fixo de ${prof.nome}.`,
      );
    },
  );

  await jornada.passo(
    `[AG02] Júlia confirma a consulta de ${porExtenso(dia)} às ${hora}`,
    async () => {
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/api/agendamentos") &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
      ]);
      expect(resposta.status(), "POST /api/agendamentos").toBe(201);
      await page.waitForURL("**/agenda", { timeout: 20_000 });
    },
  );

  await jornada.passo(
    `[AG02] Júlia confere na ficha de ${paciente.nome}: a consulta está lá`,
    async () => {
      await page.goto(`/pacientes/${paciente.id}`);
      await expect(page.getByText("Próximas consultas")).toBeVisible();
      const linha = page
        .getByRole("row")
        .filter({ hasText: regexDe(porExtenso(dia)) })
        .filter({ hasText: regexDe(prof.nome) })
        .first();
      await jornada.validar(
        linha,
        `${porExtenso(dia)} às ${hora} · ${prof.nome} · ${sala} — agendada`,
      );
    },
  );

  await jornada.encerrar(
    `Consulta marcada por telefone: ${paciente.nome} em ${porExtenso(dia)} às ${hora} ` +
      `com ${prof.nome} (${prof.especialidade}), no ${sala} — sala definida pelo turno fixo, não pela atendente`,
  );
});
