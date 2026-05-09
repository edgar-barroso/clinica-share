import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Mock do mailer ANTES de importar usecases que dependem dele
vi.mock("@/app/(back-end)/_lib/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/(back-end)/api/auth/register/route";
import { prisma } from "@/lib/db";
import { cleanAuthData, findUserByEmail } from "../helpers/db";
import { jsonRequest } from "../helpers/request";

beforeEach(async () => {
  await cleanAuthData();
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("cria User+Paciente com role=paciente e seta cookie", async () => {
    const res = await POST(
      jsonRequest("/api/auth/register", {
        nome: "Maria da Silva",
        email: "maria@example.com",
        telefone: "(11) 99999-0000",
        senha: "senha-forte-123",
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("maria@example.com");
    expect(body.user.role).toBe("paciente");
    expect(body.user.paciente?.nome).toBe("Maria da Silva");

    const cookie = res.cookies.get("auth-token");
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);

    const persisted = await findUserByEmail("maria@example.com");
    expect(persisted).not.toBeNull();
    expect(persisted?.passwordHash).toBeTruthy();
    expect(persisted?.passwordHash).not.toBe("senha-forte-123");
  });

  it("rejeita e-mail duplicado com 409", async () => {
    await POST(
      jsonRequest("/api/auth/register", {
        nome: "João",
        email: "joao@example.com",
        telefone: "11988887777",
        senha: "senha12345",
      }),
    );

    const res = await POST(
      jsonRequest("/api/auth/register", {
        nome: "Outro João",
        email: "joao@example.com",
        telefone: "11988887777",
        senha: "outrasenha1",
      }),
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/já cadastrado/i);
  });

  it("rejeita senha curta com 422", async () => {
    const res = await POST(
      jsonRequest("/api/auth/register", {
        nome: "Ana",
        email: "ana@example.com",
        telefone: "11999990000",
        senha: "abc",
      }),
    );
    expect(res.status).toBe(422);
  });

  it("rejeita e-mail inválido com 422", async () => {
    const res = await POST(
      jsonRequest("/api/auth/register", {
        nome: "Ana",
        email: "nao-eh-email",
        telefone: "11999990000",
        senha: "senha-forte-123",
      }),
    );
    expect(res.status).toBe(422);
  });
});
