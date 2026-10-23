import { NextResponse } from "next/server";
import { demoToken, equalSecret } from "@/lib/local-ai/backend";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.code !== "string" || !equalSecret(body.code, process.env.AI_DEMO_ACCESS_CODE || "")) return NextResponse.json({ error: "Invalid demo access code." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("ai-demo", demoToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 3600, path: "/" });
  return response;
}
// Dispatched through the shared API route to fit Vercel Hobby function limits.
