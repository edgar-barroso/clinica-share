import { NextRequest, NextResponse } from "next/server";
import {
  listAgendamentosQuerySchema,
  createAgendamentoSchema,
} from "./_schemas";
import { listAgendamentos } from "@/app/(back-end)/_usecases/agendamento/list";
import { createAgendamento } from "@/app/(back-end)/_usecases/agendamento/create";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const filter = listAgendamentosQuerySchema.parse({
      data: searchParams.get("data") ?? undefined,
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
      profissionalId: searchParams.get("profissionalId") ?? undefined,
      pacienteId: searchParams.get("pacienteId") ?? undefined,
      consultorioId: searchParams.get("consultorioId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    const agendamentos = await listAgendamentos(filter, {
      role: user.role,
      profissionalId: user.profissionalId,
      pacienteId: user.pacienteId,
    });
    return NextResponse.json({ agendamentos });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // AG01 (paciente) ou AG02 (atendente/admin)
    await requireUser(req, ["admin", "atendente", "paciente"]);
    const body = await req.json();
    const input = createAgendamentoSchema.parse(body);
    const agendamento = await createAgendamento(input);
    return NextResponse.json({ agendamento }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
