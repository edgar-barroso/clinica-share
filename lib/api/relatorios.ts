import { apiGet } from "@/lib/api-client";

export interface RelatorioFinanceiroLinha {
  profissionalId: string;
  profissionalNome: string;
  modalidade: string;
  qtdAtendimentos: number;
  receitaBruta: string;
  repasseEstimado: string;
  margemClinica: string;
}

export interface RelatorioFinanceiroResponse {
  linhas: RelatorioFinanceiroLinha[];
  totais: {
    qtdAtendimentos: number;
    receitaBruta: string;
    repasseEstimado: string;
    margemClinica: string;
  };
}

export interface RelatorioConsultoriosLinha {
  consultorioId: string;
  nome: string;
  tipo: string;
  qtdAtendimentos: number;
  receita: string;
}

export interface RelatorioGratuitasLinha {
  id: string;
  data: string;
  hora: string;
  profissional: string;
  especialidade: string;
  paciente: string;
  motivo: string;
  valorOriginal: string;
}

export interface RelatorioCancelamentosLinha {
  id: string;
  data: string;
  hora: string;
  status: "cancelado" | "nao_compareceu";
  profissional: string;
  paciente: string;
  motivo: string;
}

interface PeriodoFilter {
  dataInicio: string;
  dataFim: string;
}

const qs = (filter: object) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (typeof v === "string" && v.length > 0) p.set(k, v);
  }
  return p.toString();
};

export const apiRelatorioFinanceiro = (
  filter: PeriodoFilter & { profissionalId?: string; consultorioId?: string },
) =>
  apiGet<RelatorioFinanceiroResponse>(
    `/api/relatorios/financeiro?${qs(filter)}`,
  );

export const apiRelatorioConsultorios = (filter: PeriodoFilter) =>
  apiGet<{ linhas: RelatorioConsultoriosLinha[] }>(
    `/api/relatorios/consultorios?${qs(filter)}`,
  );

export const apiRelatorioGratuitas = (filter: PeriodoFilter) =>
  apiGet<{ linhas: RelatorioGratuitasLinha[]; totalAtendimentos: number }>(
    `/api/relatorios/gratuitas?${qs(filter)}`,
  );

export const apiRelatorioCancelamentos = (filter: PeriodoFilter) =>
  apiGet<{
    linhas: RelatorioCancelamentosLinha[];
    totais: { cancelados: number; naoCompareceu: number; total: number };
  }>(`/api/relatorios/cancelamentos?${qs(filter)}`);
