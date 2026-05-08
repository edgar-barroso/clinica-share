import { NextRequest, NextResponse } from "next/server";
import { periodoSchema } from "../relatorios/_schemas";
import { dashboardStats } from "@/app/(back-end)/_usecases/dashboard/stats";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    await requireUser(req, ["admin", "auxiliar", "atendente", "profissional"]);
    const { searchParams } = new URL(req.url);
    const filter = periodoSchema.parse({
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
    });
    const stats = await dashboardStats(filter);
    return NextResponse.json({ stats });
  } catch (err) {
    return handleError(err);
  }
}
