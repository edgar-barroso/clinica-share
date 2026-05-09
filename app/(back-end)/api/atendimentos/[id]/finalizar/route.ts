import { NextRequest, NextResponse } from "next/server";
import { finalizarAtendimentoSchema } from "../../_schemas";
import { finalizarAtendimento } from "@/app/(back-end)/_usecases/atendimento/finalizar";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    // AT06: profissional dono OU admin/aux
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "profissional",
    ]);
    const { id } = await ctx.params;
    const body = await req.json();
    const input = finalizarAtendimentoSchema.parse(body);
    const atendimento = await finalizarAtendimento(
      id,
      input,
      { role: user.role, profissionalId: user.profissionalId },
      user,
    );
    return NextResponse.json({ atendimento });
  } catch (err) {
    return handleError(err);
  }
}
