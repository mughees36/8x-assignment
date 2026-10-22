import "server-only";
import { mkdir, open, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Meeting, ProcessingJob } from "@/lib/types";
import { localAISettings } from "@/lib/local-ai/settings";

const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,80}$/;
export function assertSafeId(id: string) {
  if (!SAFE_ID.test(id)) throw new Error("Invalid identifier");
  return id;
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
export async function getLocalMeeting(id: string) { return readJson<Meeting>(withinData("meetings", `${assertSafeId(id)}.json`)); }

export async function listLocalMeetings(): Promise<Meeting[]> {
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
