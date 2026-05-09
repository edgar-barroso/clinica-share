import { NextRequest, NextResponse } from "next/server";
import { getAgendamento } from "@/app/(back-end)/_usecases/agendamento/get";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { NaoAutorizado } from "@/app/(back-end)/_lib/errors";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser(req);
    const agendamento = await getAgendamento(id);

    // RBAC RF-023: profissional só vê o próprio; paciente só o próprio
    if (user.role === "profissional" && agendamento.profissionalId !== user.profissionalId) {
      throw new NaoAutorizado("Você não tem acesso a este agendamento");
    }
    if (user.role === "paciente" && agendamento.pacienteId !== user.pacienteId) {
      throw new NaoAutorizado("Você não tem acesso a este agendamento");
    }
    return NextResponse.json({ agendamento });
  } catch (err) {
    return handleError(err);
  }
}
