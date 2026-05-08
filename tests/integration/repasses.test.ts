import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { GET as listGet } from "@/app/(back-end)/api/repasses/route";
import { POST as gerarPost } from "@/app/(back-end)/api/repasses/gerar/route";
import { GET as itemGet } from "@/app/(back-end)/api/repasses/[id]/route";
import { POST as marcarPagoPost } from "@/app/(back-end)/api/repasses/[id]/marcar-pago/route";
import { prisma } from "@/lib/db";
import { signAuthToken } from "@/app/(back-end)/_lib/jwt";
import { cleanDb } from "../helpers/db";
import { createUserWithRole } from "../helpers/auth";
import { jsonRequest, getRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const ctxId = (id: string) => ({ params: Promise.resolve({ id }) });
const PERIODO_INICIO = "2026-06-01";
const PERIODO_FIM = "2026-06-07";

async function fixtureCenario() {
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. R",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 1000",
      email: "drR@e.com",
      telefone: "11999990000",
      modalidadeContrato: "percentual",
      percentualRepasse: new Prisma.Decimal(0.3),
      duracaoConsultaMinutos: 30,
    },
  });
  const paciente = await prisma.paciente.create({
    data: { nome: "P", email: "p@e.com", telefone: "11900000000" },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "S1",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  await prisma.atendimento.create({
    data: {
      pacienteId: paciente.id,
      profissionalId: profissional.id,
      consultorioId: consultorio.id,
      data: new Date("2026-06-03"),
      hora: "10:00",
      valorConsulta: new Prisma.Decimal(200),
      status: "realizado",
      statusPagamento: "pago",
    },
  });
  return { profissional };
}

describe("POST /api/repasses/gerar", () => {
  it("admin gera repasse + atendimentos vinculados", async () => {
    const { token } = await createUserWithRole("admin");
    const { profissional } = await fixtureCenario();

    const res = await gerarPost(
      withAuthCookie(
        jsonRequest("/api/repasses/gerar", {
          profissionalId: profissional.id,
          periodoInicio: PERIODO_INICIO,
          periodoFim: PERIODO_FIM,
        }),
        token,
      ),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.repasse.receitaBruta).toBe("200");
    expect(body.repasse.valorRepasse).toBe("60");
    expect(body.repasse.atendimentos).toHaveLength(1);
  });

  it("idempotente: 2ª chamada retorna o mesmo Repasse", async () => {
    const { token } = await createUserWithRole("admin");
    const { profissional } = await fixtureCenario();

    const r1 = await gerarPost(
      withAuthCookie(
        jsonRequest("/api/repasses/gerar", {
          profissionalId: profissional.id,
          periodoInicio: PERIODO_INICIO,
          periodoFim: PERIODO_FIM,
        }),
        token,
      ),
    );
    const b1 = await r1.json();
    const r2 = await gerarPost(
      withAuthCookie(
        jsonRequest("/api/repasses/gerar", {
          profissionalId: profissional.id,
          periodoInicio: PERIODO_INICIO,
          periodoFim: PERIODO_FIM,
        }),
        token,
      ),
    );
    const b2 = await r2.json();
    expect(b1.repasse.id).toBe(b2.repasse.id);

    const count = await prisma.repasse.count({
      where: { profissionalId: profissional.id },
    });
    expect(count).toBe(1);
  });

  it("profissional NÃO pode gerar (só admin/aux) → 403", async () => {
    const { token } = await createUserWithRole("profissional");
    const { profissional } = await fixtureCenario();

    const res = await gerarPost(
      withAuthCookie(
        jsonRequest("/api/repasses/gerar", {
          profissionalId: profissional.id,
          periodoInicio: PERIODO_INICIO,
          periodoFim: PERIODO_FIM,
        }),
        token,
      ),
    );
    expect(res.status).toBe(403);
  });

  it("período inválido (fim < inicio) → 422", async () => {
    const { token } = await createUserWithRole("admin");
    const { profissional } = await fixtureCenario();

    const res = await gerarPost(
      withAuthCookie(
        jsonRequest("/api/repasses/gerar", {
          profissionalId: profissional.id,
          periodoInicio: "2026-06-07",
          periodoFim: "2026-06-01",
        }),
        token,
      ),
    );
    expect(res.status).toBe(422);
  });
});

describe("POST /api/repasses/[id]/marcar-pago — FI08", () => {
  it("admin marca pago + audit log", async () => {
    const { user, token } = await createUserWithRole("admin");
    const { profissional } = await fixtureCenario();

    const r = await prisma.repasse.create({
      data: {
        profissionalId: profissional.id,
        periodoInicio: new Date(PERIODO_INICIO),
        periodoFim: new Date(PERIODO_FIM),
        receitaBruta: new Prisma.Decimal(200),
        valorRepasse: new Prisma.Decimal(60),
      },
    });

    const res = await marcarPagoPost(
      withAuthCookie(
        jsonRequest(`/api/repasses/${r.id}/marcar-pago`, {
          motivo: "Pagamento via PIX",
        }),
        token,
      ),
      ctxId(r.id),
    );
    expect(res.status).toBe(200);

    const persisted = await prisma.repasse.findUnique({ where: { id: r.id } });
    expect(persisted?.status).toBe("pago");
    expect(persisted?.dataPagamento).toBeTruthy();

    const log = await prisma.auditLog.findFirst({
      where: { entidadeId: r.id },
    });
    expect(log?.userId).toBe(user.id);
    expect(log?.valorDepois).toBe("pago");
    expect(log?.motivo).toBe("Pagamento via PIX");
  });

  it("profissional NÃO pode marcar pago → 403", async () => {
    const { token } = await createUserWithRole("profissional");
    const { profissional } = await fixtureCenario();

    const r = await prisma.repasse.create({
      data: {
        profissionalId: profissional.id,
        periodoInicio: new Date(PERIODO_INICIO),
        periodoFim: new Date(PERIODO_FIM),
        receitaBruta: new Prisma.Decimal(200),
        valorRepasse: new Prisma.Decimal(60),
      },
    });

    const res = await marcarPagoPost(
      withAuthCookie(
        jsonRequest(`/api/repasses/${r.id}/marcar-pago`, {}),
        token,
      ),
      ctxId(r.id),
    );
    expect(res.status).toBe(403);
  });

  it("já pago → 400", async () => {
    const { token } = await createUserWithRole("admin");
    const { profissional } = await fixtureCenario();

    const r = await prisma.repasse.create({
      data: {
        profissionalId: profissional.id,
        periodoInicio: new Date(PERIODO_INICIO),
        periodoFim: new Date(PERIODO_FIM),
        receitaBruta: new Prisma.Decimal(200),
        valorRepasse: new Prisma.Decimal(60),
        status: "pago",
        dataPagamento: new Date(),
      },
    });

    const res = await marcarPagoPost(
      withAuthCookie(
        jsonRequest(`/api/repasses/${r.id}/marcar-pago`, {}),
        token,
      ),
      ctxId(r.id),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/repasses — RBAC", () => {
  it("profissional vê só os próprios repasses", async () => {
    const { profissional } = await fixtureCenario();
    const profB = await prisma.profissional.create({
      data: {
        nome: "Outro",
        especialidade: "Pediatria",
        conselho: "CRM-SP 2",
        email: "outro@e.com",
        telefone: "11900000022",
        modalidadeContrato: "percentual",
        percentualRepasse: new Prisma.Decimal(0.3),
        duracaoConsultaMinutos: 30,
      },
    });

    await prisma.repasse.createMany({
      data: [
        {
          profissionalId: profissional.id,
          periodoInicio: new Date(PERIODO_INICIO),
          periodoFim: new Date(PERIODO_FIM),
          receitaBruta: new Prisma.Decimal(200),
          valorRepasse: new Prisma.Decimal(60),
        },
        {
          profissionalId: profB.id,
          periodoInicio: new Date(PERIODO_INICIO),
          periodoFim: new Date(PERIODO_FIM),
          receitaBruta: new Prisma.Decimal(500),
          valorRepasse: new Prisma.Decimal(150),
        },
      ],
    });

    const { user } = await createUserWithRole("profissional", "u-r@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profissional.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await listGet(withAuthCookie(getRequest("/api/repasses"), token));
    const body = await res.json();
    expect(body.repasses).toHaveLength(1);
    expect(body.repasses[0].profissionalId).toBe(profissional.id);
  });
});

describe("GET /api/repasses/[id]", () => {
  it("admin vê detalhe com breakdown", async () => {
    const { token } = await createUserWithRole("admin");
    const { profissional } = await fixtureCenario();
    const r = await prisma.repasse.create({
      data: {
        profissionalId: profissional.id,
        periodoInicio: new Date(PERIODO_INICIO),
        periodoFim: new Date(PERIODO_FIM),
        receitaBruta: new Prisma.Decimal(200),
        valorRepasse: new Prisma.Decimal(60),
      },
    });

    const res = await itemGet(
      withAuthCookie(getRequest(`/api/repasses/${r.id}`), token),
      ctxId(r.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.repasse.id).toBe(r.id);
    expect(body.breakdown.modalidade).toBe("percentual");
    expect(body.breakdown.detalhes).toHaveLength(1);
  });

  it("profissional dono vê breakdown", async () => {
    const { profissional } = await fixtureCenario();
    const r = await prisma.repasse.create({
      data: {
        profissionalId: profissional.id,
        periodoInicio: new Date(PERIODO_INICIO),
        periodoFim: new Date(PERIODO_FIM),
        receitaBruta: new Prisma.Decimal(200),
        valorRepasse: new Prisma.Decimal(60),
      },
    });
    const { user } = await createUserWithRole("profissional", "u-r2@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profissional.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await itemGet(
      withAuthCookie(getRequest(`/api/repasses/${r.id}`), token),
      ctxId(r.id),
    );
    expect(res.status).toBe(200);
  });

  it("profissional não-dono → 403", async () => {
    const { profissional } = await fixtureCenario();
    const profB = await prisma.profissional.create({
      data: {
        nome: "Outro",
        especialidade: "Pediatria",
        conselho: "CRM-SP 3",
        email: "ob@e.com",
        telefone: "11900000099",
        modalidadeContrato: "percentual",
        percentualRepasse: new Prisma.Decimal(0.3),
        duracaoConsultaMinutos: 30,
      },
    });
    const r = await prisma.repasse.create({
      data: {
        profissionalId: profissional.id,
        periodoInicio: new Date(PERIODO_INICIO),
        periodoFim: new Date(PERIODO_FIM),
        receitaBruta: new Prisma.Decimal(200),
        valorRepasse: new Prisma.Decimal(60),
      },
    });
    const { user } = await createUserWithRole("profissional", "u-rOutro@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profB.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await itemGet(
      withAuthCookie(getRequest(`/api/repasses/${r.id}`), token),
      ctxId(r.id),
    );
    expect(res.status).toBe(403);
  });
});
