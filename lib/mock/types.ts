export type Turno = "manha" | "tarde" | "noite";

export interface Periodo {
  inicio: string;
  fim: string;
}

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
  telefone: string;
  email: string;
  cpf?: string;
  dataNascimento?: string;
  sexo?: Sexo;
  endereco?: EnderecoPaciente;
  plano?: PlanoPaciente;
  /**
   * Indica se a credencial de acesso ao portal foi configurada (PEND-036).
   * Senha em si nunca é guardada no mock — em produção será hash.
   */
  senhaDefinida?: boolean;
}

export type StatusPagamento = "pago" | "pendente" | "gratuito";
export type StatusAgendamento =
  | "agendado"
  | "em_atendimento"
  | "realizado"
  | "cancelado"
  | "nao_compareceu";

export interface ProcedimentoExtra {
  nome: string;
  valor: number;
}

export interface ProntuarioInterno {
  evolucao: string;
  diagnostico: string;
  conduta: string;
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
  prontuarioInterno?: ProntuarioInterno;
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
