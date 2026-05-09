import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(back-end)/_lib/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
}));

vi.mock("@/app/(back-end)/_lib/google-verify", () => ({
  verifyGoogleIdToken: verifyMock,
}));

import { POST } from "@/app/(back-end)/api/auth/google/route";
import { POST as registerPost } from "@/app/(back-end)/api/auth/register/route";
import { ProvedorGoogleInvalido } from "@/app/(back-end)/_lib/errors";
import { prisma } from "@/lib/db";
import { cleanAuthData, findUserByEmail } from "../helpers/db";
import { jsonRequest } from "../helpers/request";

beforeEach(async () => {
  await cleanAuthData();
  verifyMock.mockReset();
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

describe("POST /api/auth/google", () => {
  it("cria User+Paciente quando Google user é novo", async () => {
    verifyMock.mockResolvedValue({
      googleId: "google-sub-123",
      email: "novo@gmail.com",
      name: "Novo Usuário",
      picture: "https://lh3.googleusercontent.com/foo",
    });

    const res = await POST(
      jsonRequest("/api/auth/google", { idToken: "fake-id-token" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("novo@gmail.com");
    expect(body.user.role).toBe("paciente");
    expect(body.user.paciente?.nome).toBe("Novo Usuário");

    const persisted = await findUserByEmail("novo@gmail.com");
    expect(persisted?.googleId).toBe("google-sub-123");
  });

  it("vincula googleId a User existente que tem mesmo e-mail", async () => {
    // Cria via /register (sem googleId)
    await registerPost(
      jsonRequest("/api/auth/register", {
        nome: "Existente",
        email: "existente@gmail.com",
        telefone: "11999990000",
        senha: "senha-forte-123",
      }),
    );

    verifyMock.mockResolvedValue({
      googleId: "google-sub-456",
      email: "existente@gmail.com",
      name: "Existente",
    });

    const res = await POST(
      jsonRequest("/api/auth/google", { idToken: "fake-id-token-2" }),
    );

    expect(res.status).toBe(200);
    const persisted = await findUserByEmail("existente@gmail.com");
    expect(persisted?.googleId).toBe("google-sub-456");
    // passwordHash original mantido
    expect(persisted?.passwordHash).toBeTruthy();
  });

  it("rejeita idToken inválido com 401", async () => {
    verifyMock.mockRejectedValue(new ProvedorGoogleInvalido());

    const res = await POST(
      jsonRequest("/api/auth/google", { idToken: "token-invalido" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita payload sem idToken com 422", async () => {
    const res = await POST(jsonRequest("/api/auth/google", {}));
    expect(res.status).toBe(422);
  });
});
