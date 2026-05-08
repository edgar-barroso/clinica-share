import { NextRequest, NextResponse } from "next/server";
import { getRepasse } from "@/app/(back-end)/_usecases/repasse/get";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "profissional",
    ]);
    const { id } = await ctx.params;
    const result = await getRepasse(id, {
      role: user.role,
      profissionalId: user.profissionalId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}
