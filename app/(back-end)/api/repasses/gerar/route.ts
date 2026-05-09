import { NextRequest, NextResponse } from "next/server";
import { gerarRepasseSchema } from "../_schemas";
import { gerarRepasse } from "@/app/(back-end)/_usecases/repasse/gerar";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function POST(req: NextRequest) {
  try {
    await requireUser(req, ["admin", "auxiliar"]);
    const body = await req.json();
    const input = gerarRepasseSchema.parse(body);
    const repasse = await gerarRepasse(input);
    return NextResponse.json({ repasse }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
