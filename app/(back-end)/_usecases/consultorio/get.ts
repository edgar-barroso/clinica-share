import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function getConsultorio(id: string) {
  const consultorio = await prisma.consultorio.findUnique({ where: { id } });
  if (!consultorio) throw new NaoEncontrado("Consultório");
  return consultorio;
}
