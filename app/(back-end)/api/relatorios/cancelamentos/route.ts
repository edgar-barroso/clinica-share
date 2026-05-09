import { NextRequest, NextResponse } from "next/server";
import { periodoSchema } from "../_schemas";
import { relatorioCancelamentos } from "@/app/(back-end)/_usecases/relatorio/cancelamentos";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    await requireUser(req, ["admin", "auxiliar"]);
    const { searchParams } = new URL(req.url);
    const filter = periodoSchema.parse({
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
    });
    const relatorio = await relatorioCancelamentos(filter);
    return NextResponse.json(relatorio);
  } catch (err) {
    return handleError(err);
  }
}
