import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
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
