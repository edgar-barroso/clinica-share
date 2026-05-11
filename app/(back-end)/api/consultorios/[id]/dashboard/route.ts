import { NextRequest, NextResponse } from "next/server";
import { detalheConsultorioSchema } from "../../_schemas";
import { detalheConsultorio } from "@/app/(back-end)/_usecases/consultorio/detalhamento";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin", "auxiliar"]);
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const filter = detalheConsultorioSchema.parse({
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
    });
    const detalhe = await detalheConsultorio({
      consultorioId: id,
      ...filter,
    });
    return NextResponse.json(detalhe);
  } catch (err) {
    return handleError(err);
  }
}
