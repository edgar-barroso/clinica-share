import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  GET as listGet,
  POST as walkInPost,
} from "@/app/(back-end)/api/atendimentos/route";
import {
  GET as itemGet,
  PATCH as itemPatch,
} from "@/app/(back-end)/api/atendimentos/[id]/route";
import { POST as finalizarPost } from "@/app/(back-end)/api/atendimentos/[id]/finalizar/route";
import { POST as iniciarPost } from "@/app/(back-end)/api/agendamentos/[id]/iniciar/route";
import { POST as naoCompareceuPost } from "@/app/(back-end)/api/agendamentos/[id]/nao-compareceu/route";
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

async function createFixtures() {
  const paciente = await prisma.paciente.create({
    data: { nome: "Paciente A", email: "pa@e.com", telefone: "11999990000" },
  });
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. A",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 1",
      email: "dra@e.com",
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: 0.3,
      duracaoConsultaMinutos: 30,
    },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "Sala 1",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  return { paciente, profissional, consultorio };
}

async function createAgendado() {
  const { paciente, profissional, consultorio } = await createFixtures();
  const ag = await prisma.atendimento.create({
    data: {
      pacienteId: paciente.id,
      profissionalId: profissional.id,
      consultorioId: consultorio.id,
      data: new Date("2026-06-01"),
      hora: "10:00",
      valorConsulta: 0,
    },
  });
  return { paciente, profissional, consultorio, ag };
}

describe("POST /api/atendimentos — walk-in (AT01)", () => {
  it("admin cria walk-in já realizado + audit log", async () => {
    const { user, token } = await createUserWithRole("admin");
    const { paciente, profissional, consultorio } = await createFixtures();

    const res = await walkInPost(
      withAuthCookie(
        jsonRequest("/api/atendimentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-10",
          hora: "10:00",
          valorConsulta: 250,
          statusPagamento: "pago",
        }),
        token,
      ),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.atendimento.status).toBe("realizado");
    expect(body.atendimento.statusPagamento).toBe("pago");

    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: body.atendimento.id },
    });
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.every((l) => l.userId === user.id)).toBe(true);
  });

  it("atendente é negado em walk-in (403)", async () => {
    const { token } = await createUserWithRole("atendente");
    const { paciente, profissional, consultorio } = await createFixtures();

    const res = await walkInPost(
      withAuthCookie(
        jsonRequest("/api/atendimentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-10",
          hora: "11:00",
          valorConsulta: 100,
          statusPagamento: "pago",
        }),
        token,
      ),
    );
    expect(res.status).toBe(403);
  });

  it("walk-in gratuito sem motivo → 422 (FI06)", async () => {
    const { token } = await createUserWithRole("admin");
    const { paciente, profissional, consultorio } = await createFixtures();

    const res = await walkInPost(
      withAuthCookie(
        jsonRequest("/api/atendimentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-10",
          hora: "11:00",
          valorConsulta: 0,
          statusPagamento: "gratuito",
        }),
        token,
      ),
    );
    expect(res.status).toBe(422);
  });
});

describe("POST /api/agendamentos/[id]/iniciar — AT05", () => {
  it("profissional dono inicia atendimento → em_atendimento", async () => {
    const { profissional, ag } = await createAgendado();
    const { user } = await createUserWithRole("profissional", "drA-user@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profissional.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await iniciarPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${ag.id}/iniciar`, {}),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(200);

    const persisted = await prisma.atendimento.findUnique({ where: { id: ag.id } });
    expect(persisted?.status).toBe("em_atendimento");

    const logs = await prisma.auditLog.findMany({ where: { entidadeId: ag.id } });
    expect(logs.length).toBe(1);
    expect(logs[0].valorDepois).toBe("em_atendimento");
  });

  it("profissional NÃO-dono → 403", async () => {
    const { ag } = await createAgendado();
    // Profissional B (outro)
    const profB = await prisma.profissional.create({
      data: {
        nome: "Dr. B",
        especialidade: "Pediatria",
        conselho: "CRM-SP 2",
        email: "drb@e.com",
        telefone: "11977776666",
        modalidadeContrato: "percentual",
        valorConsultaBase: 200,
        percentualRepasse: 0.3,
        duracaoConsultaMinutos: 30,
      },
    });
    const { user } = await createUserWithRole("profissional", "drB-user@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profB.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await iniciarPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${ag.id}/iniciar`, {}),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(403);
  });

  it("status já em_atendimento → 400", async () => {
    const { token } = await createUserWithRole("admin");
    const { ag } = await createAgendado();
    await prisma.atendimento.update({
      where: { id: ag.id },
      data: { status: "em_atendimento" },
    });

    const res = await iniciarPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${ag.id}/iniciar`, {}),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/agendamentos/[id]/nao-compareceu", () => {
  it("atendente marca não-compareceu + audit", async () => {
    const { token } = await createUserWithRole("atendente");
    const { ag } = await createAgendado();

    const res = await naoCompareceuPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${ag.id}/nao-compareceu`, {}),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(200);

    const persisted = await prisma.atendimento.findUnique({ where: { id: ag.id } });
    expect(persisted?.status).toBe("nao_compareceu");

    const logs = await prisma.auditLog.findMany({ where: { entidadeId: ag.id } });
    expect(logs.length).toBe(1);
    expect(logs[0].valorDepois).toBe("nao_compareceu");
  });

  it("profissional NÃO pode marcar não-compareceu → 403", async () => {
    const { token } = await createUserWithRole("profissional");
    const { ag } = await createAgendado();

    const res = await naoCompareceuPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${ag.id}/nao-compareceu`, {}),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(403);
  });
});

describe("POST /api/atendimentos/[id]/finalizar — AT06", () => {
  async function emAtendimento() {
    const { paciente, profissional, consultorio } = await createFixtures();
    const ag = await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-01"),
        hora: "10:00",
        valorConsulta: 0,
        status: "em_atendimento",
      },
    });
    return { ag, profissional };
  }

  it("profissional dono finaliza → realizado + 3 audit logs", async () => {
    const { ag, profissional } = await emAtendimento();
    const { user } = await createUserWithRole("profissional", "p-finalizar@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profissional.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await finalizarPost(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${ag.id}/finalizar`, {
          valorConsulta: 200,
          statusPagamento: "pago",
          prontuarioInterno: { anamnese: "ok", evolucao: "boa" },
        }),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.atendimento.status).toBe("realizado");
    expect(body.atendimento.valorConsulta).toBe("200");

    const logs = await prisma.auditLog.findMany({ where: { entidadeId: ag.id } });
    const campos = logs.map((l) => l.campo).sort();
    expect(campos).toEqual(["status", "statusPagamento", "valorConsulta"]);
  });

  it("profissional NÃO-dono → 403", async () => {
    const { ag } = await emAtendimento();
    const profB = await prisma.profissional.create({
      data: {
        nome: "Outro",
        especialidade: "Pediatria",
        conselho: "CRM-SP 9",
        email: "outro@e.com",
        telefone: "11955554444",
        modalidadeContrato: "percentual",
        valorConsultaBase: 200,
        percentualRepasse: 0.3,
        duracaoConsultaMinutos: 30,
      },
    });
    const { user } = await createUserWithRole("profissional", "outro-user@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profB.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await finalizarPost(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${ag.id}/finalizar`, {
          valorConsulta: 100,
          statusPagamento: "pago",
        }),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(403);
  });

  it("status agendado (não em_atendimento) → 400", async () => {
    const { token } = await createUserWithRole("admin");
    const { ag } = await createAgendado();

    const res = await finalizarPost(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${ag.id}/finalizar`, {
          valorConsulta: 100,
          statusPagamento: "pago",
        }),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(400);
  });

  it("gratuito sem motivo → 422", async () => {
    const { token } = await createUserWithRole("admin");
    const { ag } = await emAtendimento();

    const res = await finalizarPost(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${ag.id}/finalizar`, {
          valorConsulta: 0,
          statusPagamento: "gratuito",
        }),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/atendimentos/[id] — FI11 edição pós-realizado", () => {
  async function realizado() {
    const { paciente, profissional, consultorio } = await createFixtures();
    return prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-01"),
        hora: "10:00",
        valorConsulta: 200,
        status: "realizado",
        statusPagamento: "pago",
      },
    });
  }

  it("admin altera valorConsulta + audit log com motivo", async () => {
    const { token } = await createUserWithRole("admin");
    const a = await realizado();

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${a.id}`, {
          valorConsulta: 180,
          // FI06: 180 está abaixo do valor de tabela do profissional (200),
          // então a edição é um desconto e precisa da justificativa que vai
          // para o relatório. `motivo` é a razão da EDIÇÃO (FI11), coisa
          // diferente da justificativa do abatimento.
          motivoDescontoOuGratuidade: "Cobrança duplicada reconhecida",
          motivo: "Cliente alegou cobrança duplicada",
        }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.atendimento.valorConsulta).toBe("180");

    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: a.id, campo: "valorConsulta" },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].valorAntes).toBe("200");
    expect(logs[0].valorDepois).toBe("180");
    expect(logs[0].motivo).toBe("Cliente alegou cobrança duplicada");
  });

  it("auxiliar pode editar (200)", async () => {
    const { token } = await createUserWithRole("auxiliar");
    const a = await realizado();

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${a.id}`, {
          observacoes: "Adicionado pós-consulta",
          motivo: "Correção solicitada pelo profissional",
        }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(200);
  });

  it("profissional NÃO pode editar pós-realizado (PEND-031) → 403", async () => {
    const { token } = await createUserWithRole("profissional");
    const a = await realizado();

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${a.id}`, {
          valorConsulta: 100,
          motivo: "tentativa",
        }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(403);
  });

  it("atendente NÃO pode editar pós-realizado → 403", async () => {
    const { token } = await createUserWithRole("atendente");
    const a = await realizado();

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${a.id}`, {
          valorConsulta: 100,
          motivo: "tentativa",
        }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(403);
  });

  it("editar atendimento NÃO realizado → 400", async () => {
    const { token } = await createUserWithRole("admin");
    const { ag } = await createAgendado();

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${ag.id}`, {
          valorConsulta: 100,
          motivo: "tentativa pré-realizado",
        }),
        token,
      ),
      ctxId(ag.id),
    );
    expect(res.status).toBe(400);
  });

  it("motivo curto → 422", async () => {
    const { token } = await createUserWithRole("admin");
    const a = await realizado();

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/atendimentos/${a.id}`, {
          valorConsulta: 180,
          motivo: "x",
        }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /api/atendimentos — RBAC", () => {
  it("paciente vê só os próprios atendimentos", async () => {
    const { paciente, profissional, consultorio } = await createFixtures();
    const pB = await prisma.paciente.create({
      data: { nome: "P B", email: "pb@e.com", telefone: "11900000000" },
    });
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "10:00",
          valorConsulta: 0,
        },
        {
          pacienteId: pB.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "11:00",
          valorConsulta: 0,
        },
      ],
    });

    const { user } = await createUserWithRole("paciente", "pac-user@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: paciente.id },
    });
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await listGet(withAuthCookie(getRequest("/api/atendimentos"), token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.atendimentos).toHaveLength(1);
    expect(body.atendimentos[0].pacienteId).toBe(paciente.id);
  });

  it("paciente A não vê /atendimentos/[id] do paciente B → 403", async () => {
    const { paciente, profissional, consultorio } = await createFixtures();
    const pB = await prisma.paciente.create({
      data: { nome: "P B", email: "pb@e.com", telefone: "11900000000" },
    });
    const aB = await prisma.atendimento.create({
      data: {
        pacienteId: pB.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-01"),
        hora: "11:00",
        valorConsulta: 0,
      },
    });

    const { user } = await createUserWithRole("paciente", "pac-A@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: paciente.id },
    });
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await itemGet(
      withAuthCookie(getRequest(`/api/atendimentos/${aB.id}`), token),
      ctxId(aB.id),
    );
    expect(res.status).toBe(403);
  });
});
