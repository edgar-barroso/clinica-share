import { NextRequest, NextResponse } from "next/server";
import { updateAtendimentoSchema } from "../_schemas";
import { getAtendimento } from "@/app/(back-end)/_usecases/atendimento/get";
import { updateAtendimento } from "@/app/(back-end)/_usecases/atendimento/update";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const atendimento = await getAtendimento(id, {
      role: user.role,
      profissionalId: user.profissionalId,
      pacienteId: user.pacienteId,
    });
    return NextResponse.json({ atendimento });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    // FI11: edição pós-realizado — apenas admin/auxiliar (PEND-031)
    const user = await requireUser(req, ["admin", "auxiliar"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateAtendimentoSchema.parse(body);
    const atendimento = await updateAtendimento(id, input, user);
    return NextResponse.json({ atendimento });
  } catch (err) {
    return handleError(err);
  }
}
