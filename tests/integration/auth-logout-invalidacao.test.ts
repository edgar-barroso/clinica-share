/**
 * RF-024 — o logout tem que invalidar o TOKEN, não só apagar o cookie.
 *
 * Contexto de por que estes testes existem:
 *
 * O "Sair" original limpava o `localStorage` e nem chamava a rota de logout —
 * o cookie sobrevivia e voltar ao painel reautenticava. Isso foi corrigido.
 * Mas a correção trouxe o sliding expiration, que reemitia o cookie em TODA
 * resposta autenticada, e aí apareceu uma falha pior: uma requisição em voo
 * no instante do logout devolvia `Set-Cookie` com o token válido e a sessão
 * ressuscitava. Como a página autenticada sempre tem requisições de fundo
 * (RoleProvider, keepalive do guard de inatividade), a corrida era real.
 *
 * A defesa aqui é do servidor: o logout marca `sessoesInvalidadasEm` e todo
 * guard que consulta o banco recusa token emitido antes dessa marca. Assim o
 * token não vale mais nada nem se o cookie for reposto.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST as logoutPost } from "@/app/(back-end)/api/auth/logout/route";
import { GET as meGet } from "@/app/(back-end)/api/auth/me/route";
import { prisma } from "@/lib/db";
import { cleanDb } from "../helpers/db";
import { createUserWithRole } from "../helpers/auth";
import { getRequest, jsonRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("RF-024 — logout invalida o token no servidor", () => {
  it("token continua funcionando antes do logout", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await meGet(withAuthCookie(getRequest("/api/auth/me"), token));
    expect(res.status).toBe(200);
  });

  it("o mesmo token é RECUSADO depois do logout, mesmo com o cookie reposto", async () => {
    // O cenário exato da corrida: o cliente volta a apresentar um cookie
    // válido depois de ter deslogado. Antes isto devolvia 200.
    const { user, token } = await createUserWithRole("admin");

    const logout = await logoutPost(
      withAuthCookie(jsonRequest("/api/auth/logout", {}), token),
    );
    expect(logout.status).toBe(200);

    const res = await meGet(withAuthCookie(getRequest("/api/auth/me"), token));
    expect(res.status).toBe(401);

    const salvo = await prisma.user.findUnique({ where: { id: user.id } });
    expect(salvo!.sessoesInvalidadasEm).not.toBeNull();
  });

  it("logout de um usuário não derruba a sessão de outro", async () => {
    const a = await createUserWithRole("admin", `a-${Date.now()}@e.com`);
    const b = await createUserWithRole("auxiliar", `b-${Date.now()}@e.com`);

    await logoutPost(withAuthCookie(jsonRequest("/api/auth/logout", {}), a.token));

    const resA = await meGet(withAuthCookie(getRequest("/api/auth/me"), a.token));
    expect(resA.status).toBe(401);

    const resB = await meGet(withAuthCookie(getRequest("/api/auth/me"), b.token));
    expect(resB.status).toBe(200);
  });

  it("login posterior ao logout volta a valer", async () => {
    // A marca invalida o que veio ANTES dela; um token novo tem `iat` depois
    // e precisa continuar funcionando, senão o usuário não consegue voltar.
    const { user, token } = await createUserWithRole("admin");
    await logoutPost(withAuthCookie(jsonRequest("/api/auth/logout", {}), token));

    // Espera 1s: o `iat` do JWT tem resolução de segundos, e um token emitido
    // no mesmo segundo do logout seria indistinguível de um anterior.
    await new Promise((r) => setTimeout(r, 1100));

    const { signAuthToken } = await import("@/app/(back-end)/_lib/jwt");
    const novo = signAuthToken({ userId: user.id, role: user.role });

    const res = await meGet(withAuthCookie(getRequest("/api/auth/me"), novo));
    expect(res.status).toBe(200);
  });
});
