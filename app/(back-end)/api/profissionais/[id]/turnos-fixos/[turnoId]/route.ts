import { NextRequest, NextResponse } from "next/server";
import { removeTurnoFixo } from "@/app/(back-end)/_usecases/profissional/remove-turno-fixo";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string; turnoId: string }>;
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id, turnoId } = await ctx.params;
    await removeTurnoFixo(id, turnoId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
