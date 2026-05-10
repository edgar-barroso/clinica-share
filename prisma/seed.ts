/**
 * Seed do cenário Dr. Edson Andrade (DEC-P08).
 *
 * Idempotente: limpa todas as tabelas e recria do zero a cada run.
 * Garante que `npm run db:seed` produz o mesmo banco sempre, ideal pra
 * demo do MVP e pra testes manuais.
 *
 * Rodar com: `npm run db:seed`
 *
 * Volume:
 * - 1 admin + 1 auxiliar + 1 atendente + 5 profissionais (com User) + 30 pacientes (5 com User)
 * - 6 consultórios + 8 turnos fixos
 * - ~200 atendimentos distribuídos em 60 dias (passado + futuro)
 *   cobrindo todos os status e modos de pagamento
 * - 4 repasses semanais já gerados (2 pagos, 2 em aberto)
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
import { Prisma, PrismaClient, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@clinicashare.local",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "change-me-on-first-login",
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
      nome: "Carla Auxiliar",
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
      nome: "Beatriz Atendente",
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
      nome: "Sala 1 — Clínica geral",
      tipo: "Clínico",
      equipamentos: ["Maca", "Mesa de exame", "Estetoscópio"],
      especialidadesCompativeis: ["Clínica geral", "Cardiologia"],
    },
    {
      nome: "Sala 2 — Pediatria",
      tipo: "Pediátrico",
      equipamentos: ["Maca infantil", "Brinquedos", "Balança pediátrica"],
      especialidadesCompativeis: ["Pediatria"],
    },
    {
      nome: "Sala 3 — Ginecologia",
      tipo: "Ginecológico",
      equipamentos: ["Mesa ginecológica", "Ultrassom", "Foco"],
      especialidadesCompativeis: ["Ginecologia"],
    },
    {
      nome: "Sala 4 — Psicologia",
      tipo: "Psicoterapia",
      equipamentos: ["Poltrona", "Sofá", "Mesa lateral"],
      especialidadesCompativeis: ["Psicologia"],
    },
    {
      nome: "Sala 5 — Dermatologia",
      tipo: "Procedimentos",
      equipamentos: ["Maca", "Lupa dermatológica", "Cautério"],
      especialidadesCompativeis: ["Dermatologia"],
    },
    {
      nome: "Sala 6 — Sala desativada (reforma)",
      tipo: "Indisponível",
      equipamentos: [],
      especialidadesCompativeis: [],
      ativo: false,
    },
  ];
  const consultorios = await Promise.all(
    data.map((c) => prisma.consultorio.create({ data: c })),
  );
  console.log(`✓ Consultórios: ${consultorios.length} (1 desativado)`);
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
      nome: "Dra. Helena Jacarandá",
      especialidade: "Ginecologia",
      conselho: "CRM-SP 345678",
      email: "prof3@clinicashare.local",
      telefone: "11977770003",
      modalidadeContrato: "aluguel_fixo" as const,
      valorAluguelPorTurno: new Prisma.Decimal(250),
      valorConsultaBase: new Prisma.Decimal(300),
      duracaoConsultaMinutos: 45,
    },
    {
      nome: "Dr. André Manacá",
      especialidade: "Psicologia",
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

async function seedTurnosFixos(
  profs: Awaited<ReturnType<typeof seedProfissionais>>,
  consultorios: Awaited<ReturnType<typeof seedConsultorios>>,
) {
  // Aloca cada profissional em (dia, turno) específicos respeitando consultório compatível
  // diaSemana: 1=seg ... 5=sex
  const allocations = [
    { prof: 0, cons: 0, diaSemana: 1, turno: "manha" as const },
    { prof: 0, cons: 0, diaSemana: 3, turno: "tarde" as const },
    { prof: 1, cons: 1, diaSemana: 2, turno: "manha" as const },
    { prof: 1, cons: 1, diaSemana: 4, turno: "tarde" as const },
    { prof: 2, cons: 2, diaSemana: 1, turno: "tarde" as const },
    { prof: 2, cons: 2, diaSemana: 4, turno: "manha" as const },
    { prof: 3, cons: 3, diaSemana: 2, turno: "tarde" as const },
    { prof: 3, cons: 3, diaSemana: 5, turno: "noite" as const },
    { prof: 4, cons: 4, diaSemana: 3, turno: "manha" as const },
    { prof: 4, cons: 4, diaSemana: 5, turno: "tarde" as const },
  ];

  for (const a of allocations) {
    await prisma.turnoFixo.create({
      data: {
        profissionalId: profs[a.prof].id,
        consultorioId: consultorios[a.cons].id,
        diaSemana: a.diaSemana,
        turno: a.turno,
      },
    });
  }
  console.log(`✓ Turnos fixos: ${allocations.length} alocações`);
}

// ============================================================
// PACIENTES + USERS
// ============================================================

const NOMES_PACIENTES = [
  "Mariana Silva",
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
    const sexo = i % 3 === 0 ? "M" : i % 3 === 1 ? "F" : "outro";
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
// ATENDIMENTOS (~200 distribuídos em 60 dias)
// ============================================================

const HORARIOS_BASE: Record<"manha" | "tarde" | "noite", string[]> = {
  manha: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  tarde: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"],
  noite: ["18:00", "18:30", "19:00", "19:30"],
};

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
}

async function seedAtendimentos(
  profs: Awaited<ReturnType<typeof seedProfissionais>>,
  consultorios: Awaited<ReturnType<typeof seedConsultorios>>,
  pacientes: Awaited<ReturnType<typeof seedPacientes>>,
) {
  const hoje = startOfDay();
  const consAtivos = consultorios.filter((c) => c.ativo);
  const ocupados = new Set<string>(); // chave: "YYYY-MM-DD|HH:mm|consultorioId"

  const seeds: AtendimentoSeed[] = [];
  const motivosCancel = [
    "Paciente solicitou remarcação",
    "Profissional indisponível por imprevisto",
    "Paciente fora da cidade",
    "Conflito com horário de trabalho",
    "Sem justificativa registrada",
  ];
  const motivosGratuidade = [
    "Cortesia para filho de funcionário",
    "Atendimento social — paciente em situação de vulnerabilidade",
    "Retorno gratuito (revisão pós-procedimento)",
    "Cortesia institucional",
  ];

  // Distribui em 60 dias: 30 dias passados + hoje + 29 dias futuros
  for (let offset = -45; offset <= 14; offset++) {
    const data = addDays(hoje, offset);
    const dow = data.getDay();
    if (dow === 0 || dow === 6) continue; // pula fim de semana

    // 4-7 atendimentos por dia útil
    const qtd = 4 + Math.floor(rand() * 4);
    for (let i = 0; i < qtd; i++) {
      const profIdx = Math.floor(rand() * profs.length);
      const prof = profs[profIdx];
      const cons = pick(consAtivos, profIdx + (i % consAtivos.length));

      // Escolhe turno e horário
      const turnoIdx = rand();
      const turno = turnoIdx < 0.5 ? "manha" : turnoIdx < 0.9 ? "tarde" : "noite";
      const horarios = HORARIOS_BASE[turno];
      const hora = horarios[Math.floor(rand() * horarios.length)];

      const key = `${isoDate(data)}|${hora}|${cons.id}`;
      if (ocupados.has(key)) continue;
      ocupados.add(key);

      const paciente = pacientes[Math.floor(rand() * pacientes.length)];
      // Para finalizados/cobranças seed mantém a lógica antiga de
      // gerar variedade de valores; agendados/cancelados copiam
      // o `valorConsultaBase` do profissional (mesmo caminho da
      // criação em produção pós-migration).
      const valorBase =
        prof.modalidadeContrato === "percentual" ? 200 + (profIdx * 50) : 200;
      const valor = new Prisma.Decimal(valorBase);
      const valorAgendado = new Prisma.Decimal(prof.valorConsultaBase);

      // Status conforme posição temporal
      if (offset > 0) {
        // Futuro: agendado (95%) ou cancelado (5%)
        const r = rand();
        if (r < 0.05) {
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: valorAgendado,
            status: "cancelado",
            statusPagamento: "pendente",
            motivoCancelamento: pick(motivosCancel, Math.floor(r * 100)),
          });
        } else {
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: valorAgendado,
            status: "agendado",
            statusPagamento: "pendente",
          });
        }
      } else if (offset === 0) {
        // Hoje: misto agendado / em_atendimento (mostra fluxo do dia)
        const r = rand();
        if (r < 0.3) {
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: new Prisma.Decimal(0),
            status: "em_atendimento",
            statusPagamento: "pendente",
          });
        } else {
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: new Prisma.Decimal(0),
            status: "agendado",
            statusPagamento: "pendente",
          });
        }
      } else {
        // Passado: realizado (75%), cancelado (10%), nao_compareceu (10%), gratuito (5%)
        const r = rand();
        if (r < 0.05) {
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: valor,
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
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: new Prisma.Decimal(0),
            status: "cancelado",
            statusPagamento: "pendente",
            motivoCancelamento: pick(motivosCancel, Math.floor(r * 1000)),
          });
        } else if (r < 0.25) {
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: new Prisma.Decimal(0),
            status: "nao_compareceu",
            statusPagamento: "pendente",
          });
        } else {
          // Realizado pago ou pendente
          const pagamento = r < 0.85 ? "pago" : "pendente";
          seeds.push({
            data,
            hora,
            pacienteId: paciente.id,
            profissionalId: prof.id,
            consultorioId: cons.id,
            valorConsulta: valor,
            status: "realizado",
            statusPagamento: pagamento,
            prontuarioInterno: {
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
  console.log(`✓ Atendimentos: ${seeds.length}`);
  for (const [k, v] of Object.entries(stats).sort()) {
    console.log(`    ${k}: ${v}`);
  }

  return seeds.length;
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
            })
          : await prisma.atendimento.findMany({
              where: {
                profissionalId: prof.id,
                status: "realizado",
                data: { gte: inicio, lte: fim },
              },
            });

      if (elegiveis.length === 0) continue;

      const receitaBruta = elegiveis
        .filter((a) => a.statusPagamento === "pago")
        .reduce((s, a) => s.plus(a.valorConsulta), new Prisma.Decimal(0));

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
  // Pega 5 atendimentos realizados e simula correções de valor
  const samples = await prisma.atendimento.findMany({
    where: { status: "realizado", statusPagamento: "pago" },
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
  await seedTurnosFixos(profs, consultorios);
  const pacientes = await seedPacientes();
  await seedAtendimentos(profs, consultorios, pacientes);
  await seedRepasses(profs, admin);
  await seedAuditLogs(admin);

  console.log("\n✅ Seed completa! Resumo:");
  console.log(
    `  - 1 admin (${env.ADMIN_EMAIL}) + 2 staff + 5 profissionais + 30 pacientes`,
  );
  console.log(
    `  - 6 consultórios (5 ativos) + 10 alocações de turno fixo`,
  );
  console.log(`  - ~200 atendimentos cobrindo todos os status`);
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
