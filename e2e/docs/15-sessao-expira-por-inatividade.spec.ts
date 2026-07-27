/**
 * Jornada 15 — A sessão de Carla não fica aberta sozinha.
 * Cobre: [RF-024] (e [RF-021] nos logins).
 * Persona: AUXILIAR · Carla Nogueira.
 *
 * POR QUE ISSO EXISTE: o computador da recepção é compartilhado, e o painel de
 * Carla mostra prontuário, valor de consulta e repasse de todo mundo. Uma tela
 * esquecida aberta é o mesmo que deixar a pasta de pacientes em cima do balcão.
 *
 * Duas partes:
 *   (a) SAIR ENCERRA DE VERDADE — o botão "Sair" invalida o cookie no servidor,
 *       e não apenas some com o nome do usuário no navegador;
 *   (b) INATIVIDADE — sem ninguém tocar no computador, a mesma sessão deixa de
 *       ser aceita depois da janela configurada.
 *
 * COMO O TEMPO PASSA NESTE VÍDEO: ninguém espera 30 minutos de gravação. O
 * relógio da sessão (`User.ultimoAcesso`, o carimbo do último acesso) é
 * envelhecido no banco para além da janela, e então a MESMA sessão, com o MESMO
 * cookie, é reapresentada ao servidor. Isso é manipulação de pré-condição de
 * tempo — não é atalho de autenticação: o login continua sendo pela tela, e o
 * cookie usado na prova é exatamente o que a tela emitiu.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { test, expect, ELENCO, entrarComo, sair } from "./_support";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

/** Mesma fonte de verdade do servidor (`lib/session-idle.ts`), default 30min. */
const JANELA_MINUTOS = Number(process.env.SESSION_IDLE_MINUTES ?? 30) || 30;

test("15 — Sessão encerrada: por decisão de Carla e por inatividade", async ({
  page,
  jornada,
}) => {
  test.setTimeout(240_000);

  /**
   * Navegar direto numa rota de API faz o Chrome mostrar o corpo cru da
   * resposta. Como o vídeo não grava a barra de endereços, é a legenda que diz
   * qual rota foi chamada e qual status voltou.
   */
  const respostaDoServidor = page.locator("body");

  await jornada.abrir({
    persona: ELENCO.auxiliar.persona,
    objetivo:
      "Mostrar que a sessão de Carla acaba de duas formas: quando ela clica em Sair e quando o computador dela fica sozinho tempo demais.",
    ids: ["RF-024"],
    precondicoes: [
      "Carla é auxiliar financeira e trabalha num computador compartilhado da recepção",
      "O painel dela mostra atendimento, valor cobrado e repasse de toda a clínica",
      `A janela de inatividade configurada no sistema é de ${JANELA_MINUTOS} minutos`,
    ],
  });

  // =========================================================================
  // PARTE A — Sair encerra a sessão de verdade
  // =========================================================================

  await entrarComo(page, jornada, "auxiliar");

  await jornada.passo(
    "[RF-024] Carla está dentro do painel, com o financeiro da clínica na tela",
    async () => {
      const sessao = await page.request.get("/api/auth/me");
      expect(sessao.status(), "sessão recém-aberta").toBe(200);
      await jornada.validar(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
        "Sessão aberta: o servidor reconhece Carla e entrega o painel com os números da clínica",
      );
    },
  );

  await sair(page, jornada);

  await jornada.passo(
    "[RF-024] Voltar ao painel já não funciona — o sistema pede login de novo",
    async () => {
      await page.goto("/dashboard");
      await page.waitForURL(/\/login/, { timeout: 20_000 });
      await jornada.validar(
        page.getByLabel("E-mail"),
        "Digitar o endereço do painel não traz mais a sessão de volta: o sistema devolve a tela de login",
      );
    },
  );

  await jornada.passo(
    "[RF-024] E o encerramento foi no servidor, não só no navegador",
    async () => {
      const resposta = await page.goto("/api/auth/me");
      expect(resposta?.status(), "sessão encerrada pelo botão Sair").toBe(401);
      await jornada.validar(
        respostaDoServidor,
        'GET /api/auth/me → 401 "Não autenticado". O cookie da sessão foi invalidado no servidor — não bastaria limpar a tela do navegador.',
      );
    },
  );

  // =========================================================================
  // PARTE B — A sessão morre sozinha por inatividade
  // =========================================================================

  await entrarComo(page, jornada, "auxiliar");

  await jornada.passo(
    "[RF-024] Carla entra de novo e é chamada na recepção, deixando o painel aberto",
    async () => {
      const sessao = await page.request.get("/api/auth/me");
      expect(sessao.status(), "sessão viva logo após o login").toBe(200);
      await jornada.validar(
        page.getByRole("button", { name: "Menu do usuário" }),
        "Sessão viva: o sistema sabe que quem está nesta máquina é Carla Nogueira, auxiliar financeira",
      );
    },
  );

  await jornada.passo(
    `[RF-024] O tempo passa: ninguém toca no computador por mais de ${JANELA_MINUTOS} minutos`,
    async () => {
      // Envelhecer o carimbo do último acesso equivale a deixar a máquina
      // parada esse tempo todo — é a única coisa que a gravação adianta.
      await prisma.user.update({
        where: { email: ELENCO.auxiliar.email },
        data: {
          ultimoAcesso: new Date(Date.now() - (JANELA_MINUTOS + 1) * 60_000),
        },
      });
      await jornada.validar(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
        `Relógio da sessão adiantado em ${JANELA_MINUTOS + 1} minutos — o mesmo que a recepção ficar vazia esse tempo. A tela continua igual; quem mudou de ideia foi o servidor.`,
      );
    },
  );

  await jornada.passo(
    "[RF-024] A mesma sessão, no mesmo computador, passa a ser recusada",
    async () => {
      const resposta = await page.goto("/api/auth/me");
      expect(resposta?.status(), "sessão parada além da janela").toBe(401);
      await jornada.validar(
        respostaDoServidor,
        `Mesmo cookie, mesma aba, nenhum logout: GET /api/auth/me → 401 "Não autenticado". Passada a janela de ${JANELA_MINUTOS} minutos, o servidor deixa de aceitar a sessão.`,
      );
    },
  );

  await jornada.passo(
    "[RF-024] Quem chegar depois na recepção encontra a tela de login",
    async () => {
      await page.goto("/login");
      await jornada.validar(
        page.getByLabel("E-mail"),
        "São duas travas para a mesma janela: o cookie da sessão só vale até o fim dela e é reemitido a cada uso, e o servidor ainda confere o último acesso a cada pedido. Máquina parada, sessão encerrada.",
      );
    },
  );

  await jornada.encerrar(
    "A sessão de Carla acaba das duas formas. Clicando em Sair, o cookie é invalidado no servidor e o painel exige login de novo. " +
      `Sem ninguém mexer, a mesma sessão é recusada com 401 depois de ${JANELA_MINUTOS} minutos parada. ` +
      "Prontuário e dinheiro não ficam abertos num computador sozinho.",
  );
});
