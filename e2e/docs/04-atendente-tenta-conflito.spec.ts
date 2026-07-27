/**
 * Jornada 04 — NEGATIVA. O sistema recusa duas marcações inválidas.
 * Cobre: [AG05] [AG03] (e [RF-021] no login).
 * Persona: ATENDENTE · Júlia Nunes.
 *
 * ATENÇÃO A QUEM ASSISTE: as duas mensagens vermelhas deste vídeo são o
 * comportamento CORRETO. O objetivo aqui é justamente provar que o sistema
 * BLOQUEIA:
 *   (a) duas consultas no mesmo consultório, no mesmo dia e hora  → HTTP 409
 *   (b) consulta numa sala que não é o turno fixo do profissional → HTTP 400
 * Nada quebrou; o sistema fez o que tinha de fazer.
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
}

interface ConsultorioApi {
  id: string;
  nome: string;
  ativo: boolean;
}

interface AgendamentoApi {
  id: string;
  hora: string;
  consultorio: { id: string; nome: string };
}

test("04 — Sistema bloqueia conflito de sala e sala fora do turno fixo", async ({
  page,
  jornada,
}) => {
  test.setTimeout(240_000);

  await jornada.abrir({
    persona: ELENCO.atendente.persona,
    objetivo:
      "Júlia tenta marcar duas consultas que não podem existir. O resultado ESPERADO deste vídeo é o sistema recusar as duas — nada está com defeito.",
    ids: ["AG05", "AG03"],
    precondicoes: [
      "Júlia é atendente e tem login próprio",
      "Cada profissional tem turnos fixos que definem dia, período e sala",
      "O banco não permite duas consultas na mesma sala, no mesmo dia e hora",
    ],
  });

  await entrarComo(page, jornada, "atendente");

  // -----------------------------------------------------------------------
  // Cenário lido do sistema real
  // -----------------------------------------------------------------------
  const { profissionais } = await lerJson<{ profissionais: ProfissionalApi[] }>(
    page,
    "/api/profissionais?ativo=true",
  );
  const escolhido = profissionais.find((p) => p.turnosFixos.length > 0);
  expect(escolhido, "a seed precisa de um profissional com agenda").toBeTruthy();
  const prof = escolhido!;

  const dia = primeiraDataAtendida(
    new Set(prof.turnosFixos.map((t) => t.diaSemana)),
  );
  const dow = new Date(`${dia}T12:00:00`).getDay();
  const turnosDoDia = prof.turnosFixos.filter((t) => t.diaSemana === dow);
  const salasDoDia = new Set(turnosDoDia.map((t) => t.consultorio.id));

  const { agendamentos } = await lerJson<{ agendamentos: AgendamentoApi[] }>(
    page,
    `/api/agendamentos?dataInicio=${dia}&dataFim=${dia}`,
  );
  const horasOcupadas = new Set(
    agendamentos
      .filter((a) => salasDoDia.has(a.consultorio.id))
      .map((a) => a.hora),
  );

  const { pacientes } = await lerJson<{ pacientes: PacienteApi[] }>(
    page,
    "/api/pacientes",
  );
  expect(pacientes.length, "a seed precisa de pelo menos 2 pacientes").toBeGreaterThan(1);
  const pacienteDeJulia = pacientes[0];
  const pacienteQueChegouAntes = pacientes[1];

  const { consultorios } = await lerJson<{ consultorios: ConsultorioApi[] }>(
    page,
    "/api/consultorios?ativo=true",
  );

  let hora = "";
  let horaAlternativa = "";
  let sala = { id: "", nome: "" };

  // -----------------------------------------------------------------------
  // Montagem: Júlia preenche a tela com um horário que, neste instante, está livre
  // -----------------------------------------------------------------------
  await jornada.passo(
    `[AG05] Júlia começa um agendamento para ${pacienteDeJulia.nome} com ${prof.nome} em ${porExtenso(dia)}`,
    async () => {
      await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
      await page.getByRole("link", { name: /Novo agendamento/i }).click();
      await page.waitForURL("**/agenda/novo", { timeout: 20_000 });

      await page.locator("#paciente").click();
      await page
        .getByPlaceholder("Nome, e-mail, CPF ou telefone")
        .fill(pacienteDeJulia.nome);
      await page.waitForTimeout(600);
      await page
        .getByRole("option", { name: regexDe(pacienteDeJulia.nome) })
        .first()
        .click();

      await expect(page.locator("#profissional")).toBeVisible();
      await page.selectOption("#profissional", prof.id);
      await escolherDia(page, dia);

      const slots = horariosLivres(page);
      await expect(slots.first()).toBeVisible();
      const total = await slots.count();
      const livres: string[] = [];
      for (let i = 0; i < total; i++) {
        const candidato = (await slots.nth(i).innerText()).trim();
        if (!horasOcupadas.has(candidato)) livres.push(candidato);
        if (livres.length === 2) break;
      }
      expect(livres.length, "precisam sobrar 2 horários livres nesse dia").toBe(2);
      hora = livres[0];
      horaAlternativa = livres[1];

      await page.getByRole("button", { name: hora, exact: true }).click();

      const linhaSala = page.locator("p").filter({ hasText: /Sala:/ }).first();
      const nomeSala = (await linhaSala.innerText())
        .replace(/^Sala:\s*/, "")
        .trim();
      const encontrada = consultorios.find((c) => c.nome === nomeSala);
      expect(encontrada, "a sala do resumo precisa existir no catálogo").toBeTruthy();
      sala = { id: encontrada!.id, nome: encontrada!.nome };

      await jornada.validar(
        linhaSala,
        `Até aqui está tudo certo: ${porExtenso(dia)} às ${hora}, no ${sala.nome} — a sala veio do turno fixo de ${prof.nome}`,
      );
    },
  );

  // -----------------------------------------------------------------------
  // Pré-condição do bloqueio (a): alguém reservou esse mesmo horário primeiro
  // -----------------------------------------------------------------------
  await jornada.passo(
    `Pré-condição: enquanto Júlia digitava, ${pacienteQueChegouAntes.nome} fechou por outro canal exatamente ${porExtenso(dia)} às ${hora} no ${sala.nome}`,
    async () => {
      const reserva = await page.request.post("/api/agendamentos", {
        data: {
          pacienteId: pacienteQueChegouAntes.id,
          profissionalId: prof.id,
          consultorioId: sala.id,
          data: dia,
          hora,
        },
      });
      expect(reserva.status(), "a reserva legítima precisa ser criada").toBe(201);
    },
  );

  // -----------------------------------------------------------------------
  // Bloqueio (a) — conflito de data + hora + consultório → 409
  // -----------------------------------------------------------------------
  await jornada.passo(
    `[AG05] O sistema DEVE recusar: o ${sala.nome} já tem consulta às ${hora} em ${porExtenso(dia)}`,
    async () => {
      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/api/agendamentos") &&
            r.request().method() === "POST",
        ),
        page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
      ]);
      expect(resposta.status(), "conflito de sala/horário deve dar 409").toBe(409);
      const { error } = (await resposta.json()) as { error: string };

      await jornada.validar(
        page.getByText(regexDe(error)).first(),
        `BLOQUEIO CORRETO (HTTP 409): ${error}`,
      );
    },
  );

  // -----------------------------------------------------------------------
  // Bloqueio (b) — sala que não é o turno fixo do profissional → 400
  // -----------------------------------------------------------------------
  // A tela NUNCA oferece uma sala errada: o resumo mostra a sala vinda do
  // turno fixo e o botão de confirmar só habilita com ela — é exatamente o
  // que o AG03 pede. Por isso a tentativa (b) só pode ser feita direto na
  // API: é o único caminho para provar que o servidor também barra, e não
  // apenas a tela. A prova em vídeo é o resumo, que mostra a sala certa
  // enquanto a legenda traz a recusa do servidor.
  // Qualquer sala ativa que NÃO seja turno fixo do profissional nesse dia —
  // assim a recusa vale para qualquer horário escolhido.
  const salaErrada = consultorios.find((c) => !salasDoDia.has(c.id));
  expect(salaErrada, "a clínica precisa de outra sala ativa para o teste").toBeTruthy();

  await jornada.passo(
    `[AG03] O sistema DEVE recusar: ${salaErrada!.nome} não é o turno fixo de ${prof.nome} nesse dia`,
    async () => {
      const resposta = await page.request.post("/api/agendamentos", {
        data: {
          pacienteId: pacienteDeJulia.id,
          profissionalId: prof.id,
          consultorioId: salaErrada!.id,
          data: dia,
          hora: horaAlternativa,
        },
      });
      expect(resposta.status(), "sala fora do turno fixo deve dar 400").toBe(400);
      const { error } = (await resposta.json()) as { error: string };

      await jornada.validar(
        page.locator("p").filter({ hasText: /Sala:/ }).first(),
        `BLOQUEIO CORRETO (HTTP 400): ${error}`,
      );
    },
  );

  await jornada.encerrar(
    `Os dois bloqueios são o resultado esperado: HTTP 409 para segunda consulta no ${sala.nome} ` +
      `em ${porExtenso(dia)} às ${hora} (AG05) e HTTP 400 para consulta no ${salaErrada!.nome}, ` +
      `que não é o turno fixo de ${prof.nome} (AG03). ` +
      `Só a reserva legítima de ${pacienteQueChegouAntes.nome} ficou de pé — nenhuma duplicidade foi criada.`,
  );
});
