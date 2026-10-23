import { NextRequest, NextResponse } from "next/server";
import { backendFetch, demoAuthorized } from "@/lib/local-ai/backend";
export const dynamic = "force-dynamic";
async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const publicRead = request.method === "GET" && /^public\/shares\/[A-Za-z0-9_-]{43}\/audio$/.test(path);
  if (!publicRead && !(await demoAuthorized())) return NextResponse.json({ error: "Enter the demo access code on the new meeting screen." }, { status: 401 });
  try {
    if (request.method === "POST" && path === "local-ai/jobs") {
      const ticket = await backendFetch("/upload-ticket", { method: "POST" });
      const data = await ticket.json();
      return NextResponse.json({ ...data, ...(data.uploadPath ? { uploadUrl: new URL(data.uploadPath, process.env.AI_BACKEND_URL).href } : {}) }, { status: ticket.status });
    }
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && body.length > 8192) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const response = await backendFetch(`/api/${path}`, { method: request.method, body, headers: { "content-type": "application/json", ...(request.headers.get("range") ? { range: request.headers.get("range")! } : {}) } });
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch { return NextResponse.json({ error: "The AI host is offline or unavailable. Your browser recording has been retained for retry." }, { status: 503 }); }
}
export const GET = proxy;
export const POST = proxy;
// Dispatched through the shared API route to fit Vercel Hobby function limits.
