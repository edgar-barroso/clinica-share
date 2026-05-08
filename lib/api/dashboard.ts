import { apiGet } from "@/lib/api-client";

export interface DashboardStats {
  repassesAbertos: string;
  repassesPagos: string;
  repassesTotal: string;
  qtdRepassesAbertos: number;
  qtdRepassesPagos: number;
  profissionaisAtivos: number;
  profissionaisTotal: number;
  atendimentosPendentes: number;
  receitaPorDia: { data: string; receita: string }[];
}

export const apiDashboardStats = (filter: {
  dataInicio: string;
  dataFim: string;
}) => {
  const params = new URLSearchParams({
    dataInicio: filter.dataInicio,
    dataFim: filter.dataFim,
  });
  return apiGet<{ stats: DashboardStats }>(`/api/dashboard?${params}`);
};
