import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Auth tests share a single DB; rodar serialmente evita corrida em cleanAuthData()
    fileParallelism: false,
    pool: "forks",
    // @ts-expect-error — Vitest 4 aceita `forks` em runtime mas o tipo InlineConfig ainda não expõe
    forks: { singleFork: true },
  },
});
