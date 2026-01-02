import express from "express";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import { transcriptVideo } from "./utils/api";

const app = express();

app.use(express.json());

// Check if the folder already exist
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Assinatura de Callback para configurção do multer
const storage = multer.diskStorage({
  // Req éo request normal do express.
  // o File é os metadados do arquivo recebido, como o nome, o tipo...
  // O cb é a reposta se deu certo ou errado, como se fosse um return, usado para o multer
  destination: (_req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `video-${unique}${ext}`);
  },
});

// Verificando tipo do arquivo com mimetype
function videoFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  const allowed = ["video/mp4", "video/webm", "video/quicktime"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Tipo de arquivo não permitido. Envie mp4/webm/mov."));
  }

  cb(null, true);
}

// Middleware de upload
const upload = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

app.post(
  "/api/upload",
  upload.single("video"),
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("deu certo!");

    if (!req.file) {
      res.status(400).json({
        error: "Arquivo nao encontrado!",
      });
      return;
    }

    try {
      await transcriptVideo(req.file.path);

      res.status(201).json({
        message: "Upload realizado com sucesso.",
        file: {
          originalName: req.file.originalname,
          savedName: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          savedPath: req.file.path,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Middleware de erro (precisa ter 4 parâmetros)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: "Arquivo grande demais (limite: 100MB)." });
  }

  return res.status(400).json({ error: err?.message ?? "Erro no upload." });
});

// 404 (rota não encontrada) - vem por último
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

export default app;
