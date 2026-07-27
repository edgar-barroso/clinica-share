/**
 * Jornada 02 — A paciente marca a própria consulta pelo portal.
 * Cobre: [AG01] (e [RF-021] no login).
 * Persona: PACIENTE · Maria Silva.
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

test("02 — Paciente agenda consulta online", async ({ page, jornada }) => {
  await jornada.abrir({
    persona: ELENCO.paciente.persona,
    objetivo:
      "Maria quer marcar uma consulta sozinha, pela internet, sem ligar para a clínica.",
    ids: ["AG01"],
    precondicoes: [
      "Maria já tem cadastro e senha no portal do paciente",
      "A clínica já tem profissionais com agenda semanal definida",
    ],
  });

  await entrarComo(page, jornada, "paciente");

  // O elenco vem do catálogo real: escolhemos um profissional que tenha
  // agenda fixa, senão o servidor recusa o agendamento.
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
  let horaEscolhida = "";

  await jornada.passo("Maria abre a tela de agendamento do portal", async () => {
    await page.goto("/p/agendar");
    await expect(
      page.getByRole("heading", { name: /Agendar consulta/i }),
    ).toBeVisible();
  });

  await jornada.passo(
    `[AG01] Maria escolhe a especialidade que precisa: ${prof.especialidade}`,
    async () => {
      await page
        .getByRole("button", { name: prof.especialidade, exact: true })
        .click();
      await page.getByRole("button", { name: /^Continuar$/ }).click();
    },
  );

  await jornada.passo(
    `[AG01] Maria escolhe a profissional: ${prof.nome}`,
    async () => {
      await expect(page.getByText("Escolha o profissional")).toBeVisible();
      await page.getByRole("button", { name: regexDe(prof.nome) }).click();
      await page.getByRole("button", { name: /^Continuar$/ }).click();
    },
  );

  await jornada.passo(
    `[AG01] Maria escolhe o dia ${porExtenso(dia)} — o calendário só libera os dias em que essa profissional atende`,
    async () => {
      await expect(page.getByText("Qual data prefere?")).toBeVisible();
      await escolherDia(page, dia);
      await page.getByRole("button", { name: /^Continuar$/ }).click();
    },
  );

  await jornada.passo(
    `[AG01] Maria escolhe o horário — os intervalos seguem a duração de ${prof.duracaoConsultaMinutos} minutos da consulta`,
    async () => {
      await expect(page.getByText("Escolha o horário")).toBeVisible();
      const slots = horariosLivres(page);
      await expect(slots.first()).toBeVisible();
      horaEscolhida = (await slots.first().innerText()).trim();
      await slots.first().click();
    },
  );

  await jornada.passo("[AG01] Maria confirma o agendamento", async () => {
    const [resposta] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/agendamentos") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
    ]);
    expect(resposta.status()).toBe(201);
    await page.waitForURL("**/p/consultas", { timeout: 20_000 });
  });

  await jornada.passo(
    "A consulta aparece na lista de consultas de Maria",
    async () => {
      const cartao = page
        .getByText(regexDe(prof.nome))
        .first()
        .locator("xpath=ancestor-or-self::*[self::li or self::article or self::div][1]");
      await jornada.validar(
        cartao,
        `Consulta confirmada com ${prof.nome} em ${porExtenso(dia)} às ${horaEscolhida}`,
      );
    },
  );

  await jornada.encerrar(
    `Consulta agendada para ${porExtenso(dia)} às ${horaEscolhida} com ${prof.nome} (${prof.especialidade})`,
  );
});
