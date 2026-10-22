import "server-only";
import { access, constants } from "node:fs/promises";
import { localAISettings, isLoopbackUrl } from "@/lib/local-ai/settings";

async function readable(file: string, executable = false) {
  try { await access(file, executable ? constants.X_OK : constants.R_OK); return true; } catch { return false; }
}

export async function getReadiness() {
  const [ffmpeg, whisperCli, whisperModel] = await Promise.all([
    readable(localAISettings.ffmpegPath, true), readable(localAISettings.whisperCliPath, true), readable(localAISettings.whisperModelPath),
  ]);
  let ollama = false;
  let ollamaError = "Ollama is not reachable.";
  if (!isLoopbackUrl(localAISettings.ollamaBaseUrl)) ollamaError = "OLLAMA_BASE_URL must use a loopback address for local-only processing.";
  else try {
    const response = await fetch(`${localAISettings.ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    if (response.ok) {
      const data = await response.json() as { models?: { name: string }[] };
      ollama = Boolean(data.models?.some((model) => model.name === localAISettings.ollamaModel || model.name.startsWith(`${localAISettings.ollamaModel}:`)));
      if (!ollama) ollamaError = `Ollama is running, but ${localAISettings.ollamaModel} is not installed.`;
    }
  } catch {}
  const ready = ffmpeg && whisperCli && whisperModel && ollama;
  return {
    ready, localOnly: true,
    message: ready ? "Local transcription and summarization are ready on this Mac." : "Local AI is unavailable until every required tool, model, and service is ready.",
    deploymentNotice: "Recording processing runs only on the computer hosting this Next.js server. Public/serverless deployments cannot access your Mac's localhost or local files.",
    checks: {
      ffmpeg: { ready: ffmpeg, detail: ffmpeg ? "ffmpeg is executable." : `Missing or not executable: ${localAISettings.ffmpegPath}` },
      whisper: { ready: whisperCli, detail: whisperCli ? "whisper-cli is executable." : `Missing or not executable: ${localAISettings.whisperCliPath}` },
      model: { ready: whisperModel, detail: whisperModel ? "Whisper model is readable." : `Missing or unreadable: ${localAISettings.whisperModelPath}` },
      ollama: { ready: ollama, detail: ollama ? `${localAISettings.ollamaModel} is available.` : ollamaError },
    },
  };
}
