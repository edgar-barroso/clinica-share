import { NextRequest, NextResponse } from "next/server";
import { listStaffQuerySchema, createStaffSchema } from "./_schemas";
import { listStaff } from "@/app/(back-end)/_usecases/staff/list";
import { createStaff } from "@/app/(back-end)/_usecases/staff/create";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["admin", "auxiliar"]);
    const { searchParams } = new URL(req.url);
    const filter = listStaffQuerySchema.parse({
      ativo: searchParams.get("ativo") ?? undefined,
      cargo: searchParams.get("cargo") ?? undefined,
    });
    const staff = await listStaff(filter);
    return NextResponse.json({ staff });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["admin"]);
    const body = await req.json();
    const input = createStaffSchema.parse(body);
    const staff = await createStaff(input);
    return NextResponse.json({ staff }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
