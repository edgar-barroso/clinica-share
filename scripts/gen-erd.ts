/**
 * Gera prisma/erd.svg.
 *
 * O generator do ERD usa Puppeteer/Chrome, que não roda no build da
 * Vercel (faltam libs de sistema). Por isso ele não está mais no
 * `schema.prisma` principal — este script monta um schema temporário
 * com o generator extra, roda o `prisma generate` e remove o tmp.
 *
 * Uso: `npm run db:erd`
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = path.join("prisma", "schema.prisma");
const TMP = path.join("prisma", ".schema.erd.tmp.prisma");

const original = fs.readFileSync(SCHEMA, "utf-8");
const generatorBlock = `
generator erd {
  provider = "prisma-erd-generator"
  output   = "./erd.svg"
  theme    = "default"
}
`;

// Insere o generator extra logo antes do bloco datasource
const augmented = original.replace(
  /(\ndatasource db \{)/,
  `\n${generatorBlock}$1`,
);

fs.writeFileSync(TMP, augmented);

try {
  execSync(`npx prisma generate --schema=${TMP}`, { stdio: "inherit" });
  console.log("\n✓ ERD gerado em prisma/erd.svg");
} catch (err) {
  console.error("Falha ao gerar ERD:", err);
  process.exitCode = 1;
} finally {
  if (fs.existsSync(TMP)) fs.unlinkSync(TMP);
}
