import { NextRequest, NextResponse } from "next/server";
import {
  createWalkInSchema,
  listAtendimentosQuerySchema,
} from "./_schemas";
import { listAtendimentos } from "@/app/(back-end)/_usecases/atendimento/list";
import { createWalkInAtendimento } from "@/app/(back-end)/_usecases/atendimento/create-walkin";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const filter = listAtendimentosQuerySchema.parse({
      data: searchParams.get("data") ?? undefined,
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
      profissionalId: searchParams.get("profissionalId") ?? undefined,
      pacienteId: searchParams.get("pacienteId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      statusPagamento: searchParams.get("statusPagamento") ?? undefined,
    });
    const atendimentos = await listAtendimentos(filter, {
      role: user.role,
      profissionalId: user.profissionalId,
      pacienteId: user.pacienteId,
    });
    return NextResponse.json({ atendimentos });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // AT01 walk-in: profissional dono OU admin/aux registram avulso
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "profissional",
    ]);
    const body = await req.json();
    const input = createWalkInSchema.parse(body);
    const atendimento = await createWalkInAtendimento(input, user);
    return NextResponse.json({ atendimento }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
