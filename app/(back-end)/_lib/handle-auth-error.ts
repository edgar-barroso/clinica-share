import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AuthError,
  CredenciaisInvalidas,
  EmailJaCadastrado,
  NaoAutenticado,
  ProvedorGoogleInvalido,
  TokenExpirado,
  TokenInvalido,
} from "./errors";

export function handleAuthError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: err.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (err instanceof EmailJaCadastrado) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }

  if (err instanceof CredenciaisInvalidas) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (err instanceof NaoAutenticado) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (err instanceof TokenExpirado) {
    return NextResponse.json({ error: err.message }, { status: 410 });
  }

  if (err instanceof TokenInvalido) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (err instanceof ProvedorGoogleInvalido) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.error("[auth] erro inesperado:", err);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
