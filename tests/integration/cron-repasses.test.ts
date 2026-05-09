import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { POST as cronPost } from "@/app/(back-end)/api/cron/gerar-repasses/route";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { cleanDb } from "../helpers/db";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

function cronRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new NextRequest("http://localhost:3000/api/cron/gerar-repasses", {
    method: "POST",
    headers,
  });
}

async function seedProfissional() {
  return prisma.profissional.create({
    data: {
      nome: "Dra. Cron Tester",
      especialidade: "Clínica geral",
      email: `cron-${Date.now()}@test.local`,
      telefone: "11999990000",
      conselho: "CRM-12345",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: new Prisma.Decimal(0.7),
      ativo: true,
    },
  });
}

describe("POST /api/cron/gerar-repasses — auth", () => {
  it("rejeita request sem header Authorization", async () => {
    const res = await cronPost(cronRequest());
    expect(res.status).toBe(401);
  });

  it("rejeita bearer com secret incorreto", async () => {
    const res = await cronPost(cronRequest("token-totalmente-errado-aqui-aqui"));
    expect(res.status).toBe(401);
  });

  it("aceita bearer com CRON_SECRET válido", async () => {
    await seedProfissional();
    const res = await cronPost(cronRequest(env.CRON_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("periodoInicio");
    expect(body).toHaveProperty("periodoFim");
    expect(body.detalhes).toHaveLength(1);
  });
});

describe("POST /api/cron/gerar-repasses — idempotência", () => {
  it("chamar duas vezes não cria registro duplicado", async () => {
    const prof = await seedProfissional();

    const r1 = await cronPost(cronRequest(env.CRON_SECRET));
    expect(r1.status).toBe(200);
    const b1 = await r1.json();
    expect(b1.detalhes[0].criado).toBe(true);

    const r2 = await cronPost(cronRequest(env.CRON_SECRET));
    expect(r2.status).toBe(200);
    const b2 = await r2.json();
    expect(b2.detalhes[0].criado).toBe(false);
    expect(b2.detalhes[0].repasseId).toBe(b1.detalhes[0].repasseId);

    const total = await prisma.repasse.count({
      where: { profissionalId: prof.id },
    });
    expect(total).toBe(1);
  });
});
