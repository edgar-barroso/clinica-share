import { describe, expect, it } from "vitest";
import { isNavItemActive } from "@/lib/nav-active";

const NAV_PACIENTE = [
  "/p",
  "/p/consultas",
  "/p/agendar",
  "/p/perfil",
];

const NAV_STAFF = [
  "/dashboard",
  "/agenda",
  "/atendimentos",
  "/consultorios",
  "/profissionais",
  "/financeiro/repasses",
  "/relatorios",
  "/auditoria",
  "/configuracoes",
];

describe("isNavItemActive — paciente (bug do user)", () => {
  it("'Início' (/p) NÃO fica ativo em /p/consultas", () => {
    expect(isNavItemActive("/p", "/p/consultas", NAV_PACIENTE)).toBe(false);
  });

  it("'Início' (/p) NÃO fica ativo em /p/agendar", () => {
    expect(isNavItemActive("/p", "/p/agendar", NAV_PACIENTE)).toBe(false);
  });

  it("'Início' (/p) NÃO fica ativo em /p/consultas/abc123", () => {
    expect(
      isNavItemActive("/p", "/p/consultas/abc123", NAV_PACIENTE),
    ).toBe(false);
  });

  it("'Início' (/p) fica ativo APENAS em /p", () => {
    expect(isNavItemActive("/p", "/p", NAV_PACIENTE)).toBe(true);
  });

  it("'Minhas consultas' fica ativo em /p/consultas", () => {
    expect(
      isNavItemActive("/p/consultas", "/p/consultas", NAV_PACIENTE),
    ).toBe(true);
  });

  it("'Minhas consultas' fica ativo em /p/consultas/[id] (subrota)", () => {
    expect(
      isNavItemActive("/p/consultas", "/p/consultas/abc", NAV_PACIENTE),
    ).toBe(true);
  });
});

describe("isNavItemActive — staff (mantém prefix-match para subrotas)", () => {
  it("'Atendimentos' fica ativo em /atendimentos/[id]", () => {
    expect(
      isNavItemActive("/atendimentos", "/atendimentos/abc", NAV_STAFF),
    ).toBe(true);
  });

  it("'Profissionais' fica ativo em /profissionais/123/editar", () => {
    expect(
      isNavItemActive(
        "/profissionais",
        "/profissionais/123/editar",
        NAV_STAFF,
      ),
    ).toBe(true);
  });

  it("'Configurações' fica ativo em /configuracoes/turnos", () => {
    expect(
      isNavItemActive("/configuracoes", "/configuracoes/turnos", NAV_STAFF),
    ).toBe(true);
  });

  it("nenhum item ativa em rota desconhecida", () => {
    for (const href of NAV_STAFF) {
      expect(isNavItemActive(href, "/desconhecido", NAV_STAFF)).toBe(false);
    }
  });
});

describe("isNavItemActive — caso de prefixo conflitante", () => {
  // Hipotético: se "/p" e "/p/consultas" coexistem, /p/consultas vence em /p/consultas.
  // Garante que isso vale para qualquer combinação de prefixos.
  it("href mais específico vence quando ambos seriam prefixos", () => {
    const all = ["/a", "/a/b", "/a/b/c"];
    expect(isNavItemActive("/a", "/a/b/c", all)).toBe(false);
    expect(isNavItemActive("/a/b", "/a/b/c", all)).toBe(false);
    expect(isNavItemActive("/a/b/c", "/a/b/c", all)).toBe(true);
  });

  it("href que apenas compartilha prefixo de string (não de path) não bate", () => {
    // /pacientes não deve ativar para /p/consultas
    const all = ["/p", "/pacientes"];
    expect(isNavItemActive("/pacientes", "/p/consultas", all)).toBe(false);
  });
});
