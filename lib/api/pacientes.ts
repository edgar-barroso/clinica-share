import { apiGet, apiPost, apiPatch } from "@/lib/api-client";

export type Sexo = "M" | "F" | "outro";

export interface EnderecoPaciente {
  cep: string;
  rua: string;
  numero: string;
  cidade: string;
  uf: string;
}

export interface PlanoPaciente {
  temPlano: boolean;
  operadora?: string;
  numeroCarteirinha?: string;
}

export interface Paciente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string | null;
  dataNascimento: string | null;
  sexo: Sexo | null;
  endereco: EnderecoPaciente | null;
  plano: PlanoPaciente | null;
  senhaDefinida: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePacienteInput {
  nome: string;
  email: string;
  telefone: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  sexo?: Sexo | null;
  endereco?: EnderecoPaciente | null;
  plano?: PlanoPaciente | null;
}

export type UpdatePacienteInput = Partial<CreatePacienteInput>;

export const apiListPacientes = (filter?: { q?: string }) => {
  const qs = filter?.q ? `?q=${encodeURIComponent(filter.q)}` : "";
  return apiGet<{ pacientes: Paciente[] }>(`/api/pacientes${qs}`);
};

export const apiGetPaciente = (id: string) =>
  apiGet<{ paciente: Paciente }>(`/api/pacientes/${id}`);

export const apiCreatePaciente = (input: CreatePacienteInput) =>
  apiPost<{ paciente: Paciente }>("/api/pacientes", input);

export const apiUpdatePaciente = (id: string, input: UpdatePacienteInput) =>
  apiPatch<{ paciente: Paciente }>(`/api/pacientes/${id}`, input);
