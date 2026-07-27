/**
 * Navegação por perfil e destino pós-login.
 *
 * Estes testes existem por causa de três bugs concretos que a duplicação de
 * menu causou:
 *
 *  1. O login mandava `profissional` para `/dashboard` — tela que não aparece
 *     no menu dele e cujas chamadas devolvem 403, então o login terminava num
 *     toast de "Acesso negado para este perfil".
 *  2. O menu mobile do admin não tinha "Equipe".
 *  3. O menu mobile do profissional apontava para `/agenda`, a agenda da
 *     clínica inteira, contrariando o isolamento do RF-023.
 *
 * O invariante central: o destino pós-login é sempre a PRIMEIRA página do
 * próprio menu do perfil. Se alguém mexer numa das duas coisas sem mexer na
 * outra, este arquivo quebra.
 */
import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import {
  NAV_CLINICA,
  ROLE_REDIRECT,
  navDoPapel,
  primeiraRotaDoPapel,
} from "@/lib/nav";

const PAPEIS: Role[] = [
  "admin",
  "auxiliar",
  "profissional",
  "atendente",
  "paciente",
];

describe("destino pós-login", () => {
  it.each(PAPEIS)(
    "%s cai na primeira página do próprio menu",
    (papel) => {
      const menu = navDoPapel(papel);
      expect(menu.length, `${papel} não tem nenhuma tela no menu`).toBeGreaterThan(0);
      expect(ROLE_REDIRECT[papel]).toBe(menu[0].href);
    },
  );

  it.each(PAPEIS)("o destino de %s está dentro do menu dele", (papel) => {
    const hrefs = navDoPapel(papel).map((n) => n.href);
    expect(hrefs).toContain(ROLE_REDIRECT[papel]);
  });

  it("profissional NÃO é mandado para o dashboard", () => {
    // Era o bug: /dashboard chama /api/consultorios/dashboard, restrito a
    // admin e auxiliar, e o profissional caía num 403 logo após entrar.
    expect(ROLE_REDIRECT.profissional).not.toBe("/dashboard");
    expect(ROLE_REDIRECT.profissional).toBe("/minha-agenda");
  });

  it("paciente vai para o portal, não para telas da clínica", () => {
    expect(ROLE_REDIRECT.paciente).toBe("/p");
  });

  it("atendente vai para a agenda do dia", () => {
    expect(ROLE_REDIRECT.atendente).toBe("/agenda");
  });
});

describe("menu por perfil", () => {
  it("profissional não enxerga a agenda da clínica inteira (RF-023)", () => {
    const hrefs = navDoPapel("profissional").map((n) => n.href);
    expect(hrefs).toContain("/minha-agenda");
    expect(hrefs).not.toContain("/agenda");
  });

  it("profissional não enxerga financeiro, relatórios nem auditoria", () => {
    const hrefs = navDoPapel("profissional").map((n) => n.href);
    for (const proibida of [
      "/financeiro/repasses",
      "/relatorios",
      "/auditoria",
      "/consultorios",
      "/profissionais",
      "/equipe",
      "/configuracoes",
    ]) {
      expect(hrefs).not.toContain(proibida);
    }
  });

  it("admin enxerga o catálogo completo, incluindo Equipe", () => {
    // "Equipe" era justamente o item que faltava na cópia mobile do menu.
    const hrefs = navDoPapel("admin").map((n) => n.href);
    expect(hrefs).toEqual(NAV_CLINICA.map((n) => n.href));
    expect(hrefs).toContain("/equipe");
  });

  it("auxiliar tem o financeiro mas não os cadastros estruturais", () => {
    const hrefs = navDoPapel("auxiliar").map((n) => n.href);
    expect(hrefs).toContain("/financeiro/repasses");
    expect(hrefs).toContain("/auditoria");
    expect(hrefs).not.toContain("/consultorios");
    expect(hrefs).not.toContain("/equipe");
    expect(hrefs).not.toContain("/configuracoes");
  });

  it("atendente não alcança dinheiro nem relatório", () => {
    const hrefs = navDoPapel("atendente").map((n) => n.href);
    expect(hrefs).toContain("/agenda");
    expect(hrefs).not.toContain("/financeiro/repasses");
    expect(hrefs).not.toContain("/relatorios");
    expect(hrefs).not.toContain("/dashboard");
  });

  it('acrescenta "Meu perfil" quando o profissional tem id', () => {
    const semId = navDoPapel("profissional").map((n) => n.href);
    const comId = navDoPapel("profissional", { profissionalId: "abc" }).map(
      (n) => n.href,
    );
    expect(comId).toEqual([...semId, "/profissionais/abc/editar"]);
  });

  it("papel desconhecido não recebe menu nenhum", () => {
    expect(navDoPapel("intruso")).toEqual([]);
    expect(navDoPapel(null)).toEqual([]);
    // Sem menu não há primeira rota: cai no login em vez de vazar uma tela.
    expect(primeiraRotaDoPapel("intruso")).toBe("/login");
  });
});
