import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const AUTH_COOKIE = "auth-token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

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
