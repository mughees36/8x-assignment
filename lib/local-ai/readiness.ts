import "server-only";
import { access, constants } from "node:fs/promises";
import { localAISettings, isLoopbackUrl } from "@/lib/local-ai/settings";
import { remoteAI, backendFetch } from "@/lib/local-ai/backend";

async function readable(file: string, executable = false) {
  try { await access(file, executable ? constants.X_OK : constants.R_OK); return true; } catch { return false; }
}

export async function getReadiness() {
  if (process.env.VERCEL && !remoteAI) return { ready: false, localOnly: false, message: 'The AI host is not connected. Seeded meetings remain available.', deploymentNotice: 'Live recording is unavailable until the protected gateway is connected.', checks: { gateway: { ready: false, detail: 'Gateway not configured' } } };
  if (remoteAI) {
    try { const response = await backendFetch('/api/local-ai/status'); if (response.ok) { const status = await response.json(); return { ...status, localOnly: false, message: status.ready ? 'The local AI host is online. Recording requires a demo access code.' : 'The local AI host is not ready.', deploymentNotice: 'Audio uploads directly to the protected AI host. Code holders share a demo workspace. Seeded meetings remain available when the host is offline.' }; } } catch {}
    return { ready: false, localOnly: false, message: 'The AI host is offline. Seeded meetings remain available.', deploymentNotice: 'Start the local services and gateway to enable recording.', checks: { gateway: { ready: false, detail: 'Gateway unreachable' } } };
  }
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
