import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import {
  escolherDiaNoCalendario,
  horariosLivres,
  isoLocal,
  proximoDiaUtil,
} from "./helpers/calendario";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ATEND_EMAIL = `atend-e2e-${Date.now()}@example.com`;
const ATEND_PASSWORD = "atend-e2e-12345";
const PACIENTE_EMAIL = `pac-e2e-${Date.now()}@example.com`;

let profissionalId = "";
let consultorioId = "";
/** Horário efetivamente escolhido no primeiro teste; os seguintes reusam. */
let horaCriada = "";

/**
 * Próximo dia ÚTIL, não simplesmente amanhã: `TurnoFixo` só aceita diaSemana
 * 1..5 e o calendário desabilita os dias em que o profissional não atende,
 * então cair num sábado deixaria o teste sem nenhum dia clicável.
 */
function dataAmanhaISO() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return isoLocal(proximoDiaUtil(d));
}

test.beforeAll(async () => {
  await prisma.repasse.deleteMany();
  await prisma.atendimento.deleteMany();
  await prisma.turnoFixo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.consultorio.deleteMany();

  // Atendente para login
  await prisma.user.create({
    data: {
      email: ATEND_EMAIL,
      passwordHash: await bcrypt.hash(ATEND_PASSWORD, 10),
      role: "atendente",
    },
  });

  // Paciente já existente (para evitar fluxo de cadastro no E2E principal)
  await prisma.paciente.create({
    data: {
      nome: "Paciente E2E",
      email: PACIENTE_EMAIL,
      telefone: "11999990000",
    },
  });

  const prof = await prisma.profissional.create({
    data: {
      nome: "Dr. Agenda E2E",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 88888",
      email: `prof-ag-${Date.now()}@e2e.com`,
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: 0.3,
      duracaoConsultaMinutos: 30,
    },
  });
  profissionalId = prof.id;

  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala Agenda E2E",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  consultorioId = cons.id;

  // Sem TurnoFixo o calendário não libera dia nenhum e `createAgendamento`
  // recusa com 400 antes de avaliar conflito de horário — era por isso que o
  // teste de AG05 recebia 400 onde esperava 409.
  const alvo = new Date(`${dataAmanhaISO()}T12:00:00`);
  await prisma.turnoFixo.create({
    data: {
      profissionalId: prof.id,
      consultorioId: cons.id,
      diaSemana: alvo.getDay(),
      turno: "manha",
    },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAsAtendente(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(ATEND_EMAIL);
  await page.getByLabel("Senha").fill(ATEND_PASSWORD);
  await Promise.all([
    page.waitForURL("**/agenda", { timeout: 15_000 }),
    page.getByRole("button", { name: /^Entrar$/ }).click(),
  ]);
}

test.describe("Agenda — fluxo Atendente (Fase 3)", () => {
  test("cria agendamento via UI e marca chegada", async ({ page }) => {
    await loginAsAtendente(page);

    await page.goto("/agenda/novo");

    // Combobox: abre via label, busca, seleciona paciente
    await page.getByLabel("Paciente").click();
    await page.getByPlaceholder("Nome, e-mail, CPF ou telefone").fill("Paciente E2E");
    await page.getByRole("option", { name: /Paciente E2E/i }).click();

    // Profissional + consultório já vêm pré-selecionados (os únicos cadastrados)

    // Data: próximo dia útil, escolhido no calendário mensal (a tela deixou
    // de ter um input de data)
    const data = dataAmanhaISO();
    await escolherDiaNoCalendario(page, data);

    // Primeiro horário realmente livre da grade do profissional
    const slots = horariosLivres(page);
    await expect(slots.first()).toBeVisible();
    horaCriada = (await slots.first().innerText()).trim();
    await slots.first().click();

    await Promise.all([
      page.waitForURL("**/agenda", { timeout: 15_000 }),
      page.getByRole("button", { name: /Confirmar agendamento/i }).click(),
    ]);

    // Garante que selecionamos o dia certo na visão de agenda
    // (a página abre em hoje; navegamos para amanhã via API direta para validar)
    // Nesta versão simplificada, validamos via DB que o agendamento existe:
    const ag = await prisma.atendimento.findFirst({
      where: { profissionalId, hora: horaCriada },
    });
    expect(ag).not.toBeNull();
    expect(ag?.status).toBe("agendado");
  });

  test("conflito de horário (AG05) retorna erro amigável", async ({ page }) => {
    await loginAsAtendente(page);

    // Criar segundo paciente direto no DB
    const p2 = await prisma.paciente.create({
      data: {
        nome: "Outro E2E",
        email: `outro-${Date.now()}@e2e.com`,
        telefone: "11977776666",
      },
    });

    // Tentar criar via API direto (page.request compartilha cookie do login)
    const data = dataAmanhaISO();
    const res = await page.request.post("/api/agendamentos", {
      data: {
        pacienteId: p2.id,
        profissionalId,
        consultorioId,
        data,
        hora: horaCriada,
      },
    });
    expect(res.status()).toBe(409);
  });

  test("marcar chegada altera status para em_atendimento", async ({ page }) => {
    await loginAsAtendente(page);

    const ag = await prisma.atendimento.findFirstOrThrow({
      where: { profissionalId, hora: horaCriada },
    });

    const res = await page.request.post(
      `/api/agendamentos/${ag.id}/marcar-chegada`,
      { data: {} },
    );
    expect(res.status()).toBe(200);

    const updated = await prisma.atendimento.findUnique({ where: { id: ag.id } });
    expect(updated?.status).toBe("em_atendimento");

    const logs = await prisma.auditLog.findMany({ where: { entidadeId: ag.id } });
    expect(logs.length).toBeGreaterThan(0);
  });

  test("cancelar com motivo grava AuditLog", async ({ page }) => {
    await loginAsAtendente(page);

    // Agendamento próprio: o do teste anterior já foi movido para
    // `em_atendimento`, e o cancelamento só aceita `agendado`.
    const paciente = await prisma.paciente.findFirstOrThrow();
    const ag = await prisma.atendimento.create({
      data: {
        data: new Date(dataAmanhaISO()),
        hora: "11:30",
        pacienteId: paciente.id,
        profissionalId,
        consultorioId,
        valorConsulta: 200,
        status: "agendado",
        statusPagamento: "pendente",
      },
    });

    const res = await page.request.post(
      `/api/agendamentos/${ag.id}/cancelar`,
      { data: { motivo: "Paciente solicitou remarcação" } },
    );
    expect(res.status()).toBe(200);

    const updated = await prisma.atendimento.findUnique({ where: { id: ag.id } });
    expect(updated?.status).toBe("cancelado");
    expect(updated?.motivoCancelamento).toBe("Paciente solicitou remarcação");

    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: ag.id, campo: "status" },
    });
    expect(logs.some((l) => l.valorDepois === "cancelado")).toBe(true);
  });
});
