import { NextRequest, NextResponse } from "next/server";
import { equalSecret } from "@/lib/local-ai/backend";
import { getLocalMeeting, getShareSnapshot, listLocalMeetings } from "@/lib/local-ai/persistence";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!equalSecret(request.headers.get("authorization") || "", `Bearer ${process.env.AI_GATEWAY_SECRET || "disabled"}`) || !process.env.AI_GATEWAY_SECRET) return new NextResponse(null, { status: 404 });
  const id = request.nextUrl.searchParams.get("id"); const share = request.nextUrl.searchParams.get("share");
  try { return NextResponse.json(share ? await getShareSnapshot(share) || null : id ? await getLocalMeeting(id) || null : await listLocalMeetings()); }
  catch { return NextResponse.json(null, { status: 404 }); }
}
// Dispatched through the shared API route to fit Vercel Hobby function limits.
