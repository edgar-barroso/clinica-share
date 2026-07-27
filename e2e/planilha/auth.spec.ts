/**
 * COMPROVAÇÃO EM VÍDEO — bloco AUTENTICAÇÃO / SEGURANÇA (RF-021 a RF-026)
 * da planilha de custos (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * Um `test()` = um requisito = um vídeo (`video: "on"` no playwright.config.ts).
 *
 * REGRA DESTES SPECS: **não limpam o banco**. Rodam sobre o cenário da seed
 * (`npm run db:seed`) — ver `_helpers.ts`. O Prisma é usado aqui só para
 * inspecionar/envelhecer registros pontuais (RF-024) e ler o token de reset
 * (RF-026); nenhuma linha da seed é apagada, e nenhuma senha da seed é
 * trocada (RF-026 usa uma conta descartável criada pelo próprio teste).
 *
 * Rodar isolado — os specs de `e2e/*.spec.ts` (raiz) fazem `deleteMany` no
 * `beforeAll` e apagariam a seed antes destes rodarem:
 *   npx playwright test e2e/planilha
 */
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// Sem isto DATABASE_URL/ADMIN_* ficam undefined no processo de teste.
import "dotenv/config";
import { login, irPara, mostrar, CONTAS, type Perfil } from "./_helpers";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

/** Mesma fonte de verdade do servidor (`lib/session-idle.ts`), default 30min. */
const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES ?? 30) || 30;

// ---------------------------------------------------------------------------
// Tipos e helpers
// ---------------------------------------------------------------------------

interface MeResponse {
  user: {
    id: string;
    email: string;
    role: string;
    profissionalId: string | null;
    pacienteId: string | null;
    staffId: string | null;
  };
}

interface ProfissionalApi {
  id: string;
  nome: string;
  email: string;
}

interface AtendimentoApi {
  id: string;
  profissionalId: string;
  data: string;
  hora: string;
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
}

interface RepasseApi {
  id: string;
  status: "aberto" | "pago";
  valorRepasse: string;
}

async function getJson<T>(page: Page, url: string): Promise<T> {
  const res = await page.request.get(url);
  expect(res.status(), `GET ${url}`).toBe(200);
  return (await res.json()) as T;
}

async function meuUsuario(page: Page): Promise<MeResponse["user"]> {
  return (await getJson<MeResponse>(page, "/api/auth/me")).user;
}

/**
 * O token de reset é gravado em `User.passwordResetToken` ANTES da tentativa
 * de envio do e-mail — por isso a comprovação não depende de SMTP acessível
 * no ambiente de gravação.
 */
async function esperarTokenDeReset(email: string, timeoutMs = 20_000): Promise<string> {
  const limite = Date.now() + timeoutMs;
  while (Date.now() < limite) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.passwordResetToken) return user.passwordResetToken;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`passwordResetToken não foi gravado para ${email}`);
}

// ===========================================================================
// RF-021 — Autenticação com e-mail e senha
// ===========================================================================

test("RF-021 — autenticação com e-mail e senha", async ({ page }) => {
  // 1) Credencial errada é recusada na tela e o usuário fica no /login.
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(CONTAS.admin.email);
  await page.getByLabel("Senha").fill("senha-propositalmente-errada");
  await mostrar(page);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page.getByText("E-mail ou senha inválidos")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await mostrar(page);

  // 2) A API responde 401 e NÃO distingue "senha errada" de "e-mail
  //    inexistente" — mesma mensagem nos dois casos (evita enumerar usuários).
  const senhaErrada = await page.request.post("/api/auth/login", {
    data: { email: CONTAS.admin.email, senha: "outra-senha-errada" },
  });
  const emailInexistente = await page.request.post("/api/auth/login", {
    data: {
      email: `nao-existe-${Date.now()}@clinicashare.local`,
      senha: "qualquer-coisa",
    },
  });
  expect(senhaErrada.status()).toBe(401);
  expect(emailInexistente.status()).toBe(401);
  const erroSenha = (await senhaErrada.json()) as { error: string };
  const erroEmail = (await emailInexistente.json()) as { error: string };
  expect(erroSenha.error).toBe("E-mail ou senha inválidos");
  expect(erroEmail.error).toBe(erroSenha.error);

  // 3) Credencial correta autentica e a sessão passa a existir no servidor.
  await login(page, "admin");
  await expect(page.getByRole("heading", { name: /^Dashboard$/ })).toBeVisible();
  const user = await meuUsuario(page);
  expect(user.email).toBe(CONTAS.admin.email);
  expect(user.role).toBe("admin");
  await mostrar(page);
});

// ===========================================================================
// RF-022 — Controle de acesso por perfil
// ===========================================================================

test("RF-022 — controle de acesso por perfil (5 perfis + 403 em rota restrita)", async ({
  page,
}) => {
  const perfis: { perfil: Perfil; role: string; url: RegExp }[] = [
    { perfil: "admin", role: "admin", url: /\/dashboard$/ },
    { perfil: "auxiliar", role: "auxiliar", url: /\/dashboard$/ },
    { perfil: "profissional", role: "profissional", url: /\/dashboard$/ },
    { perfil: "atendente", role: "atendente", url: /\/agenda$/ },
    { perfil: "paciente", role: "paciente", url: /\/p$/ },
  ];

  for (const { perfil, role, url } of perfis) {
    // O helper `login` já espera o redirect por perfil (lib/auth-client.ts).
    await login(page, perfil);
    await expect(page, `destino de ${perfil}`).toHaveURL(url);
    const user = await meuUsuario(page);
    expect(user.role, `role de ${perfil}`).toBe(role);
    await mostrar(page, 800);

    if (perfil === "admin") {
      // Contraste positivo: o admin enxerga a trilha de auditoria.
      await expect(page.getByRole("link", { name: "Auditoria" })).toBeVisible();
    }

    if (perfil === "profissional") {
      // Profissional não tem a auditoria nem no menu nem na API.
      await expect(page.getByRole("link", { name: "Auditoria" })).toHaveCount(0);
      const auditoria = await page.request.get("/api/auditoria");
      expect(auditoria.status(), "profissional em /api/auditoria").toBe(403);
      expect(((await auditoria.json()) as { error: string }).error).toMatch(
        /Acesso negado/i,
      );
    }

    if (perfil === "paciente") {
      // Paciente autenticado, porém sem permissão no relatório financeiro.
      const relatorio = await page.request.get("/api/relatorios/financeiro");
      expect(relatorio.status(), "paciente em /api/relatorios/financeiro").toBe(403);
      // 403 (autenticado, sem permissão) ≠ 401 (não autenticado): a sessão
      // do paciente é válida, o que falta é o perfil.
      const proprioPortal = await page.request.get("/api/auth/me");
      expect(proprioPortal.status()).toBe(200);
    }
  }
  await mostrar(page);
});

// ===========================================================================
// RF-023 — Profissional não acessa dados de outro profissional
// ===========================================================================

test("RF-023 — profissional não acessa agenda/dados de outro profissional", async ({
  page,
}) => {
  // Como admin, localiza um atendimento que pertence a OUTRO profissional.
  await login(page, "admin");
  const { profissionais } = await getJson<{ profissionais: ProfissionalApi[] }>(
    page,
    "/api/profissionais?ativo=all",
  );
  const prof1 = profissionais.find((p) => p.email === CONTAS.profissional.email);
  // prof2 não tem conta em CONTAS — é só "o outro profissional" desta prova.
  const outro = profissionais.find((p) => p.email === "prof2@clinicashare.local");
  if (!prof1 || !outro) {
    throw new Error("seed sem prof1/prof2 — rode 'npm run db:seed'");
  }

  const { atendimentos } = await getJson<{ atendimentos: AtendimentoApi[] }>(
    page,
    `/api/atendimentos?profissionalId=${outro.id}`,
  );
  const atendimentoAlheio = atendimentos[0];
  expect(atendimentoAlheio, `${outro.nome} precisa ter atendimentos`).toBeTruthy();

  // Agora como a profissional prof1.
  await login(page, "profissional");
  const user = await meuUsuario(page);
  expect(user.profissionalId).toBe(prof1.id);
  await irPara(page, "/atendimentos", /^Meus atendimentos$/);

  // 1) O scoping é do SERVIDOR: mesmo pedindo explicitamente a agenda de
  //    outro profissional, o filtro é sobrescrito e só vêm os próprios.
  const { agendamentos } = await getJson<{ agendamentos: AtendimentoApi[] }>(
    page,
    `/api/agendamentos?profissionalId=${outro.id}`,
  );
  expect(agendamentos.length, "prof1 tem agenda própria na seed").toBeGreaterThan(0);
  expect(agendamentos.every((a) => a.profissionalId === prof1.id)).toBe(true);
  expect(agendamentos.some((a) => a.profissionalId === outro.id)).toBe(false);
  await mostrar(page);

  // 2) Detalhe de atendimento alheio → 403.
  const alheio = await page.request.get(`/api/atendimentos/${atendimentoAlheio.id}`);
  expect(alheio.status(), "atendimento de outro profissional").toBe(403);
  expect(((await alheio.json()) as { error: string }).error).toMatch(
    /atendimentos atribuídos a você/i,
  );

  // 3) Contraste: o próprio atendimento continua acessível (200).
  const proprio = await page.request.get(`/api/atendimentos/${agendamentos[0].id}`);
  expect(proprio.status(), "atendimento próprio").toBe(200);
  await mostrar(page);
});

// ===========================================================================
// RF-024 — Encerramento automático de sessão após inatividade
// ===========================================================================

test("RF-024 — encerramento de sessão: logout real e janela de inatividade", async ({
  page,
}) => {
  // ---- PARTE 1: o botão "Sair" faz logout de verdade ----------------------
  // (bug recém-corrigido: antes limpava só o localStorage e o cookie
  // `auth-token` continuava válido — voltar ao /dashboard re-autenticava.)
  await login(page, "admin");
  await page.getByRole("button", { name: "Menu do usuário" }).click();
  await mostrar(page, 600);
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL("**/login", { timeout: 20_000 });
  await mostrar(page);

  // Voltar para uma rota privada agora cai no /login (proxy barra no Edge).
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  const semSessao = await page.request.get("/api/auth/me");
  expect(semSessao.status(), "cookie foi de fato invalidado").toBe(401);
  await mostrar(page);

  // ---- PARTE 2: janela de inatividade (SESSION_IDLE_MINUTES) --------------
  // A janela real é de 30min com sliding expiration (o proxy reassina o
  // cookie a cada request). Para comprovar sem esperar 30 minutos,
  // envelhecemos o backstop do banco (`User.ultimoAcesso`) e mantemos o
  // MESMO cookie — que continua criptograficamente válido.
  await login(page, "admin");
  const antes = await page.request.get("/api/auth/me");
  expect(antes.status(), "sessão viva antes do envelhecimento").toBe(200);
  await mostrar(page);

  const envelhecido = new Date(Date.now() - (IDLE_MINUTES + 1) * 60_000);
  await prisma.user.update({
    where: { email: CONTAS.admin.email },
    data: { ultimoAcesso: envelhecido },
  });

  // Mesmo cookie, mesma aba: o servidor recusa porque o heartbeat estourou
  // a janela. `/api/auth/me` passa por `requireUser`/`getUserFromRequest`,
  // que é onde o backstop de banco é validado.
  const depois = await page.request.get("/api/auth/me");
  expect(depois.status(), "sessão inativa deve ser 401").toBe(401);
  expect(((await depois.json()) as { error: string }).error).toMatch(
    /Não autenticado/i,
  );

  // Fronteira honesta do mecanismo: rotas que usam apenas `requireRole` não
  // consultam o banco, então elas seguem respondendo enquanto o JWT do
  // cookie não expira por conta própria. O backstop de `ultimoAcesso` só
  // atua nas rotas que fazem lookup do User (`requireUser`).
  const soRequireRole = await page.request.get("/api/consultorios");
  expect(soRequireRole.status()).toBe(200);

  // A tela reflete a queda: o boot do RoleProvider recebe 401 em /api/auth/me
  // e o usuário deixa de ser reconhecido pela aplicação.
  await page.goto("/dashboard");
  await mostrar(page);
});

// ===========================================================================
// RF-025 — Registro do user_id em todo audit log financeiro
// ===========================================================================

test("RF-025 — audit log financeiro registra o user_id de quem agiu", async ({
  page,
}) => {
  await login(page, "admin");
  const user = await meuUsuario(page);

  await irPara(page, "/financeiro/repasses", /^Repasses$/);
  const { repasses } = await getJson<{ repasses: RepasseApi[] }>(
    page,
    "/api/repasses?status=aberto",
  );
  const alvo = repasses[0];
  if (!alvo) {
    throw new Error("seed sem repasse em aberto — rode 'npm run db:seed'");
  }

  // 1) Mutação financeira: marcar repasse como pago.
  const motivo = `Pagamento conferido em conta — comprovação RF-025 #${Date.now()}`;
  const marcarPago = await page.request.post(
    `/api/repasses/${alvo.id}/marcar-pago`,
    { data: { motivo } },
  );
  expect(marcarPago.status(), "POST /marcar-pago").toBe(200);

  // 2) O AuditLog gerado carrega o userId do autenticado (não um "sistema").
  const { logs } = await getJson<{ logs: AuditLogApi[] }>(
    page,
    `/api/auditoria?entidade=Repasse&entidadeId=${alvo.id}`,
  );
  const log = logs.find((l) => l.campo === "status" && l.motivo === motivo);
  if (!log) throw new Error("audit log do pagamento não foi gravado");
  expect(log.userId, "AuditLog.userId deve ser o do usuário autenticado").toBe(
    user.id,
  );
  expect(log.userNome.length).toBeGreaterThan(0);
  expect(log.valorAntes).toBe("aberto");
  expect(log.valorDepois).toBe("pago");

  // 3) A regra vale para a trilha inteira: todo log tem userId preenchido.
  const { logs: todos } = await getJson<{ logs: AuditLogApi[] }>(
    page,
    "/api/auditoria",
  );
  expect(todos.length).toBeGreaterThan(0);
  expect(todos.every((l) => typeof l.userId === "string" && l.userId.length > 0)).toBe(
    true,
  );

  // 4) E a trilha é visível em /auditoria (admin/auxiliar).
  await irPara(page, "/auditoria", /^Auditoria$/);
  await page.getByLabel("Entidade").selectOption("Repasse");
  await expect(page.getByText(motivo)).toBeVisible();
  await mostrar(page);

  // 5) RESSALVA HONESTA (constatada na auditoria e comprovada abaixo):
  //    a cobertura de audit log NÃO é total no fluxo financeiro. O usecase
  //    `gerarRepasse` e o cron semanal `POST /api/cron/gerar-repasses` criam
  //    Repasse SEM gravar AuditLog — a única mutação de repasse auditada é o
  //    pagamento. Por isso, abaixo, todos os logs deste repasse são do campo
  //    "status": não existe nenhum registro de quem/quando o repasse foi
  //    gerado (o cron, aliás, roda sem usuário — autenticado por Bearer
  //    secret —, o que exigiria um "usuário sistema" para satisfazer RF-025).
  const { logs: doRepasse } = await getJson<{ logs: AuditLogApi[] }>(
    page,
    `/api/auditoria?entidadeId=${alvo.id}`,
  );
  expect(doRepasse.every((l) => l.campo === "status")).toBe(true);
});

// ===========================================================================
// RF-026 — Recuperação de senha via e-mail
// ===========================================================================

test("RF-026 — recuperação de senha via e-mail (fluxo completo)", async ({
  page,
}) => {
  // Conta DESCARTÁVEL: trocar a senha de uma conta da seed quebraria todos os
  // outros vídeos (que logam com a senha demo). O teste cria a sua própria.
  const email = `rf026-${Date.now()}@example.com`;
  const senhaInicial = "SenhaInicial123";
  const novaSenha = "NovaSenha2026";

  const registro = await page.request.post("/api/auth/register", {
    data: {
      nome: "Paciente Recuperação E2E",
      email,
      telefone: "11999990000",
      senha: senhaInicial,
    },
  });
  expect(registro.status(), "POST /api/auth/register").toBe(201);

  // O register já emite cookie de sessão; descartamos para filmar a
  // recuperação do ponto de vista de quem está deslogado.
  await page.context().clearCookies();

  // 1) Pedido de recuperação.
  //    (CardTitle renderiza <div>, não heading — por isso getByText.)
  await page.goto("/esqueci-senha");
  await expect(page.getByText("Recuperar senha")).toBeVisible();
  await page.getByLabel("E-mail cadastrado").fill(email);
  await mostrar(page);
  await page.getByRole("button", { name: "Enviar instruções" }).click();

  // 2) O token é persistido em `User.passwordResetToken` (é o mesmo token que
  //    vai no link do e-mail). A gravação acontece ANTES do envio SMTP, então
  //    a comprovação não depende de e-mail configurado no ambiente.
  const token = await esperarTokenDeReset(email);
  expect(token.length).toBeGreaterThan(20);
  await mostrar(page);

  // 3) Abre o link recebido e define a nova senha (≥8 chars, 1 maiúscula, 1 número).
  await page.goto(
    `/redefinir-senha?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
  );
  await expect(page.getByText("Criar nova senha")).toBeVisible();
  await page.getByLabel("Nova senha", { exact: true }).fill(novaSenha);
  await page.getByLabel("Confirmar nova senha").fill(novaSenha);
  await expect(page.getByText("Pelo menos 8 caracteres")).toBeVisible();
  await expect(page.getByText("1 letra maiúscula")).toBeVisible();
  await expect(page.getByText("1 número")).toBeVisible();
  await expect(page.getByText("Senhas coincidem")).toBeVisible();
  await mostrar(page);
  await page.getByRole("button", { name: "Redefinir senha" }).click();
  await page.waitForURL("**/login", { timeout: 20_000 });
  await mostrar(page);

  // 4) A nova senha funciona no login (destino de paciente = /p).
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(novaSenha);
  await Promise.all([
    page.waitForURL("**/p", { timeout: 20_000 }),
    page.getByRole("button", { name: /^Entrar$/ }).click(),
  ]);
  await mostrar(page);

  // 5) O token é de uso único: foi limpo do banco após a redefinição.
  const usuario = await prisma.user.findUnique({ where: { email } });
  expect(usuario?.passwordResetToken).toBeNull();
  expect(usuario?.passwordResetTokenExpiresAt).toBeNull();

  // E a senha antiga não vale mais.
  const senhaAntiga = await page.request.post("/api/auth/login", {
    data: { email, senha: senhaInicial },
  });
  expect(senhaAntiga.status(), "senha antiga deve ser rejeitada").toBe(401);
});
