import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AuthError,
  ConflitoRecurso,
  CredenciaisInvalidas,
  EmailJaCadastrado,
  NaoAutenticado,
  NaoAutorizado,
  NaoEncontrado,
  ProvedorGoogleInvalido,
  RegraNegocio,
  TokenExpirado,
  TokenInvalido,
} from "./errors";

/**
 * Mapeia erros conhecidos para respostas HTTP. Use em todas as rotas dentro
 * de um `try { ... } catch (err) { return handleError(err); }`.
 */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: err.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (err instanceof EmailJaCadastrado || err instanceof ConflitoRecurso) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }

  if (err instanceof CredenciaisInvalidas || err instanceof NaoAutenticado) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (err instanceof NaoAutorizado) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  if (err instanceof NaoEncontrado) {
    return NextResponse.json({ error: err.message }, { status: 404 });
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

  if (err instanceof RegraNegocio) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.error("[api] erro inesperado:", err);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}

/** @deprecated Use `handleError` (mesma assinatura). Mantido para retrocompat. */
export const handleAuthError = handleError;
