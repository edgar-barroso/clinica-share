import { NextRequest, NextResponse } from "next/server";
import { marcarChegada } from "@/app/(back-end)/_usecases/agendamento/marcar-chegada";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * AG08 — atendente OU admin/auxiliar marca chegada do paciente.
 * Profissional não dispara essa transição (PEND-030 / DEC-P06).
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser(req, ["admin", "auxiliar", "atendente"]);
    const agendamento = await marcarChegada(id, user);
    return NextResponse.json({ agendamento });
  } catch (err) {
    return handleError(err);
  }
}
