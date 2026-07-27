/**
 * Jornada 12 — Uma porta de entrada, cinco sistemas diferentes.
 * Cobre: [RF-022] (e [RF-021] em cada um dos cinco logins).
 * Personas: ADMINISTRADOR, AUXILIAR, PROFISSIONAL, ATENDENTE e PACIENTE.
 *
 * O vídeo passa pelos cinco perfis na mesma sessão de gravação: cada um entra
 * pela MESMA tela de login, e o que muda é o que o sistema devolve — para onde
 * leva e o que o menu abre. Entre um perfil e outro há logout visível
 * (`sair`) e cartão de transição (`trocarPersona`), para quem assiste sem áudio
 * nunca confundir de quem é a tela.
 *
 * Fecha provando o outro lado da mesma regra: estar logado não é estar
 * autorizado. Profissional na trilha de auditoria e paciente no relatório
 * financeiro recebem 403 — não 401.
 */
import { test, expect, ELENCO, entrarComo, sair } from "./_support";

test("12 — Controle de acesso por perfil: o que cada um enxerga", async ({
  page,
  jornada,
}) => {
  test.setTimeout(300_000);

  // O menu lateral do `AppShell` — é ele que traduz o perfil em telas.
  // `.first()` fixa a barra de desktop: a gaveta mobile é outro <aside>, que
  // só entra no DOM quando alguém abre o menu sanduíche.
  const menuLateral = page.locator("aside nav").first();
  const itemDoMenu = (rotulo: string) =>
    menuLateral.getByRole("link", { name: rotulo, exact: true });

  /**
   * Ao navegar direto para uma rota de API, o Chrome exibe o corpo cru da
   * resposta. O vídeo não grava a barra de endereços, então quem diz qual rota
   * foi chamada e qual status voltou é sempre a legenda.
   */
  const respostaDoServidor = page.locator("body");

  async function conferirMenu(abre: string[], naoAbre: string[]) {
    for (const rotulo of abre) {
      await expect(itemDoMenu(rotulo), `menu deve abrir "${rotulo}"`).toBeVisible();
    }
    for (const rotulo of naoAbre) {
      await expect(
        itemDoMenu(rotulo),
        `menu NÃO pode oferecer "${rotulo}"`,
      ).toHaveCount(0);
    }
  }

  await jornada.abrir({
    persona: ELENCO.admin.persona,
    objetivo:
      "Mostrar, perfil por perfil, o que a clínica abre e o que ela fecha para cada tipo de usuário.",
    ids: ["RF-022"],
    precondicoes: [
      "A clínica tem um usuário para cada perfil: administrador, auxiliar, profissional, atendente e paciente",
      "Todos usam a mesma tela de login — quem decide o que aparece é o sistema, não o usuário",
    ],
  });

  // =========================================================================
  // 1. ADMINISTRADOR — a clínica inteira
  // =========================================================================

  await entrarComo(page, jornada, "admin");

  await jornada.passo(
    "[RF-022] O administrador é levado ao painel de gestão da clínica",
    async () => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await jornada.validar(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
        "Perfil ADMINISTRADOR: o sistema abre direto no Dashboard, a visão de gestão da clínica",
      );
    },
  );

  await jornada.passo(
    "[RF-022] O menu do administrador abre todas as áreas, inclusive dinheiro e auditoria",
    async () => {
      await conferirMenu(
        [
          "Dashboard",
          "Agenda",
          "Atendimentos",
          "Pacientes",
          "Consultórios",
          "Profissionais",
          "Equipe",
          "Financeiro",
          "Relatórios",
          "Auditoria",
          "Configurações",
        ],
        [],
      );
      await jornada.validar(
        menuLateral,
        "Administrador: 11 áreas. É o único perfil que abre Consultórios, Profissionais, Equipe e Configurações.",
      );
    },
  );

  await sair(page, jornada);

  // =========================================================================
  // 2. AUXILIAR — o dinheiro da clínica, sem os cadastros
  // =========================================================================

  await jornada.trocarPersona(
    ELENCO.auxiliar.persona,
    "Carla cuida do financeiro. Precisa de números e da trilha de auditoria — não precisa cadastrar sala nem contratar profissional.",
  );
  await entrarComo(page, jornada, "auxiliar");

  await jornada.passo(
    "[RF-022] A auxiliar financeira também começa pelo painel",
    async () => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await jornada.validar(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
        "Perfil AUXILIAR: mesmo ponto de partida do administrador, o Dashboard",
      );
    },
  );

  await jornada.passo(
    "[RF-022] O menu da auxiliar tem Financeiro, Relatórios e Auditoria — e não tem os cadastros da clínica",
    async () => {
      await conferirMenu(
        [
          "Dashboard",
          "Atendimentos",
          "Pacientes",
          "Financeiro",
          "Relatórios",
          "Auditoria",
        ],
        ["Agenda", "Consultórios", "Profissionais", "Equipe", "Configurações"],
      );
      await jornada.validar(
        menuLateral,
        "Auxiliar: 6 áreas. Fecha para ela o cadastro de consultórios, profissionais, equipe e as configurações da clínica.",
      );
    },
  );

  await sair(page, jornada);

  // =========================================================================
  // 3. PROFISSIONAL — só a agenda dela e os atendimentos dela
  // =========================================================================

  await jornada.trocarPersona(
    ELENCO.psicologa.persona,
    "A profissional entra para atender. Ela não administra a clínica nem acompanha o caixa.",
  );
  await entrarComo(page, jornada, "psicologa");

  await jornada.passo(
    "[RF-022] A profissional entra e o sistema a leva ao painel",
    async () => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await jornada.validar(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
        "Perfil PROFISSIONAL: o login termina no painel — mas o menu dela, ao lado, é outro",
      );
    },
  );

  await jornada.passo(
    "[RF-022] O menu da profissional abre só a agenda dela, os atendimentos dela e o perfil dela",
    async () => {
      await conferirMenu(
        ["Minha agenda", "Atendimentos", "Meu perfil"],
        [
          "Dashboard",
          "Pacientes",
          "Consultórios",
          "Profissionais",
          "Equipe",
          "Financeiro",
          "Relatórios",
          "Auditoria",
          "Configurações",
        ],
      );
      await jornada.validar(
        menuLateral,
        "Profissional: 3 áreas. Sem Financeiro, sem Relatórios, sem Auditoria — o que ela vê é o próprio trabalho.",
      );
    },
  );

  await jornada.passo(
    "[RF-022] Dra. Helena tenta abrir a trilha de auditoria da clínica",
    async () => {
      await page.goto("/auditoria");
      await jornada.validar(
        page.getByRole("heading", { name: "Nenhum registro de auditoria" }),
        "A tela até abre, mas volta vazia: o servidor não entrega a trilha de auditoria para o perfil PROFISSIONAL",
      );
    },
  );

  await jornada.passo(
    "[RF-022] O servidor recusa em bom português: 403, acesso negado para este perfil",
    async () => {
      const resposta = await page.goto("/api/auditoria");
      expect(resposta?.status(), "profissional em GET /api/auditoria").toBe(403);
      await jornada.validar(
        respostaDoServidor,
        'GET /api/auditoria → 403 "Acesso negado para este perfil". 403 não é 401: Dra. Helena está logada, o que falta é permissão.',
      );
      // Volta ao sistema para encerrar a sessão pelo menu, como um usuário faria.
      await page.goto("/dashboard");
    },
  );

  await sair(page, jornada);

  // =========================================================================
  // 4. ATENDENTE — a recepção, o dia de hoje
  // =========================================================================

  await jornada.trocarPersona(
    ELENCO.atendente.persona,
    "Júlia recebe quem chega na porta. O sistema não a leva a painel nenhum: abre direto na agenda do dia.",
  );
  await entrarComo(page, jornada, "atendente");

  await jornada.passo(
    "[RF-022] A atendente cai direto na Agenda, não no painel de gestão",
    async () => {
      await expect(page).toHaveURL(/\/agenda$/);
      await jornada.validar(
        page.getByRole("heading", { name: "Agenda", exact: true }),
        "Perfil ATENDENTE: o destino do login é /agenda — a tela de trabalho da recepção",
      );
    },
  );

  await jornada.passo(
    "[RF-022] O menu da atendente tem Agenda, Atendimentos e Pacientes — nada de dinheiro",
    async () => {
      await conferirMenu(
        ["Agenda", "Atendimentos", "Pacientes"],
        [
          "Dashboard",
          "Consultórios",
          "Profissionais",
          "Equipe",
          "Financeiro",
          "Relatórios",
          "Auditoria",
          "Configurações",
        ],
      );
      await jornada.validar(
        menuLateral,
        "Atendente: 3 áreas. Ela marca, recebe e cadastra paciente — não vê Dashboard, Relatórios nem Financeiro.",
      );
    },
  );

  await sair(page, jornada);

  // =========================================================================
  // 5. PACIENTE — um portal só dela
  // =========================================================================

  await jornada.trocarPersona(
    ELENCO.paciente.persona,
    "A paciente não entra na clínica: ela entra no portal dela, onde só existem as consultas dela.",
  );
  await entrarComo(page, jornada, "paciente");

  await jornada.passo(
    "[RF-022] A paciente é levada ao portal do paciente, que é outro sistema",
    async () => {
      await expect(page).toHaveURL(/\/p$/);
      await jornada.validar(
        page.getByRole("heading", { name: /^Olá/ }),
        "Perfil PACIENTE: o destino do login é /p, o portal do paciente — nem passa pela área da clínica",
      );
    },
  );

  await jornada.passo(
    "[RF-022] O menu da paciente só tem as consultas dela e o cadastro dela",
    async () => {
      await conferirMenu(
        ["Início", "Minhas consultas", "Agendar consulta", "Meu perfil"],
        [
          "Dashboard",
          "Agenda",
          "Atendimentos",
          "Pacientes",
          "Consultórios",
          "Profissionais",
          "Equipe",
          "Financeiro",
          "Relatórios",
          "Auditoria",
          "Configurações",
        ],
      );
      await jornada.validar(
        menuLateral,
        "Paciente: 4 áreas, todas sobre ela. Nenhuma tela da clínica aparece no menu dela.",
      );
    },
  );

  await jornada.passo(
    "[RF-022] Maria tenta o relatório financeiro da clínica e o servidor recusa com 403",
    async () => {
      const resposta = await page.goto("/api/relatorios/financeiro");
      expect(resposta?.status(), "paciente em GET /api/relatorios/financeiro").toBe(
        403,
      );
      await jornada.validar(
        respostaDoServidor,
        'GET /api/relatorios/financeiro → 403 "Acesso negado para este perfil". O faturamento da clínica não é assunto da paciente.',
      );
    },
  );

  await jornada.passo(
    "[RF-022] E ela continua logada: a mesma sessão responde 200 no que é dela",
    async () => {
      const resposta = await page.goto("/api/auth/me");
      expect(resposta?.status(), "a sessão da paciente é válida").toBe(200);
      await jornada.validar(
        respostaDoServidor,
        "GET /api/auth/me → 200, mesma sessão, mesmo cookie. Confirma que o 403 anterior foi falta de permissão, e não falta de login.",
      );
      await page.goto("/p");
    },
  );

  await sair(page, jornada);

  await jornada.encerrar(
    "Mesma porta de entrada, cinco sistemas diferentes. " +
      "ADMINISTRADOR: a clínica inteira, com cadastros, financeiro e auditoria. " +
      "AUXILIAR: financeiro, relatórios e auditoria, sem os cadastros. " +
      "PROFISSIONAL: só a agenda e os atendimentos dela. " +
      "ATENDENTE: a agenda do dia, atendimentos e pacientes. " +
      "PACIENTE: um portal com as próprias consultas. " +
      "E quem está logado sem permissão recebe 403 — não vê o dado.",
  );
});
