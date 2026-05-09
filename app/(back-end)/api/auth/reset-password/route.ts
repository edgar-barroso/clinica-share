import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "../_schemas";
import { resetPassword } from "@/app/(back-end)/_usecases/auth/reset-password";
import { handleAuthError } from "@/app/(back-end)/_lib/handle-auth-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);
    await resetPassword(input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAuthError(err);
  }
}
