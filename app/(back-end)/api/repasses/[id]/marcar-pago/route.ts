import { NextRequest, NextResponse } from "next/server";
import { marcarPagoSchema } from "../../_schemas";
import { marcarRepassePago } from "@/app/(back-end)/_usecases/repasse/marcar-pago";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(req, ["admin", "auxiliar"]);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const input = marcarPagoSchema.parse(body);
    const repasse = await marcarRepassePago(id, user, input.motivo);
    return NextResponse.json({ repasse });
  } catch (err) {
    return handleError(err);
  }
}
