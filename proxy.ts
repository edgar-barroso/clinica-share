/**
 * Proxy do Next.js 16 (antigo middleware) — primeira linha de defesa de
 * autenticação. Roda no Edge runtime ANTES de qualquer route handler.
 *
 * Responsabilidades:
 * 1. Lê o cookie `auth-token` (HttpOnly).
 * 2. Verifica o JWT (HS256, mesma chave do `_lib/jwt.ts`).
 * 3. Para rotas API privadas: bloqueia com 401 se ausente/inválido.
 * 4. Para rotas API públicas: tenta validar (best-effort) mas não bloqueia.
 * 5. Para páginas privadas: redireciona pra /login.
 * 6. Quando válido, injeta `x-user-id` e `x-user-role` nos headers da
 *    request — route handlers + helpers como `requireRole` podem usar
 *    esses headers sem re-verificar o JWT (fast path).
 *
 * RBAC fino (allowlist por rota) continua nos handlers via
 * `requireRole`/`requireUser` (`_lib/require-role.ts`) — proxy é
 * defense-in-depth, não substitui RBAC.
 */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

interface TokenPayload {
  userId: string;
  role: string;
}

async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
    throw new Error("Payload JWT inválido");
  }
  return { userId: payload.userId, role: payload.role };
}

// Rotas API públicas: { path, method }. Method "*" = qualquer.
// Path matching é por prefixo (startsWith).
const publicApiRoutes: { path: string; method: string }[] = [
  { path: "/api/auth/login", method: "POST" },
  { path: "/api/auth/register", method: "POST" },
  { path: "/api/auth/forgot-password", method: "POST" },
  { path: "/api/auth/reset-password", method: "POST" },
  { path: "/api/auth/google", method: "POST" },
  { path: "/api/auth/logout", method: "POST" },
  { path: "/api/auth/me", method: "GET" },
  { path: "/api/hello", method: "GET" },
];

// Páginas públicas (rotas exatas)
const publicPages = new Set([
  "/",
  "/login",
  "/cadastrar",
  "/esqueci-senha",
  "/redefinir-senha",
]);

function isPublicApiRoute(pathname: string, method: string): boolean {
  return publicApiRoutes.some(
    (r) =>
      pathname.startsWith(r.path) && (r.method === "*" || r.method === method),
  );
}

async function handleApi(
  request: NextRequest,
  token: string | undefined,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicApiRoute(pathname, request.method);

  if (isPublic) {
    // Best-effort: se tem token válido, injeta headers (útil pra
    // rotas como /api/auth/me que querem saber quem está logado)
    if (token) {
      try {
        const { userId, role } = await verifyToken(token);
        const headers = new Headers(request.headers);
        headers.set("x-user-id", userId);
        headers.set("x-user-role", role);
        return NextResponse.next({ request: { headers } });
      } catch {
        /* segue sem auth — rota é pública */
      }
    }
    return NextResponse.next();
  }

  // Rota privada: exige token válido
  if (!token) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { userId, role } = await verifyToken(token);
    const headers = new Headers(request.headers);
    headers.set("x-user-id", userId);
    headers.set("x-user-role", role);
    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json(
      { error: "Sessão expirada ou inválida" },
      { status: 401 },
    );
  }
}

async function handlePage(
  request: NextRequest,
  token: string | undefined,
): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (publicPages.has(pathname)) {
    return NextResponse.next();
  }

  // Página privada: exige token válido. Se inválido, redireciona pra login
  // mantendo callbackUrl pra voltar após autenticar.
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return handleApi(request, token);
  }
  return handlePage(request, token);
}

export const config = {
  // Rode em tudo, exceto assets estáticos do Next + arquivos com extensão
  // (imagens, .js, .css, etc.)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
