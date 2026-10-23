import "server-only";
import { mkdir, open, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LocalShareSnapshot, Meeting, ProcessingJob } from "@/lib/types";
import { localAISettings } from "@/lib/local-ai/settings";
import { remoteAI, backendFetch, demoAuthorized } from "@/lib/local-ai/backend";

const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,80}$/;
const SAFE_TOKEN = /^[A-Za-z0-9_-]{43}$/;
export function assertSafeId(id: string) {
  if (!SAFE_ID.test(id)) throw new Error("Invalid identifier");
  return id;
}
export function assertSafeShareToken(token: string) {
  if (!SAFE_TOKEN.test(token)) throw new Error("Invalid share token");
  return token;
}

function withinData(...parts: string[]) {
  const target = path.resolve(localAISettings.dataDir, ...parts);
  const root = path.resolve(localAISettings.dataDir) + path.sep;
  if (!target.startsWith(root)) throw new Error("Unsafe storage path");
  return target;
}

async function atomicJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
  const handle = await open(temp, "r");
  await handle.sync();
  await handle.close();
  await rename(temp, file);
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try { return JSON.parse(await readFile(file, "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}

export function recordingPaths(meetingId: string) {
  assertSafeId(meetingId);
  const directory = withinData("recordings", meetingId);
  return { directory, original: path.join(directory, "original.media"), wav: path.join(directory, "audio-16k-mono.wav"), transcriptPrefix: path.join(directory, "transcript") };
}

export async function saveOriginal(meetingId: string, bytes: Uint8Array) {
  const { directory, original } = recordingPaths(meetingId);
  await mkdir(directory, { recursive: true });
  await writeFile(original, bytes, { mode: 0o600 });
  return original;
}

export async function saveJob(job: ProcessingJob) { await atomicJson(withinData("jobs", `${assertSafeId(job.id)}.json`), job); }
export async function getJob(id: string) { return readJson<ProcessingJob>(withinData("jobs", `${assertSafeId(id)}.json`)); }
export async function saveMeeting(meeting: Meeting) { await atomicJson(withinData("meetings", `${assertSafeId(meeting.id)}.json`), meeting); }
export async function getLocalMeeting(id: string): Promise<Meeting | undefined> {
  if (remoteAI) { if (!(await demoAuthorized())) return undefined; try { const r = await backendFetch(`/api/gateway-data?id=${assertSafeId(id)}`); return r.ok ? await r.json() || undefined : undefined; } catch { return undefined; } }
  return readJson<Meeting>(withinData("meetings", `${assertSafeId(id)}.json`));
}

export async function createShareSnapshot(meeting: Meeting) {
  if (meeting.origin !== "local-recording") throw new Error("Only local meetings require snapshots");
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const snapshot: LocalShareSnapshot = { version: 1, token, createdAt: new Date().toISOString(), meeting: structuredClone(meeting) };
  await atomicJson(withinData("shares", `${assertSafeShareToken(token)}.json`), snapshot);
  return snapshot;
}

export async function getShareSnapshot(token: string) {
  if (remoteAI) { try { const r = await backendFetch(`/api/gateway-data?share=${assertSafeShareToken(token)}`); return r.ok ? await r.json() as LocalShareSnapshot | undefined : undefined; } catch { return undefined; } }
  return readJson<LocalShareSnapshot>(withinData("shares", `${assertSafeShareToken(token)}.json`));
}

export async function revokeShareSnapshot(token: string) {
  const { unlink } = await import("node:fs/promises");
  try { await unlink(withinData("shares", `${assertSafeShareToken(token)}.json`)); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}

export async function listLocalMeetings(): Promise<Meeting[]> {
  if (remoteAI) { if (!(await demoAuthorized())) return []; try { const r = await backendFetch('/api/gateway-data'); return r.ok ? await r.json() : []; } catch { return []; } }
  const directory = withinData("meetings");
  try {
    const { readdir } = await import("node:fs/promises");
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
    return (await Promise.all(files.map((file) => readJson<Meeting>(path.join(directory, file))))).filter((item): item is Meeting => Boolean(item));
  } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}

export async function getAudioPath(id: string, converted = false) {
  const paths = recordingPaths(id);
  const file = converted ? paths.wav : paths.original;
  const info = await stat(file);
  return { file, size: info.size };
}

export async function getPlaybackAudioPath(id: string, originalMimeType = "application/octet-stream") {
  try {
    const audio = await getAudioPath(id, true);
    return { ...audio, mimeType: "audio/wav" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const audio = await getAudioPath(id);
    return { ...audio, mimeType: originalMimeType };
  }
}
