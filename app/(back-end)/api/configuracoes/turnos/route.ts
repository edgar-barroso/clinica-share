import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getTurnos,
  setTurnos,
} from "@/app/(back-end)/_usecases/configuracao/turnos";
import { requireUser } from "@/app/(back-end)/_lib/require-role";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

const horaSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Hora deve estar em formato HH:mm");

const turnoSchema = z
  .object({
    inicio: horaSchema,
    fim: horaSchema,
  })
  .refine((v) => v.fim > v.inicio, {
    message: "fim deve ser > inicio",
    path: ["fim"],
  });

const turnosSchema = z.object({
  manha: turnoSchema,
  tarde: turnoSchema,
  noite: turnoSchema,
});

export async function GET(req: NextRequest) {
  try {
    await requireUser(req, ["admin", "auxiliar", "atendente", "profissional"]);
    const turnos = await getTurnos();
    return NextResponse.json({ turnos });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser(req, ["admin"]);
    const body = await req.json();
    const turnos = turnosSchema.parse(body);
    const updated = await setTurnos(turnos, user);
    return NextResponse.json({ turnos: updated });
  } catch (err) {
    return handleError(err);
  }
}
