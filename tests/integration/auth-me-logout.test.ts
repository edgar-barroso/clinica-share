import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(back-end)/_lib/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

import { GET as meGet } from "@/app/(back-end)/api/auth/me/route";
import { POST as logoutPost } from "@/app/(back-end)/api/auth/logout/route";
import { POST as registerPost } from "@/app/(back-end)/api/auth/register/route";
import { prisma } from "@/lib/db";
import { cleanAuthData } from "../helpers/db";
import { getRequest, jsonRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanAuthData();
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

describe("GET /api/auth/me + POST /api/auth/logout", () => {
  it("/me sem cookie → 401", async () => {
    const res = await meGet(getRequest("/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("/me com cookie válido → 200 com user", async () => {
    // Registra → recebe cookie
    const reg = await registerPost(
      jsonRequest("/api/auth/register", {
        nome: "Me Test",
        email: "me@example.com",
        telefone: "11999990000",
        senha: "senha-forte-123",
      }),
    );
    const token = reg.cookies.get("auth-token")!.value;

    const res = await meGet(withAuthCookie(getRequest("/api/auth/me"), token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("me@example.com");
  });

  it("/me com cookie inválido → 401", async () => {
    const res = await meGet(
      withAuthCookie(getRequest("/api/auth/me"), "token-falso"),
    );
    expect(res.status).toBe(401);
  });

  it("/logout limpa o cookie (maxAge=0)", async () => {
    // O logout agora recebe a request para poder invalidar o token no
    // servidor (RF-024). Sem cookie ele só limpa e responde 200 — logout é
    // idempotente e não revela se havia sessão.
    const res = await logoutPost(jsonRequest("/api/auth/logout", {}));
    expect(res.status).toBe(200);
    const cookie = res.cookies.get("auth-token");
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });
});
