import { NextRequest, NextResponse } from "next/server";
import { assertSafeId, getLocalMeeting, getPlaybackAudioPath } from "@/lib/local-ai/persistence";
import { audioResponse } from "@/lib/local-ai/audio-response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = assertSafeId((await params).id); const meeting = await getLocalMeeting(id);
    if (!meeting || meeting.origin !== "local-recording") return NextResponse.json({ error: "Recording not found." }, { status: 404 });
    const { file, size, mimeType } = await getPlaybackAudioPath(id, meeting.audio?.mimeType);
    return audioResponse(file, size, mimeType, request.headers.get("range"), "private");
  } catch { return NextResponse.json({ error: "Recording not found." }, { status: 404 }); }
}
