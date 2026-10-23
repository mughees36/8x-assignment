import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/local-ai/readiness";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(await getReadiness(), { headers: { "cache-control": "no-store" } }); }
// Dispatched through the shared API route to fit Vercel Hobby function limits.
