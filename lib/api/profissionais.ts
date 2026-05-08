import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export type ModalidadeContrato = "aluguel_fixo" | "percentual";
export type Turno = "manha" | "tarde" | "noite";

export interface TurnoFixo {
  id: string;
  diaSemana: number;
  turno: Turno;
  consultorioId: string;
  consultorio: { id: string; nome: string };
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  conselho: string;
  email: string;
  telefone: string;
  ativo: boolean;
  modalidadeContrato: ModalidadeContrato;
  percentualRepasse: string | null;
  valorAluguelPorTurno: string | null;
  duracaoConsultaMinutos: number;
  turnosFixos?: TurnoFixo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfissionalInput {
  nome: string;
  especialidade: string;
  conselho: string;
  email: string;
  telefone: string;
  modalidadeContrato: ModalidadeContrato;
  percentualRepasse?: number | null;
  valorAluguelPorTurno?: number | null;
  duracaoConsultaMinutos: number;
}

export type UpdateProfissionalInput = Partial<CreateProfissionalInput> & {
  ativo?: boolean;
  motivo?: string;
};

export const apiListProfissionais = (filter?: { ativo?: boolean | "all" }) => {
  const qs =
    filter?.ativo === undefined ? "" : `?ativo=${filter.ativo === "all" ? "all" : filter.ativo}`;
  return apiGet<{ profissionais: Profissional[] }>(`/api/profissionais${qs}`);
};

export const apiGetProfissional = (id: string) =>
  apiGet<{ profissional: Profissional }>(`/api/profissionais/${id}`);

export const apiCreateProfissional = (input: CreateProfissionalInput) =>
  apiPost<{ profissional: Profissional }>("/api/profissionais", input);

export const apiUpdateProfissional = (id: string, input: UpdateProfissionalInput) =>
  apiPatch<{ profissional: Profissional }>(`/api/profissionais/${id}`, input);

export const apiDeactivateProfissional = (id: string) =>
  apiDelete<{ profissional: Profissional }>(`/api/profissionais/${id}`);

export const apiAddTurnoFixo = (
  profissionalId: string,
  input: { consultorioId: string; diaSemana: number; turno: Turno },
) => apiPost<{ turno: TurnoFixo }>(`/api/profissionais/${profissionalId}/turnos-fixos`, input);

export const apiRemoveTurnoFixo = (profissionalId: string, turnoId: string) =>
  apiDelete<{ ok: true }>(`/api/profissionais/${profissionalId}/turnos-fixos/${turnoId}`);
