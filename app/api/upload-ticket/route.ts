import { NextResponse } from 'next/server';
import { backendFetch, demoAuthorized, remoteAI } from '@/lib/local-ai/backend';
export async function POST() {
  if (!remoteAI) return NextResponse.json({ local: true });
  if (!(await demoAuthorized())) return NextResponse.json({ error: 'Enter a valid demo access code before recording.' }, { status: 401 });
  try { const r = await backendFetch('/upload-ticket', { method: 'POST' }); const data = await r.json(); return NextResponse.json({ ...data, ...(data.uploadPath ? { uploadUrl: new URL(data.uploadPath, process.env.AI_BACKEND_URL).href } : {}) }, { status: r.status }); }
  catch { return NextResponse.json({ error: 'AI host offline. Recording remains in this browser tab; retry the upload.' }, { status: 503 }); }
}
