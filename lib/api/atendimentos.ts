import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  AgendamentoListItem,
  StatusAgendamento,
  StatusPagamento,
} from "./agendamentos";

export type { StatusAgendamento, StatusPagamento };

export interface AtendimentoListItem extends AgendamentoListItem {
  motivoDescontoOuGratuidade?: string | null;
}

export interface AtendimentoDetail extends AtendimentoListItem {
  paciente: AgendamentoListItem["paciente"] & { email?: string };
  profissional: AgendamentoListItem["profissional"] & { conselho?: string };
  prontuarioInterno: unknown;
}

export interface CreateWalkInInput {
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  data: string;
  hora: string;
  valorConsulta: number;
  statusPagamento: StatusPagamento;
  motivoDescontoOuGratuidade?: string;
  prontuarioInterno?: unknown;
  observacoes?: string;
}

export interface FinalizarAtendimentoInput {
  valorConsulta: number;
  statusPagamento: StatusPagamento;
  motivoDescontoOuGratuidade?: string;
  prontuarioInterno?: unknown;
  observacoes?: string;
}

export interface UpdateAtendimentoInput {
  valorConsulta?: number;
  statusPagamento?: StatusPagamento;
  motivoDescontoOuGratuidade?: string | null;
  prontuarioInterno?: unknown;
  observacoes?: string | null;
  motivo: string;
}

export const apiListAtendimentos = (filter?: {
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  profissionalId?: string;
  pacienteId?: string;
  consultorioId?: string;
  status?: StatusAgendamento;
  statusPagamento?: StatusPagamento;
}) => {
  const params = new URLSearchParams();
  if (filter?.data) params.set("data", filter.data);
  if (filter?.dataInicio) params.set("dataInicio", filter.dataInicio);
  if (filter?.dataFim) params.set("dataFim", filter.dataFim);
  if (filter?.profissionalId) params.set("profissionalId", filter.profissionalId);
  if (filter?.pacienteId) params.set("pacienteId", filter.pacienteId);
  if (filter?.consultorioId) params.set("consultorioId", filter.consultorioId);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.statusPagamento) params.set("statusPagamento", filter.statusPagamento);
  const qs = params.toString();
  return apiGet<{ atendimentos: AtendimentoListItem[] }>(
    `/api/atendimentos${qs ? `?${qs}` : ""}`,
  );
};

export const apiGetAtendimento = (id: string) =>
  apiGet<{ atendimento: AtendimentoDetail }>(`/api/atendimentos/${id}`);

export const apiCreateWalkIn = (input: CreateWalkInInput) =>
  apiPost<{ atendimento: AtendimentoDetail }>("/api/atendimentos", input);

export const apiFinalizarAtendimento = (
  id: string,
  input: FinalizarAtendimentoInput,
) =>
  apiPost<{ atendimento: AtendimentoDetail }>(
    `/api/atendimentos/${id}/finalizar`,
    input,
  );

export const apiUpdateAtendimento = (id: string, input: UpdateAtendimentoInput) =>
  apiPatch<{ atendimento: AtendimentoDetail }>(`/api/atendimentos/${id}`, input);

export const apiIniciarAtendimento = (id: string) =>
  apiPost<{ atendimento: AtendimentoListItem }>(
    `/api/agendamentos/${id}/iniciar`,
    {},
  );

export const apiNaoCompareceu = (id: string) =>
  apiPost<{ atendimento: AtendimentoListItem }>(
    `/api/agendamentos/${id}/nao-compareceu`,
    {},
  );
