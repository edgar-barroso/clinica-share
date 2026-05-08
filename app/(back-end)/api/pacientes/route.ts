import { NextRequest, NextResponse } from "next/server";
import { listPacientesQuerySchema, createPacienteSchema } from "./_schemas";
import { listPacientes } from "@/app/(back-end)/_usecases/paciente/list";
import { createPaciente } from "@/app/(back-end)/_usecases/paciente/create";
import { requireRole } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["admin", "auxiliar", "atendente", "profissional"]);
    const { searchParams } = new URL(req.url);
    const filter = listPacientesQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
    });
    const pacientes = await listPacientes(filter);
    return NextResponse.json({ pacientes });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["admin", "atendente"]);
    const body = await req.json();
    const input = createPacienteSchema.parse(body);
    const paciente = await createPaciente(input);
    return NextResponse.json({ paciente }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
