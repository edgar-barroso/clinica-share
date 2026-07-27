/**
 * Localiza um ffmpeg com H.264. O ffmpeg embutido do Playwright NÃO serve:
 * é um build reduzido, sem muxer MP4 ("Error initializing the muxer").
 *
 * Ordem: variável FFMPEG, PATH do sistema, binário estático do pacote Python
 * `imageio-ffmpeg` (bem mais enxuto que instalar o ffmpeg do Homebrew).
 */
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

export function acharFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  const tentativas = [
    () => execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim(),
    () =>
      execFileSync(
        "python3",
        ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"],
        { encoding: "utf8" },
      ).trim(),
  ];
  for (const tentar of tentativas) {
    try {
      const caminho = tentar();
      if (caminho && existsSync(caminho)) return caminho;
    } catch {
      // tenta a próxima estratégia
    }
  }
  return null;
}

/** Argumentos de conversão para MP4 legível em qualquer player. */
export function argsMp4(origem, destino) {
  return [
    "-y", "-loglevel", "error",
    "-i", origem,
    "-c:v", "libx264", "-preset", "medium", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-an",
    destino,
  ];
}
