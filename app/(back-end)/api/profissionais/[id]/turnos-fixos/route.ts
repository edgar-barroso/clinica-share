import { NextRequest, NextResponse } from "next/server";
import { createTurnoFixoSchema } from "../../_schemas";
import { addTurnoFixo } from "@/app/(back-end)/_usecases/profissional/add-turno-fixo";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const input = createTurnoFixoSchema.parse(body);
    const turno = await addTurnoFixo(id, input);
    return NextResponse.json({ turno }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
