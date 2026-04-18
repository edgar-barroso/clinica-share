import type {
  Atendimento,
  AuditLog,
  Consultorio,
  Paciente,
  Profissional,
  Repasse,
} from "./types";

export const consultorios: Consultorio[] = [
  {
    id: "c01",
    nome: "Sala 01",
    tipo: "Consultório Clínico",
    equipamentos: ["Maca", "Otoscópio", "Balança"],
    especialidadesCompativeis: ["Clínica geral", "Cardiologia", "Neurologia"],
  },
  {
    id: "c02",
    nome: "Sala 02",
    tipo: "Consultório Clínico",
    equipamentos: ["Maca", "Equipamento para ECG"],
    especialidadesCompativeis: ["Clínica geral", "Cardiologia"],
  },
  {
    id: "c03",
    nome: "Sala 03",
    tipo: "Consultório Especializado",
    equipamentos: ["Refrator", "Lâmpada de fenda", "Campímetro"],
    especialidadesCompativeis: ["Oftalmologia"],
  },
  {
    id: "c04",
    nome: "Sala 04",
    tipo: "Consultório Clínico",
    equipamentos: ["Maca", "Estetoscópio"],
    especialidadesCompativeis: ["Clínica geral", "Pediatria"],
  },
  {
    id: "c05",
    nome: "Sala 05",
    tipo: "Consultório Pediátrico",
    equipamentos: ["Maca pediátrica", "Brinquedos", "Balança infantil"],
    especialidadesCompativeis: ["Pediatria"],
  },
  {
    id: "c06",
    nome: "Sala 06",
    tipo: "Consultório Psicológico",
    equipamentos: ["Poltronas", "Isolamento acústico"],
    especialidadesCompativeis: ["Psicologia", "Psiquiatria"],
  },
  {
    id: "c07",
    nome: "Sala 07",
    tipo: "Consultório Especializado",
    equipamentos: ["ECG", "Esteira ergométrica"],
    especialidadesCompativeis: ["Cardiologia"],
  },
  {
    id: "c08",
    nome: "Sala 08",
    tipo: "Consultório Ginecológico",
    equipamentos: ["Maca ginecológica", "Ultrassom"],
    especialidadesCompativeis: ["Ginecologia", "Obstetrícia"],
  },
  {
    id: "c09",
    nome: "Sala 09",
    tipo: "Sala de Procedimentos",
    equipamentos: ["Maca", "Aparelho ultrassom portátil"],
    especialidadesCompativeis: ["Clínica geral", "Ginecologia", "Ortopedia"],
  },
  {
    id: "c10",
    nome: "Sala 10",
    tipo: "Consultório Fisioterapia",
    equipamentos: ["Maca", "TENS", "Ultrassom terapêutico"],
    especialidadesCompativeis: ["Fisioterapia"],
  },
  {
    id: "c11",
    nome: "Sala 11",
    tipo: "Consultório Nutrição",
    equipamentos: ["Bioimpedância", "Balança", "Adipômetro"],
    especialidadesCompativeis: ["Nutrição", "Endocrinologia"],
  },
  {
    id: "c12",
    nome: "Sala 12",
    tipo: "Consultório Dermatológico",
    equipamentos: ["Dermatoscópio", "Lupa clínica"],
    especialidadesCompativeis: ["Dermatologia"],
  },
];

export const profissionais: Profissional[] = [
  {
    id: "p01",
    nome: "Dra. Nirmala Azalea",
    especialidade: "Oftalmologia",
    conselho: "CRM/SP 123456",
    email: "nirmala.azalea@clinicashare.com.br",
    telefone: "(11) 98765-1001",
    ativo: true,
    modalidadeContrato: "percentual",
    percentualRepasse: 0.3,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 30,
    turnosFixos: [
      { dia: 1, turno: "manha", consultorioId: "c03" },
      { dia: 3, turno: "manha", consultorioId: "c03" },
      { dia: 5, turno: "tarde", consultorioId: "c03" },
    ],
  },
  {
    id: "p02",
    nome: "Dr. Rafael Costa",
    especialidade: "Cardiologia",
    conselho: "CRM/SP 234567",
    email: "rafael.costa@clinicashare.com.br",
    telefone: "(11) 98765-1002",
    ativo: true,
    modalidadeContrato: "percentual",
    percentualRepasse: 0.25,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 45,
    turnosFixos: [
      { dia: 2, turno: "tarde", consultorioId: "c07" },
      { dia: 4, turno: "tarde", consultorioId: "c07" },
    ],
  },
  {
    id: "p03",
    nome: "Dra. Helena Lima",
    especialidade: "Pediatria",
    conselho: "CRM/SP 345678",
    email: "helena.lima@clinicashare.com.br",
    telefone: "(11) 98765-1003",
    ativo: true,
    modalidadeContrato: "percentual",
    percentualRepasse: 0.3,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 30,
    turnosFixos: [
      { dia: 1, turno: "tarde", consultorioId: "c05" },
      { dia: 3, turno: "tarde", consultorioId: "c05" },
    ],
  },
  {
    id: "p04",
    nome: "Marcos Tavares",
    especialidade: "Psicologia",
    conselho: "CRP 06/98765",
    email: "marcos.tavares@clinicashare.com.br",
    telefone: "(11) 98765-1004",
    ativo: true,
    modalidadeContrato: "aluguel-fixo",
    percentualRepasse: null,
    valorAluguelPorTurno: 180,
    duracaoConsultaMinutos: 50,
    turnosFixos: [
      { dia: 2, turno: "noite", consultorioId: "c06" },
      { dia: 4, turno: "noite", consultorioId: "c06" },
    ],
  },
  {
    id: "p05",
    nome: "Dra. Beatriz Rocha",
    especialidade: "Ginecologia",
    conselho: "CRM/SP 456789",
    email: "beatriz.rocha@clinicashare.com.br",
    telefone: "(11) 98765-1005",
    ativo: true,
    modalidadeContrato: "percentual",
    percentualRepasse: 0.28,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 30,
    turnosFixos: [{ dia: 5, turno: "manha", consultorioId: "c08" }],
  },
  {
    id: "p06",
    nome: "Juliana Prado",
    especialidade: "Fisioterapia",
    conselho: "CREFITO 12345-F",
    email: "juliana.prado@clinicashare.com.br",
    telefone: "(11) 98765-1006",
    ativo: true,
    modalidadeContrato: "aluguel-fixo",
    percentualRepasse: null,
    valorAluguelPorTurno: 150,
    duracaoConsultaMinutos: 40,
    turnosFixos: [
      { dia: 1, turno: "manha", consultorioId: "c10" },
      { dia: 3, turno: "manha", consultorioId: "c10" },
    ],
  },
];

export const pacientes: Paciente[] = [
  { id: "pt01", nome: "João Pereira", telefone: "(11) 99111-0001", email: "joao.pereira@email.com" },
  { id: "pt02", nome: "Maria Silva", telefone: "(11) 99111-0002", email: "maria.silva@email.com" },
  { id: "pt03", nome: "Ana Souza", telefone: "(11) 99111-0003", email: "ana.souza@email.com" },
  { id: "pt04", nome: "Pedro Oliveira", telefone: "(11) 99111-0004", email: "pedro.oliveira@email.com" },
  { id: "pt05", nome: "Lucas Ferreira", telefone: "(11) 99111-0005", email: "lucas.ferreira@email.com" },
  { id: "pt06", nome: "Juliana Mendes", telefone: "(11) 99111-0006", email: "juliana.mendes@email.com" },
  { id: "pt07", nome: "Rafael Almeida", telefone: "(11) 99111-0007", email: "rafael.almeida@email.com" },
  { id: "pt08", nome: "Carla Barbosa", telefone: "(11) 99111-0008", email: "carla.barbosa@email.com" },
  { id: "pt09", nome: "Fernanda Dias", telefone: "(11) 99111-0009", email: "fernanda.dias@email.com" },
  { id: "pt10", nome: "Tiago Ribeiro", telefone: "(11) 99111-0010", email: "tiago.ribeiro@email.com" },
  { id: "pt11", nome: "Beatriz Gomes", telefone: "(11) 99111-0011", email: "beatriz.gomes@email.com" },
  { id: "pt12", nome: "Eduardo Neves", telefone: "(11) 99111-0012", email: "eduardo.neves@email.com" },
  { id: "pt13", nome: "Patrícia Lopes", telefone: "(11) 99111-0013", email: "patricia.lopes@email.com" },
  { id: "pt14", nome: "Henrique Teixeira", telefone: "(11) 99111-0014", email: "henrique.teixeira@email.com" },
  { id: "pt15", nome: "Camila Santos", telefone: "(11) 99111-0015", email: "camila.santos@email.com" },
  { id: "pt16", nome: "Ricardo Pinheiro", telefone: "(11) 99111-0016", email: "ricardo.pinheiro@email.com" },
  { id: "pt17", nome: "Mariana Cavalcanti", telefone: "(11) 99111-0017", email: "mariana.cavalcanti@email.com" },
  { id: "pt18", nome: "Bruno Carvalho", telefone: "(11) 99111-0018", email: "bruno.carvalho@email.com" },
  { id: "pt19", nome: "Laura Freitas", telefone: "(11) 99111-0019", email: "laura.freitas@email.com" },
  { id: "pt20", nome: "Daniel Moreira", telefone: "(11) 99111-0020", email: "daniel.moreira@email.com" },
];

// Semana-referência 06/04 a 15/04/2026 (R1 foi em 06/04)
const semana = "2026-04";
function iso(d: string, hhmm: string) {
  return `${semana}-${d}T${hhmm}:00`;
}

export const atendimentos: Atendimento[] = [
  // seg 06/04
  {
    id: "a001",
    data: `${semana}-06`,
    hora: "08:30",
    pacienteId: "pt02",
    profissionalId: "p01",
    consultorioId: "c03",
    valorConsulta: 280,
    procedimentos: [{ nome: "Mapeamento de retina", valor: 120 }],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a002",
    data: `${semana}-06`,
    hora: "09:15",
    pacienteId: "pt05",
    profissionalId: "p01",
    consultorioId: "c03",
    valorConsulta: 280,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a003",
    data: `${semana}-06`,
    hora: "08:00",
    pacienteId: "pt08",
    profissionalId: "p06",
    consultorioId: "c10",
    valorConsulta: 180,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a004",
    data: `${semana}-06`,
    hora: "14:00",
    pacienteId: "pt10",
    profissionalId: "p03",
    consultorioId: "c05",
    valorConsulta: 220,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a005",
    data: `${semana}-06`,
    hora: "15:00",
    pacienteId: "pt14",
    profissionalId: "p03",
    consultorioId: "c05",
    valorConsulta: 220,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pendente",
    usaProntuarioExterno: false,
  },

  // ter 07/04
  {
    id: "a006",
    data: `${semana}-07`,
    hora: "14:00",
    pacienteId: "pt03",
    profissionalId: "p02",
    consultorioId: "c07",
    valorConsulta: 350,
    procedimentos: [{ nome: "Eletrocardiograma", valor: 180 }],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a007",
    data: `${semana}-07`,
    hora: "15:30",
    pacienteId: "pt06",
    profissionalId: "p02",
    consultorioId: "c07",
    valorConsulta: 350,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: true,
  },
  {
    id: "a008",
    data: `${semana}-07`,
    hora: "19:00",
    pacienteId: "pt11",
    profissionalId: "p04",
    consultorioId: "c06",
    valorConsulta: 260,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a009",
    data: `${semana}-07`,
    hora: "19:55",
    pacienteId: "pt13",
    profissionalId: "p04",
    consultorioId: "c06",
    valorConsulta: 260,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },

  // qua 08/04
  {
    id: "a010",
    data: `${semana}-08`,
    hora: "08:00",
    pacienteId: "pt09",
    profissionalId: "p06",
    consultorioId: "c10",
    valorConsulta: 180,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a011",
    data: `${semana}-08`,
    hora: "09:00",
    pacienteId: "pt15",
    profissionalId: "p01",
    consultorioId: "c03",
    valorConsulta: 280,
    procedimentos: [{ nome: "Mapeamento de retina", valor: 120 }],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a012",
    data: `${semana}-08`,
    hora: "14:00",
    pacienteId: "pt17",
    profissionalId: "p03",
    consultorioId: "c05",
    valorConsulta: 220,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "gratuito",
    motivoDescontoOuGratuidade: "Cortesia para filho de funcionário",
    usaProntuarioExterno: false,
  },

  // qui 09/04
  {
    id: "a013",
    data: `${semana}-09`,
    hora: "14:30",
    pacienteId: "pt04",
    profissionalId: "p02",
    consultorioId: "c07",
    valorConsulta: 350,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pendente",
    usaProntuarioExterno: false,
  },
  {
    id: "a014",
    data: `${semana}-09`,
    hora: "19:00",
    pacienteId: "pt18",
    profissionalId: "p04",
    consultorioId: "c06",
    valorConsulta: 260,
    procedimentos: [],
    status: "cancelado",
    statusPagamento: "gratuito",
    motivoCancelamento: "Paciente solicitou remarcação por motivo pessoal",
    usaProntuarioExterno: false,
  },

  // sex 10/04
  {
    id: "a015",
    data: `${semana}-10`,
    hora: "08:30",
    pacienteId: "pt01",
    profissionalId: "p05",
    consultorioId: "c08",
    valorConsulta: 300,
    procedimentos: [{ nome: "Ultrassom transvaginal", valor: 220 }],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a016",
    data: `${semana}-10`,
    hora: "09:30",
    pacienteId: "pt07",
    profissionalId: "p05",
    consultorioId: "c08",
    valorConsulta: 300,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pago",
    usaProntuarioExterno: false,
  },
  {
    id: "a017",
    data: `${semana}-10`,
    hora: "15:00",
    pacienteId: "pt16",
    profissionalId: "p01",
    consultorioId: "c03",
    valorConsulta: 280,
    procedimentos: [],
    status: "realizado",
    statusPagamento: "pendente",
    usaProntuarioExterno: false,
  },

  // Agendamentos futuros (13-15/04)
  {
    id: "a018",
    data: `${semana}-13`,
    hora: "08:30",
    pacienteId: "pt19",
    profissionalId: "p01",
    consultorioId: "c03",
    valorConsulta: 280,
    procedimentos: [],
    status: "confirmado",
    statusPagamento: "pendente",
    usaProntuarioExterno: false,
  },
  {
    id: "a019",
    data: `${semana}-13`,
    hora: "14:00",
    pacienteId: "pt20",
    profissionalId: "p03",
    consultorioId: "c05",
    valorConsulta: 220,
    procedimentos: [],
    status: "agendado",
    statusPagamento: "pendente",
    usaProntuarioExterno: false,
  },
  {
    id: "a020",
    data: `${semana}-14`,
    hora: "14:30",
    pacienteId: "pt12",
    profissionalId: "p02",
    consultorioId: "c07",
    valorConsulta: 350,
    procedimentos: [],
    status: "agendado",
    statusPagamento: "pendente",
    usaProntuarioExterno: false,
  },
];

// Calcula repasses por profissional na semana 06-12/abr
function calcularReceitaBruta(profId: string, inicio: string, fim: string) {
  const ats = atendimentos.filter(
    (a) =>
      a.profissionalId === profId &&
      a.data >= inicio &&
      a.data <= fim &&
      a.status === "realizado" &&
      a.statusPagamento === "pago",
  );
  return ats.reduce(
    (acc, a) =>
      acc + a.valorConsulta + a.procedimentos.reduce((s, p) => s + p.valor, 0),
    0,
  );
}

function repasseDeProfissional(prof: Profissional, inicio: string, fim: string) {
  const atsIds = atendimentos
    .filter(
      (a) =>
        a.profissionalId === prof.id &&
        a.data >= inicio &&
        a.data <= fim &&
        a.status === "realizado",
    )
    .map((a) => a.id);
  const receitaBruta = calcularReceitaBruta(prof.id, inicio, fim);
  let valor = 0;
  if (prof.modalidadeContrato === "percentual" && prof.percentualRepasse) {
    valor = receitaBruta * prof.percentualRepasse;
  } else if (prof.modalidadeContrato === "aluguel-fixo" && prof.valorAluguelPorTurno) {
    const turnosNaSemana = atendimentos
      .filter(
        (a) =>
          a.profissionalId === prof.id &&
          a.data >= inicio &&
          a.data <= fim &&
          a.status === "realizado",
      )
      .reduce(
        (set, a) => set.add(`${a.data}-${a.hora < "13:00" ? "m" : a.hora < "18:00" ? "t" : "n"}`),
        new Set<string>(),
      ).size;
    valor = prof.valorAluguelPorTurno * Math.max(1, turnosNaSemana);
  }
  return { atsIds, receitaBruta, valor };
}

const periodoInicio = `${semana}-06`;
const periodoFim = `${semana}-12`;

export const repasses: Repasse[] = profissionais.map((p, i) => {
  const { atsIds, receitaBruta, valor } = repasseDeProfissional(p, periodoInicio, periodoFim);
  return {
    id: `r${String(i + 1).padStart(3, "0")}`,
    profissionalId: p.id,
    periodoInicio,
    periodoFim,
    atendimentosIds: atsIds,
    receitaBruta,
    valorRepasse: Math.round(valor * 100) / 100,
    status: i < 2 ? "pago" : "aberto",
    dataPagamento: i < 2 ? `${semana}-13` : undefined,
  };
});

export const auditoria: AuditLog[] = [
  {
    id: "log001",
    timestamp: `${semana}-13T09:15:00`,
    userId: "admin",
    userNome: "Dr. Edson Andrade",
    entidade: "Repasse",
    entidadeId: "r001",
    campo: "status",
    valorAntes: "aberto",
    valorDepois: "pago",
    motivo: "Pagamento semanal via Pix",
  },
  {
    id: "log002",
    timestamp: `${semana}-13T09:17:00`,
    userId: "admin",
    userNome: "Dr. Edson Andrade",
    entidade: "Repasse",
    entidadeId: "r002",
    campo: "status",
    valorAntes: "aberto",
    valorDepois: "pago",
    motivo: "Pagamento semanal via Pix",
  },
  {
    id: "log003",
    timestamp: `${semana}-08T14:25:00`,
    userId: "auxiliar",
    userNome: "Joana Ribeiro",
    entidade: "Atendimento",
    entidadeId: "a012",
    campo: "statusPagamento",
    valorAntes: "pendente",
    valorDepois: "gratuito",
    motivo: "Cortesia para filho de funcionário",
  },
  {
    id: "log004",
    timestamp: `${semana}-09T19:05:00`,
    userId: "atendente",
    userNome: "Carla Moreira",
    entidade: "Atendimento",
    entidadeId: "a014",
    campo: "status",
    valorAntes: "agendado",
    valorDepois: "cancelado",
    motivo: "Paciente solicitou remarcação por motivo pessoal",
  },
  {
    id: "log005",
    timestamp: `${semana}-06T18:00:00`,
    userId: "auxiliar",
    userNome: "Joana Ribeiro",
    entidade: "Atendimento",
    entidadeId: "a001",
    campo: "statusPagamento",
    valorAntes: "pendente",
    valorDepois: "pago",
    motivo: "Pagamento no ato em dinheiro",
  },
];

// Helpers
export function getProfissional(id: string) {
  return profissionais.find((p) => p.id === id);
}

export function getConsultorio(id: string) {
  return consultorios.find((c) => c.id === id);
}

export function getPaciente(id: string) {
  return pacientes.find((p) => p.id === id);
}

export function atendimentosRealizadosSemana() {
  return atendimentos.filter(
    (a) => a.status === "realizado" && a.data >= periodoInicio && a.data <= periodoFim,
  );
}

export function receitaTotalSemana() {
  return atendimentosRealizadosSemana()
    .filter((a) => a.statusPagamento === "pago")
    .reduce(
      (acc, a) => acc + a.valorConsulta + a.procedimentos.reduce((s, p) => s + p.valor, 0),
      0,
    );
}

export function receitaPorConsultorio() {
  const mapa = new Map<string, { consultorioId: string; receita: number; atendimentos: number }>();
  for (const c of consultorios) {
    mapa.set(c.id, { consultorioId: c.id, receita: 0, atendimentos: 0 });
  }
  for (const a of atendimentosRealizadosSemana()) {
    if (a.statusPagamento === "pago") {
      const atual = mapa.get(a.consultorioId)!;
      atual.receita +=
        a.valorConsulta + a.procedimentos.reduce((s, p) => s + p.valor, 0);
      atual.atendimentos += 1;
    }
  }
  return Array.from(mapa.values()).sort((a, b) => b.receita - a.receita);
}

export const periodoReferencia = { inicio: periodoInicio, fim: periodoFim };
