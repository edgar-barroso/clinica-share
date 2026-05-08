import { NextRequest, NextResponse } from "next/server";
import { iniciarAtendimento } from "@/app/(back-end)/_usecases/agendamento/iniciar";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    // AT05: profissional dono OU admin/aux
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "profissional",
    ]);
    const { id } = await ctx.params;
    const atendimento = await iniciarAtendimento(
      id,
      { role: user.role, profissionalId: user.profissionalId },
      user,
    );
    return NextResponse.json({ atendimento });
  } catch (err) {
    return handleError(err);
  }
}
