import { NextRequest, NextResponse } from "next/server";
import { listConsultoriosQuerySchema, createConsultorioSchema } from "./_schemas";
import { listConsultorios } from "@/app/(back-end)/_usecases/consultorio/list";
import { createConsultorio } from "@/app/(back-end)/_usecases/consultorio/create";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["admin", "auxiliar", "profissional", "atendente"]);
    const { searchParams } = new URL(req.url);
    const filter = listConsultoriosQuerySchema.parse({
      ativo: searchParams.get("ativo") ?? undefined,
    });
    const consultorios = await listConsultorios(filter);
    return NextResponse.json({ consultorios });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["admin"]);
    const body = await req.json();
    const input = createConsultorioSchema.parse(body);
    const consultorio = await createConsultorio(input);
    return NextResponse.json({ consultorio }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
