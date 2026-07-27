import { apiGet, apiPost } from "@/lib/api-client";

export type StatusAgendamento =
  | "agendado"
  | "em_atendimento"
  | "realizado"
  | "cancelado"
  | "nao_compareceu";

export type StatusPagamento = "pago" | "pendente" | "gratuito";

export interface AgendamentoListItem {
  id: string;
  data: string;
  hora: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  valorConsulta: string;
  status: StatusAgendamento;
  statusPagamento: StatusPagamento;
  motivoCancelamento: string | null;
  observacoes: string | null;
  paciente: { id: string; nome: string; telefone: string };
  profissional: { id: string; nome: string; especialidade: string };
  consultorio: { id: string; nome: string };
}

/**
 * Status que tiram o agendamento da fila de trabalho do profissional: o
 * atendimento já foi realizado, o paciente faltou, ou o agendamento foi
 * cancelado. Nenhum dos três pede mais nenhuma ação na agenda.
 */
export const STATUS_ENCERRADOS: StatusAgendamento[] = [
  "realizado",
  "nao_compareceu",
  "cancelado",
];

/** True quando o agendamento ainda pede ação (`agendado` ou `em_atendimento`). */
export function agendamentoEmAberto(a: { status: StatusAgendamento }): boolean {
  return !STATUS_ENCERRADOS.includes(a.status);
}

export interface CreateAgendamentoInput {
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  observacoes?: string;
}

export const apiListAgendamentos = (filter?: {
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  profissionalId?: string;
  pacienteId?: string;
  consultorioId?: string;
  status?: StatusAgendamento;
}) => {
  const params = new URLSearchParams();
  if (filter?.data) params.set("data", filter.data);
  if (filter?.dataInicio) params.set("dataInicio", filter.dataInicio);
  if (filter?.dataFim) params.set("dataFim", filter.dataFim);
  if (filter?.profissionalId) params.set("profissionalId", filter.profissionalId);
  if (filter?.pacienteId) params.set("pacienteId", filter.pacienteId);
  if (filter?.consultorioId) params.set("consultorioId", filter.consultorioId);
  if (filter?.status) params.set("status", filter.status);
  const qs = params.toString();
  return apiGet<{ agendamentos: AgendamentoListItem[] }>(
    `/api/agendamentos${qs ? `?${qs}` : ""}`,
  );
};

/**
 * Horários tomados na agenda de um profissional. É o que a tela de agendamento
 * deve usar para montar slots livres: `apiListAgendamentos` é filtrada por RBAC
 * e, para o paciente, devolve só as consultas dele — a agenda parecia vazia e o
 * conflito só aparecia no confirmar (409/AG05).
 */
export const apiListOcupados = (filter: {
  profissionalId: string;
  data?: string;
  dataInicio?: string;
  dataFim?: string;
}) => {
  const params = new URLSearchParams({ profissionalId: filter.profissionalId });
  if (filter.data) params.set("data", filter.data);
  if (filter.dataInicio) params.set("dataInicio", filter.dataInicio);
  if (filter.dataFim) params.set("dataFim", filter.dataFim);
  return apiGet<{ ocupados: { data: string; hora: string }[] }>(
    `/api/agendamentos/ocupados?${params.toString()}`,
  );
};

export const apiGetAgendamento = (id: string) =>
  apiGet<{ agendamento: AgendamentoListItem }>(`/api/agendamentos/${id}`);

export const apiCreateAgendamento = (input: CreateAgendamentoInput) =>
  apiPost<{ agendamento: AgendamentoListItem }>("/api/agendamentos", input);

export const apiCancelarAgendamento = (id: string, motivo: string) =>
  apiPost<{ agendamento: AgendamentoListItem }>(
    `/api/agendamentos/${id}/cancelar`,
    { motivo },
  );

export const apiMarcarChegada = (id: string) =>
  apiPost<{ agendamento: AgendamentoListItem }>(
    `/api/agendamentos/${id}/marcar-chegada`,
    {},
  );
