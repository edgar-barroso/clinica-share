/**
 * Jornada 14 — A paciente esqueceu a senha e volta a entrar sozinha.
 * Cobre: [RF-026] (e [RF-021] no login com a senha nova).
 * Persona: PACIENTE · Maria Silva.
 *
 * CONTA DESCARTÁVEL, DE PROPÓSITO: esta jornada TROCA uma senha. Se ela mexesse
 * numa conta da seed, todas as outras jornadas — que entram com a senha de
 * demonstração — quebrariam na gravação seguinte. Por isso o vídeo acompanha
 * uma paciente recém-cadastrada, criada no início do próprio teste, com nome
 * "Maria Silva" e e-mail exclusivo desta execução.
 *
 * O "e-mail que chegou" é lido de `User.passwordResetToken`, gravado no banco
 * ANTES da tentativa de envio SMTP — assim a comprovação não depende de haver
 * servidor de e-mail no ambiente de gravação. O token é o mesmo que iria no
 * link. A leitura é só isso: leitura. O login continua sendo pela tela.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { test, expect, ELENCO, entrarPelaTela } from "./_support";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

test.afterAll(async () => {
  await prisma.$disconnect();
});

const EMAIL = `maria.silva.${Date.now()}@example.com`;
/** A senha que Maria esqueceu. */
const SENHA_ESQUECIDA = "Consulta2026";
/** A senha nova: ≥8 caracteres, 1 maiúscula e 1 número, como a tela exige. */
const SENHA_NOVA = "Girassol2027";

/**
 * O token é gravado no banco durante o POST /api/auth/forgot-password. A tela
 * confirma o pedido antes de o backend terminar, então esperamos aparecer.
 */
async function esperarLinkDoEmail(email: string, timeoutMs = 20_000) {
  const limite = Date.now() + timeoutMs;
  while (Date.now() < limite) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.passwordResetToken) return user.passwordResetToken;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`passwordResetToken não foi gravado para ${email}`);
}

test("14 — Paciente recupera a senha esquecida", async ({ page, jornada }) => {
  test.setTimeout(240_000);

  // Bastidor: a paciente recém-cadastrada desta gravação.
  const cadastro = await page.request.post("/api/auth/register", {
    data: {
      nome: "Maria Silva",
      email: EMAIL,
      telefone: "11988887766",
      senha: SENHA_ESQUECIDA,
    },
  });
  expect(cadastro.status(), "POST /api/auth/register").toBe(201);
  // O cadastro já emite cookie de sessão. A jornada precisa começar de fora,
  // como quem não consegue entrar — então a sessão do cadastro é descartada.
  await page.context().clearCookies();

  await jornada.abrir({
    persona: ELENCO.paciente.persona,
    objetivo:
      "Maria criou a conta dela no portal, esqueceu a senha e quer voltar a entrar sem depender de ninguém da clínica.",
    ids: ["RF-026"],
    precondicoes: [
      "Maria é paciente e tem conta no portal, com este e-mail",
      "A clínica não guarda a senha em texto: nem o suporte consegue lê-la para ela",
      "A recuperação exige provar o acesso ao e-mail cadastrado",
    ],
  });

  await jornada.passo(
    "[RF-026] Maria abre a recuperação de senha a partir do login",
    async () => {
      await page.goto("/esqueci-senha");
      await jornada.validar(
        page.getByText("Recuperar senha", { exact: true }),
        "A recuperação é pública: quem não consegue entrar precisa chegar aqui sem estar logado",
      );
    },
  );

  await jornada.passo(
    "[RF-026] Maria informa o e-mail cadastrado e pede as instruções",
    async () => {
      await page.getByLabel("E-mail cadastrado").fill(EMAIL);
      await page.getByRole("button", { name: "Enviar instruções" }).click();
      await jornada.validar(
        page.getByText(/receberá um link/i),
        "O sistema confirma o pedido sem dizer se o e-mail existe — quem não é dono da conta não descobre nada",
      );
    },
  );

  const token = await esperarLinkDoEmail(EMAIL);
  expect(token.length, "o link do e-mail precisa carregar um token").toBeGreaterThan(
    20,
  );

  await jornada.passo(
    "[RF-026] Maria abre o link que chegou no e-mail dela",
    async () => {
      await page.goto(
        `/redefinir-senha?token=${encodeURIComponent(token)}&email=${encodeURIComponent(EMAIL)}`,
      );
      await jornada.validar(
        page.getByText("Criar nova senha", { exact: true }),
        "O link vale 30 minutos e é pessoal: sem o token do e-mail, esta tela não deixa redefinir nada",
      );
    },
  );

  await jornada.passo(
    "[RF-026] Maria escolhe uma senha nova, dentro das regras da clínica",
    async () => {
      await page.getByLabel("Nova senha", { exact: true }).fill(SENHA_NOVA);
      await page.getByLabel("Confirmar nova senha").fill(SENHA_NOVA);
      await jornada.validar(
        page.getByRole("list").filter({ hasText: "Pelo menos 8 caracteres" }),
        "As quatro regras ficam verdes: 8 caracteres ou mais, 1 letra maiúscula, 1 número e confirmação igual",
      );
    },
  );

  await jornada.passo("[RF-026] Maria confirma a nova senha", async () => {
    await page.getByRole("button", { name: "Redefinir senha" }).click();
    await page.waitForURL("**/login", { timeout: 20_000 });
    await jornada.validar(
      page.getByText("Acessar minha conta", { exact: true }),
      "Senha trocada: o sistema devolve Maria à tela de login para entrar com a senha que ela acabou de criar",
    );
  });

  await entrarPelaTela(
    page,
    jornada,
    {
      nome: "Maria Silva",
      email: EMAIL,
      senha: SENHA_NOVA,
      destino: "**/p",
    },
    "[RF-026] Maria entra no portal com a senha nova",
  );

  await jornada.passo(
    "[RF-026] Maria está de volta ao portal dela, por conta própria",
    async () => {
      await expect(page).toHaveURL(/\/p$/);
      await jornada.validar(
        page.getByRole("heading", { name: /^Olá/ }),
        "Recuperação concluída sem ninguém da clínica ver ou digitar a senha de Maria",
      );
    },
  );

  await jornada.passo(
    "[RF-026] A senha antiga foi invalidada e o link é de uso único",
    async () => {
      const tentativaAntiga = await page.request.post("/api/auth/login", {
        data: { email: EMAIL, senha: SENHA_ESQUECIDA },
      });
      expect(
        tentativaAntiga.status(),
        "a senha esquecida não pode mais valer",
      ).toBe(401);

      const usuario = await prisma.user.findUnique({ where: { email: EMAIL } });
      expect(
        usuario?.passwordResetToken,
        "o link de recuperação é de uso único",
      ).toBeNull();
      expect(usuario?.passwordResetTokenExpiresAt).toBeNull();

      await jornada.validar(
        page.getByRole("heading", { name: /^Olá/ }),
        "A senha antiga foi recusada (401) e o link do e-mail já não serve para mais nada: só a senha nova entra",
      );
    },
  );

  await jornada.encerrar(
    "Maria voltou a entrar no portal com uma senha escolhida por ela: pediu pela tela, provou o acesso ao e-mail, " +
      "definiu a nova senha dentro das regras (8+ caracteres, 1 maiúscula, 1 número) e entrou. " +
      "A senha antiga foi recusada com 401 e o link de recuperação, usado uma vez, deixou de valer.",
  );
});
