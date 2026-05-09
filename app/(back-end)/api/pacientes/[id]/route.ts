import { NextRequest, NextResponse } from "next/server";
import { updatePacienteSchema } from "../_schemas";
import { getPaciente } from "@/app/(back-end)/_usecases/paciente/get";
import { updatePaciente } from "@/app/(back-end)/_usecases/paciente/update";
import { requireRole, requireUser } from "@/app/(back-end)/_lib/require-role";
import { NaoAutorizado } from "@/app/(back-end)/_lib/errors";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser(req);
    // Paciente só vê o próprio (RF-023). Outros roles veem todos.
    if (user.role === "paciente" && user.pacienteId !== id) {
      throw new NaoAutorizado("Você só pode acessar o próprio cadastro");
    }
    const paciente = await getPaciente(id);
    return NextResponse.json({ paciente });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser(req, ["admin", "atendente", "paciente"]);
    if (user.role === "paciente" && user.pacienteId !== id) {
      throw new NaoAutorizado("Você só pode editar o próprio cadastro");
    }
    const body = await req.json();
    const input = updatePacienteSchema.parse(body);
    const paciente = await updatePaciente(id, input);
    return NextResponse.json({ paciente });
  } catch (err) {
    return handleError(err);
  }
}
