/**
 * Garante que o proxy do Next 16 (proxy.ts) bloqueia rotas API
 * privadas no Edge antes de chegar nos handlers. Defense-in-depth:
 * mesmo que requireRole/requireUser falhe, o proxy protege.
 */
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = `admin-proxy-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "proxy-12345";

test.beforeAll(async () => {
  await prisma.repasse.deleteMany();
  await prisma.atendimento.deleteMany();
  await prisma.turnoFixo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.consultorio.deleteMany();

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Proxy auth — rotas API", () => {
  test("rota privada sem cookie → 401 (bloqueada pelo proxy)", async ({
    request,
  }) => {
    const res = await request.get("/api/agendamentos");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/autenticado/i);
  });

  test("rota privada com cookie inválido → 401", async ({ request }) => {
    const res = await request.get("/api/agendamentos", {
      headers: { Cookie: "auth-token=token-fake-quebrado" },
    });
    expect(res.status()).toBe(401);
  });

  test("rota privada com JWT válido → passa pelo proxy", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 15_000 }),
      page.getByRole("button", { name: /^Entrar$/ }).click(),
    ]);

    // Após login, page.request herda o cookie
    const res = await page.request.get("/api/agendamentos");
    expect(res.status()).toBe(200);
  });

  test("rotas auth públicas continuam acessíveis sem cookie", async ({
    request,
  }) => {
    // GET /api/auth/me sem cookie → 401 (handler decide), mas proxy
    // deve deixar passar (rota está na publicApiRoutes)
    const meRes = await request.get("/api/auth/me");
    expect(meRes.status()).toBe(401);
    const meBody = await meRes.json();
    // Mensagem do handler, não do proxy
    expect(meBody.error).not.toMatch(/Sessão expirada/);

    // POST /api/auth/login sem cookie → 422 (Zod valida payload), prova
    // que o proxy não bloqueou — chegou no handler
    const loginRes = await request.post("/api/auth/login", {
      data: {},
    });
    expect([422, 400]).toContain(loginRes.status());
  });

  test("rota privada com método errado é bloqueada", async ({ request }) => {
    // /api/auth/login só é público em POST. GET deve cair como protegido.
    // Sem cookie: 401 do proxy.
    const res = await request.get("/api/auth/login");
    // Pode ser 401 (proxy) ou 405 (Method Not Allowed). Ambos sao OK.
    expect([401, 405]).toContain(res.status());
  });
});

test.describe("Proxy auth — páginas", () => {
  test("/dashboard sem cookie redireciona pra /login com callbackUrl", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login\?callbackUrl=/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("callbackUrl=%2Fdashboard");
  });

  test("/login renderiza sem cookie (público)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });
});
