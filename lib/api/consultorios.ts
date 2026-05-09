import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export interface Consultorio {
  id: string;
  nome: string;
  tipo: string;
  equipamentos: string[];
  especialidadesCompativeis: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultorioInput {
  nome: string;
  tipo: string;
  equipamentos: string[];
  especialidadesCompativeis: string[];
}

export type UpdateConsultorioInput = Partial<CreateConsultorioInput> & {
  ativo?: boolean;
};

export const apiListConsultorios = (filter?: { ativo?: boolean | "all" }) => {
  const qs =
    filter?.ativo === undefined ? "" : `?ativo=${filter.ativo === "all" ? "all" : filter.ativo}`;
  return apiGet<{ consultorios: Consultorio[] }>(`/api/consultorios${qs}`);
};

export const apiGetConsultorio = (id: string) =>
  apiGet<{ consultorio: Consultorio }>(`/api/consultorios/${id}`);

export const apiCreateConsultorio = (input: CreateConsultorioInput) =>
  apiPost<{ consultorio: Consultorio }>("/api/consultorios", input);

export const apiUpdateConsultorio = (id: string, input: UpdateConsultorioInput) =>
  apiPatch<{ consultorio: Consultorio }>(`/api/consultorios/${id}`, input);

export const apiDeactivateConsultorio = (id: string) =>
  apiDelete<{ consultorio: Consultorio }>(`/api/consultorios/${id}`);
