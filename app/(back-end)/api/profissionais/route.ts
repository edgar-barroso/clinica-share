import { NextRequest, NextResponse } from "next/server";
import { listProfissionaisQuerySchema, createProfissionalSchema } from "./_schemas";
import { listProfissionais } from "@/app/(back-end)/_usecases/profissional/list";
import { createProfissional } from "@/app/(back-end)/_usecases/profissional/create";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["admin", "auxiliar", "profissional", "atendente"]);
    const { searchParams } = new URL(req.url);
    const filter = listProfissionaisQuerySchema.parse({
      ativo: searchParams.get("ativo") ?? undefined,
    });
    const profissionais = await listProfissionais(filter);
    return NextResponse.json({ profissionais });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["admin"]);
    const body = await req.json();
    const input = createProfissionalSchema.parse(body);
    const profissional = await createProfissional(input);
    return NextResponse.json({ profissional }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
