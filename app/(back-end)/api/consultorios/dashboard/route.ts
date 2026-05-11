import { NextRequest, NextResponse } from "next/server";
import { dashboardConsultoriosSchema } from "../_schemas";
import { dashboardConsultorios } from "@/app/(back-end)/_usecases/consultorio/dashboard";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["admin", "auxiliar"]);
    const { searchParams } = new URL(req.url);
    const input = dashboardConsultoriosSchema.parse({
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
      modalidade: searchParams.get("modalidade") ?? undefined,
    });
    const dashboard = await dashboardConsultorios(input);
    return NextResponse.json(dashboard);
  } catch (err) {
    return handleError(err);
  }
}
