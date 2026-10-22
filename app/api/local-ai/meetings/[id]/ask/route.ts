import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AskError, askTranscript, questionSchema } from "@/lib/local-ai/ask";
import { assertSafeId, getLocalMeeting } from "@/lib/local-ai/persistence";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = assertSafeId((await params).id);
    const body = questionSchema.parse(await request.json());
    const meeting = await getLocalMeeting(id);
    if (!meeting || meeting.origin !== "local-recording") return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    if (!meeting.transcript.length) return NextResponse.json({ error: "This meeting has no transcript to ask about." }, { status: 422 });
    return NextResponse.json(await askTranscript(body.question, meeting.transcript), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Enter a question between 1 and 500 characters." }, { status: 400 });
    if (error instanceof AskError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === "timeout" ? 504 : 503 });
    return NextResponse.json({ error: "Unable to answer this question." }, { status: 400 });
  }
}
