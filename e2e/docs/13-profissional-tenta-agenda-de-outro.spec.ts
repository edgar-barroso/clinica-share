/**
 * Jornada 13 — [NEGATIVA] A profissional tenta ver a agenda de outra profissional.
 * Cobre: [RF-023] (e [RF-021] no login).
 * Persona: PROFISSIONAL · Dra. Nirmala Azalea.
 *
 * ATENÇÃO A QUEM ASSISTE: aqui o sucesso é o sistema DIZER NÃO. Cada tentativa
 * é anunciada antes de acontecer ("o sistema DEVE...") justamente para que a
 * recusa não seja lida como falha ou tela quebrada.
 *
 * Duas provas, uma para cada forma de tentar:
 *   1. pedir a agenda de outra pessoa passando o identificador dela na consulta
 *      — o servidor sobrescreve o filtro e devolve só os próprios atendimentos;
 *   2. abrir um atendimento que é de outra pessoa — o servidor responde 403.
 *
 * O Prisma aqui só LÊ o banco, para descobrir qual atendimento pertence a outra
 * profissional (é a pré-condição do caso: numa clínica compartilhada, existem
 * atendimentos de outras pessoas na mesma base). Nada de autenticação passa por
 * fora da tela: o único login é o formulário, com `entrarComo`.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import {
  test,
  expect,
  ELENCO,
  entrarComo,
  lerJson,
  type AtendimentoApi,
} from "./_support";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

interface MeApi {
  user: { id: string; email: string; profissionalId: string | null };
}

test("13 — Profissional não alcança a agenda de outra profissional", async ({
  page,
  jornada,
}) => {
  test.setTimeout(240_000);

  // -------------------------------------------------------------------------
  // Pré-condição de bastidores: quem é "a outra profissional" e qual
  // atendimento é dela. Leitura pura do banco — nenhuma sessão é criada aqui.
  // -------------------------------------------------------------------------
  const nirmala = await prisma.profissional.findFirst({
    where: { email: ELENCO.clinicaGeral.email },
    select: { id: true, nome: true },
  });
  expect(
    nirmala,
    `a seed precisa da profissional ${ELENCO.clinicaGeral.email}`,
  ).toBeTruthy();

  const atendimentoAlheio = await prisma.atendimento.findFirst({
    where: { profissionalId: { not: nirmala!.id } },
    orderBy: { data: "desc" },
    select: {
      id: true,
      profissional: { select: { id: true, nome: true, especialidade: true } },
    },
  });
  expect(
    atendimentoAlheio,
    "a seed precisa de atendimentos de outros profissionais",
  ).toBeTruthy();
  const colega = atendimentoAlheio!.profissional;

  /**
   * Navegar direto numa rota de API faz o Chrome mostrar o corpo cru da
   * resposta. Como o vídeo não grava a barra de endereços, é sempre a legenda
   * que diz qual rota foi chamada e qual status voltou.
   */
  const respostaDoServidor = page.locator("body");

  let meuAtendimentoId = "";

  await jornada.abrir({
    persona: ELENCO.clinicaGeral.persona,
    objetivo:
      "Dra. Nirmala vai tentar alcançar a agenda e o atendimento de outra profissional da clínica. O sistema deve recusar — é isso que este vídeo comprova.",
    ids: ["RF-023"],
    precondicoes: [
      "Várias profissionais atendem na mesma clínica, na mesma base de dados",
      `${colega.nome} (${colega.especialidade}) já tem atendimentos registrados`,
      "Dra. Nirmala tem login próprio, com perfil PROFISSIONAL",
    ],
  });

  await entrarComo(page, jornada, "clinicaGeral");

  const { user } = await lerJson<MeApi>(page, "/api/auth/me");
  expect(user.profissionalId, "a conta precisa estar ligada à profissional").toBe(
    nirmala!.id,
  );

  // =========================================================================
  // O que é dela: a agenda própria
  // =========================================================================

  await jornada.passo(
    "[RF-023] Dra. Nirmala abre a agenda dela, em Minha agenda",
    async () => {
      await page.goto("/minha-agenda");
      await jornada.validar(
        page.getByRole("heading", { name: "Minha agenda", exact: true }),
        "A tela do profissional já nasce filtrada: é a agenda de Dra. Nirmala Azalea, e só dela",
      );
    },
  );

  // =========================================================================
  // Tentativa 1 — pedir a agenda de outra pessoa
  // =========================================================================

  await jornada.passo(
    `[RF-023] O sistema DEVE devolver só a agenda dela, mesmo ela pedindo a de ${colega.nome}`,
    async () => {
      const { agendamentos } = await lerJson<{ agendamentos: AtendimentoApi[] }>(
        page,
        `/api/agendamentos?profissionalId=${colega.id}`,
      );

      expect(
        agendamentos.length,
        "a seed precisa dar agenda própria a Dra. Nirmala",
      ).toBeGreaterThan(0);
      // O filtro pedido pelo cliente é sobrescrito no servidor: quem manda é o
      // perfil de quem pergunta, não o parâmetro da URL.
      expect(
        agendamentos.every((a) => a.profissionalId === nirmala!.id),
        "todo atendimento devolvido tem de ser de Dra. Nirmala",
      ).toBe(true);
      expect(
        agendamentos.some((a) => a.profissionalId === colega.id),
        `nenhum atendimento de ${colega.nome} pode vazar`,
      ).toBe(false);
      meuAtendimentoId = agendamentos[0].id;

      await jornada.validar(
        page.getByRole("button", { name: "Menu do usuário" }),
        `Pedido: a agenda de ${colega.nome}. Devolvido: ${agendamentos.length} atendimentos, todos de Dra. Nirmala Azalea e nenhum de ${colega.nome}. Quem decide é o servidor, não o pedido.`,
      );
    },
  );

  // =========================================================================
  // Tentativa 2 — abrir um atendimento que é de outra pessoa
  // =========================================================================

  await jornada.passo(
    `[RF-023] O sistema DEVE recusar a abertura de um atendimento de ${colega.nome}`,
    async () => {
      const resposta = await page.goto(
        `/api/atendimentos/${atendimentoAlheio!.id}`,
      );
      expect(
        resposta?.status(),
        `atendimento de ${colega.nome} aberto por Dra. Nirmala`,
      ).toBe(403);
      await jornada.validar(
        respostaDoServidor,
        `Atendimento de ${colega.nome} → 403 "Você só pode ver atendimentos atribuídos a você". Nem paciente, nem valor, nem prontuário: nada é devolvido.`,
      );
    },
  );

  // =========================================================================
  // Contraprova — no que é dela, o mesmo pedido é liberado
  // =========================================================================

  await jornada.passo(
    "[RF-023] O mesmo pedido, num atendimento dela, é liberado na hora",
    async () => {
      const resposta = await page.goto(`/api/atendimentos/${meuAtendimentoId}`);
      expect(resposta?.status(), "atendimento próprio de Dra. Nirmala").toBe(200);
      await jornada.validar(
        respostaDoServidor,
        "Atendimento dela → 200, com paciente, valor e prontuário. Não é o sistema fora do ar: é o sistema separando o que é de cada uma.",
      );
      await page.goto("/minha-agenda");
    },
  );

  await jornada.passo(
    "[RF-023] E a tela dela continua exatamente como estava: a agenda dela",
    async () => {
      await jornada.validar(
        page.getByRole("heading", { name: "Minha agenda", exact: true }),
        "Nenhuma tentativa mudou o que Dra. Nirmala enxerga — o limite é do servidor, não da tela",
      );
    },
  );

  await jornada.encerrar(
    `Os dois "nãos" são a proteção funcionando, não erro. ` +
      `Pedindo a agenda de ${colega.nome}, Dra. Nirmala recebeu apenas os próprios atendimentos; ` +
      `abrindo um atendimento de ${colega.nome}, recebeu 403. ` +
      `Na mesma sessão, o atendimento dela abriu normalmente (200). ` +
      `Cada profissional só alcança o próprio paciente, o próprio prontuário e o próprio dinheiro.`,
  );
});
