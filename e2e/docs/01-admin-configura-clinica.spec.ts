/**
 * Jornada 01 — O administrador prepara a clínica para operar.
 *
 * Cobre: [CO01] [FI01] [FI02] [FI08] [AG04] [CO02] [CO03] [AG03]
 *        (e [RF-021] no login).
 * Persona: ADMINISTRADOR · Roberto Lima.
 *
 * O vídeo é a "planta baixa" do sistema: antes de qualquer consulta existir,
 * alguém precisa dizer quais salas existem, quanto cada profissional recebe,
 * quanto dura cada consulta e em que dia/turno cada um ocupa qual sala.
 */
import {
  test,
  expect,
  ELENCO,
  entrarComo,
  lerJson,
  regexDe,
} from "./_support";

const DIA_LONGO = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
const TURNO_LONGO = { manha: "manhã", tarde: "tarde", noite: "noite" } as const;
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

type Turno = keyof typeof TURNO_LONGO;

/**
 * `ProfissionalApi` do `_support` não traz contrato nem o id do turno fixo,
 * e esta jornada precisa dos dois (mostrar o contrato e apagar a alocação
 * temporária do CO03 no fim).
 */
interface TurnoFixoDetalhe {
  id: string;
  diaSemana: number;
  turno: Turno;
  consultorioId: string;
  consultorio: { id: string; nome: string };
}

interface ProfissionalDetalhe {
  id: string;
  nome: string;
  especialidade: string;
  ativo: boolean;
  duracaoConsultaMinutos: number;
  modalidadeContrato: "percentual" | "aluguel_fixo";
  percentualRepasse: string | null;
  valorAluguelPorTurno: string | null;
  turnosFixos: TurnoFixoDetalhe[];
}

interface ConsultorioApi {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  equipamentos: string[];
}

function brl(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Primeira data futura num dia útil que o profissional NÃO atende. */
function primeiraDataNaoAtendida(dows: Set<number>): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 31; i++) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // fim de semana já é fechado por outro motivo
    if (!dows.has(dow)) return isoLocal(d);
  }
  throw new Error("profissional atende todos os dias úteis — CO03/AG03 sem contraste");
}

/**
 * aria-label do dia desabilitado no `<MonthlyCalendar>`:
 * "05 de agosto de 2026 — profissional não atende neste dia".
 * Ancorado no começo porque "5 de agosto" também casaria com 15 e 25.
 */
function rotuloDiaBloqueado(iso: string): RegExp {
  const d = new Date(`${iso}T12:00:00`);
  const dia = String(d.getDate()).padStart(2, "0");
  return new RegExp(
    `^${dia} de ${MESES[d.getMonth()]}.*não atende neste dia`,
    "i",
  );
}

test("01 — Administrador configura a clínica", async ({ page, jornada }) => {
  // Jornada longa: 10 passos com pausa de leitura + páginas compilando em dev.
  test.setTimeout(300_000);

  await jornada.abrir({
    persona: ELENCO.admin.persona,
    objetivo:
      "Roberto prepara a clínica para operar: confere as salas, os contratos, a duração das consultas e quem ocupa qual sala em cada turno.",
    ids: ["CO01", "CO02", "CO03", "AG03", "AG04", "FI01", "FI02", "FI08"],
    precondicoes: [
      "As salas da clínica já foram cadastradas",
      "Os profissionais já têm contrato e agenda semanal",
      "Roberto é o administrador — só ele mexe em contrato e turno",
    ],
  });

  await entrarComo(page, jornada, "admin");

  // Catálogo real: nada abaixo é inventado, tudo sai destas duas listas.
  const { consultorios } = await lerJson<{ consultorios: ConsultorioApi[] }>(
    page,
    "/api/consultorios",
  );
  const { profissionais } = await lerJson<{
    profissionais: ProfissionalDetalhe[];
  }>(page, "/api/profissionais");

  const salasAtivas = consultorios.filter((c) => c.ativo).length;
  const salasInativas = consultorios.length - salasAtivas;

  // As duas modalidades de contrato do elenco: Dra. Nirmala (percentual) e
  // Dra. Helena Braga (aluguel fixo por turno).
  const profPercentual = profissionais.find(
    (p) => p.nome === ELENCO.clinicaGeral.persona.nome,
  );
  const profAluguel = profissionais.find(
    (p) => p.nome === ELENCO.psicologa.persona.nome,
  );
  expect(profPercentual, "a seed precisa de Dra. Nirmala Azalea").toBeTruthy();
  expect(profAluguel, "a seed precisa de Dra. Helena Braga").toBeTruthy();
  const nirmala = profPercentual!;
  const helena = profAluguel!;
  expect(nirmala.modalidadeContrato).toBe("percentual");
  expect(helena.modalidadeContrato).toBe("aluguel_fixo");

  const pctTexto = String(Math.round(Number(nirmala.percentualRepasse) * 100));
  const aluguelTexto = String(Number(helena.valorAluguelPorTurno));

  // ---------------------------------------------------------------------
  // [CO01] As salas da clínica, com tipo e equipamentos
  // ---------------------------------------------------------------------
  await jornada.passo(
    `[CO01] Roberto revisa as ${consultorios.length} salas da clínica, cada uma com tipo e equipamentos`,
    async () => {
      await page.goto("/consultorios");
      await expect(
        page.getByRole("heading", { name: "Consultórios" }),
      ).toBeVisible();

      // Mesma frase que o cabeçalho da página monta, plural incluído.
      const s = consultorios.length === 1 ? "" : "s";
      await jornada.validar(
        page.getByText(`${consultorios.length} sala${s} cadastrada${s}`),
        `A clínica tem ${consultorios.length} sala${s} cadastrada${s} — ${salasAtivas} ativa${salasAtivas === 1 ? "" : "s"} e ${salasInativas} desativada${salasInativas === 1 ? "" : "s"}`,
      );

      const sala = consultorios[0];
      await jornada.validar(
        page.getByRole("link", { name: regexDe(sala.nome) }).first(),
        `${sala.nome} — tipo "${sala.tipo}", equipada com ${sala.equipamentos.join(", ")}`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [FI01][FI02] Contrato por percentual, com percentual individual
  // ---------------------------------------------------------------------
  await jornada.passo(
    `[FI01][FI02] Roberto abre o contrato de ${nirmala.nome}: repasse por percentual, com o percentual individual dela`,
    async () => {
      await page.goto(`/profissionais/${nirmala.id}/editar`);
      await expect(
        page.getByRole("heading", { name: regexDe(`Editar ${nirmala.nome}`) }),
      ).toBeVisible();

      // A escolha "Percentual" é um cartão clicável; o campo de percentual só
      // é renderizado nessa modalidade, então vê-lo já prova qual contrato é.
      await jornada.validar(
        page.getByRole("button", { name: /^Percentual\b/ }),
        `Modalidade do contrato de ${nirmala.nome}: percentual sobre a receita dos atendimentos`,
      );

      const campoPercentual = page.getByLabel(/^Percentual \(%\)/);
      await expect(campoPercentual).toHaveValue(pctTexto);
      await jornada.validar(
        campoPercentual,
        `O percentual é individual: ${pctTexto}% no contrato de ${nirmala.nome} — cada profissional pode ter o seu`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [AG04] Duração de consulta — profissional 1 de 2
  // ---------------------------------------------------------------------
  await jornada.passo(
    `[AG04] A consulta de ${nirmala.nome} (${nirmala.especialidade}) dura ${nirmala.duracaoConsultaMinutos} minutos`,
    async () => {
      const campoDuracao = page.getByLabel(/Duração/i);
      await expect(campoDuracao).toHaveValue(
        String(nirmala.duracaoConsultaMinutos),
      );
      await jornada.validar(
        campoDuracao,
        `${nirmala.nome}: consulta de ${nirmala.duracaoConsultaMinutos} minutos — é esse número que define os horários da agenda dela`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [FI08] A outra modalidade: aluguel fixo por turno
  // ---------------------------------------------------------------------
  await jornada.passo(
    `[FI08] Roberto abre o contrato de ${helena.nome}: a outra modalidade, aluguel fixo por turno usado`,
    async () => {
      await page.goto(`/profissionais/${helena.id}/editar`);
      await expect(
        page.getByRole("heading", { name: regexDe(`Editar ${helena.nome}`) }),
      ).toBeVisible();

      await jornada.validar(
        page.getByRole("button", { name: /^Aluguel fixo\b/ }),
        `${helena.nome} não paga percentual: ela aluga a sala por turno`,
      );

      const campoAluguel = page.getByLabel(/^Aluguel por turno/);
      await expect(campoAluguel).toHaveValue(aluguelTexto);
      await jornada.validar(
        campoAluguel,
        `${brl(Number(aluguelTexto))} por turno ocupado — é o que a clínica cobra dela a cada turno`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [AG04] Duração de consulta — profissional 2 de 2 (o contraste)
  // ---------------------------------------------------------------------
  await jornada.passo(
    `[AG04] Já a consulta de ${helena.nome} dura ${helena.duracaoConsultaMinutos} minutos — a duração é por profissional`,
    async () => {
      const campoDuracao = page.getByLabel(/Duração/i);
      await expect(campoDuracao).toHaveValue(
        String(helena.duracaoConsultaMinutos),
      );
      await jornada.validar(
        campoDuracao,
        `${helena.duracaoConsultaMinutos} min para ${helena.nome} contra ${nirmala.duracaoConsultaMinutos} min para ${nirmala.nome}: cada profissional tem a sua duração`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [CO02] Turnos fixos: dia + turno + consultório
  // ---------------------------------------------------------------------
  const turnoBase = helena.turnosFixos[0];
  expect(turnoBase, `${helena.nome} precisa de pelo menos um turno fixo`).toBeTruthy();

  await jornada.passo(
    `[CO02] A agenda semanal de ${helena.nome}: cada turno fixo amarra dia, período e consultório`,
    async () => {
      await jornada.validar(
        page
          .locator("li")
          .filter({ hasText: regexDe(turnoBase.consultorio.nome) })
          .first(),
        `Turno fixo: ${DIA_LONGO[turnoBase.diaSemana]}, período da ${TURNO_LONGO[turnoBase.turno]}, no ${turnoBase.consultorio.nome}`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [CO03] Mesmo profissional, mais de um turno, em salas diferentes
  // ---------------------------------------------------------------------
  // A seed aloca os dois turnos de cada profissional na MESMA sala, então o
  // caso do CO03 não existe pronto: criamos a terceira alocação numa sala
  // diferente pela API e desfazemos no último passo do vídeo.
  const salasOcupadas = new Set<string>();
  for (const p of profissionais) {
    for (const t of p.turnosFixos) {
      salasOcupadas.add(`${t.consultorioId}|${t.diaSemana}|${t.turno}`);
    }
  }
  const slotsDeHelena = new Set(
    helena.turnosFixos.map((t) => `${t.diaSemana}|${t.turno}`),
  );
  const salasDeHelena = new Set(helena.turnosFixos.map((t) => t.consultorioId));

  let alvo: { sala: ConsultorioApi; diaSemana: number; turno: Turno } | null =
    null;
  for (const diaSemana of [1, 2, 3, 4, 5]) {
    for (const turno of ["manha", "tarde", "noite"] as Turno[]) {
      if (slotsDeHelena.has(`${diaSemana}|${turno}`)) continue;
      const sala = consultorios.find(
        (c) =>
          c.ativo &&
          !salasDeHelena.has(c.id) &&
          !salasOcupadas.has(`${c.id}|${diaSemana}|${turno}`),
      );
      if (sala) {
        alvo = { sala, diaSemana, turno };
        break;
      }
    }
    if (alvo) break;
  }
  expect(alvo, "precisa sobrar um (dia, turno, sala) livre para demonstrar CO03").toBeTruthy();
  const novoTurno = alvo!;
  let turnoTemporarioId = "";

  await jornada.passo(
    `[CO03] Roberto aloca ${helena.nome} também na ${DIA_LONGO[novoTurno.diaSemana]} de ${TURNO_LONGO[novoTurno.turno]}, em OUTRA sala`,
    async () => {
      const criado = await page.request.post(
        `/api/profissionais/${helena.id}/turnos-fixos`,
        {
          data: {
            consultorioId: novoTurno.sala.id,
            diaSemana: novoTurno.diaSemana,
            turno: novoTurno.turno,
          },
        },
      );
      expect(criado.status(), "POST /turnos-fixos").toBe(201);
      turnoTemporarioId = ((await criado.json()) as { turno: { id: string } })
        .turno.id;

      await page.reload();
      await expect(
        page.getByRole("heading", { name: regexDe(`Editar ${helena.nome}`) }),
      ).toBeVisible();

      await jornada.validar(
        page
          .locator("li")
          .filter({ hasText: regexDe(novoTurno.sala.nome) })
          .first(),
        `Nova alocação: ${DIA_LONGO[novoTurno.diaSemana]} de ${TURNO_LONGO[novoTurno.turno]} no ${novoTurno.sala.nome}`,
      );
      await jornada.validar(
        page.locator("p").filter({ hasText: /Turnos:/ }).first(),
        `${helena.nome} agora ocupa ${helena.turnosFixos.length + 1} turnos em salas diferentes — ${turnoBase.consultorio.nome} e ${novoTurno.sala.nome}`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // [AG03] A agenda só oferece os dias/horários dos turnos fixos
  // ---------------------------------------------------------------------
  const dowsDeHelena = new Set<number>([
    ...helena.turnosFixos.map((t) => t.diaSemana),
    novoTurno.diaSemana,
  ]);
  const diaBloqueado = primeiraDataNaoAtendida(dowsDeHelena);
  const diasQueAtende = [...dowsDeHelena]
    .sort()
    .map((d) => DIA_LONGO[d])
    .join(", ");

  await jornada.passo(
    `[AG03] Marcar consulta com ${helena.nome} só é possível nos dias desses turnos fixos — o resto do calendário fica bloqueado`,
    async () => {
      await page.goto("/agenda/novo");
      await expect(
        page.getByRole("heading", { name: "Novo agendamento" }),
      ).toBeVisible();
      await expect(page.locator("#profissional")).toBeVisible();
      await page.selectOption("#profissional", helena.id);

      const dia = page.getByRole("button", {
        name: rotuloDiaBloqueado(diaBloqueado),
      });
      // O calendário abre no mês de amanhã; se a data cair no mês seguinte,
      // avança uma vez.
      for (let i = 0; i < 3 && (await dia.count()) === 0; i++) {
        await page.getByRole("button", { name: /Próximo mês/i }).click();
        await page.waitForTimeout(250);
      }
      await expect(dia.first()).toBeDisabled();
      await jornada.validar(
        dia.first(),
        `${helena.nome} atende ${diasQueAtende}. Fora desses dias o calendário apaga a data e não deixa clicar.`,
      );
    },
  );

  // ---------------------------------------------------------------------
  // Limpeza: a alocação do CO03 existiu só para este vídeo
  // ---------------------------------------------------------------------
  await jornada.passo(
    `[CO03] Roberto desfaz a alocação extra — ela foi criada só para mostrar o caso neste vídeo`,
    async () => {
      const apagado = await page.request.delete(
        `/api/profissionais/${helena.id}/turnos-fixos/${turnoTemporarioId}`,
      );
      expect(apagado.status(), "DELETE /turnos-fixos/:id").toBe(200);

      await page.goto(`/profissionais/${helena.id}/editar`);
      await expect(
        page.getByRole("heading", { name: regexDe(`Editar ${helena.nome}`) }),
      ).toBeVisible();
      await jornada.validar(
        page.locator("p").filter({ hasText: /Turnos:/ }).first(),
        `Agenda de ${helena.nome} de volta aos ${helena.turnosFixos.length} turnos originais — a clínica ficou como estava`,
      );
    },
  );

  await jornada.encerrar(
    `Clínica configurada: ${consultorios.length} consultórios (${salasAtivas} ativos), ` +
      `${profissionais.length} profissionais e as duas modalidades de contrato — ` +
      `percentual (${nirmala.nome}, ${pctTexto}%) e aluguel fixo por turno ` +
      `(${helena.nome}, ${brl(Number(aluguelTexto))}/turno)`,
  );
});
