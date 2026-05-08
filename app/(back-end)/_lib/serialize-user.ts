import type { Prisma } from "@prisma/client";

type UserWithRelations = Prisma.UserGetPayload<{
  include: { paciente: true; profissional: true; staff: true };
}>;

export interface AuthUserResponse {
  id: string;
  email: string;
  role: string;
  ativo: boolean;
  pacienteId: string | null;
  profissionalId: string | null;
  staffId: string | null;
  paciente: { id: string; nome: string } | null;
  profissional: { id: string; nome: string } | null;
  staff: { id: string; nome: string } | null;
}

export function serializeUser(user: UserWithRelations): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    ativo: user.ativo,
    pacienteId: user.pacienteId,
    profissionalId: user.profissionalId,
    staffId: user.staffId,
    paciente: user.paciente ? { id: user.paciente.id, nome: user.paciente.nome } : null,
    profissional: user.profissional ? { id: user.profissional.id, nome: user.profissional.nome } : null,
    staff: user.staff ? { id: user.staff.id, nome: user.staff.nome } : null,
  };
}
