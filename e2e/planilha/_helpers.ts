/**
 * Helpers dos vídeos de comprovação da planilha de custos
 * (`ClinicaShare_Planilha_Custos ✅ .xlsx`).
 *
 * IMPORTANTE — diferença em relação aos outros specs de `e2e/`:
 * estes specs NÃO limpam o banco. Eles rodam contra o cenário da seed
 * (`npm run db:seed`), porque o objetivo é filmar cada requisito operando
 * sobre dados realistas. Qualquer `deleteMany` aqui destruiria o cenário
 * que os demais testes da mesma execução esperam encontrar.
 */
import { expect, type Page } from "@playwright/test";
// Sem isto, ADMIN_EMAIL/ADMIN_PASSWORD ficam undefined no processo de teste e
// o login cai no fallback errado — o seed usa o admin do .env.
import "dotenv/config";

export const SENHA_DEMO = "paciente-12345";

/** Credenciais do seed. Admin vem do .env (ADMIN_EMAIL/ADMIN_PASSWORD). */
export const CONTAS = {
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin@clinicashare.local",
    senha: process.env.ADMIN_PASSWORD ?? "change-me-on-first-login",
    destino: "**/dashboard",
  },
  auxiliar: {
    email: "aux@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/dashboard",
  },
  atendente: {
    email: "atend@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/agenda",
  },
  /** Dra. Nirmala Azalea — Clínica geral, percentual 30%, base R$220, 30min */
  profissional: {
    email: "prof1@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/minha-agenda",
  },
  /** Dra. Helena Braga — Psicologia, aluguel fixo R$250/turno, 45min */
  profissionalAluguel: {
    email: "prof3@clinicashare.local",
    senha: SENHA_DEMO,
    destino: "**/minha-agenda",
  },
  paciente: {
    email: "paciente1@example.com",
    senha: SENHA_DEMO,
    destino: "**/p",
  },
} as const;

export type Perfil = keyof typeof CONTAS;

/** Faz login pela UI e espera o redirect por perfil (lib/auth-client.ts). */
export async function login(page: Page, perfil: Perfil): Promise<void> {
  const conta = CONTAS[perfil];
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(conta.email);
  await page.getByLabel("Senha").fill(conta.senha);
  await Promise.all([
    page.waitForURL(conta.destino, { timeout: 20_000 }),
    page.getByRole("button", { name: /^Entrar$/ }).click(),
  ]);
}

/**
 * Pausa curta só para o vídeo ficar legível — sem isso o Playwright
 * navega rápido demais e o frame relevante passa em ~2 frames.
 */
export async function mostrar(page: Page, ms = 1800): Promise<void> {
  await page.waitForTimeout(ms);
}

/** Navega e confirma o h1 do PageHeader, deixando o frame visível no vídeo. */
export async function irPara(
  page: Page,
  rota: string,
  tituloEsperado: RegExp,
): Promise<void> {
  await page.goto(rota);
  await expect(page.getByRole("heading", { name: tituloEsperado })).toBeVisible({
    timeout: 20_000,
  });
  await mostrar(page);
}
