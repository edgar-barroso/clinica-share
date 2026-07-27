/**
 * Jornada 05 — A rotina automática que lembra o paciente da consulta de amanhã.
 * Cobre: [AG07] (e [RF-021] no login usado só para enxergar a agenda).
 * Persona: SISTEMA · Rotina automática diária (não está no ELENCO — é um cron).
 *
 * Aqui não há usuário: quem age é o agendador (cron da Vercel), que chama
 * `POST /api/cron/lembretes-amanha` uma vez por dia. Como cron não tem tela,
 * o vídeo mostra três coisas verificáveis:
 *   1. quais consultas de amanhã seriam avisadas (pela agenda real);
 *   2. que a rota do agendador existe;
 *   3. que ela é protegida — sem a chave secreta responde 401.
 * O vídeo NÃO promete "e-mail entregue": isso acontece no servidor de produção.
 */
import {
  test,
  expect,
  ELENCO,
  entrarComo,
  lerJson,
  porExtenso,
  regexDe,
  type Persona,
} from "./_support";

const SISTEMA: Persona = { papel: "SISTEMA", nome: "Rotina automática diária" };

const DIA_LONGO = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

interface AgendamentoApi {
  id: string;
  hora: string;
  paciente: { id: string; nome: string };
  profissional: { id: string; nome: string };
  consultorio: { id: string; nome: string };
}

function amanhaISO(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("05 — Sistema avisa quem tem consulta amanhã", async ({ page, jornada }) => {
  test.setTimeout(180_000);

  const amanha = amanhaISO();
  const dowAmanha = new Date(`${amanha}T12:00:00`).getDay();
  const clinicaAbreAmanha = dowAmanha >= 1 && dowAmanha <= 5;

  await jornada.abrir({
    persona: SISTEMA,
    objetivo:
      "Todo dia à noite, sem ninguém operando o sistema, o ClinicaShare avisa cada paciente que tem consulta no dia seguinte.",
    ids: ["AG07"],
    precondicoes: [
      "O agendador (cron) é configurado para chamar a rotina uma vez por dia",
      "A rotina só é aceita com a chave secreta do agendador",
      "Cada consulta guarda a marca de quando o lembrete foi enviado",
    ],
  });

  // A rotina não tem tela. Trocamos de persona para que ninguém confunda o
  // login da Júlia com o disparo do lembrete: ela entra só para MOSTRAR o
  // que a rotina vai processar.
  await jornada.trocarPersona(
    ELENCO.atendente.persona,
    "O robô não tem tela. Júlia entra apenas para mostrarmos, na agenda de verdade, quais consultas de amanhã vão receber o aviso.",
  );

  await entrarComo(page, jornada, "atendente");

  const { agendamentos } = await lerJson<{ agendamentos: AgendamentoApi[] }>(
    page,
    `/api/agendamentos?data=${amanha}&status=agendado`,
  );

  await jornada.passo(
    `[AG07] A agenda de amanhã, ${porExtenso(amanha)}: são estas as pessoas que a rotina vai avisar`,
    async () => {
      await page.goto("/agenda");
      await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

      // A tira de dias da /agenda cobre a semana útil corrente. Quando amanhã
      // é sábado ou domingo o botão não existe — não forçamos nada, apenas
      // narramos o que a tela realmente mostra.
      const numeroDoDia = String(
        new Date(`${amanha}T12:00:00`).getDate(),
      ).padStart(2, "0");
      const botaoDia = page.getByRole("button", {
        name: new RegExp(`${numeroDoDia}\\s*$`),
      });
      const diaNaTira = clinicaAbreAmanha && (await botaoDia.count()) > 0;
      if (diaNaTira) await botaoDia.first().click();

      if (diaNaTira && agendamentos.length > 0) {
        const primeira = agendamentos[0];
        const cartao = page
          .getByText(regexDe(primeira.paciente.nome))
          .first()
          .locator(
            "xpath=ancestor-or-self::*[self::li or self::article or self::div][1]",
          );
        await jornada.validar(
          cartao,
          `${agendamentos.length} consulta(s) marcadas para ${porExtenso(amanha)} — ex.: ${primeira.paciente.nome} às ${primeira.hora} com ${primeira.profissional.nome}. Cada uma gera um lembrete na véspera.`,
        );
      } else if (diaNaTira) {
        await jornada.validar(
          page.getByRole("heading", { name: /Nenhum atendimento neste dia/i }),
          `Amanhã (${porExtenso(amanha)}) não há consulta agendada — nesse caso a rotina roda e não tem ninguém para avisar`,
        );
      } else {
        await jornada.validar(
          page.getByRole("heading", { name: "Agenda" }),
          `Amanhã é ${DIA_LONGO[dowAmanha]} (${porExtenso(amanha)}) e a clínica não atende — a agenda mostra o dia útil mais próximo`,
        );
      }
    },
  );

  await jornada.trocarPersona(
    SISTEMA,
    "Agora sem nenhum usuário na tela: quem chama a rotina é o agendador, com uma chave secreta que só o servidor conhece.",
  );

  // -----------------------------------------------------------------------
  // A rota do agendador existe e é protegida
  // -----------------------------------------------------------------------
  await jornada.passo(
    "[AG07] Sem a chave secreta do agendador, o sistema recusa o disparo — ninguém dispara lembrete de fora",
    async () => {
      // A rota aceita GET com a mesma regra do POST, então dá para abri-la no
      // navegador: quem assiste vê a resposta real do servidor, não um log.
      const semChave = await page.goto("/api/cron/lembretes-amanha");
      expect(semChave?.status(), "cron sem Authorization deve dar 401").toBe(401);
      await jornada.validar(
        page.getByText(/Não autorizado/).first(),
        "HTTP 401: a rotina de lembrete existe, mas só roda para quem apresenta a chave secreta do agendador",
      );
    },
  );

  // -----------------------------------------------------------------------
  // Disparo real — só quando a chave está disponível para o teste
  // -----------------------------------------------------------------------
  const segredo = process.env.CRON_SECRET;
  let resumoDisparo = "";

  if (segredo) {
    await jornada.passo(
      "[AG07] Com a chave do agendador, a rotina roda e devolve o resumo do que processou",
      async () => {
        await page.setExtraHTTPHeaders({ Authorization: `Bearer ${segredo}` });
        const comChave = await page.goto("/api/cron/lembretes-amanha");
        expect(comChave?.status(), "cron com Authorization deve dar 200").toBe(200);
        const resultado = (await comChave!.json()) as {
          dataAlvo: string;
          total: number;
          enviados: number;
          jaNotificados: number;
        };
        resumoDisparo =
          `${resultado.total} consulta(s) em ${porExtenso(resultado.dataAlvo)}: ` +
          `${resultado.enviados} avisada(s) agora e ${resultado.jaNotificados} já avisada(s) antes`;
        await jornada.validar(
          page.getByText(/dataAlvo/).first(),
          `A rotina respondeu: ${resumoDisparo}. Quem já foi avisado não é avisado de novo.`,
        );
        await page.setExtraHTTPHeaders({});
      },
    );
  } else {
    await jornada.passo(
      "[AG07] Nenhum e-mail é enviado neste vídeo — o disparo de verdade acontece no servidor de produção",
      async () => {
        // Sem CRON_SECRET no ambiente do teste não há como chamar a rota
        // autenticada, e inventar um envio seria mentir na documentação.
        await page.goto("/agenda");
        await jornada.validar(
          page.getByRole("heading", { name: "Agenda" }),
          "Em produção o cron da Vercel chama esta rota uma vez por dia com a chave secreta; a consulta avisada fica marcada para não receber o aviso duas vezes",
        );
      },
    );
  }

  await jornada.encerrar(
    segredo
      ? `Comprovado: a rotina automática existe, é protegida por chave secreta (401 sem ela) e, ao rodar, processou ${resumoDisparo}. Envio de e-mail depende do provedor configurado no servidor.`
      : `Comprovado: a rotina automática de lembrete existe em /api/cron/lembretes-amanha, é protegida por chave secreta (401 sem ela) e as ${agendamentos.length} consulta(s) de ${porExtenso(amanha)} são as que ela avisaria. Nenhum e-mail foi enviado neste vídeo.`,
  );
});
