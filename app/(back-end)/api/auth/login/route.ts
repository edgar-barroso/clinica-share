import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "../_schemas";
import { login } from "@/app/(back-end)/_usecases/auth/login";
import { signAuthToken } from "@/app/(back-end)/_lib/jwt";
import { setAuthCookie } from "@/app/(back-end)/_lib/auth-cookie";
import { serializeUser } from "@/app/(back-end)/_lib/serialize-user";
import { handleAuthError } from "@/app/(back-end)/_lib/handle-auth-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);
    const user = await login(input);

    const token = signAuthToken({ userId: user.id, role: user.role });
    const res = NextResponse.json({ user: serializeUser(user) });
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    return handleAuthError(err);
  }
}
