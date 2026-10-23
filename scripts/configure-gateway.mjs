// Generates private deployment credentials without printing them or placing them in Git.
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const file = '.data/gateway.env';
await mkdir('.data', { recursive: true });
let existing = '';
try { existing = await readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const values = Object.fromEntries(existing.trim().split('\n').filter(Boolean).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
values.AI_GATEWAY_SECRET ||= randomBytes(32).toString('hex');
values.AI_DEMO_ACCESS_CODE ||= randomBytes(18).toString('base64url');
values.AI_GATEWAY_ORIGIN = process.env.DEPLOYMENT_ORIGIN || values.AI_GATEWAY_ORIGIN;
values.AI_GATEWAY_UPSTREAM = 'http://127.0.0.1:3002';
values.AI_GATEWAY_PORT = '8787';
if (!values.AI_GATEWAY_ORIGIN) throw new Error('Set DEPLOYMENT_ORIGIN');
if (process.env.DEPLOYMENT_GATEWAY_URL) values.REMOTE_GATEWAY_URL = process.env.DEPLOYMENT_GATEWAY_URL;
await writeFile(file, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 });
await writeFile('.data/demo-access.txt', values.AI_DEMO_ACCESS_CODE + '\n', { mode: 0o600 });
if (process.argv.includes('--vercel')) {
  for (const [name, value] of Object.entries({ AI_BACKEND_URL: values.REMOTE_GATEWAY_URL, AI_BACKEND_SECRET: values.AI_GATEWAY_SECRET, AI_DEMO_ACCESS_CODE: values.AI_DEMO_ACCESS_CODE })) {
    if (!value) throw new Error(`${name} missing`);
    const result = spawnSync('pnpm', ['dlx', 'vercel', 'env', 'add', name, 'production', '--force', '--sensitive'], { input: value, encoding: 'utf8', env: process.env });
    if (result.status !== 0) throw new Error(`Could not configure ${name}: ${result.stderr}`);
    console.log(`Configured ${name} as a sensitive production variable.`);
  }
}
console.log('Credentials stored privately in .data/gateway.env; reviewer code in .data/demo-access.txt.');
