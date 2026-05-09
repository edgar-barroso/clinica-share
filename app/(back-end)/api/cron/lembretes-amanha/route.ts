import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { enviarLembretesAmanha } from "@/app/(back-end)/_usecases/notificacao/lembrete-amanha";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

/**
 * Cron de lembrete D-1: notifica todos os pacientes que têm consulta
 * agendada no dia seguinte (email + WhatsApp).
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Não usa cookie
 * — chamado por agendador externo (Vercel Cron, GitHub Actions, etc.).
 *
 * Idempotente: cada atendimento tem `lembreteEnviadoEm` que evita
 * reenvio quando o cron dispara mais de uma vez no mesmo dia.
 *
 * Cadência sugerida: todo dia às 18:00 (horário comercial) para que os
 * pacientes recebam o lembrete na noite anterior à consulta.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${env.CRON_SECRET}`;
    if (auth !== expected) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const result = await enviarLembretesAmanha();
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

export const GET = POST;
