import { NextRequest, NextResponse } from "next/server";
import { getReadiness } from "@/lib/local-ai/readiness";
import { processJob } from "@/lib/local-ai/processor";
import { assertSafeId, getJob, saveJob } from "@/lib/local-ai/persistence";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = assertSafeId((await params).id); const job = await getJob(id);
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
    if (job.status === "processing") return NextResponse.json({ error: "This job is already processing." }, { status: 409 });
    const readiness = await getReadiness(); if (!readiness.ready) return NextResponse.json({ error: readiness.message, readiness }, { status: 503 });
    await saveJob({ ...job, status: "processing", stage: "transcribing-audio", updatedAt: new Date().toISOString(), error: undefined });
    void processJob(id); return NextResponse.json({ jobId: id, meetingId: job.meetingId }, { status: 202 });
  } catch { return NextResponse.json({ error: "Invalid job identifier." }, { status: 400 }); }
}
// Dispatched through the shared API route to fit Vercel Hobby function limits.
