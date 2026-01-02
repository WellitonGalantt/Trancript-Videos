import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { videoToAudio } from "./videoToAudio";

dotenv.config();

export async function transcriptVideo(videoPath: string): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  const apiUrl = process.env.GROQ_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error("A apikey e apiUrl nao estão carregando!");
  }

  const groq = new Groq({ apiKey: apiKey });

  try {
    const audioPath = await videoToAudio(videoPath);
    if (!audioPath) {
      throw new Error("Caminho do audio esta vazio!");
    }

    // const res = await fetch("apiUrl",)
    // const audioPath = path.join(process.cwd(), "audio_fast.mp3");
    const audioJsonPath = path.join(process.cwd(), "transcript.json");

    const transcription = await groq.audio.transcriptions.create({ 
      file: fs.createReadStream(audioPath), // Arquivo de áudio
      model: "whisper-large-v3", // Modelo a usar
      language: "pt", // Idioma (opcional mas ajuda na precisão)
      response_format: "verbose_json", // ou "text", "srt", "vtt", "verbose_json"
      temperature: 0, // 0-1, menor = mais conservador
    });

    await fsp.writeFile(audioJsonPath, JSON.stringify(transcription, null, 2));
  } catch (err: any) {
    console.error(err);
    throw new Error("Erro ao transcrever o video: " + err.message);
  }
}
