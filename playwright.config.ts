import { defineConfig, devices } from "@playwright/test";

/**
 * Três suítes com objetivos diferentes, por isso três projetos:
 *
 * - `chromium`   — suíte de regressão (CI). Sem vídeo e sem slowMo: velocidade
 *                  é o que importa aqui.
 * - `planilha`   — comprovação por requisito da planilha de custos. Grava vídeo
 *                  de cada requisito nos dois ambientes.
 * - `docs-e2e`   — documentação funcional narrada. Vídeo pensado para alguém
 *                  que nunca viu o sistema assistir sem áudio: mais devagar,
 *                  trace sempre retido.
 *
 * Rodar isolado: `npx playwright test --project=docs-e2e`
 */
const ENV_LABEL = process.env.E2E_ENV ?? "local";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const CHROME = devices["Desktop Chrome"];

/** Viewport igual ao tamanho do vídeo — evita reescala e texto borrado. */
const TELA = { width: 1280, height: 720 };

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  // Specs compartilham o mesmo Postgres e várias fazem beforeAll que limpa
  // tabelas — paralelismo causaria race entre workers
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  outputDir: process.env.E2E_OUT_DIR ?? `test-results/${ENV_LABEL}`,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      testDir: "./e2e",
      // As duas suítes de vídeo têm projeto próprio; fora daqui elas só
      // deixariam o CI lento.
      testIgnore: ["**/planilha/**", "**/docs/**"],
      use: { ...CHROME },
    },
    {
      name: "planilha",
      testDir: "./e2e/planilha",
      use: {
        ...CHROME,
        viewport: TELA,
        video: { mode: "on", size: TELA },
        launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 250) },
      },
    },
    {
      name: "docs-e2e",
      testDir: "./e2e/docs",
      use: {
        ...CHROME,
        viewport: TELA,
        video: { mode: "on", size: TELA },
        // Mais devagar que a suíte de comprovação: aqui o espectador precisa
        // ler legenda e acompanhar cada interação.
        launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 300) },
        trace: "on",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
