import { NextRequest, NextResponse } from "next/server";
import { marcarNaoCompareceu } from "@/app/(back-end)/_usecases/agendamento/nao-compareceu";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "atendente",
    ]);
    const { id } = await ctx.params;
    const atendimento = await marcarNaoCompareceu(id, user);
    return NextResponse.json({ atendimento });
  } catch (err) {
    return handleError(err);
  }
}
