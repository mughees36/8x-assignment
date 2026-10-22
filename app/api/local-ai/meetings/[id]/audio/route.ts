import { NextRequest, NextResponse } from "next/server";
import { assertSafeId, getAudioPath, getLocalMeeting } from "@/lib/local-ai/persistence";
import { audioResponse } from "@/lib/local-ai/audio-response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = assertSafeId((await params).id); const [{ file, size }, meeting] = await Promise.all([getAudioPath(id), getLocalMeeting(id)]);
    const contentType = meeting?.audio?.mimeType ?? "application/octet-stream";
    if (!meeting || meeting.origin !== "local-recording") return NextResponse.json({ error: "Recording not found." }, { status: 404 });
    return audioResponse(file, size, contentType, request.headers.get("range"), "private");
  } catch { return NextResponse.json({ error: "Recording not found." }, { status: 404 }); }
}
