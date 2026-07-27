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
 * 7. [RF-024] Sliding expiration: o token vale só a janela de inatividade
 *    (`SESSION_IDLE_MINUTES`, default 30min). Toda requisição autenticada
 *    reassina o token e reenvia o cookie, empurrando a expiração pra
 *    frente. Quem para de fazer requests expira sozinho — não existe
 *    "manter logado" no cliente, o servidor é a autoridade.
 *
 * RBAC fino (allowlist por rota) continua nos handlers via
 * `requireRole`/`requireUser` (`_lib/require-role.ts`) — proxy é
 * defense-in-depth, não substitui RBAC.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { SESSION_IDLE_SECONDS } from "@/lib/session-idle";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
const AUTH_COOKIE = "auth-token";

interface TokenPayload {
  userId: string;
  role: string;
  /** Emissão em segundos. Repassada aos handlers como `x-token-iat`. */
  iat?: number;
}

async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
    throw new Error("Payload JWT inválido");
  }
  return { userId: payload.userId, role: payload.role, iat: payload.iat };
}

/**
 * Rotas que gerenciam o cookie por conta própria (emitem ou limpam
 * `auth-token`). O proxy nunca renova nelas — dois `Set-Cookie` para o
 * mesmo nome na mesma resposta tornam o resultado ambíguo, e no caso do
 * logout a renovação do proxy poderia ressuscitar a sessão.
 */
const cookieOwningRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

/**
 * [RF-024] Empurra a expiração do cookie/JWT pra frente.
 *
 * Reassina em TODA requisição autenticada, de propósito: assim a janela
 * vale exatamente `SESSION_IDLE_MINUTES` desde a última requisição, em
 * qualquer rota — inclusive nas que usam só `requireRole` e nunca tocam o
 * banco (onde o `ultimoAcesso` não ajudaria). O custo é um HS256 no Edge,
 * sem I/O. Efeito colateral: reassinar também encurta tokens legados
 * emitidos sob a política antiga (TTL absoluto de 7d), sem deslogar
 * ninguém. Mesmos atributos de cookie de `_lib/auth-cookie.ts`.
 */
async function slideSession(
  res: NextResponse,
  request: NextRequest,
  payload: TokenPayload,
): Promise<NextResponse> {
  if (cookieOwningRoutes.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return res;
  }

  const agora = Date.now();

  // Renova só quando o token já gastou metade da janela. Reemitir o cookie em
  // TODA resposta autenticada abria uma corrida com o logout: qualquer
  // requisição em voo (RoleProvider, keepalive do guard de inatividade)
  // devolvia `Set-Cookie` com o token válido e ressuscitava a sessão que o
  // usuário acabara de encerrar. Renovar na metade preserva o sliding
  // expiration — quem está ativo nunca chega perto de expirar — e tira o
  // `Set-Cookie` da esmagadora maioria das respostas.
  if (payload.iat !== undefined) {
    const idadeMs = agora - payload.iat * 1000;
    if (idadeMs < (SESSION_IDLE_SECONDS * 1000) / 2) {
      return res;
    }
  }
  const token = await new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(agora / 1000) + SESSION_IDLE_SECONDS)
    .sign(JWT_SECRET);

  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_IDLE_SECONDS,
  });
  return res;
}

/** Remove o cookie morto para o cliente não reenviá-lo a cada navegação. */
function dropSession(res: NextResponse): NextResponse {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
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
  // Cron interno: autenticado por bearer secret na própria rota, não por cookie.
  { path: "/api/cron/gerar-repasses", method: "POST" },
  { path: "/api/cron/gerar-repasses", method: "GET" },
  { path: "/api/cron/lembretes-amanha", method: "POST" },
  { path: "/api/cron/lembretes-amanha", method: "GET" },
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
        const payload = await verifyToken(token);
        const headers = new Headers(request.headers);
        headers.set("x-user-id", payload.userId);
        headers.set("x-user-role", payload.role);
        // RF-024: `requireUser` compara com `sessoesInvalidadasEm` para
        // recusar token anterior ao último logout.
        if (payload.iat !== undefined) {
          headers.set("x-token-iat", String(payload.iat));
        }
        return slideSession(
          NextResponse.next({ request: { headers } }),
          request,
          payload,
        );
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
    const payload = await verifyToken(token);
    const headers = new Headers(request.headers);
    headers.set("x-user-id", payload.userId);
    headers.set("x-user-role", payload.role);
    if (payload.iat !== undefined) {
      headers.set("x-token-iat", String(payload.iat));
    }
    return slideSession(
      NextResponse.next({ request: { headers } }),
      request,
      payload,
    );
  } catch {
    // [RF-024] Token expirado por inatividade (ou inválido): 401 + cookie
    // limpo. O `api-client` do front trata 401 e manda pro /login.
    return dropSession(
      NextResponse.json(
        { error: "Sessão expirada ou inválida" },
        { status: 401 },
      ),
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
    const payload = await verifyToken(token);
    return slideSession(NextResponse.next(), request, payload);
  } catch {
    // [RF-024] Token expirado por inatividade: volta pro login com
    // `expirada=1` (a página avisa o motivo) e sem cookie zumbi.
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname + search);
    url.searchParams.set("expirada", "1");
    return dropSession(NextResponse.redirect(url));
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
