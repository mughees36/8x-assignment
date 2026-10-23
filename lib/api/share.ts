import { NextResponse } from "next/server";
import { assertSafeId, createShareSnapshot, getLocalMeeting } from "@/lib/local-ai/persistence";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const meeting = await getLocalMeeting(assertSafeId((await params).id));
    if (!meeting || meeting.origin !== "local-recording") return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    const snapshot = await createShareSnapshot(meeting);
    return NextResponse.json({ token: snapshot.token, url: `/share/${snapshot.token}` }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to create a share right now." }, { status: 400 }); }
}
// Dispatched through the shared API route to fit Vercel Hobby function limits.
