/**
 * Extrai frames dos vídeos de documentação para conferência visual.
 *
 * Serve ao gate de conclusão: os vídeos precisam ser OLHADOS, não só
 * "passar". Cada frame vira uma imagem que dá para abrir e responder as
 * quatro perguntas do teste do observador — quem age, o que quer, em que
 * passo está, se deu certo.
 *
 * Uso: node scripts/extrair-frames.mjs <dir-videos> <dir-saida> [seg-entre-frames]
 */
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join, extname } from "node:path";
import { acharFfmpeg } from "./ffmpeg.mjs";

const [, , dirVideos = "docs/videos", dirSaida = "/tmp/frames", intervalo = "3"] =
  process.argv;

const ffmpeg = acharFfmpeg();
if (!ffmpeg) {
  console.error("ffmpeg com H.264 não encontrado (tente `pip install imageio-ffmpeg`)");
  process.exit(1);
}
if (!existsSync(dirVideos)) {
  console.error(`pasta não encontrada: ${dirVideos}`);
  process.exit(1);
}

mkdirSync(dirSaida, { recursive: true });

const videos = readdirSync(dirVideos).filter((f) =>
  [".mp4", ".webm"].includes(extname(f)),
);

for (const arquivo of videos) {
  const slug = basename(arquivo, extname(arquivo));
  const destino = join(dirSaida, slug);
  mkdirSync(destino, { recursive: true });
  execFileSync(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", join(dirVideos, arquivo),
    "-vf", `fps=1/${intervalo}`,
    join(destino, "f-%03d.png"),
  ]);
  const n = readdirSync(destino).length;
  console.log(`${slug}: ${n} frames`);
}

console.log(`\n${videos.length} vídeos processados em ${dirSaida}/`);
