import { NextRequest, NextResponse } from "next/server";
import { updateStaffSchema } from "../_schemas";
import { getStaff } from "@/app/(back-end)/_usecases/staff/get";
import { updateStaff } from "@/app/(back-end)/_usecases/staff/update";
import { deactivateStaff } from "@/app/(back-end)/_usecases/staff/deactivate";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin", "auxiliar"]);
    const { id } = await ctx.params;
    const staff = await getStaff(id);
    return NextResponse.json({ staff });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateStaffSchema.parse(body);
    const staff = await updateStaff(id, input);
    return NextResponse.json({ staff });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const staff = await deactivateStaff(id);
    return NextResponse.json({ staff });
  } catch (err) {
    return handleError(err);
  }
}
