/**
 * COMPROVAÇÃO EM VÍDEO — bloco AGENDAMENTO da planilha de custos
 * (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * Regra do arquivo: 1 `test()` = 1 requisito = 1 vídeo (o config já tem
 * `video: "on"`, nada é configurado aqui).
 *
 * IMPORTANTE — estes specs NÃO limpam o banco. Eles rodam sobre o cenário
 * do `npm run db:seed` (12 consultórios, 5 profissionais, 30 pacientes,
 * 241 atendimentos, 10 turnos fixos). Ver o cabeçalho de `_helpers.ts`.
 *
 * Quando o requisito não é observável na UI (bloqueio de conflito, cron de
 * lembrete), a prova é feita via `page.request` — que herda o cookie de
 * sessão emitido no login — mas sempre depois de navegar por uma tela real,
 * pro vídeo não virar uma tela branca.
 */
import { test, expect, type Page } from "@playwright/test";
import { login, irPara, mostrar, CONTAS } from "./_helpers";

// ---------------------------------------------------------------------------
// Tipos mínimos das respostas de API usadas aqui (evita `any` espalhado).
// ---------------------------------------------------------------------------

type Turno = "manha" | "tarde" | "noite";

interface TurnoFixoApi {
  id: string;
  diaSemana: number; // 1=seg ... 5=sex
  turno: Turno;
  consultorioId: string;
  consultorio: { id: string; nome: string };
}

interface ProfissionalApi {
  id: string;
  nome: string;
  email: string;
  especialidade: string;
  ativo: boolean;
  duracaoConsultaMinutos: number;
  turnosFixos: TurnoFixoApi[];
}

interface PacienteApi {
  id: string;
  nome: string;
  telefone: string;
}

interface ConsultorioApi {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
}

interface AgendamentoApi {
  id: string;
  data: string;
  hora: string;
  status: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  motivoCancelamento: string | null;
}

interface FaixaTurno {
  inicio: string; // "HH:mm"
  fim: string;
}
type TurnosConfigApi = Record<Turno, FaixaTurno>;

// ---------------------------------------------------------------------------
// Helpers locais (os compartilhados vivem em `_helpers.ts`)
// ---------------------------------------------------------------------------

/** GET autenticado pelo cookie da sessão do `page`, com status conferido. */
async function getJson<T>(page: Page, url: string): Promise<T> {
  const res = await page.request.get(url);
  expect(res.status(), `GET ${url}`).toBe(200);
  return (await res.json()) as T;
}

/** ISO YYYY-MM-DD no fuso local (a API recebe a string, não um Date). */
function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Primeira data do MÊS SEGUINTE cujo dia da semana esteja em `dows`.
 *  Mês seguinte de propósito: a seed só cria atendimentos até +14 dias, então
 *  lá não há nenhum slot ocupado e o agendamento do vídeo nunca colide. */
function primeiraDataDoMesSeguinte(dows: Set<number>): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1, 12, 0, 0, 0);
  for (let i = 0; i < 14 && !dows.has(d.getDay()); i++) {
    d.setDate(d.getDate() + 1);
  }
  return isoLocal(d);
}

/** Próxima data com o dia da semana `dow`, pelo menos `minDias` à frente. */
function proximaDataNoDow(dow: number, minDias: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + minDias);
  for (let i = 0; i < 7 && d.getDay() !== dow; i++) d.setDate(d.getDate() + 1);
  return isoLocal(d);
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Reproduz `formatDateLong` (dd 'de' MMMM 'de' yyyy) — é o `aria-label` de
 *  cada dia habilitado do `<MonthlyCalendar>`, então serve de seletor exato. */
function rotuloDiaCalendario(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return `${String(dia).padStart(2, "0")} de ${MESES[mes - 1]} de ${ano}`;
}

function regexDe(texto: string): RegExp {
  return new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

const minutos = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/**
 * Hora "HH:mm" garantidamente dentro da faixa do turno (o backend recusa com
 * 400 qualquer hora fora do turno fixo do profissional). O minuto é sorteado
 * para o teste continuar re-executável: a constraint é
 * `@@unique([data, hora, consultorioId])`, então repetir a mesma hora numa
 * segunda execução daria 409 já no primeiro POST.
 */
function horaDentroDoTurno(faixa: FaixaTurno): string {
  const ini = minutos(faixa.inicio);
  const janela = Math.max(1, Math.min(30, minutos(faixa.fim) - ini - 1));
  const total = ini + Math.floor(Math.random() * janela);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Botões de horário livres da grade de slots (ocupados vêm `disabled`). */
function horariosLivres(page: Page) {
  return page
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .and(page.locator("button:not([disabled])"));
}

/**
 * Navega o `<MonthlyCalendar>` até o mês da data alvo e clica no dia.
 * O mês inicial varia por tela (o /p/agendar abre no mês corrente, o
 * /agenda/novo abre no mês de "amanhã"), então avança sob demanda em vez de
 * assumir um número fixo de cliques em "Próximo mês".
 */
async function escolherDiaNoCalendario(page: Page, iso: string): Promise<void> {
  const dia = page.getByRole("button", {
    name: rotuloDiaCalendario(iso),
    exact: true,
  });
  for (let tentativa = 0; tentativa < 4 && (await dia.count()) === 0; tentativa++) {
    await page.getByRole("button", { name: "Próximo mês" }).click();
    await page.waitForTimeout(250);
  }
  await expect(dia, `dia ${iso} deveria estar disponível no calendário`).toBeVisible();
  await dia.click();
}

test.describe("Planilha de custos — Agendamento", () => {
  /**
   * AG01 — Paciente agenda consulta online (portal web).
   *
   * Percorre o wizard de 4 etapas do `/p/agendar` logado como paciente
   * (especialidade → profissional → data → horário) e conclui de fato o
   * agendamento. A prova final é dupla: o POST /api/agendamentos responde 201
   * e o próprio paciente enxerga a consulta na listagem dele (a API filtra por
   * `pacienteId` do token, RF-023).
   */
  test("AG01 — paciente agenda consulta online pelo portal", async ({ page }) => {
    await login(page, "paciente");
    await mostrar(page);

    // Catálogo real da seed: escolhe um profissional que tenha turno fixo
    // (sem turno fixo o backend recusa o agendamento com 400).
    const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
      page,
      "/api/profissionais?ativo=true",
    );
    const prof = profissionais.find((p) => p.turnosFixos.length > 0);
    expect(prof, "seed precisa de ao menos 1 profissional com turno fixo").toBeTruthy();
    const alvo = prof!;
    const dows = new Set(alvo.turnosFixos.map((tf) => tf.diaSemana));
    const dataAlvo = primeiraDataDoMesSeguinte(dows);

    await irPara(page, "/p/agendar", /Agendar consulta/i);

    // Etapa 1 — especialidade
    await expect(page.getByText("Qual especialidade você precisa?")).toBeVisible();
    await page.getByRole("button", { name: alvo.especialidade, exact: true }).click();
    await mostrar(page, 600);
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 2 — profissional
    await expect(page.getByText("Escolha o profissional")).toBeVisible();
    await page.getByRole("button", { name: regexDe(alvo.nome) }).click();
    await mostrar(page, 600);
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 3 — data. Vai pro mês seguinte (sem dados de seed = sem colisão) e
    // clica o dia pelo aria-label; dias em que o profissional não atende ficam
    // desabilitados e com outro aria-label, então o clique já é uma prova de
    // que a agenda respeita os turnos fixos.
    await expect(page.getByText("Qual data prefere?")).toBeVisible();
    await escolherDiaNoCalendario(page, dataAlvo);
    await mostrar(page, 600);
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    // Etapa 4 — horário. Os slots são gerados pela duração do profissional
    // (AG04) dentro dos blocos configurados em /configuracoes/turnos.
    await expect(page.getByText("Escolha o horário")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`${alvo.duracaoConsultaMinutos}\\s*min`)).first(),
    ).toBeVisible();
    const slots = horariosLivres(page);
    await expect(slots.first()).toBeVisible();
    expect(await slots.count()).toBeGreaterThan(0);

    const horaEscolhida = (await slots.first().innerText()).trim();
    await slots.first().click();
    await mostrar(page);

    const [resposta] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/agendamentos") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
    ]);
    expect(resposta.status()).toBe(201);

    await page.waitForURL("**/p/consultas", { timeout: 20_000 });
    await mostrar(page);

    // Confirmação pelo dado: a consulta existe na agenda DO PACIENTE.
    const { agendamentos } = await getJson<{ agendamentos: AgendamentoApi[] }>(
      page,
      `/api/agendamentos?data=${dataAlvo}`,
    );
    expect(
      agendamentos.some(
        (a) =>
          a.hora === horaEscolhida &&
          a.profissionalId === alvo.id &&
          a.status === "agendado",
      ),
      `esperava consulta ${dataAlvo} ${horaEscolhida} com ${alvo.nome}`,
    ).toBe(true);
  });

  /**
   * AG02 — Atendente agenda em nome do paciente.
   *
   * Mesmo fluxo, mas pela retaguarda: `/agenda` → "Novo agendamento". Aqui o
   * paciente é escolhido no `PacienteCombobox` (busca por nome/CPF/e-mail/
   * telefone) e o consultório NÃO é digitado — sai do turno fixo do
   * profissional, que a tela mostra no resumo. O vídeo comprova os três
   * eixos exigidos: paciente + profissional + horário.
   */
  test("AG02 — atendente agenda em nome do paciente", async ({ page }) => {
    await login(page, "atendente"); // atendente cai direto em /agenda
    await expect(page.getByRole("heading", { name: /^Agenda$/ })).toBeVisible();
    await mostrar(page);

    const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
      page,
      "/api/profissionais?ativo=true",
    );
    // Profissional diferente do usado no AG01, pra não disputar sala/horário
    // (prof3 = aluguel fixo, consulta de 45min — também exercita outra duração).
    const alvo =
      profissionais.find((p) => p.email === CONTAS.profissionalAluguel.email) ??
      profissionais.find((p) => p.turnosFixos.length > 0)!;
    expect(alvo.turnosFixos.length).toBeGreaterThan(0);

    const dows = new Set(alvo.turnosFixos.map((tf) => tf.diaSemana));
    const dataAlvo = primeiraDataDoMesSeguinte(dows);
    const dowAlvo = new Date(`${dataAlvo}T12:00:00`).getDay();
    const salasDoDia = alvo.turnosFixos
      .filter((tf) => tf.diaSemana === dowAlvo)
      .map((tf) => tf.consultorio.nome);
    expect(salasDoDia.length).toBeGreaterThan(0);

    const { pacientes } = await getJson<{ pacientes: PacienteApi[] }>(
      page,
      "/api/pacientes",
    );
    const paciente = pacientes[0];

    await page.getByRole("link", { name: /Novo agendamento/i }).click();
    await expect(
      page.getByRole("heading", { name: /^Novo agendamento$/ }),
    ).toBeVisible();
    await mostrar(page);

    // 1. Paciente — combobox com busca (o gatilho é um <button id="paciente">,
    //    por isso o seletor é pelo id e as opções pelo role="option").
    await page.locator("#paciente").click();
    await page.getByRole("option", { name: regexDe(paciente.nome) }).first().click();
    await expect(page.locator("#paciente")).toContainText(paciente.nome);

    // 2. Profissional — <select> nativo.
    const valorProf = await page
      .locator("#profissional option", { hasText: alvo.nome })
      .first()
      .getAttribute("value");
    await page.locator("#profissional").selectOption(valorProf!);
    await mostrar(page, 600);

    // 3. Data + horário — o calendário só habilita os dias de turno fixo.
    await escolherDiaNoCalendario(page, dataAlvo);

    // A UI marca como livre todo slot sem atendimento ATIVO, mas o índice
    // único `(data, hora, consultorioId)` do banco não exclui cancelados —
    // então um horário cancelado aparece clicável e o POST devolve 409
    // (mesma lacuna registrada em AG05). Também precisamos evitar o slot que
    // o AG01 acabou de reservar e o de execuções anteriores, já que estes
    // specs não limpam o banco. Por isso a escolha do horário consulta o
    // servidor em vez de confiar só no que está habilitado na tela.
    const { agendamentos: doDia } = await getJson<{
      agendamentos: AgendamentoApi[];
    }>(page, `/api/agendamentos?dataInicio=${dataAlvo}&dataFim=${dataAlvo}`);
    const horasOcupadas = new Set(doDia.map((a) => a.hora));

    const slots = horariosLivres(page);
    await expect(slots.first()).toBeVisible();

    const totalSlots = await slots.count();
    let horaEscolhida = "";
    for (let i = 0; i < totalSlots; i++) {
      const texto = (await slots.nth(i).innerText()).trim();
      if (!horasOcupadas.has(texto)) {
        horaEscolhida = texto;
        await slots.nth(i).click();
        break;
      }
    }
    expect(
      horaEscolhida,
      `nenhum horário realmente livre em ${dataAlvo} (ocupados: ${[...horasOcupadas].join(", ")})`,
    ).not.toBe("");

    // A sala vem do turno fixo — o resumo tem que exibir uma das salas do dia.
    await expect(
      page.getByText(new RegExp(salasDoDia.map((n) => regexDe(n).source).join("|"))).first(),
    ).toBeVisible();
    await mostrar(page);

    const [resposta] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/agendamentos") && r.request().method() === "POST",
      ),
      page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
    ]);
    expect(resposta.status()).toBe(201);
    await page.waitForURL("**/agenda", { timeout: 20_000 });
    await mostrar(page);

    // Prova pelo dado: o agendamento ficou no nome do paciente escolhido.
    const { agendamentos } = await getJson<{ agendamentos: AgendamentoApi[] }>(
      page,
      `/api/agendamentos?data=${dataAlvo}`,
    );
    expect(
      agendamentos.some(
        (a) =>
          a.pacienteId === paciente.id &&
          a.profissionalId === alvo.id &&
          a.hora === horaEscolhida,
      ),
      `esperava agendamento de ${paciente.nome} em ${dataAlvo} ${horaEscolhida}`,
    ).toBe(true);
  });

  /**
   * AG04 — Duração de consulta configurável por profissional.
   *
   * Prova em duas camadas: (a) o dado — `GET /api/profissionais` devolve
   * `duracaoConsultaMinutos` e a seed tem valores diferentes (30/45/60);
   * (b) a tela — o campo de duração existe no formulário de edição do
   * profissional e mostra valores diferentes para profissionais diferentes.
   *
   * Obs.: o label real no JSX é "Duração da consulta" (o campo é `#duracao`),
   * por isso o seletor usa um regex por /Duração/ em vez de texto exato.
   */
  test("AG04 — duração de consulta configurável por profissional", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/profissionais", /Profissionais/i);

    const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
      page,
      "/api/profissionais?ativo=all",
    );
    for (const p of profissionais) {
      expect(
        typeof p.duracaoConsultaMinutos,
        `${p.nome} sem duracaoConsultaMinutos`,
      ).toBe("number");
    }
    const duracoes = new Set(profissionais.map((p) => p.duracaoConsultaMinutos));
    expect(
      duracoes.size,
      `durações distintas na base: ${[...duracoes].join(", ")}`,
    ).toBeGreaterThan(1);

    const profA =
      profissionais.find((p) => p.email === CONTAS.profissional.email) ??
      profissionais[0];
    const profB =
      profissionais.find(
        (p) => p.duracaoConsultaMinutos !== profA.duracaoConsultaMinutos,
      )!;
    expect(profB, "seed precisa de 2 profissionais com durações distintas").toBeTruthy();

    // Profissional A na tela de edição
    await irPara(page, `/profissionais/${profA.id}/editar`, /^Editar/);
    await expect(page.getByLabel(/Duração/i)).toHaveValue(
      String(profA.duracaoConsultaMinutos),
    );
    await mostrar(page);

    // Profissional B — mesma tela, duração diferente = campo é por profissional
    await irPara(page, `/profissionais/${profB.id}/editar`, /^Editar/);
    await expect(page.getByLabel(/Duração/i)).toHaveValue(
      String(profB.duracaoConsultaMinutos),
    );
    await mostrar(page);
  });

  /**
   * AG05 — Bloqueio de conflito de horário e consultório.
   *
   * Não há tela que "mostre" a colisão: quem garante é o banco
   * (`@@unique([data, hora, consultorioId])` → P2002 → 409) e a regra de
   * turno fixo do use case. Por isso a prova é via API, com a `/agenda`
   * aberta no vídeo. São dois bloqueios distintos:
   *   (a) mesma sala, mesma data e mesma hora, pacientes diferentes → 409;
   *   (b) sala que não é a do turno fixo do profissional → 400.
   * A data usada fica ~60 dias à frente, fora da janela da seed (+14 dias),
   * pra não competir com nenhum atendimento existente.
   */
  test("AG05 — bloqueio de conflito de horário e consultório", async ({ page }) => {
    await login(page, "admin");
    await irPara(page, "/agenda", /^Agenda$/);

    const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
      page,
      "/api/profissionais?ativo=true",
    );
    const prof = profissionais.find((p) => p.turnosFixos.length > 0)!;
    expect(prof, "seed precisa de profissional com turno fixo").toBeTruthy();
    const turnoFixo = prof.turnosFixos[0];

    const { turnos } = await getJson<{ turnos: TurnosConfigApi }>(
      page,
      "/api/configuracoes/turnos",
    );
    const { pacientes } = await getJson<{ pacientes: PacienteApi[] }>(
      page,
      "/api/pacientes",
    );
    const { consultorios } = await getJson<{ consultorios: ConsultorioApi[] }>(
      page,
      "/api/consultorios?ativo=true",
    );

    const corpo = {
      pacienteId: pacientes[0].id,
      profissionalId: prof.id,
      consultorioId: turnoFixo.consultorioId,
      data: proximaDataNoDow(turnoFixo.diaSemana, 60),
      hora: horaDentroDoTurno(turnos[turnoFixo.turno]),
    };

    // 1ª reserva: slot livre → criada.
    const primeira = await page.request.post("/api/agendamentos", { data: corpo });
    expect(
      primeira.status(),
      `1ª reserva deveria ser criada: ${await primeira.text()}`,
    ).toBe(201);

    // 2ª reserva: outro paciente, mesma sala/data/hora → CONFLITO (409).
    const segunda = await page.request.post("/api/agendamentos", {
      data: { ...corpo, pacienteId: pacientes[1].id },
    });
    expect(segunda.status()).toBe(409);
    expect((await segunda.json()).error).toMatch(/agendamento|conflito|AG05/i);

    // 3ª tentativa: sala que não pertence ao turno fixo do profissional → 400.
    const outraSala = consultorios.find((c) => c.id !== turnoFixo.consultorioId)!;
    const salaErrada = await page.request.post("/api/agendamentos", {
      data: { ...corpo, consultorioId: outraSala.id },
    });
    expect(salaErrada.status()).toBe(400);
    expect((await salaErrada.json()).error).toMatch(/consultório|atende/i);

    await mostrar(page);
  });

  /**
   * AG06 — Cancelamento com motivo obrigatório.
   *
   * (a) motivo vazio e motivo curto são recusados com 422 (zod `min(3)`);
   * (b) com motivo válido o cancelamento acontece, o motivo fica gravado em
   *     `Atendimento.motivoCancelamento` (relido do servidor) e aparece na
   *     coluna "Motivo" do relatório de cancelamentos.
   *
   * Este teste cancela um agendamento futuro REAL da seed — é a natureza do
   * requisito. Nada é apagado, só muda de status (e gera audit log, RNF-102).
   */
  test("AG06 — cancelamento com motivo obrigatório", async ({ page }) => {
    await login(page, "admin");
    await irPara(page, "/agenda", /^Agenda$/);

    const hoje = isoLocal(new Date());
    const { agendamentos } = await getJson<{ agendamentos: AgendamentoApi[] }>(
      page,
      `/api/agendamentos?status=agendado&dataInicio=${hoje}`,
    );
    expect(
      agendamentos.length,
      "seed precisa de ao menos 1 agendamento futuro em status agendado",
    ).toBeGreaterThan(0);
    const alvo = agendamentos[0];

    // (a) motivo vazio → 422 com a mensagem do schema
    const vazio = await page.request.post(
      `/api/agendamentos/${alvo.id}/cancelar`,
      { data: { motivo: "" } },
    );
    expect(vazio.status()).toBe(422);
    const erroVazio = (await vazio.json()) as {
      issues?: { motivo?: string[] };
    };
    expect(erroVazio.issues?.motivo?.join(" ") ?? "").toMatch(/obrigat/i);

    // motivo curto demais (2 chars) também é recusado
    const curto = await page.request.post(
      `/api/agendamentos/${alvo.id}/cancelar`,
      { data: { motivo: "ok" } },
    );
    expect(curto.status()).toBe(422);

    // o agendamento continua intacto depois das recusas
    const intacto = await getJson<{ agendamento: AgendamentoApi }>(
      page,
      `/api/agendamentos/${alvo.id}`,
    );
    expect(intacto.agendamento.status).toBe("agendado");

    // (b) motivo válido → 200, status cancelado e motivo persistido
    const MOTIVO = "Paciente solicitou cancelamento — comprovação AG06";
    const ok = await page.request.post(`/api/agendamentos/${alvo.id}/cancelar`, {
      data: { motivo: MOTIVO },
    });
    expect(ok.status()).toBe(200);
    const { agendamento } = (await ok.json()) as { agendamento: AgendamentoApi };
    expect(agendamento.status).toBe("cancelado");
    expect(agendamento.motivoCancelamento).toBe(MOTIVO);

    const relido = await getJson<{ agendamento: AgendamentoApi }>(
      page,
      `/api/agendamentos/${alvo.id}`,
    );
    expect(relido.agendamento.motivoCancelamento).toBe(MOTIVO);

    // O motivo registrado aparece no relatório (coluna "Motivo").
    // A janela é [dia-1, dia+1] porque as datas da seed são gravadas em
    // meia-noite local e o filtro compara em UTC.
    const diaIso = String(alvo.data).slice(0, 10);
    const base = new Date(`${diaIso}T12:00:00`);
    const antes = new Date(base);
    antes.setDate(antes.getDate() - 1);
    const depois = new Date(base);
    depois.setDate(depois.getDate() + 1);

    await irPara(page, "/relatorios/cancelamentos", /Cancelamentos/i);
    await page.locator("#ini").fill(isoLocal(antes));
    await page.locator("#fim").fill(isoLocal(depois));
    await expect(page.getByText(MOTIVO).first()).toBeVisible({ timeout: 15_000 });
    await mostrar(page);
  });

  /**
   * AG07 — Lembrete automático via e-mail (D-1).
   *
   * O disparo não tem UI: é `POST /api/cron/lembretes-amanha`, chamado por
   * agendador externo e protegido por `Authorization: Bearer ${CRON_SECRET}`
   * (o proxy libera a rota justamente porque a autenticação é por bearer, não
   * por cookie). A comprovação possível em teste é que a rota EXISTE e está
   * PROTEGIDA: sem o header, 401.
   *
   * O envio real usa nodemailer (`_lib/mailer.ts` → `sendLembreteConsultaEmail`)
   * mais WhatsApp, e NÃO é disparado pelo caminho 401. O branch autenticado só
   * roda se `CRON_SECRET` estiver no ambiente do teste (hoje não está no .env,
   * o app usa o default do schema em `lib/env.ts`) — e mesmo aí o use case é
   * idempotente: marca `Atendimento.lembreteEnviadoEm` e não reenvia.
   */
  test("AG07 — lembrete automático via e-mail (cron D-1 protegido)", async ({
    page,
  }) => {
    await login(page, "admin");
    await irPara(page, "/agenda", /^Agenda$/);

    const semHeader = await page.request.post("/api/cron/lembretes-amanha", {
      data: {},
    });
    expect(semHeader.status()).toBe(401);
    // "Não autorizado" vem do handler da rota (o proxy diria "Não autenticado"),
    // o que prova que a rota existe e que quem barrou foi o bearer check.
    expect((await semHeader.json()).error).toMatch(/não autorizado/i);

    const segredo = process.env.CRON_SECRET;
    if (segredo) {
      const comHeader = await page.request.post("/api/cron/lembretes-amanha", {
        headers: { Authorization: `Bearer ${segredo}` },
        data: {},
      });
      expect(comHeader.status()).toBe(200);
      const resultado = (await comHeader.json()) as {
        dataAlvo: string;
        total: number;
        enviados: number;
      };
      expect(resultado.dataAlvo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof resultado.total).toBe("number");
      expect(typeof resultado.enviados).toBe("number");
    } else {
      test.info().annotations.push({
        type: "nota",
        description:
          "CRON_SECRET não está no ambiente do teste — comprovado apenas o 401 (rota existe e está protegida).",
      });
    }

    await mostrar(page);
  });
});
