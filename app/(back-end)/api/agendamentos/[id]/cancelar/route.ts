import { NextRequest, NextResponse } from "next/server";
import { cancelAgendamentoSchema } from "../../_schemas";
import { cancelAgendamento } from "@/app/(back-end)/_usecases/agendamento/cancel";
import { getAgendamento } from "@/app/(back-end)/_usecases/agendamento/get";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { NaoAutorizado } from "@/app/(back-end)/_lib/errors";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    // Admin/auxiliar/atendente cancelam qualquer agendamento;
    // paciente só pode cancelar o próprio (AG09 reagendamento livre — DEC-P06).
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "atendente",
      "paciente",
    ]);

    if (user.role === "paciente") {
      const agendamento = await getAgendamento(id);
      if (agendamento.pacienteId !== user.pacienteId) {
        throw new NaoAutorizado("Você só pode cancelar o próprio agendamento");
      }
    }

    const body = await req.json();
    const input = cancelAgendamentoSchema.parse(body);
    const agendamento = await cancelAgendamento(id, input, user);
    return NextResponse.json({ agendamento });
  } catch (err) {
    return handleError(err);
  }
}
