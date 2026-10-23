import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { randomBytes } from 'node:crypto';

test('gateway rejects anonymous access, unlisted routes and invalid upload origins', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), '8x-gateway-'));
  const secret = randomBytes(32).toString('hex');
  const upstream = http.createServer((_req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ready: true })); });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const upPort = upstream.address().port;
  const reserve = http.createServer(); await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve)); const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const child = spawn(process.execPath, [path.resolve('scripts/ai-gateway.mjs')], { cwd: temp, env: { ...process.env, AI_GATEWAY_SECRET: secret, AI_GATEWAY_PORT: String(port), AI_GATEWAY_ORIGIN: 'https://example.test', AI_GATEWAY_UPSTREAM: `http://127.0.0.1:${upPort}` }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('exit', reject); setTimeout(() => reject(new Error('Gateway did not start')), 5000).unref(); });
    const base = `http://127.0.0.1:${port}`; const headers = { authorization: `Bearer ${secret}` };
    assert.equal((await fetch(base + '/api/local-ai/status')).status, 401);
    assert.equal((await fetch(base + '/api/local-ai/status', { headers })).status, 200);
    assert.equal((await fetch(base + '/api/tags', { headers })).status, 404);
    assert.equal((await fetch(base + '/api/local-ai/meetings/local-private/audio', { headers })).status, 404);
    const ticket = await (await fetch(base + '/upload-ticket', { method: 'POST', headers })).json();
    assert.match(ticket.uploadPath, /^\/upload\/[A-Za-z0-9_-]{43}$/);
    assert.equal((await fetch(base + ticket.uploadPath, { method: 'POST', headers: { origin: 'https://attacker.test' } })).status, 401);
    assert.equal((await fetch(base + ticket.uploadPath, { method: 'POST', headers: { origin: 'https://example.test', 'content-type': 'application/json' }, body: '{}' })).status, 415);
    assert.equal((await fetch(base + ticket.uploadPath, { method: 'POST', headers: { origin: 'https://example.test' } })).status, 401);
  } finally { child.kill(); await new Promise(resolve => child.once('exit', resolve)); await new Promise(resolve => upstream.close(resolve)); await rm(temp, { recursive: true, force: true }); }
});

test('meeting questions have a separate bounded quota from recording uploads', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), '8x-gateway-quota-'));
  const secret = randomBytes(32).toString('hex');
  await mkdir(path.join(temp, '.data'));
  await writeFile(path.join(temp, '.data/gateway-manifest.json'), JSON.stringify({ meetings: ['local-testone'], jobs: [], day: new Date().toISOString().slice(0, 10), jobsUsed: 1, questions: 0 }));
  const upstream = http.createServer((_req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ answer: 'Maya' })); });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const reserve = http.createServer(); await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve)); const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const child = spawn(process.execPath, [path.resolve('scripts/ai-gateway.mjs')], { cwd: temp, env: { ...process.env, AI_GATEWAY_SECRET: secret, AI_GATEWAY_PORT: String(port), AI_GATEWAY_ORIGIN: 'https://example.test', AI_GATEWAY_UPSTREAM: `http://127.0.0.1:${upstream.address().port}`, AI_GATEWAY_DAILY_JOBS: '1', AI_GATEWAY_DAILY_QUESTIONS: '2' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('exit', reject); setTimeout(() => reject(new Error('Gateway did not start')), 5000).unref(); });
    const base = `http://127.0.0.1:${port}`; const headers = { authorization: `Bearer ${secret}` };
    const ask = () => fetch(base + '/api/local-ai/meetings/local-testone/ask', { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ question: 'Who owns it?' }) });
    assert.equal((await ask()).status, 200);
    assert.equal((await ask()).status, 200);
    assert.equal((await ask()).status, 429);
    const ticket = await (await fetch(base + '/upload-ticket', { method: 'POST', headers })).json();
    const form = new FormData(); form.set('title', 'Quota test'); form.set('audio', new Blob(['audio'], { type: 'audio/webm' }), 'test.webm');
    const upload = await fetch(base + ticket.uploadPath, { method: 'POST', headers: { origin: 'https://example.test' }, body: form });
    assert.equal(upload.status, 429);
    assert.match((await upload.json()).error, /Daily recording limit/);
  } finally { child.kill(); await new Promise(resolve => child.once('exit', resolve)); await new Promise(resolve => upstream.close(resolve)); await rm(temp, { recursive: true, force: true }); }
});
