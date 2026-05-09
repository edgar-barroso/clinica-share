import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/app/(back-end)/_lib/auth-cookie";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}
