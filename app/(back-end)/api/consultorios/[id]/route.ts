import { NextRequest, NextResponse } from "next/server";
import { updateConsultorioSchema } from "../_schemas";
import { getConsultorio } from "@/app/(back-end)/_usecases/consultorio/get";
import { updateConsultorio } from "@/app/(back-end)/_usecases/consultorio/update";
import { deactivateConsultorio } from "@/app/(back-end)/_usecases/consultorio/deactivate";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin", "auxiliar", "profissional", "atendente"]);
    const { id } = await ctx.params;
    const consultorio = await getConsultorio(id);
    return NextResponse.json({ consultorio });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateConsultorioSchema.parse(body);
    const consultorio = await updateConsultorio(id, input);
    return NextResponse.json({ consultorio });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const consultorio = await deactivateConsultorio(id);
    return NextResponse.json({ consultorio });
  } catch (err) {
    return handleError(err);
  }
}
