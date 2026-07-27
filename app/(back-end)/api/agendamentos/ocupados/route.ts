import { NextRequest, NextResponse } from "next/server";
import { listOcupadosQuerySchema } from "../_schemas";
import { listOcupados } from "@/app/(back-end)/_usecases/agendamento/ocupados";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { NaoAutorizado } from "@/app/(back-end)/_lib/errors";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

/**
 * Disponibilidade de um profissional: só os `(data, hora)` já tomados.
 *
 * Separado de `GET /api/agendamentos` porque aquela rota é filtrada por RBAC
 * (o paciente vê apenas as consultas dele, RF-023) e por isso não serve para
 * montar slots livres. Aqui não vaza nada de paciente — nem nome, nem valor,
 * nem consultório.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req, [
      "admin",
      "auxiliar",
      "profissional",
      "atendente",
      "paciente",
    ]);
    const { searchParams } = new URL(req.url);
    const filter = listOcupadosQuerySchema.parse({
      profissionalId: searchParams.get("profissionalId") ?? undefined,
      data: searchParams.get("data") ?? undefined,
      dataInicio: searchParams.get("dataInicio") ?? undefined,
      dataFim: searchParams.get("dataFim") ?? undefined,
    });

    // RF-023: profissional não espia a agenda de outro profissional. Paciente e
    // equipe precisam da disponibilidade para conseguir agendar.
    if (
      user.role === "profissional" &&
      user.profissionalId !== filter.profissionalId
    ) {
      throw new NaoAutorizado("Você só pode consultar a própria agenda");
    }

    const ocupados = await listOcupados(filter);
    return NextResponse.json({ ocupados });
  } catch (err) {
    return handleError(err);
  }
}
