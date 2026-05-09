import { apiGet } from "@/lib/api-client";

export interface DashboardStats {
  receitaBruta: string;
  qtdAtendimentosRealizados: number;
  repasseProjetado: string;
  margemClinica: string;
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
