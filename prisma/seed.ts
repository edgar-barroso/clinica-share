/**
 * Seed do cenário Dr. Edson Andrade (DEC-P08).
 *
 * Idempotente: limpa todas as tabelas e recria do zero a cada run.
 * Garante que `npm run db:seed` produz o mesmo banco sempre, ideal pra
 * demo do MVP e pra testes manuais.
 *
 * Rodar com: `npm run db:seed`
 *
 * **Fidelidade às regras do app**: todo atendimento nasce de uma alocação de
 * turno fixo, com o consultório daquela alocação e horário dentro da grade da
 * duração do profissional, e com `valorConsulta` vindo de
 * `Profissional.valorConsultaBase`. É o mesmo que `createAgendamento` e
 * `finalizarAtendimento` exigem — sem isso a seed enche o banco de estados que
 * a própria API recusa criar (AG03, CO02, AG05, FI06).
 *
 * Volume:
 * - 1 admin + 1 auxiliar + 1 atendente + 5 profissionais (com User) + 30 pacientes (5 com User)
 * - 12 consultórios (11 ativos + 1 em reforma) + 10 alocações de turno fixo
 * - ~300 atendimentos em 60 dias (45 passados + hoje + 14 futuros), ocupando
 *   35-60% dos slots de cada turno (semanas distantes mais vazias, para a demo
 *   ter horário livre para agendar)
 *   cobrindo todos os status e modos de pagamento
 * - 4 semanas de repasse fechadas (as 2 mais antigas pagas, as 2 recentes em
 *   aberto), uma por profissional com atendimento elegível na semana
 * - AuditLogs para mutações financeiras
 *
 * Credenciais (todas ENV-driven com defaults para dev):
 * - admin@clinicashare.local / ADMIN_PASSWORD do .env
 * - aux@clinicashare.local / paciente-12345
 * - atend@clinicashare.local / paciente-12345
 * - prof[1-5]@clinicashare.local / paciente-12345
 * - paciente[1-5]@clinicashare.local / paciente-12345
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient, type Role, type Turno } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@clinicashare.local",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "change-me-on-first-login",
  // O cenário é a clínica do Dr. Edson (DEC-P08) — o default do nome do admin
  // precisa bater com ele, senão o audit log da demo credita as ações a um
  // nome que não existe em lugar nenhum do sistema.
  ADMIN_NOME: process.env.ADMIN_NOME ?? "Dr. Edson Andrade",
};

if (!env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não definida no .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SENHA_DEMO = "paciente-12345";

// ============================================================
// HELPERS
// ============================================================

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = x.getDay();
  x.setDate(x.getDate() + (dow === 0 ? -6 : 1 - dow));
  return x;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// PRNG determinístico para que a seed seja reproduzível
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

// ============================================================
// LIMPEZA
// ============================================================

async function cleanAll() {
  console.log("🧹 Limpando banco...");
  // Atendimento.repasseId tem onDelete: SetNull — Repasse pode ser
  // deletado primeiro mesmo com atendimentos vinculados.
  await prisma.repasse.deleteMany();
  await prisma.atendimento.deleteMany();
  await prisma.turnoFixo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.consultorio.deleteMany();
  // Overrides de /configuracoes/turnos: sem limpar, um ajuste de sessão
  // anterior continua valendo e faz o `horaToTurno` do cálculo de repasse
  // classificar os horários desta seed em turnos diferentes dos previstos.
  await prisma.configuracao.deleteMany();
  // ProcedimentoAtendimento sai por cascade junto com Atendimento.
}

// ============================================================
// USUÁRIOS / EQUIPE
// ============================================================

async function createUser(email: string, role: Role, senha: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(senha, 10),
      role,
    },
  });
}

async function seedAdmin() {
  const admin = await createUser(env.ADMIN_EMAIL, "admin", env.ADMIN_PASSWORD);
  console.log(`✓ Admin: ${admin.email} (senha do .env)`);
  return admin;
}

async function seedStaff() {
  const aux = await prisma.staff.create({
    data: {
      nome: "Carla Nogueira",
      cargo: "auxiliar",
      email: "aux@clinicashare.local",
      telefone: "11988880001",
    },
  });
  const auxUser = await createUser("aux@clinicashare.local", "auxiliar", SENHA_DEMO);
  await prisma.user.update({
    where: { id: auxUser.id },
    data: { staffId: aux.id },
  });

  const atend = await prisma.staff.create({
    data: {
      nome: "Júlia Nunes",
      cargo: "atendente",
      email: "atend@clinicashare.local",
      telefone: "11988880002",
    },
  });
  const atendUser = await createUser(
    "atend@clinicashare.local",
    "atendente",
    SENHA_DEMO,
  );
  await prisma.user.update({
    where: { id: atendUser.id },
    data: { staffId: atend.id },
  });

  console.log(`✓ Staff: 2 (auxiliar + atendente, senha "${SENHA_DEMO}")`);
  return { aux, atend };
}

// ============================================================
// CONSULTÓRIOS
// ============================================================

async function seedConsultorios() {
  const data = [
    {
      nome: "Consultório 01 — Clínica geral",
      tipo: "Clínico",
      equipamentos: ["Maca", "Mesa de exame", "Estetoscópio"],
      especialidadesCompativeis: ["Clínica geral", "Cardiologia"],
    },
    {
      nome: "Consultório 02 — Pediatria",
      tipo: "Pediátrico",
      equipamentos: ["Maca infantil", "Brinquedos", "Balança pediátrica"],
      especialidadesCompativeis: ["Pediatria"],
    },
    {
      nome: "Consultório 03 — Ginecologia",
      tipo: "Ginecológico",
      equipamentos: ["Mesa ginecológica", "Ultrassom", "Foco"],
      especialidadesCompativeis: ["Ginecologia"],
    },
    {
      nome: "Consultório 04 — Psicologia",
      tipo: "Psicoterapia",
      equipamentos: ["Poltrona", "Sofá", "Mesa lateral"],
      especialidadesCompativeis: ["Psicologia"],
    },
    {
      nome: "Consultório 05 — Dermatologia",
      tipo: "Procedimentos",
      equipamentos: ["Maca", "Lupa dermatológica", "Cautério"],
      especialidadesCompativeis: ["Dermatologia"],
    },
    // CO01 exige os 12 consultórios da clínica. Os índices 0-4 acima são
    // referenciados por seedTurnosFixos, então salas novas entram a partir daqui.
    {
      nome: "Consultório 06 — Cardiologia",
      tipo: "Clínico",
      equipamentos: ["Maca", "Eletrocardiógrafo", "Esfigmomanômetro"],
      especialidadesCompativeis: ["Cardiologia", "Clínica geral"],
    },
    {
      nome: "Consultório 07 — Clínica geral (apoio)",
      tipo: "Clínico",
      equipamentos: ["Maca", "Mesa de exame", "Otoscópio"],
      especialidadesCompativeis: ["Clínica geral"],
    },
    {
      nome: "Consultório 08 — Pediatria (apoio)",
      tipo: "Pediátrico",
      equipamentos: ["Maca infantil", "Balança pediátrica", "Régua antropométrica"],
      especialidadesCompativeis: ["Pediatria"],
    },
    {
      nome: "Consultório 09 — Psicologia (apoio)",
      tipo: "Psicoterapia",
      equipamentos: ["Poltrona", "Sofá", "Isolamento acústico"],
      especialidadesCompativeis: ["Psicologia"],
    },
    {
      nome: "Consultório 10 — Pequenos procedimentos",
      tipo: "Procedimentos",
      equipamentos: ["Maca cirúrgica", "Foco cirúrgico", "Autoclave"],
      especialidadesCompativeis: ["Dermatologia", "Clínica geral"],
    },
    {
      nome: "Consultório 11 — Ginecologia (apoio)",
      tipo: "Ginecológico",
      equipamentos: ["Mesa ginecológica", "Foco", "Colposcópio"],
      especialidadesCompativeis: ["Ginecologia"],
    },
    {
      nome: "Consultório 12 — Sala desativada (reforma)",
      tipo: "Indisponível",
      equipamentos: [],
      especialidadesCompativeis: [],
      ativo: false,
    },
  ];
  const consultorios = await Promise.all(
    data.map((c) => prisma.consultorio.create({ data: c })),
  );
  const ativos = consultorios.filter((c) => c.ativo).length;
  console.log(
    `✓ Consultórios: ${consultorios.length} (${ativos} ativos + ${consultorios.length - ativos} desativado) — CO01`,
  );
  return consultorios;
}

// ============================================================
// PROFISSIONAIS + USERS
// ============================================================

async function seedProfissionais() {
  const profsData = [
    {
      nome: "Dra. Nirmala Azalea",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 123456",
      email: "prof1@clinicashare.local",
      telefone: "11977770001",
      modalidadeContrato: "percentual" as const,
      // 30% do bruto vai pra clínica (profissional fica com 70%).
      percentualRepasse: new Prisma.Decimal(0.3),
      valorConsultaBase: new Prisma.Decimal(220),
      duracaoConsultaMinutos: 30,
    },
    {
      nome: "Dr. Ricardo Ipê",
      especialidade: "Pediatria",
      conselho: "CRM-SP 234567",
      email: "prof2@clinicashare.local",
      telefone: "11977770002",
      modalidadeContrato: "percentual" as const,
      // 30% pra clínica.
      percentualRepasse: new Prisma.Decimal(0.3),
      valorConsultaBase: new Prisma.Decimal(240),
      duracaoConsultaMinutos: 30,
    },
    {
      nome: "Dra. Helena Braga",
      especialidade: "Psicologia",
      conselho: "CRM-SP 345678",
      email: "prof3@clinicashare.local",
      telefone: "11977770003",
      modalidadeContrato: "aluguel_fixo" as const,
      valorAluguelPorTurno: new Prisma.Decimal(250),
      valorConsultaBase: new Prisma.Decimal(300),
      duracaoConsultaMinutos: 45,
    },
    {
      nome: "Dra. Renata Jacarandá",
      especialidade: "Ginecologia",
      conselho: "CRP-SP 06/12345",
      email: "prof4@clinicashare.local",
      telefone: "11977770004",
      modalidadeContrato: "aluguel_fixo" as const,
      valorAluguelPorTurno: new Prisma.Decimal(180),
      valorConsultaBase: new Prisma.Decimal(260),
      duracaoConsultaMinutos: 60,
    },
    {
      nome: "Dra. Sofia Pitanga",
      especialidade: "Dermatologia",
      conselho: "CRM-SP 456789",
      email: "prof5@clinicashare.local",
      telefone: "11977770005",
      modalidadeContrato: "percentual" as const,
      // Dermato cobra mais; clínica fica com 25%.
      percentualRepasse: new Prisma.Decimal(0.25),
      valorConsultaBase: new Prisma.Decimal(280),
      duracaoConsultaMinutos: 30,
    },
  ];

  const profs = [];
  for (const p of profsData) {
    const prof = await prisma.profissional.create({ data: p });
    const user = await createUser(p.email, "profissional", SENHA_DEMO);
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: prof.id },
    });
    profs.push(prof);
  }
  console.log(
    `✓ Profissionais: ${profs.length} (3 percentual + 2 aluguel-fixo, senha "${SENHA_DEMO}")`,
  );
  return profs;
}

// ============================================================
// TURNOS FIXOS
// ============================================================

type Profissional = Awaited<ReturnType<typeof seedProfissionais>>[number];
type Consultorio = Awaited<ReturnType<typeof seedConsultorios>>[number];

/** Turno fixo já criado, com prof e consultório resolvidos. */
interface Alocacao {
  profissional: Profissional;
  consultorio: Consultorio;
  diaSemana: number;
  turno: Turno;
}

async function seedTurnosFixos(
  profs: Awaited<ReturnType<typeof seedProfissionais>>,
  consultorios: Awaited<ReturnType<typeof seedConsultorios>>,
): Promise<Alocacao[]> {
  // Aloca cada profissional em (dia, turno) específicos respeitando consultório compatível
  // diaSemana: 1=seg ... 5=sex
  const allocations = [
    { prof: 0, cons: 0, diaSemana: 1, turno: "manha" as const },
    { prof: 0, cons: 0, diaSemana: 3, turno: "tarde" as const },
    { prof: 1, cons: 1, diaSemana: 2, turno: "manha" as const },
    { prof: 1, cons: 1, diaSemana: 4, turno: "tarde" as const },
    { prof: 2, cons: 3, diaSemana: 1, turno: "tarde" as const },
    { prof: 2, cons: 3, diaSemana: 4, turno: "manha" as const },
    { prof: 3, cons: 2, diaSemana: 2, turno: "tarde" as const },
    { prof: 3, cons: 2, diaSemana: 5, turno: "noite" as const },
    { prof: 4, cons: 4, diaSemana: 3, turno: "manha" as const },
    { prof: 4, cons: 4, diaSemana: 5, turno: "tarde" as const },
  ];

  const alocacoes: Alocacao[] = [];
  for (const a of allocations) {
    await prisma.turnoFixo.create({
      data: {
        profissionalId: profs[a.prof].id,
        consultorioId: consultorios[a.cons].id,
        diaSemana: a.diaSemana,
        turno: a.turno,
      },
    });
    alocacoes.push({
      profissional: profs[a.prof],
      consultorio: consultorios[a.cons],
      diaSemana: a.diaSemana,
      turno: a.turno,
    });
  }
  console.log(`✓ Turnos fixos: ${alocacoes.length} alocações`);
  return alocacoes;
}

// ============================================================
// PACIENTES + USERS
// ============================================================

const NOMES_PACIENTES = [
  "Maria Silva",
  "João Pereira",
  "Ana Santos",
  "Pedro Oliveira",
  "Beatriz Costa",
  "Lucas Mendes",
  "Carolina Lima",
  "Rafael Souza",
  "Juliana Almeida",
  "Felipe Carvalho",
  "Camila Rodrigues",
  "Gabriel Ferreira",
  "Larissa Martins",
  "Bruno Araújo",
  "Fernanda Gomes",
  "Diego Ribeiro",
  "Patrícia Barbosa",
  "Thiago Cardoso",
  "Renata Pinto",
  "Marcelo Dias",
  "Daniela Castro",
  "Eduardo Rocha",
  "Vanessa Teixeira",
  "Gustavo Moreira",
  "Cristina Nascimento",
  "Roberto Cavalcanti",
  "Letícia Monteiro",
  "Fábio Ramos",
  "Aline Vieira",
  "Henrique Macedo",
];

async function seedPacientes() {
  const pacientes = [];
  for (let i = 0; i < NOMES_PACIENTES.length; i++) {
    const nome = NOMES_PACIENTES[i];
    // Alterna M/F com um `outro` a cada 15: a distribuição anterior era 1/3 de
    // `outro`, o que não parece cadastro de clínica nenhum numa demo.
    const sexo = i % 15 === 7 ? "outro" : i % 2 === 0 ? "F" : "M";
    const dataNasc = new Date(1960 + (i * 7) % 50, i % 12, (i % 27) + 1);
    const paciente = await prisma.paciente.create({
      data: {
        nome,
        email: `paciente${i + 1}@example.com`,
        telefone: `1199000${String(i + 1).padStart(4, "0")}`,
        cpf:
          i % 3 === 0
            ? `${String(10000000000 + i).padStart(11, "0")}`
            : null,
        dataNascimento: dataNasc,
        sexo,
      },
    });
    pacientes.push(paciente);

    // Os primeiros 5 pacientes têm User criado pra demonstrar portal
    if (i < 5) {
      const userPaciente = await createUser(
        `paciente${i + 1}@example.com`,
        "paciente",
        SENHA_DEMO,
      );
      await prisma.user.update({
        where: { id: userPaciente.id },
        data: { pacienteId: paciente.id },
      });
      await prisma.paciente.update({
        where: { id: paciente.id },
        data: { senhaDefinida: true },
      });
    }
  }
  console.log(
    `✓ Pacientes: ${pacientes.length} (5 primeiros com login "paciente-12345")`,
  );
  return pacientes;
}

// ============================================================
// ATENDIMENTOS — gerados a partir dos turnos fixos (AG03/CO02/AG05/FI06)
// ============================================================

/**
 * Blocos de turno — espelham os defaults de `_lib/turnos.ts` e de
 * `BLOCOS_PADRAO` (`lib/horarios.ts`). `cleanAll` apaga os overrides da tabela
 * `Configuracao`, então depois da seed estes são de fato os blocos vigentes, e
 * o `horaToTurno` do cálculo de repasse classifica os horários seedados
 * exatamente no turno em que foram gerados.
 */
const BLOCOS: Record<Turno, { inicio: string; fim: string }> = {
  manha: { inicio: "07:00", fim: "12:00" },
  tarde: { inicio: "13:00", fim: "18:00" },
  noite: { inicio: "18:00", fim: "20:00" },
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/**
 * Mesma grade que a tela de agendamento oferece (`gerarSlots` em
 * `lib/horarios.ts`): passo igual à duração do profissional e só slots que
 * caibam inteiros no bloco. Horário fora dessa grade viraria um agendamento
 * que a própria UI não sabe remarcar.
 */
function slotsDoTurno(turno: Turno, duracaoMin: number): string[] {
  const { inicio, fim } = BLOCOS[turno];
  const limite = toMinutes(fim);
  const slots: string[] = [];
  for (let t = toMinutes(inicio); t + duracaoMin <= limite; t += duracaoMin) {
    slots.push(toHHMM(t));
  }
  return slots;
}

interface AtendimentoSeed {
  data: Date;
  hora: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  valorConsulta: Prisma.Decimal;
  status: "agendado" | "em_atendimento" | "realizado" | "cancelado" | "nao_compareceu";
  statusPagamento: "pago" | "pendente" | "gratuito";
  motivoCancelamento?: string | null;
  motivoDescontoOuGratuidade?: string | null;
  prontuarioInterno?: Prisma.InputJsonValue;
  /** FI06 — preço de tabela quando houve desconto parcial ou gratuidade */
  valorOriginal?: Prisma.Decimal | null;
  /** AT04 — atendimento documentado no prontuário próprio do profissional */
  usaProntuarioExterno?: boolean;
  referenciaProntuarioExterno?: string | null;
}

/**
 * Escolhe um paciente livre naquele dia/horário. Sem isso, o sorteio coloca o
 * mesmo paciente em duas salas ao mesmo tempo — a constraint AG05 só protege o
 * consultório.
 */
function escolherPaciente(
  pacientes: Awaited<ReturnType<typeof seedPacientes>>,
  dia: string,
  hora: string,
  ocupados: Set<string>,
) {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const paciente = pacientes[Math.floor(rand() * pacientes.length)];
    const chave = `${dia}|${hora}|${paciente.id}`;
    if (ocupados.has(chave)) continue;
    ocupados.add(chave);
    return paciente;
  }
  return null;
}

/**
 * Gera a agenda a partir das alocações de turno fixo — nunca sorteando
 * (profissional, consultório, turno) livremente. `createAgendamento` exige
 * turno fixo cobrindo (dia da semana, turno) E o consultório daquela alocação
 * (AG03/CO02); fora disso a seed produziria agendamentos que a API recusa
 * criar, com psicóloga em sala de pediatria e profissional atendendo em dia
 * que não trabalha.
 *
 * `valorConsulta` sempre nasce de `Profissional.valorConsultaBase`, como em
 * produção (FI06): assim a tela de finalização abre com o preço certo, e
 * cobrança abaixo da tabela só existe onde há `valorOriginal` + justificativa.
 */
async function seedAtendimentos(
  alocacoes: Alocacao[],
  pacientes: Awaited<ReturnType<typeof seedPacientes>>,
) {
  const hoje = startOfDay();
  const pacienteOcupado = new Set<string>();
  const seeds: AtendimentoSeed[] = [];

  const motivosCancel = [
    "Paciente solicitou remarcação",
    "Profissional indisponível por imprevisto",
    "Paciente fora da cidade",
    "Conflito com horário de trabalho",
    "Sem justificativa registrada",
  ];
  const MOTIVOS_DESCONTO = [
    "Desconto de retorno dentro de 30 dias",
    "Paciente encaminhado por convênio parceiro",
    "Desconto combinado com o profissional",
    "Ajuste por pacote de sessões",
    "Desconto social avaliado pela recepção",
  ];
  const motivosGratuidade = [
    "Cortesia para filho de funcionário",
    "Atendimento social — paciente em situação de vulnerabilidade",
    "Retorno gratuito (revisão pós-procedimento)",
    "Cortesia institucional",
  ];
  const ZERO = new Prisma.Decimal(0);

  // 45 dias passados + hoje + 14 futuros
  for (let offset = -45; offset <= 14; offset++) {
    const data = addDays(hoje, offset);
    const dow = data.getDay();
    if (dow === 0 || dow === 6) continue; // clínica não opera sáb/dom (MVP)

    for (const alo of alocacoes) {
      if (alo.diaSemana !== dow) continue;
      const prof = alo.profissional;
      const tabela = new Prisma.Decimal(prof.valorConsultaBase);
      const slots = slotsDoTurno(alo.turno, prof.duracaoConsultaMinutos);
      // Ocupação do turno. Semana futura mais distante fica mais vazia: é como
      // uma agenda real se enche e deixa horário livre para a demo agendar.
      const ocupacao = (offset > 7 ? 0.2 : 0.35) + rand() * 0.25;

      for (const hora of slots) {
        if (rand() > ocupacao) continue;
        const paciente = escolherPaciente(
          pacientes,
          isoDate(data),
          hora,
          pacienteOcupado,
        );
        if (!paciente) continue;

        const comum = {
          data,
          hora,
          pacienteId: paciente.id,
          profissionalId: prof.id,
          consultorioId: alo.consultorio.id,
        };
        const r = rand();

        if (offset > 0) {
          // Futuro: agendado (95%) ou cancelado (5%).
          seeds.push(
            r < 0.05
              ? {
                  ...comum,
                  valorConsulta: tabela,
                  status: "cancelado",
                  statusPagamento: "pendente",
                  motivoCancelamento: pick(motivosCancel, Math.floor(r * 100)),
                }
              : {
                  ...comum,
                  valorConsulta: tabela,
                  status: "agendado",
                  statusPagamento: "pendente",
                },
          );
          continue;
        }

        if (offset === 0) {
          // Hoje: parte já em atendimento, parte esperando — é o fluxo do dia
          // que a demo abre para iniciar/finalizar.
          seeds.push({
            ...comum,
            valorConsulta: tabela,
            status: r < 0.3 ? "em_atendimento" : "agendado",
            statusPagamento: "pendente",
          });
          continue;
        }

        // Passado: realizado (75%), cancelado (10%), nao_compareceu (10%),
        // gratuito (5%).
        if (r < 0.05) {
          // Gratuidade: nada cobrado, tabela preservada em `valorOriginal` e
          // justificativa obrigatória — o mesmo que `finalizar` grava (FI06).
          seeds.push({
            ...comum,
            valorConsulta: ZERO,
            valorOriginal: tabela,
            status: "realizado",
            statusPagamento: "gratuito",
            motivoDescontoOuGratuidade: pick(
              motivosGratuidade,
              Math.floor(r * 1000),
            ),
            prontuarioInterno: {
              evolucao: "Paciente em boas condições.",
              conduta: "Retorno em 30 dias.",
            },
          });
        } else if (r < 0.15) {
          seeds.push({
            ...comum,
            valorConsulta: tabela,
            status: "cancelado",
            statusPagamento: "pendente",
            motivoCancelamento: pick(motivosCancel, Math.floor(r * 1000)),
          });
        } else if (r < 0.25) {
          // `marcarNaoCompareceu` não pede motivo no cadastro — a justificativa
          // fica no audit log, então aqui também não se inventa um.
          seeds.push({
            ...comum,
            valorConsulta: tabela,
            status: "nao_compareceu",
            statusPagamento: "pendente",
          });
        } else {
          const pagamento = r < 0.85 ? "pago" : "pendente";
          // FI06: ~12% saem com desconto parcial sobre a tabela do cadastro,
          // sempre com justificativa — sem isso o relatório RE04 fica vazio.
          const comDesconto = rand() < 0.12;
          const desconto = pick([20, 30, 50, 80], Math.floor(rand() * 100));
          const valorCobrado = comDesconto ? tabela.minus(desconto) : tabela;
          // AT04: os dois profissionais de aluguel fixo mantêm prontuário
          // próprio; ~40% dos atendimentos deles são registrados fora.
          const externo =
            prof.modalidadeContrato === "aluguel_fixo" && rand() < 0.4;
          seeds.push({
            ...comum,
            valorConsulta: valorCobrado,
            valorOriginal: comDesconto ? tabela : null,
            status: "realizado",
            statusPagamento: pagamento,
            motivoDescontoOuGratuidade: comDesconto
              ? pick(MOTIVOS_DESCONTO, Math.floor(rand() * 100))
              : null,
            usaProntuarioExterno: externo,
            referenciaProntuarioExterno: externo
              ? `${prof.nome} — sistema próprio, ficha ${1000 + Math.floor(rand() * 9000)}`
              : null,
            prontuarioInterno: externo
              ? undefined
              : {
                  anamnese: "Sem queixas relevantes.",
                  evolucao: "Exame físico sem alterações.",
                  conduta: "Acompanhamento de rotina.",
                  retorno: "30 dias",
                },
          });
        }
      }
    }
  }

  // Insere em batch
  await prisma.atendimento.createMany({
    data: seeds.map((s) => ({
      data: s.data,
      hora: s.hora,
      pacienteId: s.pacienteId,
      profissionalId: s.profissionalId,
      consultorioId: s.consultorioId,
      valorConsulta: s.valorConsulta,
      status: s.status,
      statusPagamento: s.statusPagamento,
      motivoCancelamento: s.motivoCancelamento ?? null,
      motivoDescontoOuGratuidade: s.motivoDescontoOuGratuidade ?? null,
      valorOriginal: s.valorOriginal ?? null,
      usaProntuarioExterno: s.usaProntuarioExterno ?? false,
      referenciaProntuarioExterno: s.referenciaProntuarioExterno ?? null,
      prontuarioInterno: (s.prontuarioInterno ??
        Prisma.JsonNull) as Prisma.InputJsonValue,
    })),
  });

  // Estatística
  const stats = seeds.reduce<Record<string, number>>((acc, s) => {
    const key = `${s.status}/${s.statusPagamento}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const nDesconto = seeds.filter((s) => s.valorOriginal && !s.valorConsulta.isZero()).length;
  const nExterno = seeds.filter((s) => s.usaProntuarioExterno).length;
  console.log(`✓ Atendimentos: ${seeds.length}`);
  console.log(`    com desconto parcial (FI06): ${nDesconto}`);
  console.log(`    com prontuário externo (AT04): ${nExterno}`);
  for (const [k, v] of Object.entries(stats).sort()) {
    console.log(`    ${k}: ${v}`);
  }

  return seeds.length;
}

// ============================================================
// PROCEDIMENTOS EXTRAS (AT02 / FI04)
// ============================================================

/** Descrições realistas de procedimentos ambulatoriais de clínica. */
const PROCEDIMENTOS_CATALOGO = [
  "Cauterização",
  "Curativo especial",
  "Biópsia de pele",
  "Aplicação de medicação intramuscular",
  "Ultrassom diagnóstico",
  "Crioterapia",
  "Retirada de pontos",
  "Drenagem de abscesso",
  "Infiltração articular",
  "Teste alérgico de contato",
];

/**
 * AT02: procedimentos extras registrados individualmente por atendimento.
 * Aplica a ~25% dos atendimentos `realizado` + `pago` — a fatia que entra na
 * base do repasse (FI04), onde o valor extra realmente muda o cálculo.
 *
 * Usa o `rand()` determinístico para manter a seed reproduzível. Valores
 * sempre em `Prisma.Decimal` (RNF-101 / DEC-A03).
 */
async function seedProcedimentos() {
  const elegiveis = await prisma.atendimento.findMany({
    where: { status: "realizado", statusPagamento: "pago" },
    select: { id: true },
    // Ordem estável: (data, hora, consultorioId) é unique (AG05)
    orderBy: [{ data: "asc" }, { hora: "asc" }, { consultorioId: "asc" }],
  });

  const rows: {
    atendimentoId: string;
    descricao: string;
    valor: Prisma.Decimal;
  }[] = [];
  let atendimentosComProcedimento = 0;

  for (const a of elegiveis) {
    if (rand() >= 0.25) continue;
    atendimentosComProcedimento++;

    // 1 procedimento (75%) ou 2 (25%)
    const qtd = rand() < 0.75 ? 1 : 2;
    const usados = new Set<string>();
    for (let i = 0; i < qtd; i++) {
      const descricao =
        PROCEDIMENTOS_CATALOGO[
          Math.floor(rand() * PROCEDIMENTOS_CATALOGO.length)
        ];
      if (usados.has(descricao)) continue; // não repete o mesmo procedimento
      usados.add(descricao);
      // R$ 30,00 a R$ 150,00 em passos de R$ 5,00
      const valor = new Prisma.Decimal(30 + Math.floor(rand() * 25) * 5);
      rows.push({ atendimentoId: a.id, descricao, valor });
    }
  }

  await prisma.procedimentoAtendimento.createMany({ data: rows });
  console.log(
    `✓ Procedimentos extras: ${rows.length} em ${atendimentosComProcedimento} de ${elegiveis.length} atendimentos realizados+pagos`,
  );
  return rows.length;
}

// ============================================================
// REPASSES (4 semanas passadas)
// ============================================================

async function seedRepasses(
  profs: Awaited<ReturnType<typeof seedProfissionais>>,
  admin: { id: string; email: string },
) {
  const hoje = startOfDay();
  const semanaAtual = startOfWeek(hoje);

  // 4 semanas passadas: as 2 mais recentes em "aberto", 2 mais antigas "pago"
  const semanas = [
    { offset: -7 * 4, status: "pago" as const },
    { offset: -7 * 3, status: "pago" as const },
    { offset: -7 * 2, status: "aberto" as const },
    { offset: -7, status: "aberto" as const },
  ];

  let total = 0;
  for (const sem of semanas) {
    const inicio = addDays(semanaAtual, sem.offset);
    const fim = addDays(inicio, 6);

    for (const prof of profs) {
      // Busca atendimentos elegíveis (mesma lógica de calculate.ts)
      const elegiveis =
        prof.modalidadeContrato === "percentual"
          ? await prisma.atendimento.findMany({
              where: {
                profissionalId: prof.id,
                status: "realizado",
                statusPagamento: "pago",
                data: { gte: inicio, lte: fim },
              },
              include: { procedimentos: { select: { valor: true } } },
            })
          : await prisma.atendimento.findMany({
              where: {
                profissionalId: prof.id,
                status: "realizado",
                data: { gte: inicio, lte: fim },
              },
              include: { procedimentos: { select: { valor: true } } },
            });

      if (elegiveis.length === 0) continue;

      // FI04: a base é valorConsulta + procedimentos extras (mesma regra de
      // calculate.ts) — sem isso o repasse seedado divergiria do recálculo.
      const receitaBruta = elegiveis
        .filter((a) => a.statusPagamento === "pago")
        .reduce(
          (s, a) =>
            s
              .plus(a.valorConsulta)
              .plus(
                a.procedimentos.reduce(
                  (t, p) => t.plus(p.valor),
                  new Prisma.Decimal(0),
                ),
              ),
          new Prisma.Decimal(0),
        );

      let valorRepasse: Prisma.Decimal;
      if (prof.modalidadeContrato === "percentual" && prof.percentualRepasse) {
        valorRepasse = receitaBruta
          .times(prof.percentualRepasse)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      } else if (prof.valorAluguelPorTurno) {
        // Conta turnos únicos
        const turnos = new Set<string>();
        for (const a of elegiveis) {
          const t =
            a.hora < "13:00" ? "manha" : a.hora < "18:00" ? "tarde" : "noite";
          turnos.add(`${isoDate(a.data)}|${t}`);
        }
        valorRepasse = prof.valorAluguelPorTurno
          .times(turnos.size)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      } else {
        continue;
      }

      const repasse = await prisma.repasse.create({
        data: {
          profissionalId: prof.id,
          periodoInicio: inicio,
          periodoFim: fim,
          receitaBruta: receitaBruta.toDecimalPlaces(
            2,
            Prisma.Decimal.ROUND_HALF_UP,
          ),
          valorRepasse,
          status: sem.status,
          dataPagamento: sem.status === "pago" ? addDays(fim, 2) : null,
          atendimentos: {
            connect: elegiveis.map((a) => ({ id: a.id })),
          },
        },
      });

      // Se pago, registra audit log
      if (sem.status === "pago") {
        await prisma.auditLog.create({
          data: {
            userId: admin.id,
            userNome: env.ADMIN_NOME,
            entidade: "Repasse",
            entidadeId: repasse.id,
            campo: "status",
            valorAntes: "aberto",
            valorDepois: "pago",
            motivo: "Pagamento via PIX (seed)",
          },
        });
      }
      total++;
    }
  }
  console.log(`✓ Repasses: ${total} (2 semanas pagas + 2 em aberto)`);
}

// ============================================================
// AUDIT LOGS extras (simula edições financeiras pós-realizado)
// ============================================================

async function seedAuditLogs(admin: { id: string; email: string }) {
  // Pega 5 atendimentos realizados e simula correções de valor.
  // `orderBy` explícito: sem ele o Postgres não garante ordem e o `take: 5`
  // cai em atendimentos diferentes a cada run, quebrando a reprodutibilidade
  // que esta seed promete. (data, hora, consultorioId) é unique (AG05).
  const samples = await prisma.atendimento.findMany({
    where: { status: "realizado", statusPagamento: "pago" },
    orderBy: [{ data: "asc" }, { hora: "asc" }, { consultorioId: "asc" }],
    take: 5,
  });
  for (const a of samples) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userNome: env.ADMIN_NOME,
        entidade: "Atendimento",
        entidadeId: a.id,
        campo: "valorConsulta",
        valorAntes: a.valorConsulta.plus(20).toString(),
        valorDepois: a.valorConsulta.toString(),
        motivo: "Ajuste de cobrança após confirmação com paciente (seed)",
      },
    });
  }
  console.log(`✓ AuditLogs extras: ${samples.length} edições simuladas`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("🌱 Seed do cenário Dr. Edson Andrade\n");
  await cleanAll();
  const admin = await seedAdmin();
  await seedStaff();
  const consultorios = await seedConsultorios();
  const profs = await seedProfissionais();
  const alocacoes = await seedTurnosFixos(profs, consultorios);
  const pacientes = await seedPacientes();
  const atendimentos = await seedAtendimentos(alocacoes, pacientes);
  // AT02 antes dos repasses: FI04 soma procedimentos na base do repasse
  const procedimentos = await seedProcedimentos();
  await seedRepasses(profs, admin);
  await seedAuditLogs(admin);

  console.log("\n✅ Seed completa! Resumo:");
  console.log(
    `  - 1 admin (${env.ADMIN_EMAIL}) + 2 staff + 5 profissionais + 30 pacientes`,
  );
  console.log(
    `  - 12 consultórios (11 ativos) + 10 alocações de turno fixo`,
  );
  console.log(
    `  - ${atendimentos} atendimentos nos turnos fixos, cobrindo todos os status`,
  );
  console.log(
    `  - ${procedimentos} procedimentos extras (AT02) em ~25% dos realizados+pagos`,
  );
  console.log(`  - 4 semanas de repasses (2 pagas, 2 em aberto)`);
  console.log(
    `  - Senha de demo: "${SENHA_DEMO}" (admin usa ADMIN_PASSWORD do .env)\n`,
  );
}

main()
  .catch((err) => {
    console.error("❌ Erro no seed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
