import "server-only";
import { z } from "zod";
import type { MeetingAnswer, TranscriptEntry } from "@/lib/types";
import { localAISettings, isLoopbackUrl } from "@/lib/local-ai/settings";

export const questionSchema = z.object({ question: z.string().trim().min(1).max(500) }).strict();

export class AskError extends Error { constructor(public code: "unavailable" | "timeout" | "malformed", message: string) { super(message); } }

export async function askTranscript(question: string, transcript: TranscriptEntry[]): Promise<MeetingAnswer> {
  if (!isLoopbackUrl(localAISettings.ollamaBaseUrl)) throw new AskError("unavailable", "Local AI is not configured to use a loopback address.");
  const modelAnswerSchema = z.object({
    answer: z.string().trim().min(1).max(900).describe("A concise, complete standalone sentence answering the question from the transcript"),
    sourceIndexes: z.array(z.number().int().min(0).max(transcript.length - 1)).max(5).describe("Indexes of the exact numbered transcript lines that support the answer"),
  }).strict();
  const evidence = transcript.map((entry, index) => `[${index}] ${entry.text}`).join("\n");
  let response: Response;
  try {
    response = await fetch(`${localAISettings.ollamaBaseUrl}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(localAISettings.ollamaAskTimeoutMs), body: JSON.stringify({ model: localAISettings.ollamaModel, stream: false, format: z.toJSONSchema(modelAnswerSchema), options: { temperature: 0 }, messages: [
      { role: "system", content: "Answer only from the supplied transcript. For a supported answer, write a concise complete sentence and cite 1-5 exact numbered lines in sourceIndexes. If the transcript does not support an answer, say that it does not establish the answer and return an empty sourceIndexes array. Never infer missing facts." },
      { role: "user", content: `Question: ${question}\n\nTranscript:\n${evidence}` },
    ] }) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new AskError("timeout", "Local AI took too long to answer. Please try again.");
    throw new AskError("unavailable", "Local AI is unavailable. Make sure Ollama is running, then try again.");
  }
  if (!response.ok) throw new AskError("unavailable", "Local AI is unavailable. Make sure Ollama and the configured model are ready.");
  try {
    const body = await response.json() as { message?: { content?: string } };
    const parsed = modelAnswerSchema.parse(JSON.parse(body.message?.content ?? ""));
    const unique = [...new Set(parsed.sourceIndexes)].map((index) => transcript[index]).filter((entry): entry is TranscriptEntry => Boolean(entry)).slice(0, 5);
    if (!unique.length) return { answer: "The transcript does not contain enough evidence to answer that question.", citations: [] };
    return { answer: parsed.answer, citations: unique.map((entry) => ({ transcriptEntryId: entry.id, timestampSeconds: entry.startSeconds, text: entry.text })) };
  } catch (error) { if (error instanceof AskError) throw error; throw new AskError("malformed", "Local AI returned an invalid answer. Please try again."); }
}
