import { defineConfig, devices } from "@playwright/test";

// Ambiente-alvo dos vídeos de comprovação da planilha de custos.
// `E2E_ENV` só rotula a pasta de saída (local | producao) — o banco que a app
// usa vem do DATABASE_URL do processo, então quem chama é responsável por
// apontar para o Postgres do Docker ou para o Neon.
const ENV_LABEL = process.env.E2E_ENV ?? "local";
const OUT_DIR = process.env.E2E_OUT_DIR ?? `test-results/${ENV_LABEL}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  // Specs compartilham o mesmo Postgres e cada uma faz beforeAll que limpa
  // tabelas — paralelismo causaria race entre workers
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Um subdiretório por ambiente, para que rodar local e produção não
  // sobrescreva os vídeos um do outro.
  outputDir: OUT_DIR,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    // Comprovação exigida: todo teste grava vídeo, inclusive os que passam.
    // 1280x720 (e não os 800x450 padrão) para que texto de tabela financeira
    // e rótulo de formulário fiquem legíveis para quem assiste.
    video: { mode: "on", size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      // Sem isto o Playwright dispara as ações em milissegundos e o vídeo
      // fica impossível de acompanhar. Só afeta a gravação de comprovação;
      // `E2E_SLOWMO=0` devolve a velocidade normal para rodar em CI.
      slowMo: Number(process.env.E2E_SLOWMO ?? 250),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
