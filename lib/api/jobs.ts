import { NextRequest, NextResponse } from "next/server";
import type { ProcessingJob } from "@/lib/types";
import { getReadiness } from "@/lib/local-ai/readiness";
import { processJob } from "@/lib/local-ai/processor";
import { saveJob, saveOriginal } from "@/lib/local-ai/persistence";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_AUDIO_BYTES = 250 * 1024 * 1024;
export async function POST(request: NextRequest) {
  const readiness = await getReadiness();
  if (!readiness.ready) return NextResponse.json({ error: readiness.message, readiness }, { status: 503 });
  const form = await request.formData();
  const audio = form.get("audio"); const rawTitle = form.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (!(audio instanceof File) || !audio.type.startsWith("audio/") || audio.size === 0) return NextResponse.json({ error: "A non-empty MediaRecorder audio blob is required." }, { status: 400 });
  if (audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: "Recording exceeds the 250 MB local upload limit." }, { status: 413 });
  if (!title || title.length > 140) return NextResponse.json({ error: "Enter a meeting title between 1 and 140 characters." }, { status: 400 });
  const meetingId = `local-${crypto.randomUUID()}`; const jobId = `job-${crypto.randomUUID()}`; const now = new Date().toISOString();
  const job: ProcessingJob = { id: jobId, meetingId, title, status: "processing", stage: "saving-recording", createdAt: now, updatedAt: now, audioMimeType: audio.type };
  await saveJob(job);
  try { await saveOriginal(meetingId, new Uint8Array(await audio.arrayBuffer())); }
  catch { await saveJob({ ...job, status: "failed", updatedAt: new Date().toISOString(), error: "The recording could not be saved." }); return NextResponse.json({ error: "The recording could not be saved." }, { status: 500 }); }
  void processJob(jobId);
  return NextResponse.json({ jobId, meetingId }, { status: 202 });
}
// Dispatched through the shared API route to fit Vercel Hobby function limits.
