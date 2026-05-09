import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { gerarRepassesSemanaAnterior } from "@/app/(back-end)/_usecases/repasse/gerar-semana-anterior";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

/**
 * Endpoint chamado por agendador externo (Vercel Cron, GitHub Actions,
 * cronjob.org, etc.) toda segunda-feira de manhã para gerar o `Repasse`
 * da semana que acabou de fechar.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Não usa cookie
 * porque não há sessão de usuário; a chamada vem de uma máquina.
 *
 * Idempotente: chamar mais de uma vez não duplica registros — o usecase
 * `gerarRepasse` retorna o existente quando há `@@unique` por período.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${env.CRON_SECRET}`;
    if (auth !== expected) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 },
      );
    }
    const result = await gerarRepassesSemanaAnterior();
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

// Permite GET com mesmo handler para serviços que só fazem GET (cron-job.org).
export const GET = POST;
