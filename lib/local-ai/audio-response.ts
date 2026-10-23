import "server-only";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { parseByteRange } from "@/lib/local-ai/range";

export function audioResponse(file: string, size: number, contentType: string, rangeHeader: string | null, visibility: "private" | "public") {
  const range = parseByteRange(rangeHeader, size);
  const common = { "content-type": contentType, "accept-ranges": "bytes", "cache-control": visibility === "private" ? "private, no-store" : "public, max-age=3600" };
  if (range === null) return new NextResponse(null, { status: 416, headers: { ...common, "content-range": `bytes */${size}` } });
  if (range) return new NextResponse(Readable.toWeb(createReadStream(file, range)) as ReadableStream, { status: 206, headers: { ...common, "content-length": String(range.end - range.start + 1), "content-range": `bytes ${range.start}-${range.end}/${size}` } });
  return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers: { ...common, "content-length": String(size) } });
}
