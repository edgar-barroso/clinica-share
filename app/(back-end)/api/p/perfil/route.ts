import { NextRequest, NextResponse } from "next/server";
import { updatePacienteSchema } from "@/app/(back-end)/api/pacientes/_schemas";
import { getPaciente } from "@/app/(back-end)/_usecases/paciente/get";
import { updatePaciente } from "@/app/(back-end)/_usecases/paciente/update";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";
import { NaoAutorizado } from "@/app/(back-end)/_lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req, ["paciente"]);
    if (!user.pacienteId) {
      throw new NaoAutorizado(
        "Usuário paciente sem registro vinculado. Contate o administrador.",
      );
    }
    const paciente = await getPaciente(user.pacienteId);
    return NextResponse.json({ paciente });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req, ["paciente"]);
    if (!user.pacienteId) {
      throw new NaoAutorizado(
        "Usuário paciente sem registro vinculado. Contate o administrador.",
      );
    }
    const body = await req.json();
    const input = updatePacienteSchema.parse(body);
    const paciente = await updatePaciente(user.pacienteId, input);
    return NextResponse.json({ paciente });
  } catch (err) {
    return handleError(err);
  }
}
