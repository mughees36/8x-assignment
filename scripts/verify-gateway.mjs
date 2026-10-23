// Uses a self-created spoken fixture. Never uploads an existing private recording.
import { readFile } from 'node:fs/promises';
const base = process.env.VERIFY_GATEWAY_URL || 'http://127.0.0.1:8787';
const headers = { authorization: `Bearer ${process.env.AI_GATEWAY_SECRET}` };
const auth = await fetch(base + '/upload-ticket', { method: 'POST', headers });
if (!auth.ok) throw new Error(`Ticket failed: ${auth.status}`);
const ticket = await auth.json();
const form = new FormData(); form.set('title', 'Gateway verification — synthetic spoken fixture');
form.set('audio', new Blob([await readFile('.data/gateway-verification.webm')], { type: 'audio/webm' }), 'verification.webm');
const upload = await fetch(base + ticket.uploadPath, { method: 'POST', headers: { origin: process.env.AI_GATEWAY_ORIGIN }, body: form });
const result = await upload.json(); if (!upload.ok) throw new Error(JSON.stringify(result));
console.log('Actual audio uploaded; job:', result.jobId);
for (let i = 0; i < 180; i++) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const response = await fetch(base + `/api/local-ai/jobs/${result.jobId}`, { headers });
  const job = await response.json();
  if (job.status === 'failed') throw new Error(job.error);
  if (job.status === 'complete') {
    const meeting = await (await fetch(base + `/api/gateway-data?id=${result.meetingId}`, { headers })).json();
    console.log(JSON.stringify({ transcript: meeting.transcript, summary: meeting.summary, decisions: meeting.decisions, actions: meeting.actionItems, highlights: meeting.highlights }, null, 2));
    const audio = await fetch(base + `/api/local-ai/meetings/${result.meetingId}/audio`, { headers: { ...headers, range: 'bytes=0-99' } });
    console.log('Playback range:', audio.status, audio.headers.get('content-range'));
    if (audio.status !== 206 || !meeting.transcript.length) throw new Error('Playback/transcript failed');
    const ask = await fetch(base + `/api/local-ai/meetings/${result.meetingId}/ask`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ question: 'Who will prepare the onboarding checklist?' }) });
    console.log('Grounded Q&A:', ask.status, await ask.json());
    process.exit(0);
  }
}
throw new Error('Job verification timed out');
