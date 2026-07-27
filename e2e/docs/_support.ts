/**
 * Suporte das jornadas de documentação funcional.
 *
 * REGRA DE FIDELIDADE DE PERSONA: aqui não existe atalho de autenticação.
 * Nada de storageState, injeção de cookie ou `goto` direto para rota
 * autenticada. Toda jornada começa com o login real pela tela, porque o login
 * faz parte da narrativa — quem assiste precisa ver quem entrou no sistema.
 */
import type { APIRequestContext, Page } from "@playwright/test";
import "dotenv/config";
import { expect, type Narrador, type Persona } from "../../tests/support/narrator";

export { test, expect } from "../../tests/support/narrator";
export type { Narrador, Persona } from "../../tests/support/narrator";

const SENHA_DEMO = "paciente-12345";

/** Elenco da seed. Nome e papel são o que aparece no badge do vídeo. */
export const ELENCO = {
  admin: {
    persona: { papel: "ADMINISTRADOR", nome: "Roberto Lima" } as Persona,
    email: process.env.ADMIN_EMAIL ?? "admin@clinicashare.local",
    senha: process.env.ADMIN_PASSWORD ?? "change-me-on-first-login",
    destino: "**/dashboard",
  },
  auxiliar: {
    persona: { papel: "AUXILIAR", nome: "Carla Nogueira" } as Persona,
    email: "aux@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/dashboard",
  },
  atendente: {
    persona: { papel: "ATENDENTE", nome: "Júlia Nunes" } as Persona,
    email: "atend@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/agenda",
  },
  /** Dra. Helena Braga — Psicologia, aluguel fixo R$250/turno, consulta de 45min */
  psicologa: {
    persona: { papel: "PROFISSIONAL", nome: "Dra. Helena Braga" } as Persona,
    email: "prof3@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/minha-agenda",
  },
  /** Dra. Nirmala Azalea — Clínica geral, percentual 30%, consulta de 30min */
  clinicaGeral: {
    persona: { papel: "PROFISSIONAL", nome: "Dra. Nirmala Azalea" } as Persona,
    email: "prof1@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/minha-agenda",
  },
  paciente: {
    persona: { papel: "PACIENTE", nome: "Maria Silva" } as Persona,
    email: "paciente1@example.com",
    senha: SENHA_DEMO,
    destino: "**/p",
  },
} as const;

export type ChaveElenco = keyof typeof ELENCO;

/** Credenciais de quem não está no elenco fixo (contas descartáveis). */
export interface ContaDeTela {
  /** Nome que aparece na legenda do passo de login. */
  nome: string;
  email: string;
  senha: string;
  /** Glob da rota para onde o sistema leva esse perfil depois do login. */
  destino: string;
}

/**
 * ÚNICO caminho de autenticação das jornadas: formulário de login, na tela.
 * Sem storageState, sem cookie injetado, sem `goto` em rota autenticada como
 * atalho — quem assiste precisa ver quem entrou no sistema.
 */
export async function entrarPelaTela(
  page: Page,
  jornada: Narrador,
  conta: ContaDeTela,
  nomeDoPasso?: string,
): Promise<void> {
  await jornada.passo(
    nomeDoPasso ?? `[RF-021] ${conta.nome} entra no sistema com e-mail e senha`,
    async () => {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(conta.email);
      await page.getByLabel("Senha").fill(conta.senha);
      await Promise.all([
        page.waitForURL(conta.destino, { timeout: 20_000 }),
        page.getByRole("button", { name: /^Entrar$/ }).click(),
      ]);
    },
  );
}

/**
 * Login pela tela real, narrado. [RF-021] é coberto naturalmente aqui, em
 * todas as jornadas.
 */
export async function entrarComo(
  page: Page,
  jornada: Narrador,
  chave: ChaveElenco,
): Promise<void> {
  const conta = ELENCO[chave];
  await entrarPelaTela(page, jornada, {
    nome: conta.persona.nome,
    email: conta.email,
    senha: conta.senha,
    destino: conta.destino,
  });
}

/**
 * Logout visível — usado nas jornadas que trocam de papel.
 *
 * O botão "Sair" mora dentro do menu do usuário (`components/layouts/topbar`)
 * e só existe no DOM depois que o menu abre; por isso o clique é em dois
 * tempos. É logout de verdade: o `POST /api/auth/logout` invalida o cookie
 * `auth-token` no servidor [RF-024].
 */
export async function sair(page: Page, jornada: Narrador): Promise<void> {
  await jornada.passo("Encerra a sessão pelo menu do topo", async () => {
    await page.getByRole("button", { name: "Menu do usuário" }).click();
    await page.getByRole("button", { name: /^Sair$/ }).click();
    await page.waitForURL("**/login", { timeout: 20_000 });
  });
}

// ---------------------------------------------------------------------------
// Domínio
// ---------------------------------------------------------------------------

export interface TurnoFixoApi {
  diaSemana: number;
  turno: string;
  consultorio: { id: string; nome: string };
}

export interface ProfissionalApi {
  id: string;
  nome: string;
  especialidade: string;
  duracaoConsultaMinutos: number;
  modalidadeContrato: "percentual" | "aluguel_fixo";
  turnosFixos: TurnoFixoApi[];
}

export type StatusAgendamentoApi =
  | "agendado"
  | "em_atendimento"
  | "realizado"
  | "cancelado"
  | "nao_compareceu";

export type StatusPagamentoApi = "pago" | "pendente" | "gratuito";

export interface ProcedimentoApi {
  id: string;
  descricao: string;
  /** Decimal(10,2) — a API sempre entrega como string (RNF-101). */
  valor: string;
}

/**
 * Um Atendimento como a API entrega. Serve para `/api/agendamentos` (a fase
 * antes da consulta acontecer) e para `/api/atendimentos` (a mesma linha
 * depois de realizada) — é a mesma tabela, só muda o status.
 */
export interface AtendimentoApi {
  id: string;
  /** ISO completo vindo de coluna `@db.Date` — use `diaDe()` para o YYYY-MM-DD. */
  data: string;
  hora: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  valorConsulta: string;
  /** FI06 — preço de tabela quando houve desconto; null se cobrado cheio. */
  valorOriginal?: string | null;
  status: StatusAgendamentoApi;
  statusPagamento: StatusPagamentoApi;
  motivoCancelamento: string | null;
  motivoDescontoOuGratuidade?: string | null;
  /** AT04 — atendimento documentado no prontuário próprio do profissional. */
  usaProntuarioExterno?: boolean;
  referenciaProntuarioExterno?: string | null;
  prontuarioInterno?: unknown;
  procedimentos?: ProcedimentoApi[];
  valorProcedimentos?: string;
  valorTotal?: string;
  observacoes: string | null;
  paciente: { id: string; nome: string; telefone: string };
  profissional: { id: string; nome: string; especialidade: string };
  consultorio: { id: string; nome: string };
}

export async function lerJson<T>(page: Page, url: string): Promise<T> {
  const res = await page.request.get(url);
  expect(res.status(), `GET ${url}`).toBe(200);
  return (await res.json()) as T;
}

/** Escapa um nome para usar em RegExp de seletor. */
export function regexDe(texto: string): RegExp {
  return new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Primeira data do MÊS SEGUINTE cujo dia da semana o profissional atende.
 * Mês seguinte de propósito: a seed só popula até +14 dias, então a agenda
 * está vazia lá e a jornada nunca esbarra em horário ocupado.
 */
export function primeiraDataAtendida(dows: Set<number>): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1, 12, 0, 0, 0);
  for (let i = 0; i < 14 && !dows.has(d.getDay()); i++) d.setDate(d.getDate() + 1);
  return isoLocal(d);
}

export function porExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Dinheiro e período
//
// As legendas do vídeo repetem os números que estão na tela, então o spec
// precisa formatar igual à aplicação (`lib/format.ts`) e saber ler de volta
// o que o `formatBRL` escreveu.
// ---------------------------------------------------------------------------

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

/** Mesmo formato do `formatBRL` da aplicação: 1234.5 → "R$ 1.234,50". */
export function brl(valor: number): string {
  return BRL.format(valor);
}

/** Caminho inverso: "R$ 1.234,50" → 1234.5 · "17" → 17. */
export function numeroBR(texto: string): number {
  const limpo = texto
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const numero = Number(limpo);
  expect(Number.isFinite(numero), `valor não numérico: "${texto}"`).toBe(true);
  return numero;
}

export function isoHoje(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return isoLocal(d);
}

/**
 * Primeiro dia da janela que a seed popula (hoje − 45; ver `prisma/seed.ts`).
 * As telas de relatório nascem no MÊS ATUAL — no começo do mês elas ficariam
 * quase vazias no vídeo. Ampliar para esta janela mostra números reais.
 */
export function isoInicioJanelaSemeada(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 45);
  return isoLocal(d);
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** aria-label do dia no `<MonthlyCalendar>`. */
function rotuloDia(iso: string): RegExp {
  const d = new Date(`${iso}T12:00:00`);
  return new RegExp(`${d.getDate()} de ${MESES[d.getMonth()]}`, "i");
}

/** Avança o calendário até o mês da data e clica no dia. */
export async function escolherDia(page: Page, iso: string): Promise<void> {
  const dia = page.getByRole("button", { name: rotuloDia(iso) });
  for (let i = 0; i < 4 && (await dia.count()) === 0; i++) {
    await page.getByRole("button", { name: /Próximo mês/i }).click();
    await page.waitForTimeout(250);
  }
  await dia.first().click();
}

/** Horários ainda livres na grade de slots. */
export function horariosLivres(page: Page) {
  return page
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .and(page.locator("button:not([disabled])"));
}

// ---------------------------------------------------------------------------
// Pré-condição de bastidores
// ---------------------------------------------------------------------------

/** `data` chega como ISO completo (`@db.Date`); a jornada só quer o dia. */
export function diaDe(a: { data: string }): string {
  return a.data.slice(0, 10);
}

/**
 * Garante que o profissional tenha um agendamento futuro para a jornada
 * começar. Só roda quando a seed não deixou nenhum — e a narração do vídeo
 * avisa que isso é preparação de bastidores, não parte do caso de uso.
 *
 * Precisa de admin porque `POST /api/agendamentos` é AG02 (admin/atendente)
 * ou AG01 (o próprio paciente): profissional não marca consulta para si.
 * Por isso usa o `request` isolado do Playwright — a sessão da persona na
 * página continua intocada, sem cookie trocado nem papel emprestado.
 */
export async function criarAgendadoNosBastidores(
  request: APIRequestContext,
  profissionalId: string,
): Promise<void> {
  const entrada = await request.post("/api/auth/login", {
    data: { email: ELENCO.admin.email, senha: ELENCO.admin.senha },
  });
  expect(entrada.status(), "login do admin para preparar a pré-condição").toBe(
    200,
  );

  const resProf = await request.get("/api/profissionais?ativo=true");
  expect(resProf.status(), "GET /api/profissionais").toBe(200);
  const { profissionais } = (await resProf.json()) as {
    profissionais: (ProfissionalApi & { turnosFixos: TurnoFixoApi[] })[];
  };
  const prof = profissionais.find((p) => p.id === profissionalId);
  expect(prof, "profissional da jornada precisa existir e estar ativo").toBeTruthy();
  const turnoFixo = prof!.turnosFixos[0];
  expect(turnoFixo, `${prof!.nome} precisa de turno fixo cadastrado`).toBeTruthy();

  const resTurnos = await request.get("/api/configuracoes/turnos");
  expect(resTurnos.status(), "GET /api/configuracoes/turnos").toBe(200);
  const { turnos } = (await resTurnos.json()) as {
    turnos: Record<string, { inicio: string; fim: string }>;
  };
  // O início do bloco sempre cai dentro do próprio turno em `horaToTurno`.
  const hora = turnos[turnoFixo.turno].inicio;

  const resPac = await request.get("/api/pacientes");
  expect(resPac.status(), "GET /api/pacientes").toBe(200);
  const { pacientes } = (await resPac.json()) as { pacientes: { id: string }[] };
  expect(pacientes.length, "a seed precisa de pacientes").toBeGreaterThan(0);

  // Mês seguinte: a seed só popula até +14 dias, então lá a sala está livre.
  const primeiro = new Date(
    `${primeiraDataAtendida(new Set([turnoFixo.diaSemana]))}T12:00:00`,
  );
  let ultimoErro = "";
  for (let semana = 0; semana < 6; semana++) {
    const dia = new Date(primeiro);
    dia.setDate(primeiro.getDate() + semana * 7);
    const res = await request.post("/api/agendamentos", {
      data: {
        pacienteId: pacientes[0].id,
        profissionalId,
        consultorioId: turnoFixo.consultorio.id,
        data: isoLocal(dia),
        hora,
        observacoes: "Pré-condição da documentação em vídeo",
      },
    });
    if (res.status() === 201) return;
    ultimoErro = `${res.status()} ${await res.text()}`;
  }
  throw new Error(
    `Não foi possível preparar o agendamento de pré-condição: ${ultimoErro}`,
  );
}
