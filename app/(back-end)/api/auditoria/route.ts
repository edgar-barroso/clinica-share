import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listAuditoria } from "@/app/(back-end)/_usecases/auditoria/list";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

const querySchema = z.object({
  entidade: z.string().optional(),
  entidadeId: z.string().optional(),
  userId: z.string().optional(),
  campo: z.string().optional(),
  dataInicio: z.string().date().optional(),
  dataFim: z.string().date().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireUser(req, ["admin", "auxiliar"]);
    const { searchParams } = new URL(req.url);
    const filter = querySchema.parse({
      entidade: searchParams.get("entidade") ?? undefined,
      entidadeId: searchParams.get("entidadeId") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      campo: searchParams.get("campo") ?? undefined,
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
    });
    const logs = await listAuditoria(filter);
    return NextResponse.json({ logs });
  } catch (err) {
    return handleError(err);
  }
}
