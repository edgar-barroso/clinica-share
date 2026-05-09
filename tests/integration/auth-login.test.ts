import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(back-end)/_lib/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST as registerPost } from "@/app/(back-end)/api/auth/register/route";
import { POST as loginPost } from "@/app/(back-end)/api/auth/login/route";
import { prisma } from "@/lib/db";
import { cleanAuthData } from "../helpers/db";
import { jsonRequest } from "../helpers/request";

beforeEach(async () => {
  await cleanAuthData();
  // Cria um usuário para os testes de login
  await registerPost(
    jsonRequest("/api/auth/register", {
      nome: "Carlos Tester",
      email: "carlos@example.com",
      telefone: "11999990000",
      senha: "senha-forte-123",
    }),
  );
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

describe("POST /api/auth/login", () => {
  it("retorna user e seta cookie com credenciais corretas", async () => {
    const res = await loginPost(
      jsonRequest("/api/auth/login", {
        email: "carlos@example.com",
        senha: "senha-forte-123",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("carlos@example.com");
    expect(body.user.role).toBe("paciente");
    expect(res.cookies.get("auth-token")?.value).toBeTruthy();
  });

  it("rejeita senha errada com 401", async () => {
    const res = await loginPost(
      jsonRequest("/api/auth/login", {
        email: "carlos@example.com",
        senha: "senha-errada",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita e-mail inexistente com 401", async () => {
    const res = await loginPost(
      jsonRequest("/api/auth/login", {
        email: "nao-existe@example.com",
        senha: "qualquer-senha",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita payload inválido com 422", async () => {
    const res = await loginPost(
      jsonRequest("/api/auth/login", { email: "x", senha: "" }),
    );
    expect(res.status).toBe(422);
  });

  it("atualiza ultimoAcesso após login bem-sucedido", async () => {
    await loginPost(
      jsonRequest("/api/auth/login", {
        email: "carlos@example.com",
        senha: "senha-forte-123",
      }),
    );
    const user = await prisma.user.findUnique({ where: { email: "carlos@example.com" } });
    expect(user?.ultimoAcesso).toBeInstanceOf(Date);
  });
});
