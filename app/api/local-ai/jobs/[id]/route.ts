import { NextRequest, NextResponse } from "next/server";
import { assertSafeId, getJob } from "@/lib/local-ai/persistence";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const job = await getJob(assertSafeId((await params).id)); return job ? NextResponse.json(job, { headers: { "cache-control": "no-store" } }) : NextResponse.json({ error: "Job not found." }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Invalid job identifier." }, { status: 400 }); }
}
