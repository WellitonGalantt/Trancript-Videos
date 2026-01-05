// Esse arquivo sera o servico que faz o bundle do projeto remotion

import path from "path";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import fs from "fs";

export async function renderWithRemotion(params: {
  remotionRoot: string;
  compositionId: string;
  outPath: string;
  inputProps: Record<string, any>;
}) {
  const { remotionRoot, compositionId, outPath, inputProps } = params;

  const entryPoint = path.join(remotionRoot, "src", "index.ts");

  try {
    console.log("[R1] remotionRoot:", remotionRoot);
    console.log("[R2] entryPoint:", entryPoint);
    console.log("[R2.1] entryPoint exists?", fs.existsSync(entryPoint));

    if (!fs.existsSync(entryPoint)) {
      throw new Error(
        `entryPoint não existe. Verifique o caminho do remotionRoot. entryPoint=${entryPoint}`
      );
    }

    console.log("[R3] bundle() iniciando...");
    const bundleLocation = await bundle({
      entryPoint,
      // webpackOverride: (config) => config, // se precisar customizar depois
    });
    console.log("[R4] bundle() OK. serveUrl:", bundleLocation);

    const comps = await getCompositions(bundleLocation, {
      inputProps, // importante: se sua composição depende de props pra calcular duração etc.
    });

    const composition = comps.find((c) => c.id === compositionId);

    if (!composition) {
      const available = comps.map((c) => c.id).join(", ");
      throw new Error(
        `Composition "${compositionId}" não encontrada. Disponíveis: ${available}`
      );
    }

    console.log("[R7] composition encontrada:", {
      id: composition.id,
      fps: composition.fps,
      width: composition.width,
      height: composition.height,
      durationInFrames: composition.durationInFrames,
    });

    console.log("[R8] renderMedia() iniciando...");
    await renderMedia({
      serveUrl: bundleLocation,
      composition,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
    });

    console.log("[R9] renderMedia() OK. outPath:", outPath);
    return outPath;
  } catch (err: any) {
    console.error("[REMOTION ERROR]", err?.stack ?? err);
    throw err;
  }
}
