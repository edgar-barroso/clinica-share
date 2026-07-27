/**
 * AT04 — "Registro de ocorrência para profissionais com prontuário externo"
 * FI06 — "Registro de descontos com justificativa"
 *
 * Ambos existiam só no papel antes desta suíte:
 * - `usaProntuarioExterno` era código morto (só recebia `false` literal);
 * - desconto parcial era indetectável e a justificativa era descartada
 *   sempre que o pagamento não fosse "gratuito".
 *
 * Os testes abaixo travam o comportamento novo, incluindo o bug de perda de
 * dados do prontuário que existia no finalizar.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST as walkInPost } from "@/app/(back-end)/api/atendimentos/route";
import { POST as finalizarPost } from "@/app/(back-end)/api/atendimentos/[id]/finalizar/route";
import { prisma } from "@/lib/db";
import { relatorioGratuitas } from "@/app/(back-end)/_usecases/relatorio/gratuitas";
import { cleanDb } from "../helpers/db";
import { createUserWithRole } from "../helpers/auth";
import { jsonRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const ctxId = (id: string) => ({ params: Promise.resolve({ id }) });
const DATA = "2026-06-03";

async function fixtures() {
  const paciente = await prisma.paciente.create({
    data: { nome: "Paciente X", email: "px@e.com", telefone: "11999990001" },
  });
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dra. X",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 9",
      email: "drx@e.com",
      telefone: "11988887771",
      modalidadeContrato: "percentual",
      valorConsultaBase: 250,
      percentualRepasse: 0.3,
      duracaoConsultaMinutos: 30,
    },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "Sala X",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  return { paciente, profissional, consultorio };
}

/** Cria um atendimento `em_atendimento`, pronto para ser finalizado. */
async function emAtendimento(hora = "09:00") {
  const { paciente, profissional, consultorio } = await fixtures();
  const at = await prisma.atendimento.create({
    data: {
      data: new Date(DATA),
      hora,
      pacienteId: paciente.id,
      profissionalId: profissional.id,
      consultorioId: consultorio.id,
      valorConsulta: 250,
      status: "em_atendimento",
      statusPagamento: "pendente",
    },
  });
  return { at, paciente, profissional, consultorio };
}

async function admin() {
  const { token } = await createUserWithRole("admin");
  return token;
}

/** Monta um POST JSON já autenticado. */
function autenticado(path: string, body: unknown, token: string) {
  return withAuthCookie(jsonRequest(path, body), token);
}

// ===========================================================================
// AT04
// ===========================================================================

describe("AT04 — prontuário externo", () => {
  it("marca prontuário externo com referência e persiste no campo real", async () => {
    const { at } = await emAtendimento();
    const token = await admin();

    const res = await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 250,
        statusPagamento: "pago",
        usaProntuarioExterno: true,
        referenciaProntuarioExterno: "Sistema próprio, ficha 4821",
      }, token),
      ctxId(at.id),
    );
    expect(res.status).toBe(200);

    const salvo = await prisma.atendimento.findUnique({ where: { id: at.id } });
    // O ponto do requisito: campo estruturado e consultável, não um Json.
    expect(salvo!.usaProntuarioExterno).toBe(true);
    expect(salvo!.referenciaProntuarioExterno).toBe("Sistema próprio, ficha 4821");
  });

  it("recusa marcar externo sem dizer onde o registro está (422)", async () => {
    const { at } = await emAtendimento();
    const token = await admin();

    const res = await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 250,
        statusPagamento: "pago",
        usaProntuarioExterno: true,
      }, token),
      ctxId(at.id),
    );
    expect(res.status).toBe(422);

    const salvo = await prisma.atendimento.findUnique({ where: { id: at.id } });
    expect(salvo!.usaProntuarioExterno).toBe(false);
  });

  it("é consultável por SQL — dá para filtrar quem usou prontuário externo", async () => {
    const { at } = await emAtendimento();
    const token = await admin();
    await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 250,
        statusPagamento: "pago",
        usaProntuarioExterno: true,
        referenciaProntuarioExterno: "Ficha externa 10",
      }, token),
      ctxId(at.id),
    );

    const externos = await prisma.atendimento.findMany({
      where: { usaProntuarioExterno: true },
    });
    expect(externos).toHaveLength(1);
  });

  it("gera audit log ao declarar prontuário externo (RNF-102)", async () => {
    const { at } = await emAtendimento();
    const token = await admin();
    await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 250,
        statusPagamento: "pago",
        usaProntuarioExterno: true,
        referenciaProntuarioExterno: "Ficha externa 11",
      }, token),
      ctxId(at.id),
    );

    const log = await prisma.auditLog.findFirst({
      where: { entidadeId: at.id, campo: "usaProntuarioExterno" },
    });
    expect(log).not.toBeNull();
    expect(log!.valorDepois).toBe("true");
    expect(log!.userId).toBeTruthy();
  });

  it("finalizar sem reenviar o prontuário NÃO apaga o que já estava gravado", async () => {
    // Regressão: o finalizar gravava `JsonNull` quando o campo era omitido,
    // destruindo o prontuário (e a marcação de externo) já registrados.
    const { at } = await emAtendimento();
    await prisma.atendimento.update({
      where: { id: at.id },
      data: { prontuarioInterno: { anamnese: "queixa inicial registrada" } },
    });
    const token = await admin();

    await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 250,
        statusPagamento: "pago",
      }, token),
      ctxId(at.id),
    );

    const salvo = await prisma.atendimento.findUnique({ where: { id: at.id } });
    expect(salvo!.prontuarioInterno).toEqual({
      anamnese: "queixa inicial registrada",
    });
  });
});

// ===========================================================================
// FI06
// ===========================================================================

describe("FI06 — desconto parcial com justificativa", () => {
  it("recusa cobrar abaixo da tabela sem justificativa (422)", async () => {
    const { at } = await emAtendimento();
    const token = await admin();

    const res = await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 150,
        valorOriginal: 250,
        statusPagamento: "pago",
      }, token),
      ctxId(at.id),
    );
    expect(res.status).toBe(422);
  });

  it("aceita desconto com justificativa e PRESERVA o motivo", async () => {
    // Antes o motivo era forçado a null sempre que não fosse gratuidade,
    // então o desconto ficava sem rastro nenhum.
    const { at } = await emAtendimento();
    const token = await admin();

    const res = await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 150,
        valorOriginal: 250,
        statusPagamento: "pago",
        motivoDescontoOuGratuidade: "Desconto de retorno em 30 dias",
      }, token),
      ctxId(at.id),
    );
    expect(res.status).toBe(200);

    const salvo = await prisma.atendimento.findUnique({ where: { id: at.id } });
    expect(salvo!.valorConsulta.toString()).toBe("150");
    expect(salvo!.valorOriginal!.toString()).toBe("250");
    expect(salvo!.motivoDescontoOuGratuidade).toBe(
      "Desconto de retorno em 30 dias",
    );
  });

  it("recusa valor de tabela menor que o cobrado (422)", async () => {
    const { at } = await emAtendimento();
    const token = await admin();

    const res = await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 300,
        valorOriginal: 250,
        statusPagamento: "pago",
        motivoDescontoOuGratuidade: "incoerente",
      }, token),
      ctxId(at.id),
    );
    expect(res.status).toBe(422);
  });

  it("sem desconto o motivo continua sendo descartado", async () => {
    const { at } = await emAtendimento();
    const token = await admin();

    await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 250,
        valorOriginal: 250,
        statusPagamento: "pago",
        motivoDescontoOuGratuidade: "não deveria persistir",
      }, token),
      ctxId(at.id),
    );

    const salvo = await prisma.atendimento.findUnique({ where: { id: at.id } });
    expect(salvo!.motivoDescontoOuGratuidade).toBeNull();
  });

  it("gera audit log do desconto com tabela, cobrado e justificativa", async () => {
    const { at } = await emAtendimento();
    const token = await admin();
    await finalizarPost(
      autenticado(`/api/atendimentos/${at.id}/finalizar`, {
        valorConsulta: 200,
        valorOriginal: 250,
        statusPagamento: "pago",
        motivoDescontoOuGratuidade: "Pacote de sessões",
      }, token),
      ctxId(at.id),
    );

    const log = await prisma.auditLog.findFirst({
      where: { entidadeId: at.id, campo: "desconto" },
    });
    expect(log).not.toBeNull();
    expect(log!.valorAntes).toBe("250");
    expect(log!.valorDepois).toBe("200");
    expect(log!.motivo).toBe("Pacote de sessões");
  });

  it("walk-in também registra desconto com justificativa", async () => {
    const { paciente, profissional, consultorio } = await fixtures();
    const token = await admin();

    const res = await walkInPost(
      autenticado("/api/atendimentos", {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: DATA,
        hora: "11:00",
        valorConsulta: 180,
        valorOriginal: 250,
        statusPagamento: "pago",
        motivoDescontoOuGratuidade: "Cortesia parcial combinada",
      }, token),
    );
    expect(res.status).toBe(201);

    const criado = await prisma.atendimento.findFirst({
      where: { hora: "11:00" },
    });
    expect(criado!.valorOriginal!.toString()).toBe("250");
    expect(criado!.motivoDescontoOuGratuidade).toBe("Cortesia parcial combinada");
  });
});

// ===========================================================================
// RE04 — o relatório precisa enxergar o desconto, não só a gratuidade
// ===========================================================================

describe("RE04 — relatório inclui gratuidades E descontos", () => {
  it("lista desconto parcial junto com gratuidade e soma o concedido", async () => {
    const { paciente, profissional, consultorio } = await fixtures();

    await prisma.atendimento.createMany({
      data: [
        {
          data: new Date(DATA),
          hora: "08:00",
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          valorConsulta: 0,
          valorOriginal: 250,
          status: "realizado",
          statusPagamento: "gratuito",
          motivoDescontoOuGratuidade: "Cortesia institucional",
        },
        {
          data: new Date(DATA),
          hora: "09:00",
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          valorConsulta: 150,
          valorOriginal: 250,
          status: "realizado",
          statusPagamento: "pago",
          motivoDescontoOuGratuidade: "Desconto de retorno",
        },
        {
          // cobrado cheio — não deve aparecer
          data: new Date(DATA),
          hora: "10:00",
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          valorConsulta: 250,
          status: "realizado",
          statusPagamento: "pago",
        },
      ],
    });

    const rel = await relatorioGratuitas({
      dataInicio: DATA,
      dataFim: DATA,
    });

    expect(rel.totalAtendimentos).toBe(2);
    expect(rel.totalGratuidades).toBe(1);
    expect(rel.totalDescontos).toBe(1);
    // 250 de cortesia + 100 de desconto
    expect(rel.valorTotalConcedido).toBe("350.00");

    const desconto = rel.linhas.find((l) => l.tipo === "desconto")!;
    expect(desconto.valorOriginal).toBe("250.00");
    expect(desconto.valorCobrado).toBe("150.00");
    expect(desconto.valorDesconto).toBe("100.00");
    expect(desconto.motivo).toBe("Desconto de retorno");
  });
});
