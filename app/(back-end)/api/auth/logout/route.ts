import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, clearAuthCookie } from "@/app/(back-end)/_lib/auth-cookie";
import { verifyAuthToken } from "@/app/(back-end)/_lib/jwt";
import { prisma } from "@/lib/db";

/**
 * [RF-024] Encerra a sessão.
 *
 * Apagar o cookie NÃO basta. O token continua criptograficamente válido até
 * expirar, então quem o tivesse copiado seguiria autenticado — e, com o
 * sliding expiration, bastava uma requisição em voo no instante do logout
 * para o servidor reemitir o cookie e ressuscitar a sessão.
 *
 * Por isso o logout também marca `sessoesInvalidadasEm`: os guards que
 * consultam o banco recusam qualquer token emitido antes dessa marca.
 *
 * Responde 200 mesmo sem sessão válida — logout é idempotente e não deve
 * revelar se havia alguém logado.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token) {
    try {
      const { userId } = verifyAuthToken(token);
      await prisma.user.update({
        where: { id: userId },
        data: { sessoesInvalidadasEm: new Date() },
      });
    } catch {
      // Token inválido/expirado, ou usuário já removido: não há sessão a
      // invalidar e o cookie já foi limpo acima.
    }
  }

  return res;
}
