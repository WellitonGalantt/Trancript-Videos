import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { videoToAudio } from "./videoToAudio";

dotenv.config();

export async function transcriptVideo(videoPath: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const apiUrl = process.env.GROQ_API_URL;

  if (!apiUrl) {
    throw new Error("GROQ_API_URL não carregou!");
  }

  if (!apiKey) {
    throw new Error("GROQ_API_KEY não carregou!");
  }
  const groq = new Groq({ apiKey: apiKey });

  try {
    console.log("[T2] Convertendo vídeo -> áudio (ffmpeg)...");
    const audioPath = await videoToAudio(videoPath);
    if (!audioPath) {
      throw new Error("Caminho do audio esta vazio!");
    }

    // const res = await fetch("apiUrl",)
    // const audioPath = path.join(process.cwd(), "audio_fast.mp3");
    const audioJsonPath = path.join(process.cwd(), "transcript.json");

    console.log("[T4] Enviando áudio pro Groq...");
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath), // Arquivo de áudio
      model: "whisper-large-v3", // Modelo a usar
      language: "pt", // Idioma (opcional mas ajuda na precisão)
      response_format: "verbose_json", // ou "text", "srt", "vtt", "verbose_json"
      temperature: 0, // 0-1, menor = mais conservador
    });
    console.log("[T5] Groq respondeu.");

    const transcriptionFortext = JSON.stringify(transcription, null, 2);
    await fsp.writeFile(audioJsonPath, transcriptionFortext);
    return transcriptionFortext;
  } catch (err: any) {
    console.error("[T-ERRO]", err);
    throw new Error("Erro ao transcrever o video: " + err.message);
  }
}
