import "server-only";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { z } from "zod";
import type { Insight, Meeting, ProcessingJob, SummaryContent, SummaryTemplateName, TranscriptEntry } from "@/lib/types";
import { localAISettings } from "@/lib/local-ai/settings";
import { getJob, recordingPaths, saveJob, saveMeeting } from "@/lib/local-ai/persistence";

const run = promisify(execFile);
const prose = z.string().trim().min(2).max(700).refine((value) => !/[{}\[\]]/.test(value), "Must be plain prose, not JSON fragments");
const itemSchema = z.object({
  text: prose.describe("A concise fact directly supported by the transcript"),
  sourceTimestampSeconds: z.number().nonnegative().describe("The numeric seconds from the nearest supporting [Ns] transcript marker"),
});
const actionSchema = itemSchema.extend({
  owner: z.string().trim().min(1).max(100).nullable().describe("The explicitly named owner, otherwise null"),
  dueDate: z.string().trim().min(1).max(30).nullable().describe("The explicitly stated due date phrase, otherwise null"),
});
const summaryContentSchema = z.object({
  overview: prose.describe("A grounded one or two sentence overview"),
  keyPoints: z.array(prose).max(12),
  decisions: z.array(prose).max(12),
  risks: z.array(prose).max(12),
  nextSteps: z.array(prose).max(12),
  actionItems: z.array(prose).max(12),
}).strict();
const summarySchema = z.object({
  general: summaryContentSchema.describe("Balanced narrative summary"),
  executiveBrief: summaryContentSchema.describe("Concise outcome and risk brief for a leader"),
  actionFocused: summaryContentSchema.describe("Execution-oriented summary emphasizing owners and next steps"),
  decisions: z.array(itemSchema).max(20), risks: z.array(itemSchema).max(20), nextSteps: z.array(itemSchema).max(20), actions: z.array(actionSchema).max(30), highlights: z.array(itemSchema.extend({ supportingTranscript: z.string().min(1).max(700) })).max(20),
}).strict();

type AIResult = z.infer<typeof summarySchema>;
type WhisperJson = { transcription?: Array<{ offsets?: { from?: number; to?: number }; timestamps?: { from?: string; to?: string }; text?: string }> };

async function setStage(jobId: string, stage: ProcessingJob["stage"]) {
  const job = await getJob(jobId); if (!job) throw new Error("Processing job no longer exists");
  await saveJob({ ...job, status: "processing", stage, updatedAt: new Date().toISOString(), error: undefined });
}

function parseClock(value?: string) {
  if (!value) return 0;
  const parts = value.replace(/[,]/g, ".").split(":").map(Number);
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseTranscript(json: WhisperJson): { entries: TranscriptEntry[]; duration: number } {
  const raw = json.transcription ?? [];
  const entries = raw.map((segment, index) => {
    const start = segment.offsets?.from !== undefined ? segment.offsets.from / 1000 : parseClock(segment.timestamps?.from);
    return { id: `local-t-${index + 1}`, speakerId: "speaker", startSeconds: Math.max(0, Math.round(start)), text: segment.text?.trim() ?? "" };
  }).filter((entry) => entry.text.length > 0);
  const meaningful = entries.map((entry) => entry.text).join(" ").replace(/\[[^\]]+]/g, "").trim();
  if (!meaningful || meaningful.split(/\s+/).length < 2) throw new Error("No speech was detected. The original recording was kept so you can retry.");
  const final = raw.at(-1);
  const duration = final?.offsets?.to !== undefined ? final.offsets.to / 1000 : parseClock(final?.timestamps?.to);
  return { entries, duration: Math.max(Math.ceil(duration), entries.at(-1)?.startSeconds ?? 0) };
}

async function ollamaJson(prompt: string, schema: z.ZodType, timeout = 120_000): Promise<unknown> {
  const response = await fetch(`${localAISettings.ollamaBaseUrl}/api/chat`, {
    method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(timeout),
    body: JSON.stringify({
      model: localAISettings.ollamaModel,
      stream: false,
      format: z.toJSONSchema(schema),
      options: { temperature: 0 },
      messages: [
        { role: "system", content: "You extract only facts supported by the supplied transcript. Return JSON matching the supplied schema. Never invent names, dates, decisions, or commitments." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Ollama failed with HTTP ${response.status}.`);
  const body = await response.json() as { message?: { content?: string } };
  if (!body.message?.content) throw new Error("Ollama returned an empty response.");
  try { return JSON.parse(body.message.content); } catch { throw new Error("Ollama returned malformed JSON. The recording was kept for retry."); }
}

function transcriptText(entries: TranscriptEntry[]) { return entries.map((entry) => `[${entry.startSeconds}s] ${entry.text}`).join("\n"); }

export function chunkTranscript(entries: TranscriptEntry[], maxChars = 12_000) {
  const chunks: string[] = []; let current = "";
  for (const line of transcriptText(entries).split("\n")) {
    if (current && current.length + line.length + 1 > maxChars) { chunks.push(current); current = ""; }
    current += `${current ? "\n" : ""}${line}`;
  }
  if (current) chunks.push(current);
  return chunks;
}

const materialSignal = /\b(decid(?:e|ed|ing)|risk|block(?:er|ed|ing)?|will|need(?:s)? to|must|should|please|follow up|next step|send|prepare|create|update|review|confirm|schedule|share|deliver|invite|complete|fix|draft|launch|approve|deadline|due)\b/i;

async function analyze(entries: TranscriptEntry[]): Promise<AIResult> {
  const spokenText = entries.map((entry) => entry.text).join(" ").trim();
  if (spokenText.split(/\s+/).length < 12 && !materialSignal.test(spokenText)) {
    const quote = spokenText.slice(0, 500);
    return {
      general: { overview: `This short recording contains one brief statement: “${quote}”`, keyPoints: [quote], decisions: [], risks: [], nextSteps: [], actionItems: [] },
      executiveBrief: { overview: "No decision, risk, or business outcome was explicitly stated in this short recording.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] },
      actionFocused: { overview: "No explicit owner, due date, or next step was stated in this short recording.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] },
      decisions: [], risks: [], nextSteps: [], actions: [], highlights: [],
    };
  }
  const chunks = chunkTranscript(entries);
  let evidence = chunks[0];
  if (chunks.length > 1) {
    const evidenceSchema = z.object({ evidence: z.array(z.string()).max(30) }).strict();
    const notes: string[] = [];
    for (const [index, chunk] of chunks.entries()) {
      const value = await ollamaJson(`Summarize chunk ${index + 1}/${chunks.length} as compact grounded evidence. Preserve every [Ns] timestamp.\n\n${chunk}`, evidenceSchema);
      const parsed = evidenceSchema.parse(value);
      notes.push(...parsed.evidence);
    }
    evidence = notes.join("\n");
  }
  const instructions = `Create complete meeting intelligence from the evidence below.
- Make General, Executive Brief, and Action-Focused summaries meaningfully different.
- Extract every explicit decision, risk, next step, and commitment.
- For each commitment, include the explicitly named owner and due-date phrase when present; otherwise use null.
- Use a numeric timestamp copied from the nearest [Ns] evidence marker for every extracted item.
- Highlight only genuinely important moments and quote their exact supporting transcript.
- Use empty arrays when a category has no evidence. Never place JSON syntax or schema field names inside prose strings.`;
  try { return summarySchema.parse(await ollamaJson(`${instructions}\n\nTimestamped evidence:\n${evidence}`, summarySchema)); }
  catch (error) { if (error instanceof z.ZodError) throw new Error("Ollama returned JSON that did not match the required meeting schema. The recording was kept for retry."); throw error; }
}

function nearestTimestamp(requested: number, entries: TranscriptEntry[]) {
  return entries.reduce((best, entry) => Math.abs(entry.startSeconds - requested) < Math.abs(best - requested) ? entry.startSeconds : best, entries[0].startSeconds);
}
function insights(items: Array<{ text: string; sourceTimestampSeconds: number; owner?: string | null; dueDate?: string | null; supportingTranscript?: string }>, prefix: string, entries: TranscriptEntry[]): Insight[] {
  return items.map((item, index) => ({ id: `${prefix}-${index + 1}`, text: item.text, timestampSeconds: nearestTimestamp(item.sourceTimestampSeconds, entries), ...(item.owner ? { owner: item.owner } : {}), ...(item.dueDate ? { dueDate: item.dueDate } : {}), ...(item.supportingTranscript ? { supportingTranscript: item.supportingTranscript } : {}) }));
}
function sourceTextFor(insight: Insight, entries: TranscriptEntry[]) {
  return entries.reduce((closest, entry) => Math.abs(entry.startSeconds - insight.timestampSeconds) < Math.abs(closest.startSeconds - insight.timestampSeconds) ? entry : closest, entries[0]).text.toLowerCase();
}
function mentioned(value: string | undefined, source: string) {
  if (!value) return true;
  const tokens = value.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 2) ?? [];
  return tokens.length > 0 && tokens.some((token) => source.includes(token));
}
function claimMatchesSource(claim: string, source: string) {
  const ignored = new Set(["about", "after", "before", "could", "meeting", "should", "their", "there", "these", "those", "would"]);
  const tokens = claim.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 3 && !ignored.has(token)) ?? [];
  const matches = tokens.filter((token) => source.includes(token)).length;
  return matches >= Math.min(2, tokens.length) && tokens.length > 0;
}
function hasDecisionEvidence(insight: Insight, entries: TranscriptEntry[]) {
  const source = sourceTextFor(insight, entries);
  return materialSignal.test(source) && claimMatchesSource(insight.text, source);
}
function hasActionEvidence(insight: Insight, entries: TranscriptEntry[]) {
  const source = sourceTextFor(insight, entries);
  return materialSignal.test(source) && claimMatchesSource(insight.text, source) && mentioned(insight.owner, source) && mentioned(insight.dueDate, source);
}
function hasHighlightEvidence(insight: Insight, entries: TranscriptEntry[]) {
  const source = sourceTextFor(insight, entries);
  const support = insight.supportingTranscript?.trim().toLowerCase();
  const quotedEvidence = Boolean(support && (source.includes(support) || support.includes(source)));
  return quotedEvidence && (materialSignal.test(source) || source.split(/\s+/).length >= 18);
}
function templates(result: AIResult): Meeting["summaries"] {
  return { General: result.general, "Executive Brief": result.executiveBrief, "Action-Focused": result.actionFocused } satisfies Record<SummaryTemplateName, SummaryContent>;
}

export async function processJob(jobId: string) {
  const job = await getJob(jobId); if (!job) throw new Error("Unknown processing job");
  try {
    const paths = recordingPaths(job.meetingId);
    await setStage(jobId, "transcribing-audio");
    await run(localAISettings.ffmpegPath, ["-y", "-i", paths.original, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", paths.wav], { timeout: 120_000, maxBuffer: 1024 * 1024 });
    await run(localAISettings.whisperCliPath, ["-m", localAISettings.whisperModelPath, "-f", paths.wav, "-oj", "-of", paths.transcriptPrefix], { timeout: 600_000, maxBuffer: 4 * 1024 * 1024 });
    const parsed = parseTranscript(JSON.parse(await readFile(`${paths.transcriptPrefix}.json`, "utf8")) as WhisperJson);
    await setStage(jobId, "generating-summary");
    const result = await analyze(parsed.entries);
    await setStage(jobId, "extracting-action-items");
    const meeting: Meeting = {
      id: job.meetingId, title: job.title, date: job.createdAt, durationSeconds: parsed.duration,
      participants: [{ id: "speaker", name: "Speaker", role: "Recorded locally", initials: "S", color: "#245c45" }],
      summary: result.general.overview, tags: ["Local AI"], status: "ready", origin: "local-recording", source: "Local recording",
      transcript: parsed.entries,
      decisions: insights(result.decisions, "decision", parsed.entries).filter((item) => hasDecisionEvidence(item, parsed.entries)),
      actionItems: insights(result.actions, "action", parsed.entries).filter((item) => hasActionEvidence(item, parsed.entries)),
      highlights: insights(result.highlights, "highlight", parsed.entries).filter((item) => hasHighlightEvidence(item, parsed.entries)),
      summaries: templates(result),
      mediaUrl: `/api/local-ai/meetings/${job.meetingId}/audio`, audio: { mimeType: job.audioMimeType ?? "application/octet-stream", originalFileName: "original.media" },
    };
    await setStage(jobId, "preparing-workspace");
    await saveMeeting(meeting);
    await saveJob({ ...(await getJob(jobId))!, status: "complete", stage: "complete", updatedAt: new Date().toISOString(), error: undefined });
  } catch (error) {
    const current = await getJob(jobId);
    if (current) await saveJob({ ...current, status: "failed", updatedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Processing failed unexpectedly." });
  }
}
