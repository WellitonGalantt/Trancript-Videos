import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

//ffmpeg -i input.mp4 -vn -filter:a "atempo=1.5" -ac 1 -ar 16000 -c:a pcm_s16le output.wav

export async function videoToAudio(videoPath: string): Promise<string | void> {
  const dir = path.resolve(process.cwd(), "test_files");

  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }

  const base = path.basename(videoPath, path.extname(videoPath));
  const outPath = path.join(dir, `${base}.x1.5.wav`);

  const args = [
    "-y", // sobrescrever se existir
    "-i",
    videoPath, // input
    "-vn", // sem vídeo
    "-filter:a",
    "atempo=1.5", // acelera áudio
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "pcm_s16le", // WAV PCM 16-bit
    outPath,
  ];

  await new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

    // stdout = saída normal (ffmpeg quase não usa, mas pode)
    ff.stdout.on("data", (data) => {
      // console.log(String(data));
    });

    // stderr = ffmpeg manda progresso e logs aqui
    ff.stderr.on("data", (data) => {
      // Mostra progresso no terminal (útil para vídeos grandes)
      // Você pode comentar depois se ficar “poluído”
      console.log(String(data));
    });

    // on("error") dispara se o processo nem conseguiu iniciar
    // Ex: ffmpeg não está instalado / não está no PATH
    ff.on("error", (err) => {
      reject(new Error(`Falha ao executar ffmpeg: ${err.message}`));
    });

    // on("close") dispara quando o ffmpeg termina
    // code === 0 => sucesso
    ff.on("close", (code) => {
      if (code === 0) return resolve(null);
      reject(new Error(`ffmpeg saiu com código ${code} (erro ao converter)`));
    });
  });

  // Validar que o arquivo existe e não está vazio
  const stat = await fs.stat(outPath);
  if (stat.size === 0) {
    throw new Error("FFmpeg gerou um arquivo de áudio vazio.");
  }

  return outPath;
}
