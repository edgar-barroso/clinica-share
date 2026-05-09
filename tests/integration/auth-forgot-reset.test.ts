import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { sendResetSpy } = vi.hoisted(() => ({
  sendResetSpy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/(back-end)/_lib/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  sendResetPasswordEmail: sendResetSpy,
}));

import { POST as registerPost } from "@/app/(back-end)/api/auth/register/route";
import { POST as forgotPost } from "@/app/(back-end)/api/auth/forgot-password/route";
import { POST as resetPost } from "@/app/(back-end)/api/auth/reset-password/route";
import { POST as loginPost } from "@/app/(back-end)/api/auth/login/route";
import { prisma } from "@/lib/db";
import { cleanAuthData } from "../helpers/db";
import { jsonRequest } from "../helpers/request";

beforeEach(async () => {
  await cleanAuthData();
  sendResetSpy.mockClear();
  await registerPost(
    jsonRequest("/api/auth/register", {
      nome: "Reset Test",
      email: "reset@example.com",
      telefone: "11999990000",
      senha: "senha-original-123",
    }),
  );
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

describe("POST /api/auth/forgot-password + reset-password", () => {
  it("forgot persiste token, envia e-mail e reset funciona", async () => {
    const forgotRes = await forgotPost(
      jsonRequest("/api/auth/forgot-password", { email: "reset@example.com" }),
    );
    expect(forgotRes.status).toBe(200);
    expect(sendResetSpy).toHaveBeenCalledOnce();

    const user = await prisma.user.findUnique({ where: { email: "reset@example.com" } });
    expect(user?.passwordResetToken).toBeTruthy();
    expect(user?.passwordResetTokenExpiresAt).toBeInstanceOf(Date);

    const tokenPersistido = user!.passwordResetToken!;

    // Argumento passado para o mailer também tem o token
    const callArg = sendResetSpy.mock.calls[0]?.[0];
    expect(callArg.token).toBe(tokenPersistido);
    expect(callArg.to).toBe("reset@example.com");

    // Reset com token válido
    const resetRes = await resetPost(
      jsonRequest("/api/auth/reset-password", {
        email: "reset@example.com",
        token: tokenPersistido,
        novaSenha: "nova-senha-987",
      }),
    );
    expect(resetRes.status).toBe(200);

    // Token deve ser limpo
    const afterReset = await prisma.user.findUnique({ where: { email: "reset@example.com" } });
    expect(afterReset?.passwordResetToken).toBeNull();
    expect(afterReset?.passwordResetTokenExpiresAt).toBeNull();

    // Login com nova senha funciona
    const loginRes = await loginPost(
      jsonRequest("/api/auth/login", {
        email: "reset@example.com",
        senha: "nova-senha-987",
      }),
    );
    expect(loginRes.status).toBe(200);

    // Senha antiga não funciona mais
    const loginAntigo = await loginPost(
      jsonRequest("/api/auth/login", {
        email: "reset@example.com",
        senha: "senha-original-123",
      }),
    );
    expect(loginAntigo.status).toBe(401);
  });

  it("forgot retorna 200 mesmo para e-mail inexistente (não vaza)", async () => {
    sendResetSpy.mockClear();
    const res = await forgotPost(
      jsonRequest("/api/auth/forgot-password", { email: "fantasma@example.com" }),
    );
    expect(res.status).toBe(200);
    expect(sendResetSpy).not.toHaveBeenCalled();
  });

  it("reset rejeita token inválido com 400", async () => {
    await forgotPost(
      jsonRequest("/api/auth/forgot-password", { email: "reset@example.com" }),
    );
    const res = await resetPost(
      jsonRequest("/api/auth/reset-password", {
        email: "reset@example.com",
        token: "token-completamente-errado",
        novaSenha: "qualquer-senha-1",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("reset rejeita token expirado com 410", async () => {
    await forgotPost(
      jsonRequest("/api/auth/forgot-password", { email: "reset@example.com" }),
    );
    const user = await prisma.user.findUnique({ where: { email: "reset@example.com" } });
    const token = user!.passwordResetToken!;

    // Força expiração no passado
    await prisma.user.update({
      where: { id: user!.id },
      data: { passwordResetTokenExpiresAt: new Date(Date.now() - 60_000) },
    });

    const res = await resetPost(
      jsonRequest("/api/auth/reset-password", {
        email: "reset@example.com",
        token,
        novaSenha: "outra-senha-1",
      }),
    );
    expect(res.status).toBe(410);
  });
});
