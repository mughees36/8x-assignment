import "server-only";
import path from "node:path";

const projectRoot = process.cwd();

export const localAISettings = {
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
  ollamaAskTimeoutMs: Number(process.env.OLLAMA_ASK_TIMEOUT_MS ?? "30000"),
  whisperModelPath: process.env.WHISPER_MODEL_PATH ?? path.join(projectRoot, ".local-ai/models/ggml-small.en.bin"),
  ffmpegPath: process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg",
  whisperCliPath: process.env.WHISPER_CLI_PATH ?? "/opt/homebrew/bin/whisper-cli",
  dataDir: path.join(projectRoot, ".data"),
} as const;

export function isLoopbackUrl(value: string) {
  try {
    const host = new URL(value).hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}
