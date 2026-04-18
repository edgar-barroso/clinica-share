export type Turno = "manha" | "tarde" | "noite";

export interface Consultorio {
  id: string;
  nome: string;
  tipo: string;
  equipamentos: string[];
  especialidadesCompativeis: string[];
}

export type ModalidadeContrato = "aluguel-fixo" | "percentual";

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  conselho: string;
  email: string;
  telefone: string;
  ativo: boolean;
  modalidadeContrato: ModalidadeContrato;
  percentualRepasse: number | null;
  valorAluguelPorTurno: number | null;
  duracaoConsultaMinutos: number;
  turnosFixos: Array<{ dia: number; turno: Turno; consultorioId: string }>;
}

export interface Paciente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
}

export type StatusPagamento = "pago" | "pendente" | "gratuito";
export type StatusAgendamento =
  | "agendado"
  | "confirmado"
  | "realizado"
  | "cancelado"
  | "nao-compareceu";

export interface ProcedimentoExtra {
  nome: string;
  valor: number;
}

export interface Atendimento {
  id: string;
  data: string;
  hora: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  valorConsulta: number;
  procedimentos: ProcedimentoExtra[];
  status: StatusAgendamento;
  statusPagamento: StatusPagamento;
  motivoDescontoOuGratuidade?: string;
  motivoCancelamento?: string;
  usaProntuarioExterno: boolean;
  observacoes?: string;
}

export type StatusRepasse = "aberto" | "pago";

export interface Repasse {
  id: string;
  profissionalId: string;
  periodoInicio: string;
  periodoFim: string;
  atendimentosIds: string[];
  receitaBruta: number;
  valorRepasse: number;
  status: StatusRepasse;
  dataPagamento?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userNome: string;
  entidade: string;
  entidadeId: string;
  campo: string;
  valorAntes: string;
  valorDepois: string;
  motivo: string;
}
