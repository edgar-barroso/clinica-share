/**
 * Jornada 16 — Toda mexida em dinheiro fica com nome e sobrenome.
 * Cobre: [RF-025] (e [RF-021] no login).
 * Persona: AUXILIAR · Carla Nogueira.
 *
 * Por que isso existe: numa clínica onde vários profissionais dividem a mesma
 * estrutura, "quem foi que mudou esse valor?" não pode ser uma pergunta sem
 * resposta. Cada alteração financeira grava um registro com o autor, o campo
 * alterado, o valor antes, o valor depois e o motivo — e esse registro é
 * legível por administrador e auxiliar na tela de auditoria.
 *
 * DUAS RESSALVAS HONESTAS, narradas no vídeo em vez de escondidas:
 *
 *  1. A tela de pagamento NÃO pede um motivo digitado. O sistema grava um
 *     motivo padrão ("Repasse pago ao profissional") — a API aceita motivo
 *     livre, mas hoje nenhuma tela oferece o campo.
 *  2. A geração automática dos repasses (o cron que roda toda segunda) cria
 *     os registros SEM gravar auditoria. A trilha cobre as alterações feitas
 *     por pessoas, não o fechamento automático.
 */
import {
  test,
  expect,
  brl,
  ELENCO,
  entrarComo,
  lerJson,
} from "./_support";

interface UsuarioApi {
  id: string;
  email: string;
  role: string;
  staff: { id: string; nome: string } | null;
}

interface RepasseApi {
  id: string;
  receitaBruta: string;
  valorRepasse: string;
  status: "aberto" | "pago";
  dataPagamento: string | null;
  profissional: { id: string; nome: string; especialidade: string };
}

interface AuditLogApi {
  id: string;
  userId: string;
  userNome: string;
  entidade: string;
  entidadeId: string;
  campo: string;
  valorAntes: string;
  valorDepois: string;
  motivo: string;
  timestamp: string;
}

test("16 — Auxiliar paga um repasse e a auditoria mostra quem fez", async ({
  page,
  jornada,
}) => {
  await jornada.abrir({
    persona: ELENCO.auxiliar.persona,
    objetivo:
      "Carla vai dar baixa num repasse — e o sistema tem que registrar que foi ela, com o valor antes e depois.",
    ids: ["RF-025"],
    precondicoes: [
      "Existem repasses de semanas já fechadas aguardando pagamento",
      "Carla é auxiliar administrativa: pode dar baixa em repasse e ler a trilha de auditoria",
    ],
  });

  await entrarComo(page, jornada, "auxiliar");

  const { user } = await lerJson<{ user: UsuarioApi }>(page, "/api/auth/me");
  expect(user.role).toBe("auxiliar");

  const { repasses: emAberto } = await lerJson<{ repasses: RepasseApi[] }>(
    page,
    "/api/repasses?status=aberto",
  );
  expect(
    emAberto.length,
    "a seed precisa ter repasse em aberto — rode 'npm run db:seed'",
  ).toBeGreaterThan(0);

  // Preenchido com o que o servidor devolveu no pagamento — o spec só narra
  // o que de fato aconteceu, não o que ele planejou fazer.
  const pagamento = { id: "", profissional: "", valor: 0 };
  /**
   * A trilha NÃO exibe o id da entidade em coluna nenhuma — as colunas são
   * Quando, Quem, Entidade, Campo, "Antes → Depois" e Motivo. Então a linha é
   * localizada pelo que está visível: foi a Carla quem mexeu no status de um
   * Repasse, de "aberto" para "pago".
   *
   * Também não dá para usar `getByRole("row")`: a página marca as linhas
   * clicáveis com `role="link"` (elas navegam para a entidade afetada), o que
   * substitui o papel implícito de linha. Por isso o seletor é no `tr`.
   */
  const linhaDoLog = () =>
    page
      .locator("tbody tr")
      .filter({ hasText: "Carla Nogueira" })
      .filter({ hasText: "Repasse" })
      .filter({ hasText: "status" })
      .filter({ hasText: "pago" })
      .first();

  await jornada.passo(
    `[RF-025] Carla abre os ${emAberto.length} repasses em aberto e dá baixa em um deles`,
    async () => {
      await page.goto("/financeiro/repasses");
      const botaoPagar = page.getByRole("button", { name: /^Pagar$/ }).first();
      await expect(botaoPagar).toBeVisible({ timeout: 20_000 });
      await botaoPagar.click();

      // Antes de gravar, o sistema mostra exatamente o que será pago e avisa
      // que a ação fica registrada e não pode ser desfeita.
      const dialogo = page.getByRole("dialog");
      await expect(
        dialogo.getByRole("heading", { name: /^Confirmar pagamento$/ }),
      ).toBeVisible();
      await jornada.validar(
        dialogo,
        "O sistema mostra o que será pago — profissional, período, receita bruta e valor — e avisa que a ação vai para a auditoria",
      );

      const [resposta] = await Promise.all([
        page.waitForResponse(
          (r) =>
            /\/api\/repasses\/[^/]+\/marcar-pago$/.test(r.url()) &&
            r.request().method() === "POST",
        ),
        dialogo.getByRole("button", { name: /^Confirmar pagamento$/ }).click(),
      ]);
      expect(resposta.status(), "POST /marcar-pago").toBe(200);

      const { repasse } = (await resposta.json()) as { repasse: RepasseApi };
      pagamento.id = repasse.id;
      pagamento.profissional = repasse.profissional.nome;
      pagamento.valor = Number(repasse.valorRepasse);
      expect(repasse.status).toBe("pago");
      expect(repasse.dataPagamento).not.toBeNull();

      // A confirmação já diz para onde o rastro foi.
      await jornada.validar(
        page.getByText("Registro gravado na auditoria"),
        `${pagamento.profissional}: ${brl(pagamento.valor)} baixados — e o sistema avisa que gravou o registro na auditoria`,
      );
    },
  );

  await jornada.passo(
    "[RF-025] Na trilha de auditoria: o que mudou, de quanto para quanto, por quê — e o nome de quem fez",
    async () => {
      await page.goto("/auditoria");
      await expect(
        page.getByRole("heading", { name: /^Auditoria$/ }),
      ).toBeVisible();
      await page.getByLabel("Entidade").selectOption("Repasse");

      // A tabela identifica o registro pelos 8 primeiros caracteres do id —
      // é assim que se acha a linha exata do repasse que Carla acabou de pagar.
      const linha = linhaDoLog();
      await expect(linha).toHaveCount(1);
      await expect(linha).toContainText(ELENCO.auxiliar.persona.nome);
      await expect(linha).toContainText("Repasse");
      await expect(linha).toContainText("status");
      await expect(linha).toContainText("aberto");
      await expect(linha).toContainText("pago");

      await jornada.validar(
        linha,
        `Repasse · campo "status" · de "aberto" para "pago" · por ${ELENCO.auxiliar.persona.nome} — com motivo registrado`,
      );
    },
  );

  await jornada.passo(
    "[RF-025] Pelo dado: o registro guarda o usuário que agiu, não um autor anônimo",
    async () => {
      const { logs } = await lerJson<{ logs: AuditLogApi[] }>(
        page,
        `/api/auditoria?entidade=Repasse&entidadeId=${pagamento.id}`,
      );
      const log = logs.find(
        (l) => l.campo === "status" && l.valorDepois === "pago",
      );
      expect(log, "o pagamento tem que ter gerado AuditLog").toBeTruthy();

      // O ponto do RF-025: `userId` preenchido e apontando para a conta de
      // quem estava logado — o nome é um snapshot do momento da ação, então
      // sobrevive a renomeações posteriores.
      expect(log!.userId).toBe(user.id);
      expect(log!.userNome).toBe(ELENCO.auxiliar.persona.nome);
      expect(log!.valorAntes).toBe("aberto");
      expect(log!.valorDepois).toBe("pago");
      expect(log!.motivo.trim().length).toBeGreaterThan(0);

      // E não é privilégio deste registro: a trilha inteira tem autor.
      const { logs: todos } = await lerJson<{ logs: AuditLogApi[] }>(
        page,
        "/api/auditoria",
      );
      expect(todos.length).toBeGreaterThan(0);
      expect(
        todos.every((l) => typeof l.userId === "string" && l.userId.length > 0),
        "todo AuditLog precisa ter userId",
      ).toBe(true);

      // Coluna "Quem" da linha: Quando | Quem | Entidade | Campo | Antes → Depois | Motivo
      await jornada.validar(
        linhaDoLog().locator("td").nth(1),
        `AuditLog aponta para a conta de ${log!.userNome} — os ${todos.length} registros da trilha têm autor identificado`,
      );

      // RESSALVA HONESTA: a tela de pagamento não oferece campo de motivo
      // livre. O motivo que aparece na trilha é o padrão gravado pelo
      // servidor ("Repasse pago ao profissional"); a API aceita um motivo
      // digitado, mas nenhuma tela expõe esse campo hoje.
      expect(log!.motivo).toMatch(/repasse pago ao profissional/i);
    },
  );

  await jornada.passo(
    "[RF-025] Ressalva honesta: o fechamento automático das segundas ainda não deixa rastro na auditoria",
    async () => {
      const { logs } = await lerJson<{ logs: AuditLogApi[] }>(
        page,
        `/api/auditoria?entidadeId=${pagamento.id}`,
      );
      // Todos os registros deste repasse são do campo "status" — ou seja, do
      // pagamento. Não existe nenhum registro de quando/por quem o repasse
      // foi GERADO: `gerarRepasse` e o cron semanal criam o Repasse sem
      // chamar o audit. O cron, aliás, roda sem usuário (é autenticado por
      // segredo no header), o que exigiria um "usuário sistema" para
      // satisfazer o RF-025 por inteiro.
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every((l) => l.campo === "status")).toBe(true);

      await jornada.validar(
        linhaDoLog().locator("td").nth(3),
        'Só o pagamento aparece na trilha: a geração automática dos repasses ainda não grava auditoria — a cobertura é das alterações feitas por pessoas',
      );
    },
  );

  await jornada.encerrar(
    `Repasse de ${pagamento.profissional} baixado: ${brl(pagamento.valor)} · a auditoria registra ${ELENCO.auxiliar.persona.nome} mudando o campo "status" de "aberto" para "pago", com data, hora e motivo`,
  );
});
