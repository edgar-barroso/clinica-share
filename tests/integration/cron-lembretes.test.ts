import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

// Mock dos canais ANTES de importar usecases
const mocks = vi.hoisted(() => ({
  sendLembrete: vi.fn().mockResolvedValue(undefined),
  sendWhats: vi.fn().mockResolvedValue({ ok: true, messageId: "stub" }),
}));
vi.mock("@/app/(back-end)/_lib/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendLembreteConsultaEmail: mocks.sendLembrete,
}));
vi.mock("@/app/(back-end)/_lib/whatsapp", () => ({
  sendWhatsApp: mocks.sendWhats,
  normalizarTelefone: (s: string) => s,
}));

import { POST as cronPost } from "@/app/(back-end)/api/cron/lembretes-amanha/route";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { cleanDb } from "../helpers/db";

beforeEach(async () => {
  await cleanDb();
  mocks.sendLembrete.mockClear();
  mocks.sendWhats.mockClear();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

function cronReq(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new NextRequest("http://localhost:3000/api/cron/lembretes-amanha", {
    method: "POST",
    headers,
  });
}

function dataAmanha(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

async function seed(amanha: Date) {
  const cons = await prisma.consultorio.create({
    data: {
      nome: "Sala A",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  const prof = await prisma.profissional.create({
    data: {
      nome: "Dra. Lembrete",
      especialidade: "Clínica geral",
      conselho: "CRM-1",
      email: `lembrete-prof-${Date.now()}@e2e.com`,
      telefone: "11000000000",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: new Prisma.Decimal(0.7),
    },
  });
  const pac1 = await prisma.paciente.create({
    data: {
      nome: "Paciente Amanhã",
      email: `pac-amanha-${Date.now()}@e2e.com`,
      telefone: "11999990001",
    },
  });
  const pac2 = await prisma.paciente.create({
    data: {
      nome: "Paciente Hoje",
      email: `pac-hoje-${Date.now()}@e2e.com`,
      telefone: "11999990002",
    },
  });

  // 1 atendimento agendado AMANHÃ (deve notificar)
  const target = await prisma.atendimento.create({
    data: {
      pacienteId: pac1.id,
      profissionalId: prof.id,
      consultorioId: cons.id,
      data: amanha,
      hora: "10:00",
      valorConsulta: new Prisma.Decimal(0),
    },
  });

  // 1 cancelado amanhã (NÃO deve notificar)
  const hoje = new Date(amanha);
  hoje.setDate(hoje.getDate() - 1);
  await prisma.atendimento.create({
    data: {
      pacienteId: pac2.id,
      profissionalId: prof.id,
      consultorioId: cons.id,
      data: amanha,
      hora: "11:00",
      valorConsulta: new Prisma.Decimal(0),
      status: "cancelado",
      motivoCancelamento: "Teste",
    },
  });

  // 1 agendado HOJE (NÃO deve notificar — dia errado)
  await prisma.atendimento.create({
    data: {
      pacienteId: pac2.id,
      profissionalId: prof.id,
      consultorioId: cons.id,
      data: hoje,
      hora: "12:00",
      valorConsulta: new Prisma.Decimal(0),
    },
  });

  return { target, pac1 };
}

describe("POST /api/cron/lembretes-amanha — auth", () => {
  it("rejeita sem header", async () => {
    const res = await cronPost(cronReq());
    expect(res.status).toBe(401);
  });

  it("rejeita com bearer errado", async () => {
    const res = await cronPost(cronReq("token-errado-123-pq-precisa-16-chars"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/cron/lembretes-amanha — comportamento", () => {
  it("envia para agendados de amanhã, ignora outros status/datas", async () => {
    const amanha = dataAmanha();
    const { target } = await seed(amanha);

    const res = await cronPost(cronReq(env.CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.enviados).toBe(1);
    expect(body.total).toBe(1);
    expect(mocks.sendLembrete).toHaveBeenCalledTimes(1);
    expect(mocks.sendWhats).toHaveBeenCalledTimes(1);

    // marca lembreteEnviadoEm
    const after = await prisma.atendimento.findUnique({
      where: { id: target.id },
    });
    expect(after?.lembreteEnviadoEm).toBeTruthy();
  });

  it("idempotente — segunda execução não re-envia", async () => {
    const amanha = dataAmanha();
    await seed(amanha);

    await cronPost(cronReq(env.CRON_SECRET));
    expect(mocks.sendLembrete).toHaveBeenCalledTimes(1);

    mocks.sendLembrete.mockClear();
    mocks.sendWhats.mockClear();

    const res2 = await cronPost(cronReq(env.CRON_SECRET));
    const body2 = await res2.json();
    expect(body2.enviados).toBe(0);
    expect(body2.jaNotificados).toBe(1);
    expect(mocks.sendLembrete).not.toHaveBeenCalled();
  });

  it("se email falha mas WhatsApp OK, marca como enviado mesmo assim", async () => {
    mocks.sendLembrete.mockRejectedValueOnce(new Error("SMTP fail"));
    const amanha = dataAmanha();
    const { target } = await seed(amanha);

    const res = await cronPost(cronReq(env.CRON_SECRET));
    const body = await res.json();
    expect(body.enviados).toBe(1);
    expect(body.detalhes[0].emailOk).toBe(false);
    expect(body.detalhes[0].whatsappOk).toBe(true);

    const after = await prisma.atendimento.findUnique({
      where: { id: target.id },
    });
    expect(after?.lembreteEnviadoEm).toBeTruthy();
  });

  it("se ambos falham, NÃO marca como enviado (próximo cron tenta de novo)", async () => {
    mocks.sendLembrete.mockRejectedValueOnce(new Error("SMTP fail"));
    mocks.sendWhats.mockResolvedValueOnce({ ok: false, error: "API fail" });
    const amanha = dataAmanha();
    const { target } = await seed(amanha);

    const res = await cronPost(cronReq(env.CRON_SECRET));
    const body = await res.json();
    expect(body.enviados).toBe(0);

    const after = await prisma.atendimento.findUnique({
      where: { id: target.id },
    });
    expect(after?.lembreteEnviadoEm).toBeNull();
  });
});
