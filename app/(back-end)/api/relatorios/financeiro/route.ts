import { NextRequest, NextResponse } from "next/server";
import { relatorioFinanceiroSchema } from "../_schemas";
import { relatorioFinanceiro } from "@/app/(back-end)/_usecases/relatorio/financeiro";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    await requireUser(req, ["admin", "auxiliar"]);
    const { searchParams } = new URL(req.url);
    const filter = relatorioFinanceiroSchema.parse({
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
      profissionalId: searchParams.get("profissionalId") ?? undefined,
      consultorioId: searchParams.get("consultorioId") ?? undefined,
    });
    const relatorio = await relatorioFinanceiro(filter);
    return NextResponse.json(relatorio);
  } catch (err) {
    return handleError(err);
  }
}
