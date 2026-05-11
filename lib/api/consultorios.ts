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

// ============ Dashboard UC002 =========================================

export type ModalidadeFiltro = "aluguel_fixo" | "percentual" | "todos";

export interface DashboardConsultoriosLinha {
  consultorioId: string;
  nome: string;
  tipo: string;
  qtdAtendimentos: number;
  receitaTotal: string;
  receitaMediaPorAtendimento: string;
  taxaOcupacao: number;
}

export interface DashboardConsultoriosKPIs {
  totalAtendimentos: number;
  receitaTotal: string;
  taxaOcupacaoMedia: number;
}

export interface DashboardConsultoriosResponse {
  kpis: DashboardConsultoriosKPIs;
  linhas: DashboardConsultoriosLinha[];
}

export interface DetalheAtendimento {
  id: string;
  data: string;
  hora: string;
  profissionalId: string;
  profissionalNome: string;
  modalidade: "aluguel_fixo" | "percentual";
  valorConsulta: string;
}

export interface DetalheProfissionalLinha {
  profissionalId: string;
  nome: string;
  modalidade: "aluguel_fixo" | "percentual";
  qtdAtendimentos: number;
  valorGerado: string;
}

export interface DetalheConsultorioResponse {
  consultorio: { id: string; nome: string; tipo: string };
  atendimentos: DetalheAtendimento[];
  porProfissional: DetalheProfissionalLinha[];
  porModalidade: {
    aluguelFixo: { qtdAtendimentos: number; valor: string };
    percentual: { qtdAtendimentos: number; valor: string };
  };
  totais: { qtdAtendimentos: number; valor: string };
}

interface DashboardFilter {
  dataInicio: string;
  dataFim: string;
  modalidade?: ModalidadeFiltro;
}

export const apiDashboardConsultorios = (filter: DashboardFilter) => {
  const params = new URLSearchParams({
    dataInicio: filter.dataInicio,
    dataFim: filter.dataFim,
  });
  if (filter.modalidade && filter.modalidade !== "todos") {
    params.set("modalidade", filter.modalidade);
  }
  return apiGet<DashboardConsultoriosResponse>(
    `/api/consultorios/dashboard?${params.toString()}`,
  );
};

export const apiDetalheConsultorio = (
  id: string,
  filter: { dataInicio: string; dataFim: string },
) => {
  const params = new URLSearchParams({
    dataInicio: filter.dataInicio,
    dataFim: filter.dataFim,
  });
  return apiGet<DetalheConsultorioResponse>(
    `/api/consultorios/${id}/dashboard?${params.toString()}`,
  );
};
