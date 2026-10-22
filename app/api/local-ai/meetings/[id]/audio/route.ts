import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { assertSafeId, getAudioPath, getLocalMeeting } from "@/lib/local-ai/persistence";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = assertSafeId((await params).id); const [{ file, size }, meeting] = await Promise.all([getAudioPath(id), getLocalMeeting(id)]);
    const contentType = meeting?.audio?.mimeType ?? "application/octet-stream";
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
      const requestedStart = match[1] ? Number(match[1]) : undefined;
      const requestedEnd = match[2] ? Number(match[2]) : undefined;
      const start = requestedStart ?? Math.max(0, size - (requestedEnd ?? 0));
      const end = Math.min(requestedEnd ?? size - 1, size - 1);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) {
        return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
      }
      return new NextResponse(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, {
        status: 206,
        headers: {
          "content-type": contentType,
          "content-length": String(end - start + 1),
          "content-range": `bytes ${start}-${end}/${size}`,
          "cache-control": "private, max-age=3600",
          "accept-ranges": "bytes",
        },
      });
    }
    return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers: { "content-type": contentType, "content-length": String(size), "cache-control": "private, max-age=3600", "accept-ranges": "bytes" } });
  } catch { return NextResponse.json({ error: "Recording not found." }, { status: 404 }); }
}
