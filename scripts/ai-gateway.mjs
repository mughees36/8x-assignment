// Only this process may be exposed by the tunnel. The Next upstream and Ollama stay on loopback.
import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
const secret = process.env.AI_GATEWAY_SECRET;
const origin = process.env.AI_GATEWAY_ORIGIN;
const upstream = new URL(process.env.AI_GATEWAY_UPSTREAM || 'http://127.0.0.1:3002');
if (!secret || secret.length < 32 || !origin || !['127.0.0.1', 'localhost'].includes(upstream.hostname)) throw new Error('Set a 32+ character AI_GATEWAY_SECRET, exact AI_GATEWAY_ORIGIN, and loopback upstream.');
const tickets = new Map();
const statePath = '.data/gateway-manifest.json';
await mkdir('.data', { recursive: true });
let state;
try { state = JSON.parse(await readFile(statePath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; state = { meetings: [], jobs: [], day: '', jobsUsed: 0, questions: 0 }; }
// Older manifests counted recordings and questions together. Carry their usage
// into the recording bucket once, so upgrading cannot silently reset a limit.
if (!Number.isSafeInteger(state.jobsUsed) || state.jobsUsed < 0) state.jobsUsed = Number.isSafeInteger(state.count) && state.count > 0 ? state.count : 0;
if (!Number.isSafeInteger(state.questions) || state.questions < 0) state.questions = 0;
async function save() { await writeFile(`${statePath}.tmp`, JSON.stringify(state), { mode: 0o600 }); await rename(`${statePath}.tmp`, statePath); }
let busy = false; let requests = 0;
function dailyLimit(name, fallback) { const value = Number(process.env[name]); return Number.isSafeInteger(value) && value > 0 ? Math.min(value, 100) : fallback; }
setInterval(() => { requests = 0; for (const [key, expiry] of tickets) if (expiry < Date.now()) tickets.delete(key); }, 60_000).unref();
function authenticated(value = '') { const expected = Buffer.from(`Bearer ${secret}`); const actual = Buffer.from(value); return actual.length === expected.length && timingSafeEqual(actual, expected); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://gateway');
  const cors = req.headers.origin === origin;
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-content-type-options', 'nosniff');
  if (cors) { res.setHeader('access-control-allow-origin', origin); res.setHeader('vary', 'Origin'); }
  const reply = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.method === 'OPTIONS') { if (!cors) return reply(403, { error: 'Origin rejected' }); res.writeHead(204, { 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' }); return res.end(); }
  const ticket = url.pathname.startsWith('/upload/') ? url.pathname.slice(8) : '';
  const upload = req.method === 'POST' && cors && tickets.has(ticket) && tickets.get(ticket) > Date.now();
  if (!upload && !authenticated(req.headers.authorization)) return reply(401, { error: 'Unauthorized' });
  if (++requests > 240) return reply(429, { error: 'Gateway request limit reached' });
  if (req.method === 'POST' && url.pathname === '/upload-ticket') {
    const token = randomBytes(32).toString('base64url'); tickets.set(token, Date.now() + 120_000);
    if (tickets.size > 20) tickets.delete(tickets.keys().next().value);
    return reply(200, { uploadPath: `/upload/${token}` });
  }
  let path = url.pathname;
  if (upload) { tickets.delete(ticket); path = '/api/local-ai/jobs'; }
  const allowed = /^\/api\/(local-ai\/(status|jobs(?:\/job-[a-z0-9-]+(?:\/retry)?)?|meetings\/local-[a-z0-9-]+\/(audio|ask|share))|public\/shares\/[A-Za-z0-9_-]{43}\/audio|gateway-data)$/.test(path);
  if (!allowed) return reply(404, { error: 'Not found' });
  const jobId = path.match(/\/jobs\/(job-[a-z0-9-]+)/)?.[1];
  const meetingId = path.match(/\/meetings\/(local-[a-z0-9-]+)/)?.[1];
  if ((jobId && !state.jobs.includes(jobId)) || (meetingId && !state.meetings.includes(meetingId))) return reply(404, { error: 'Not found' });
  const question = req.method === 'POST' && path.endsWith('/ask');
  const inference = req.method === 'POST' && (path.endsWith('/jobs') || path.endsWith('/retry') || question);
  if (inference && busy) return reply(429, { error: 'AI host is processing another request. Retry shortly.' });
  const day = new Date().toISOString().slice(0, 10);
  if (state.day !== day) { state.day = day; state.jobsUsed = 0; state.questions = 0; state.count = 0; }
  const quotaKey = question ? 'questions' : 'jobsUsed';
  const quotaLimit = dailyLimit(question ? 'AI_GATEWAY_DAILY_QUESTIONS' : 'AI_GATEWAY_DAILY_JOBS', question ? 30 : 20);
  if (inference && state[quotaKey] >= quotaLimit) return reply(429, { error: question ? 'Daily meeting question limit reached' : 'Daily recording limit reached. Your audio remains in this browser tab; retry tomorrow.' });
  if (inference) busy = true;
  try {
    const chunks = []; let size = 0; const max = upload ? 25 * 1024 * 1024 : 8192;
    for await (const chunk of req) { size += chunk.length; if (size > max) { reply(413, { error: 'Upload limit is 25 MB' }); req.destroy(); return; } chunks.push(chunk); }
    if (req.method === 'POST' && path === '/api/local-ai/jobs' && !upload) return reply(403, { error: 'Use an upload ticket' });
    if (upload && !req.headers['content-type']?.startsWith('multipart/form-data;')) return reply(415, { error: 'Expected audio form' });
    if (inference) { state[quotaKey]++; await save(); }
    const target = new URL(path + (path === '/api/gateway-data' ? url.search : ''), upstream);
    const response = await fetch(target, { method: req.method, headers: { authorization: `Bearer ${secret}`, ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] } : {}), ...(req.headers.range ? { range: req.headers.range } : {}) }, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined, signal: AbortSignal.timeout(60_000), redirect: 'error' });
    if (path === '/api/gateway-data') {
      const data = await response.json();
      const filtered = Array.isArray(data) ? data.filter(m => state.meetings.includes(m.id)) : data?.meeting || (data?.id && state.meetings.includes(data.id)) ? data : null;
      return reply(response.status, filtered);
    }
    if (inference && response.ok && !path.endsWith('/ask')) {
      const data = await response.json();
      if (data.jobId) state.jobs = [...new Set([...state.jobs, data.jobId])];
      if (data.meetingId) state.meetings = [...new Set([...state.meetings, data.meetingId])];
      await save(); reply(response.status, data);
      const poll = setInterval(async () => { try { const r = await fetch(new URL(`/api/local-ai/jobs/${data.jobId}`, upstream)); const job = await r.json(); if (job.status !== 'processing') { clearInterval(poll); busy = false; } } catch {} }, 2000);
      setTimeout(() => { clearInterval(poll); busy = false; }, 20 * 60_000).unref();
      return;
    }
    res.writeHead(response.status, Object.fromEntries([...response.headers].filter(([key]) => ['content-type', 'content-length', 'content-range', 'accept-ranges'].includes(key))));
    if (response.body) for await (const chunk of response.body) res.write(chunk);
    res.end();
  } catch { if (!res.headersSent) reply(503, { error: 'AI host is unavailable' }); else res.end(); }
  finally { if (inference && (res.statusCode >= 400 || path.endsWith('/ask'))) busy = false; }
});
server.requestTimeout = 120_000;
server.listen(Number(process.env.AI_GATEWAY_PORT || 8787), '127.0.0.1', () => console.log('Authenticated AI gateway listening on loopback.'));
