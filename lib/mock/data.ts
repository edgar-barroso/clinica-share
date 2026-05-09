import type { Atendimento, AuditLog, Consultorio, Paciente, Periodo, Profissional, Repasse, Staff } from './types';

export const consultorios: Consultorio[] = [
  {
    id: 'c01',
    nome: 'Sala 01',
    tipo: 'Consultório Clínico',
    equipamentos: ['Maca', 'Otoscópio', 'Balança'],
    especialidadesCompativeis: ['Clínica geral', 'Cardiologia', 'Neurologia'],
  },
  {
    id: 'c02',
    nome: 'Sala 02',
    tipo: 'Consultório Clínico',
    equipamentos: ['Maca', 'Equipamento para ECG'],
    especialidadesCompativeis: ['Clínica geral', 'Cardiologia'],
  },
  {
    id: 'c03',
    nome: 'Sala 03',
    tipo: 'Consultório Especializado',
    equipamentos: ['Refrator', 'Lâmpada de fenda', 'Campímetro'],
    especialidadesCompativeis: ['Oftalmologia'],
  },
  {
    id: 'c04',
    nome: 'Sala 04',
    tipo: 'Consultório Clínico',
    equipamentos: ['Maca', 'Estetoscópio'],
    especialidadesCompativeis: ['Clínica geral', 'Pediatria'],
  },
  {
    id: 'c05',
    nome: 'Sala 05',
    tipo: 'Consultório Pediátrico',
    equipamentos: ['Maca pediátrica', 'Brinquedos', 'Balança infantil'],
    especialidadesCompativeis: ['Pediatria'],
  },
  {
    id: 'c06',
    nome: 'Sala 06',
    tipo: 'Consultório Psicológico',
    equipamentos: ['Poltronas', 'Isolamento acústico'],
    especialidadesCompativeis: ['Psicologia', 'Psiquiatria'],
  },
  {
    id: 'c07',
    nome: 'Sala 07',
    tipo: 'Consultório Especializado',
    equipamentos: ['ECG', 'Esteira ergométrica'],
    especialidadesCompativeis: ['Cardiologia'],
  },
  {
    id: 'c08',
    nome: 'Sala 08',
    tipo: 'Consultório Ginecológico',
    equipamentos: ['Maca ginecológica', 'Ultrassom'],
    especialidadesCompativeis: ['Ginecologia', 'Obstetrícia'],
  },
  {
    id: 'c09',
    nome: 'Sala 09',
    tipo: 'Sala de Procedimentos',
    equipamentos: ['Maca', 'Aparelho ultrassom portátil'],
    especialidadesCompativeis: ['Clínica geral', 'Ginecologia', 'Ortopedia'],
  },
  {
    id: 'c10',
    nome: 'Sala 10',
    tipo: 'Consultório Fisioterapia',
    equipamentos: ['Maca', 'TENS', 'Ultrassom terapêutico'],
    especialidadesCompativeis: ['Fisioterapia'],
  },
  {
    id: 'c11',
    nome: 'Sala 11',
    tipo: 'Consultório Nutrição',
    equipamentos: ['Bioimpedância', 'Balança', 'Adipômetro'],
    especialidadesCompativeis: ['Nutrição', 'Endocrinologia'],
  },
  {
    id: 'c12',
    nome: 'Sala 12',
    tipo: 'Consultório Dermatológico',
    equipamentos: ['Dermatoscópio', 'Lupa clínica'],
    especialidadesCompativeis: ['Dermatologia'],
  },
];

export const profissionais: Profissional[] = [
  {
    id: 'p01',
    nome: 'Dra. Nirmala Azalea',
    especialidade: 'Oftalmologia',
    conselho: 'CRM/SP 123456',
    email: 'nirmala.azalea@clinicashare.com.br',
    telefone: '(11) 98765-1001',
    ativo: true,
    modalidadeContrato: 'percentual',
    percentualRepasse: 0.3,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 30,
    turnosFixos: [
      { dia: 1, turno: 'manha', consultorioId: 'c03' },
      { dia: 3, turno: 'manha', consultorioId: 'c03' },
      { dia: 5, turno: 'tarde', consultorioId: 'c03' },
    ],
  },
  {
    id: 'p02',
    nome: 'Dr. Rafael Costa',
    especialidade: 'Cardiologia',
    conselho: 'CRM/SP 234567',
    email: 'rafael.costa@clinicashare.com.br',
    telefone: '(11) 98765-1002',
    ativo: true,
    modalidadeContrato: 'percentual',
    percentualRepasse: 0.25,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 45,
    turnosFixos: [
      { dia: 2, turno: 'tarde', consultorioId: 'c07' },
      { dia: 4, turno: 'tarde', consultorioId: 'c07' },
    ],
  },
  {
    id: 'p03',
    nome: 'Dra. Helena Lima',
    especialidade: 'Pediatria',
    conselho: 'CRM/SP 345678',
    email: 'helena.lima@clinicashare.com.br',
    telefone: '(11) 98765-1003',
    ativo: true,
    modalidadeContrato: 'percentual',
    percentualRepasse: 0.3,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 30,
    turnosFixos: [
      { dia: 1, turno: 'tarde', consultorioId: 'c05' },
      { dia: 3, turno: 'tarde', consultorioId: 'c05' },
    ],
  },
  {
    id: 'p04',
    nome: 'Marcos Tavares',
    especialidade: 'Psicologia',
    conselho: 'CRP 06/98765',
    email: 'marcos.tavares@clinicashare.com.br',
    telefone: '(11) 98765-1004',
    ativo: true,
    modalidadeContrato: 'aluguel-fixo',
    percentualRepasse: null,
    valorAluguelPorTurno: 180,
    duracaoConsultaMinutos: 50,
    turnosFixos: [
      { dia: 2, turno: 'noite', consultorioId: 'c06' },
      { dia: 4, turno: 'noite', consultorioId: 'c06' },
    ],
  },
  {
    id: 'p05',
    nome: 'Dra. Beatriz Rocha',
    especialidade: 'Ginecologia',
    conselho: 'CRM/SP 456789',
    email: 'beatriz.rocha@clinicashare.com.br',
    telefone: '(11) 98765-1005',
    ativo: true,
    modalidadeContrato: 'percentual',
    percentualRepasse: 0.28,
    valorAluguelPorTurno: null,
    duracaoConsultaMinutos: 30,
    turnosFixos: [{ dia: 5, turno: 'manha', consultorioId: 'c08' }],
  },
  {
    id: 'p06',
    nome: 'Juliana Prado',
    especialidade: 'Fisioterapia',
    conselho: 'CREFITO 12345-F',
    email: 'juliana.prado@clinicashare.com.br',
    telefone: '(11) 98765-1006',
    ativo: true,
    modalidadeContrato: 'aluguel-fixo',
    percentualRepasse: null,
    valorAluguelPorTurno: 150,
    duracaoConsultaMinutos: 40,
    turnosFixos: [
      { dia: 1, turno: 'manha', consultorioId: 'c10' },
      { dia: 3, turno: 'manha', consultorioId: 'c10' },
    ],
  },
];

export const staff: Staff[] = [
  {
    id: 's01',
    nome: 'Joana Ribeiro',
    cargo: 'auxiliar',
    email: 'joana.ribeiro@clinicashare.com.br',
    telefone: '(11) 98000-2001',
    ativo: true,
    senhaDefinida: true,
  },
  {
    id: 's02',
    nome: 'Carla Moreira',
    cargo: 'atendente',
    email: 'carla.moreira@clinicashare.com.br',
    telefone: '(11) 98000-2002',
    ativo: true,
    senhaDefinida: true,
  },
  {
    id: 's03',
    nome: 'Bruno Soares',
    cargo: 'atendente',
    email: 'bruno.soares@clinicashare.com.br',
    telefone: '(11) 98000-2003',
    ativo: true,
    senhaDefinida: true,
  },
  {
    id: 's04',
    nome: 'Renata Pacheco',
    cargo: 'auxiliar',
    email: 'renata.pacheco@clinicashare.com.br',
    telefone: '(11) 98000-2004',
    ativo: false,
  },
];

export const pacientes: Paciente[] = [
  {
    id: 'pt01',
    nome: 'João Pereira',
    telefone: '(11) 99111-0001',
    email: 'joao.pereira@email.com',
    cpf: '123.456.789-01',
    dataNascimento: '1985-03-12',
    sexo: 'M',
    endereco: {
      cep: '01310-100',
      rua: 'Av. Paulista',
      numero: '1500',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    plano: { temPlano: true, operadora: 'Unimed', numeroCarteirinha: '0123456789' },
    senhaDefinida: true,
  },
  {
    id: 'pt02',
    nome: 'Maria Silva',
    telefone: '(11) 99111-0002',
    email: 'maria.silva@email.com',
    cpf: '234.567.890-12',
    dataNascimento: '1992-07-25',
    sexo: 'F',
    endereco: {
      cep: '04567-010',
      rua: 'Rua Vergueiro',
      numero: '2200',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    plano: { temPlano: true, operadora: 'SulAmérica', numeroCarteirinha: '9876543210' },
    senhaDefinida: true,
  },
  {
    id: 'pt03',
    nome: 'Ana Souza',
    telefone: '(11) 99111-0003',
    email: 'ana.souza@email.com',
    cpf: '345.678.901-23',
    dataNascimento: '1978-11-03',
    sexo: 'F',
    endereco: {
      cep: '05402-000',
      rua: 'Rua Teodoro Sampaio',
      numero: '780',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    plano: { temPlano: false },
    senhaDefinida: true,
  },
  {
    id: 'pt04',
    nome: 'Pedro Oliveira',
    telefone: '(11) 99111-0004',
    email: 'pedro.oliveira@email.com',
    cpf: '456.789.012-34',
    dataNascimento: '2001-05-18',
    sexo: 'M',
    endereco: {
      cep: '02234-100',
      rua: 'Av. Cruzeiro do Sul',
      numero: '120',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    plano: { temPlano: true, operadora: 'Bradesco Saúde', numeroCarteirinha: '5566778899' },
    senhaDefinida: true,
  },
  { id: 'pt05', nome: 'Lucas Ferreira', telefone: '(11) 99111-0005', email: 'lucas.ferreira@email.com' },
  { id: 'pt06', nome: 'Juliana Mendes', telefone: '(11) 99111-0006', email: 'juliana.mendes@email.com' },
  { id: 'pt07', nome: 'Rafael Almeida', telefone: '(11) 99111-0007', email: 'rafael.almeida@email.com' },
  { id: 'pt08', nome: 'Carla Barbosa', telefone: '(11) 99111-0008', email: 'carla.barbosa@email.com' },
  { id: 'pt09', nome: 'Fernanda Dias', telefone: '(11) 99111-0009', email: 'fernanda.dias@email.com' },
  { id: 'pt10', nome: 'Tiago Ribeiro', telefone: '(11) 99111-0010', email: 'tiago.ribeiro@email.com' },
  { id: 'pt11', nome: 'Beatriz Gomes', telefone: '(11) 99111-0011', email: 'beatriz.gomes@email.com' },
  { id: 'pt12', nome: 'Eduardo Neves', telefone: '(11) 99111-0012', email: 'eduardo.neves@email.com' },
  { id: 'pt13', nome: 'Patrícia Lopes', telefone: '(11) 99111-0013', email: 'patricia.lopes@email.com' },
  { id: 'pt14', nome: 'Henrique Teixeira', telefone: '(11) 99111-0014', email: 'henrique.teixeira@email.com' },
  { id: 'pt15', nome: 'Camila Santos', telefone: '(11) 99111-0015', email: 'camila.santos@email.com' },
  { id: 'pt16', nome: 'Ricardo Pinheiro', telefone: '(11) 99111-0016', email: 'ricardo.pinheiro@email.com' },
  { id: 'pt17', nome: 'Mariana Cavalcanti', telefone: '(11) 99111-0017', email: 'mariana.cavalcanti@email.com' },
  { id: 'pt18', nome: 'Bruno Carvalho', telefone: '(11) 99111-0018', email: 'bruno.carvalho@email.com' },
  { id: 'pt19', nome: 'Laura Freitas', telefone: '(11) 99111-0019', email: 'laura.freitas@email.com' },
  { id: 'pt20', nome: 'Daniel Moreira', telefone: '(11) 99111-0020', email: 'daniel.moreira@email.com' },
];

// Datas ancoradas na semana corrente (segunda a domingo do "hoje" do navegador/servidor)
// Offsets em dias relativos à segunda-feira da semana atual:
//   0..4 = seg..sex desta semana, 5..6 = sáb..dom, 7..9 = seg..qua próxima, etc.
function startOfCurrentWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=dom..6=sáb
  const diff = dow === 0 ? -6 : 1 - dow; // segunda como início
  d.setDate(d.getDate() + diff);
  return d;
}
const ANCHOR_MONDAY = startOfCurrentWeek();

function dayISO(offset: number) {
  const d = new Date(ANCHOR_MONDAY);
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function tsISO(offset: number, hhmmss: string) {
  return `${dayISO(offset)}T${hhmmss}`;
}

export const atendimentos: Atendimento[] = [
  // segunda da semana atual
  {
    id: 'a001',
    data: dayISO(0),
    hora: '08:30',
    pacienteId: 'pt02',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a002',
    data: dayISO(0),
    hora: '09:15',
    pacienteId: 'pt05',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a003',
    data: dayISO(0),
    hora: '08:00',
    pacienteId: 'pt08',
    profissionalId: 'p06',
    consultorioId: 'c10',
    valorConsulta: 180,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a004',
    data: dayISO(0),
    hora: '14:00',
    pacienteId: 'pt10',
    profissionalId: 'p03',
    consultorioId: 'c05',
    valorConsulta: 220,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a005',
    data: dayISO(0),
    hora: '15:00',
    pacienteId: 'pt14',
    profissionalId: 'p03',
    consultorioId: 'c05',
    valorConsulta: 220,
    status: 'realizado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
  },

  // terça da semana atual
  {
    id: 'a006',
    data: dayISO(1),
    hora: '14:00',
    pacienteId: 'pt03',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a007',
    data: dayISO(1),
    hora: '15:30',
    pacienteId: 'pt06',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: true,
  },
  {
    id: 'a008',
    data: dayISO(1),
    hora: '19:00',
    pacienteId: 'pt11',
    profissionalId: 'p04',
    consultorioId: 'c06',
    valorConsulta: 260,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a009',
    data: dayISO(1),
    hora: '19:55',
    pacienteId: 'pt13',
    profissionalId: 'p04',
    consultorioId: 'c06',
    valorConsulta: 260,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },

  // quarta da semana atual
  {
    id: 'a010',
    data: dayISO(2),
    hora: '08:00',
    pacienteId: 'pt09',
    profissionalId: 'p06',
    consultorioId: 'c10',
    valorConsulta: 180,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a011',
    data: dayISO(2),
    hora: '09:00',
    pacienteId: 'pt15',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a012',
    data: dayISO(2),
    hora: '14:00',
    pacienteId: 'pt17',
    profissionalId: 'p03',
    consultorioId: 'c05',
    valorConsulta: 220,
    status: 'realizado',
    statusPagamento: 'gratuito',
    motivoDescontoOuGratuidade: 'Cortesia para filho de funcionário',
    usaProntuarioExterno: false,
  },

  // quinta da semana atual
  {
    id: 'a013',
    data: dayISO(3),
    hora: '14:30',
    pacienteId: 'pt04',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'agendado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
  },
  {
    id: 'a014',
    data: dayISO(3),
    hora: '19:00',
    pacienteId: 'pt18',
    profissionalId: 'p04',
    consultorioId: 'c06',
    valorConsulta: 260,
    status: 'cancelado',
    statusPagamento: 'gratuito',
    motivoCancelamento: 'Paciente solicitou remarcação por motivo pessoal',
    usaProntuarioExterno: false,
  },

  // sexta da semana atual (ainda futura — agendados)
  {
    id: 'a015',
    data: dayISO(4),
    hora: '08:30',
    pacienteId: 'pt01',
    profissionalId: 'p05',
    consultorioId: 'c08',
    valorConsulta: 300,
    status: 'agendado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a016',
    data: dayISO(4),
    hora: '09:30',
    pacienteId: 'pt07',
    profissionalId: 'p05',
    consultorioId: 'c08',
    valorConsulta: 300,
    status: 'agendado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  {
    id: 'a017',
    data: dayISO(4),
    hora: '15:00',
    pacienteId: 'pt16',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'agendado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
  },

  // Agendamentos futuros — segunda, segunda e terça da próxima semana
  {
    id: 'a018',
    data: dayISO(7),
    hora: '08:30',
    pacienteId: 'pt19',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'agendado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
  },
  {
    id: 'a019',
    data: dayISO(7),
    hora: '14:00',
    pacienteId: 'pt20',
    profissionalId: 'p03',
    consultorioId: 'c05',
    valorConsulta: 220,
    status: 'agendado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
  },
  {
    id: 'a020',
    data: dayISO(8),
    hora: '14:30',
    pacienteId: 'pt12',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'agendado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
  },

  // Consultas extras para pt01 (João Pereira) — demo do portal do paciente
  {
    id: 'a021',
    data: dayISO(-19),
    hora: '09:00',
    pacienteId: 'pt01',
    profissionalId: 'p03',
    consultorioId: 'c05',
    valorConsulta: 220,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
    observacoes: 'Check-up anual',
  },
  {
    id: 'a022',
    data: dayISO(-4),
    hora: '15:00',
    pacienteId: 'pt01',
    profissionalId: 'p06',
    consultorioId: 'c10',
    valorConsulta: 180,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
    observacoes: 'Sessão de fisioterapia — dor lombar',
  },
  {
    id: 'a023',
    data: dayISO(9),
    hora: '08:30',
    pacienteId: 'pt01',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'agendado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
    observacoes: 'Retorno — avaliação de visão',
  },
  {
    id: 'a024',
    data: dayISO(15),
    hora: '09:30',
    pacienteId: 'pt01',
    profissionalId: 'p06',
    consultorioId: 'c10',
    valorConsulta: 180,
    status: 'agendado',
    statusPagamento: 'pendente',
    usaProntuarioExterno: false,
    observacoes: 'Sessão de fisioterapia',
  },

  // Histórico expandido — semanas anteriores e próximas (alimenta visão mensal)
  // Semana -3 (~3 semanas antes da atual)
  { id: 'a025', data: dayISO(-21), hora: '08:30', pacienteId: 'pt02', profissionalId: 'p01', consultorioId: 'c03', valorConsulta: 280, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a026', data: dayISO(-21), hora: '14:00', pacienteId: 'pt10', profissionalId: 'p03', consultorioId: 'c05', valorConsulta: 220, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  {
    id: 'a027',
    data: dayISO(-20),
    hora: '14:00',
    pacienteId: 'pt03',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  { id: 'a028', data: dayISO(-19), hora: '19:00', pacienteId: 'pt11', profissionalId: 'p04', consultorioId: 'c06', valorConsulta: 260, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a029', data: dayISO(-18), hora: '08:00', pacienteId: 'pt09', profissionalId: 'p06', consultorioId: 'c10', valorConsulta: 180, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a030', data: dayISO(-17), hora: '08:30', pacienteId: 'pt07', profissionalId: 'p05', consultorioId: 'c08', valorConsulta: 300, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },

  // Semana -2
  {
    id: 'a031',
    data: dayISO(-14),
    hora: '08:30',
    pacienteId: 'pt05',
    profissionalId: 'p01',
    consultorioId: 'c03',
    valorConsulta: 280,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  { id: 'a032', data: dayISO(-14), hora: '14:00', pacienteId: 'pt14', profissionalId: 'p03', consultorioId: 'c05', valorConsulta: 220, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a033', data: dayISO(-13), hora: '14:00', pacienteId: 'pt06', profissionalId: 'p02', consultorioId: 'c07', valorConsulta: 350, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a034', data: dayISO(-13), hora: '19:00', pacienteId: 'pt13', profissionalId: 'p04', consultorioId: 'c06', valorConsulta: 260, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a035', data: dayISO(-12), hora: '08:00', pacienteId: 'pt08', profissionalId: 'p06', consultorioId: 'c10', valorConsulta: 180, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a036', data: dayISO(-12), hora: '09:00', pacienteId: 'pt15', profissionalId: 'p01', consultorioId: 'c03', valorConsulta: 280, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  {
    id: 'a037',
    data: dayISO(-11),
    hora: '14:30',
    pacienteId: 'pt04',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  { id: 'a038', data: dayISO(-10), hora: '08:30', pacienteId: 'pt01', profissionalId: 'p05', consultorioId: 'c08', valorConsulta: 300, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },

  // Semana -1
  { id: 'a039', data: dayISO(-7), hora: '08:30', pacienteId: 'pt16', profissionalId: 'p01', consultorioId: 'c03', valorConsulta: 280, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a040', data: dayISO(-7), hora: '14:00', pacienteId: 'pt17', profissionalId: 'p03', consultorioId: 'c05', valorConsulta: 220, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  {
    id: 'a041',
    data: dayISO(-6),
    hora: '14:00',
    pacienteId: 'pt18',
    profissionalId: 'p02',
    consultorioId: 'c07',
    valorConsulta: 350,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },
  { id: 'a042', data: dayISO(-6), hora: '19:00', pacienteId: 'pt19', profissionalId: 'p04', consultorioId: 'c06', valorConsulta: 260, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a043', data: dayISO(-5), hora: '08:00', pacienteId: 'pt20', profissionalId: 'p06', consultorioId: 'c10', valorConsulta: 180, status: 'realizado', statusPagamento: 'pago', usaProntuarioExterno: false },
  { id: 'a044', data: dayISO(-5), hora: '14:00', pacienteId: 'pt12', profissionalId: 'p03', consultorioId: 'c05', valorConsulta: 220, status: 'realizado', statusPagamento: 'pendente', usaProntuarioExterno: false },
  {
    id: 'a045',
    data: dayISO(-3),
    hora: '08:30',
    pacienteId: 'pt07',
    profissionalId: 'p05',
    consultorioId: 'c08',
    valorConsulta: 300,
    status: 'realizado',
    statusPagamento: 'pago',
    usaProntuarioExterno: false,
  },

  // Semana +1 (após a corrente — agendamentos futuros)
  { id: 'a046', data: dayISO(8), hora: '08:30', pacienteId: 'pt02', profissionalId: 'p01', consultorioId: 'c03', valorConsulta: 280, status: 'agendado', statusPagamento: 'pendente', usaProntuarioExterno: false },
  { id: 'a047', data: dayISO(9), hora: '14:00', pacienteId: 'pt05', profissionalId: 'p03', consultorioId: 'c05', valorConsulta: 220, status: 'agendado', statusPagamento: 'pendente', usaProntuarioExterno: false },
  { id: 'a048', data: dayISO(10), hora: '08:30', pacienteId: 'pt06', profissionalId: 'p05', consultorioId: 'c08', valorConsulta: 300, status: 'agendado', statusPagamento: 'pendente', usaProntuarioExterno: false },

  // Semana +2
  { id: 'a049', data: dayISO(14), hora: '09:15', pacienteId: 'pt03', profissionalId: 'p01', consultorioId: 'c03', valorConsulta: 280, status: 'agendado', statusPagamento: 'pendente', usaProntuarioExterno: false },
  { id: 'a050', data: dayISO(16), hora: '14:30', pacienteId: 'pt04', profissionalId: 'p02', consultorioId: 'c07', valorConsulta: 350, status: 'agendado', statusPagamento: 'pendente', usaProntuarioExterno: false },
];

// Calcula repasses por profissional na semana 06-12/abr
function calcularReceitaBruta(profId: string, inicio: string, fim: string) {
  const ats = atendimentos.filter((a) => a.profissionalId === profId && a.data >= inicio && a.data <= fim && a.status === 'realizado' && a.statusPagamento === 'pago');
  return ats.reduce((acc, a) => acc + a.valorConsulta, 0);
}

function repasseDeProfissional(prof: Profissional, inicio: string, fim: string) {
  const atsIds = atendimentos.filter((a) => a.profissionalId === prof.id && a.data >= inicio && a.data <= fim && a.status === 'realizado').map((a) => a.id);
  const receitaBruta = calcularReceitaBruta(prof.id, inicio, fim);
  let valor = 0;
  if (prof.modalidadeContrato === 'percentual' && prof.percentualRepasse) {
    valor = receitaBruta * prof.percentualRepasse;
  } else if (prof.modalidadeContrato === 'aluguel-fixo' && prof.valorAluguelPorTurno) {
    const turnosNaSemana = atendimentos
      .filter((a) => a.profissionalId === prof.id && a.data >= inicio && a.data <= fim && a.status === 'realizado')
      .reduce((set, a) => set.add(`${a.data}-${a.hora < '13:00' ? 'm' : a.hora < '18:00' ? 't' : 'n'}`), new Set<string>()).size;
    valor = prof.valorAluguelPorTurno * Math.max(1, turnosNaSemana);
  }
  return { atsIds, receitaBruta, valor };
}

const periodoInicio = dayISO(0);
const periodoFim = dayISO(6);
const dataPagamentoSemana = dayISO(7);

function buildRepassesSemana(
  weekOffset: number,
  idStart: number,
  statusPorProf: Array<'pago' | 'aberto'>,
): Repasse[] {
  const inicio = dayISO(weekOffset * 7);
  const fim = dayISO(weekOffset * 7 + 6);
  const dataPagamento = dayISO(weekOffset * 7 + 7);
  return profissionais.map((p, i) => {
    const { atsIds, receitaBruta, valor } = repasseDeProfissional(p, inicio, fim);
    const status = statusPorProf[i] ?? 'aberto';
    return {
      id: `r${String(idStart + i + 1).padStart(3, '0')}`,
      profissionalId: p.id,
      periodoInicio: inicio,
      periodoFim: fim,
      atendimentosIds: atsIds,
      receitaBruta,
      valorRepasse: Math.round(valor * 100) / 100,
      status,
      dataPagamento: status === 'pago' ? dataPagamento : undefined,
    };
  });
}

// Semana retrasada (-2): quase tudo pago, 1 atrasado (Marcos = p04, aluguel-fixo)
const repassesSemanaMenos2 = buildRepassesSemana(-2, 12, [
  'pago',
  'pago',
  'pago',
  'aberto',
  'pago',
  'pago',
]);

// Semana passada (-1): 4 pagos, 2 atrasados (Beatriz = p05 e Juliana = p06)
const repassesSemanaMenos1 = buildRepassesSemana(-1, 6, [
  'pago',
  'pago',
  'pago',
  'pago',
  'aberto',
  'aberto',
]);

// Semana atual (0): 2 pagos, 4 abertos (em andamento, ainda dentro do prazo)
const repassesSemanaAtual: Repasse[] = profissionais.map((p, i) => {
  const { atsIds, receitaBruta, valor } = repasseDeProfissional(p, periodoInicio, periodoFim);
  return {
    id: `r${String(i + 1).padStart(3, '0')}`,
    profissionalId: p.id,
    periodoInicio,
    periodoFim,
    atendimentosIds: atsIds,
    receitaBruta,
    valorRepasse: Math.round(valor * 100) / 100,
    status: i < 2 ? 'pago' : 'aberto',
    dataPagamento: i < 2 ? dataPagamentoSemana : undefined,
  };
});

export const repasses: Repasse[] = [
  ...repassesSemanaMenos2,
  ...repassesSemanaMenos1,
  ...repassesSemanaAtual,
];

export const auditoria: AuditLog[] = [
  {
    id: 'log001',
    timestamp: tsISO(7, '09:15:00'),
    userId: 'admin',
    userNome: 'Dr. Edson Andrade',
    entidade: 'Repasse',
    entidadeId: 'r001',
    campo: 'status',
    valorAntes: 'aberto',
    valorDepois: 'pago',
    motivo: 'Pagamento semanal via Pix',
  },
  {
    id: 'log002',
    timestamp: tsISO(7, '09:17:00'),
    userId: 'admin',
    userNome: 'Dr. Edson Andrade',
    entidade: 'Repasse',
    entidadeId: 'r002',
    campo: 'status',
    valorAntes: 'aberto',
    valorDepois: 'pago',
    motivo: 'Pagamento semanal via Pix',
  },
  {
    id: 'log003',
    timestamp: tsISO(2, '14:25:00'),
    userId: 'auxiliar',
    userNome: 'Joana Ribeiro',
    entidade: 'Atendimento',
    entidadeId: 'a012',
    campo: 'statusPagamento',
    valorAntes: 'pendente',
    valorDepois: 'gratuito',
    motivo: 'Cortesia para filho de funcionário',
  },
  {
    id: 'log004',
    timestamp: tsISO(3, '19:05:00'),
    userId: 'atendente',
    userNome: 'Carla Moreira',
    entidade: 'Atendimento',
    entidadeId: 'a014',
    campo: 'status',
    valorAntes: 'agendado',
    valorDepois: 'cancelado',
    motivo: 'Paciente solicitou remarcação por motivo pessoal',
  },
  {
    id: 'log005',
    timestamp: tsISO(0, '18:00:00'),
    userId: 'auxiliar',
    userNome: 'Joana Ribeiro',
    entidade: 'Atendimento',
    entidadeId: 'a001',
    campo: 'statusPagamento',
    valorAntes: 'pendente',
    valorDepois: 'pago',
    motivo: 'Pagamento no ato em dinheiro',
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

export function getStaff(id: string) {
  return staff.find((s) => s.id === id);
}

export function atendimentosRealizadosNoIntervalo(periodo: Periodo) {
  return atendimentos.filter((a) => a.status === 'realizado' && a.data >= periodo.inicio && a.data <= periodo.fim);
}

export function atendimentosRealizadosSemana() {
  return atendimentosRealizadosNoIntervalo(periodoReferencia);
}

export function receitaTotalSemana() {
  return atendimentosRealizadosSemana()
    .filter((a) => a.statusPagamento === 'pago')
    .reduce((acc, a) => acc + a.valorConsulta, 0);
}

export function receitaPorConsultorio(periodo: Periodo = periodoReferencia) {
  const mapa = new Map<string, { consultorioId: string; receita: number; atendimentos: number }>();
  for (const c of consultorios) {
    mapa.set(c.id, { consultorioId: c.id, receita: 0, atendimentos: 0 });
  }
  for (const a of atendimentosRealizadosNoIntervalo(periodo)) {
    if (a.statusPagamento === 'pago') {
      const atual = mapa.get(a.consultorioId)!;
      atual.receita += a.valorConsulta;
      atual.atendimentos += 1;
    }
  }
  return Array.from(mapa.values()).sort((a, b) => b.receita - a.receita);
}

export const periodoReferencia = {
  inicio: periodoInicio,
  fim: periodoFim,
  dataPagamento: dataPagamentoSemana,
};

export function diasDaSemana(): string[] {
  return Array.from({ length: 7 }).map((_, i) => dayISO(i));
}

// =====================================================
// Helpers de período (semana / mês) para seletor de UI
// =====================================================

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getSemanaContendo(iso: string): Periodo {
  const d = parseISO(iso);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const segunda = new Date(d);
  segunda.setDate(d.getDate() + diff);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  return { inicio: fmtISO(segunda), fim: fmtISO(domingo) };
}

export function getMesContendo(iso: string): Periodo {
  const d = parseISO(iso);
  const primeiro = new Date(d.getFullYear(), d.getMonth(), 1);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { inicio: fmtISO(primeiro), fim: fmtISO(ultimo) };
}

function periodoKey(p: Periodo): string {
  return `${p.inicio}|${p.fim}`;
}

export function semanasDisponiveis(): Periodo[] {
  const set = new Map<string, Periodo>();
  for (const a of atendimentos) {
    const sem = getSemanaContendo(a.data);
    set.set(periodoKey(sem), sem);
  }
  // Garantir que a semana corrente sempre apareça
  const atual = getSemanaContendo(dayISO(0));
  set.set(periodoKey(atual), atual);
  return Array.from(set.values()).sort((a, b) => b.inicio.localeCompare(a.inicio));
}

export function mesesDisponiveis(): Periodo[] {
  const set = new Map<string, Periodo>();
  for (const a of atendimentos) {
    const mes = getMesContendo(a.data);
    set.set(periodoKey(mes), mes);
  }
  const atual = getMesContendo(dayISO(0));
  set.set(periodoKey(atual), atual);
  return Array.from(set.values()).sort((a, b) => b.inicio.localeCompare(a.inicio));
}

export function semanasDoMes(mes: Periodo): Periodo[] {
  const fim = parseISO(mes.fim);
  const semanas: Periodo[] = [];
  let cursor = parseISO(mes.inicio);
  while (cursor <= fim) {
    const sem = getSemanaContendo(fmtISO(cursor));
    // Recortar para os limites do mês
    const inicio = sem.inicio < mes.inicio ? mes.inicio : sem.inicio;
    const finalSem = sem.fim > mes.fim ? mes.fim : sem.fim;
    semanas.push({ inicio, fim: finalSem });
    const proximo = parseISO(sem.fim);
    proximo.setDate(proximo.getDate() + 1);
    cursor = proximo;
  }
  return semanas;
}

export function formatPeriodoLabel(periodo: Periodo, granularidade: 'semana' | 'mes'): string {
  const ini = parseISO(periodo.inicio);
  const fim = parseISO(periodo.fim);
  if (granularidade === 'mes') {
    return `${MESES_LONGOS[ini.getMonth()]}/${ini.getFullYear()}`;
  }
  const sameMonth = ini.getMonth() === fim.getMonth();
  const dIni = String(ini.getDate()).padStart(2, '0');
  const dFim = String(fim.getDate()).padStart(2, '0');
  if (sameMonth) {
    return `${dIni}–${dFim}/${MESES_ABREV[ini.getMonth()]}`;
  }
  return `${dIni}/${MESES_ABREV[ini.getMonth()]} – ${dFim}/${MESES_ABREV[fim.getMonth()]}`;
}

export function semanaAtual(): Periodo {
  return getSemanaContendo(dayISO(0));
}

export function mesAtual(): Periodo {
  return getMesContendo(dayISO(0));
}
