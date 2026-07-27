import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SESSION_IDLE_SECONDS } from "@/lib/session-idle";

export const AUTH_COOKIE = "auth-token";
/**
 * [RF-024] O cookie expira junto com o JWT — janela de inatividade, não
 * TTL absoluto. Renovado a cada requisição autenticada pelo `proxy.ts`.
 */
const MAX_AGE = SESSION_IDLE_SECONDS;

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readAuthCookie(req: NextRequest): string | null {
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}
