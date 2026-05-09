import { NextRequest, NextResponse } from "next/server";
import { updateProfissionalSchema } from "../_schemas";
import { getProfissional } from "@/app/(back-end)/_usecases/profissional/get";
import { updateProfissional } from "@/app/(back-end)/_usecases/profissional/update";
import { deactivateProfissional } from "@/app/(back-end)/_usecases/profissional/deactivate";
import { requireRole, requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin", "auxiliar", "profissional", "atendente"]);
    const { id } = await ctx.params;
    const profissional = await getProfissional(id);
    return NextResponse.json({ profissional });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    // requireUser pq audit log precisa do user para snapshot do nome
    const user = await requireUser(req, ["admin"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateProfissionalSchema.parse(body);
    const profissional = await updateProfissional(id, input, user);
    return NextResponse.json({ profissional });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const profissional = await deactivateProfissional(id);
    return NextResponse.json({ profissional });
  } catch (err) {
    return handleError(err);
  }
}
