import { prisma } from "@/lib/db";
import type { CreateConsultorioInput } from "@/app/(back-end)/api/consultorios/_schemas";

export async function createConsultorio(input: CreateConsultorioInput) {
  return prisma.consultorio.create({ data: input });
}
