import { describe, expect, it } from "vitest";
import {
  STATUS_ENCERRADOS,
  agendamentoEmAberto,
  type StatusAgendamento,
} from "@/lib/api/agendamentos";

describe("agendamentoEmAberto", () => {
  it("mantém o que ainda pede ação do profissional", () => {
    expect(agendamentoEmAberto({ status: "agendado" })).toBe(true);
    expect(agendamentoEmAberto({ status: "em_atendimento" })).toBe(true);
  });

  it("descarta atendimento realizado, falta e cancelamento", () => {
    expect(agendamentoEmAberto({ status: "realizado" })).toBe(false);
    expect(agendamentoEmAberto({ status: "nao_compareceu" })).toBe(false);
    expect(agendamentoEmAberto({ status: "cancelado" })).toBe(false);
  });

  it("cobre todos os status do enum — nenhum fica sem decisão", () => {
    const todos: StatusAgendamento[] = [
      "agendado",
      "em_atendimento",
      "realizado",
      "cancelado",
      "nao_compareceu",
    ];
    const emAberto = todos.filter((status) => agendamentoEmAberto({ status }));
    expect(emAberto).toEqual(["agendado", "em_atendimento"]);
    expect([...STATUS_ENCERRADOS].sort()).toEqual(
      ["cancelado", "nao_compareceu", "realizado"].sort(),
    );
  });
});
