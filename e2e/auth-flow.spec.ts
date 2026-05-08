import { test, expect } from "@playwright/test";
import { cleanAuthData, disconnect, getResetToken } from "./helpers/db";

const EMAIL = `e2e-${Date.now()}@example.com`;
const SENHA_INICIAL = "Senha-forte-123";
const NOVA_SENHA = "Nova-senha-456";

test.beforeAll(async () => {
  await cleanAuthData();
});

test.afterAll(async () => {
  await cleanAuthData();
  await disconnect();
});

test.describe("Auth flow E2E", () => {
  test("registra → /me → logout → login → forgot/reset → login com nova senha", async ({
    page,
  }) => {
    // page.request herda cookies do browser context (request fixture é isolado)
    const request = page.request;
    // 1) Cadastro
    await page.goto("/cadastrar");
    await page.getByLabel("Nome completo").fill("E2E Tester");
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Celular com WhatsApp").fill("11988887777");
    await page.getByLabel("Senha").fill(SENHA_INICIAL);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Criar conta/i }).click();
    await page.waitForURL("**/p", { timeout: 15_000 });

    // 2) /api/auth/me reflete usuário logado
    let me = await request.get("/api/auth/me");
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.user.email).toBe(EMAIL);
    expect(meBody.user.role).toBe("paciente");

    // 3) Logout via API e /me passa a 401
    const logout = await request.post("/api/auth/logout");
    expect(logout.status()).toBe(200);
    me = await request.get("/api/auth/me");
    expect(me.status()).toBe(401);

    // 4) Login pela UI
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha").fill(SENHA_INICIAL);
    await page.getByRole("button", { name: /^Entrar$/ }).click();
    await page.waitForURL("**/p", { timeout: 15_000 });

    // 5) Forgot password — submete e lê token direto do DB (proxy de "abrir e-mail")
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail cadastrado").fill(EMAIL);
    await page.getByRole("button", { name: /Enviar instru/i }).click();
    await expect(page.getByText(/receberá um link/i)).toBeVisible();

    const token = await getResetToken(EMAIL);
    expect(token).toBeTruthy();

    // 6) Reset via página redefinir-senha
    await page.goto(
      `/redefinir-senha?token=${encodeURIComponent(token!)}&email=${encodeURIComponent(EMAIL)}`,
    );
    await page.getByLabel("Nova senha", { exact: true }).fill(NOVA_SENHA);
    await page.getByLabel("Confirmar nova senha").fill(NOVA_SENHA);
    await page.getByRole("button", { name: /Redefinir senha/i }).click();
    await page.waitForURL("**/login", { timeout: 15_000 });

    // 7) Login com nova senha
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha").fill(NOVA_SENHA);
    await page.getByRole("button", { name: /^Entrar$/ }).click();
    await page.waitForURL("**/p", { timeout: 15_000 });

    // 8) Senha antiga deve falhar
    await request.post("/api/auth/logout");
    const tentativaAntiga = await request.post("/api/auth/login", {
      data: { email: EMAIL, senha: SENHA_INICIAL },
    });
    expect(tentativaAntiga.status()).toBe(401);
  });
});
