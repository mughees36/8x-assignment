import { NextRequest, NextResponse } from "next/server";
import { audioResponse } from "@/lib/local-ai/audio-response";
import { getAudioPath, getShareSnapshot } from "@/lib/local-ai/persistence";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const snapshot = await getShareSnapshot((await params).token);
    if (!snapshot || snapshot.meeting.origin !== "local-recording") return NextResponse.json({ error: "Shared recording not found." }, { status: 404 });
    const { file, size } = await getAudioPath(snapshot.meeting.id);
    return audioResponse(file, size, snapshot.meeting.audio?.mimeType ?? "application/octet-stream", request.headers.get("range"), "public");
  } catch { return NextResponse.json({ error: "Shared recording not found." }, { status: 404 }); }
}
