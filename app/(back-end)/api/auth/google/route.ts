import { NextRequest, NextResponse } from "next/server";
import { googleSchema } from "../_schemas";
import { authorizeWithGoogle } from "@/app/(back-end)/_usecases/auth/authorize-with-google";
import { signAuthToken } from "@/app/(back-end)/_lib/jwt";
import { setAuthCookie } from "@/app/(back-end)/_lib/auth-cookie";
import { serializeUser } from "@/app/(back-end)/_lib/serialize-user";
import { handleAuthError } from "@/app/(back-end)/_lib/handle-auth-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = googleSchema.parse(body);
    const user = await authorizeWithGoogle(input);

    const token = signAuthToken({ userId: user.id, role: user.role });
    const res = NextResponse.json({ user: serializeUser(user) });
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    return handleAuthError(err);
  }
}
