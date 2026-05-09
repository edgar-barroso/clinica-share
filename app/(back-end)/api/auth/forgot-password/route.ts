import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "../_schemas";
import { requestPasswordReset } from "@/app/(back-end)/_usecases/auth/request-password-reset";
import { handleAuthError } from "@/app/(back-end)/_lib/handle-auth-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = forgotPasswordSchema.parse(body);
    await requestPasswordReset(input);
    // Sempre 200 — não revelar se e-mail existe
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAuthError(err);
  }
}
