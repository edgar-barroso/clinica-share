import { NextRequest, NextResponse } from "next/server";
import { listRepassesQuerySchema } from "./_schemas";
import { listRepasses } from "@/app/(back-end)/_usecases/repasse/list";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "profissional",
    ]);
    const { searchParams } = new URL(req.url);
    const filter = listRepassesQuerySchema.parse({
      profissionalId: searchParams.get("profissionalId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      periodoInicio: searchParams.get("periodoInicio") ?? undefined,
      periodoFim: searchParams.get("periodoFim") ?? undefined,
    });
    const repasses = await listRepasses(filter, {
      role: user.role,
      profissionalId: user.profissionalId,
    });
    return NextResponse.json({ repasses });
  } catch (err) {
    return handleError(err);
  }
}
