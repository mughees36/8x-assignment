# Deployment preparation

Repository: https://github.com/mughees36/8x-assignment

Production URL: pending approval and Vercel authentication. No tunnel or deployment has been published.

## Architecture

Vercel serves Next.js and the ten seeded meetings independently of the Mac. Server handlers use `AI_BACKEND_URL` and `AI_BACKEND_SECRET` to call a loopback Node gateway through an HTTPS Cloudflare tunnel. The gateway forwards only approved routes to an isolated Next process on port 3002. That process reuses the existing Whisper, FFmpeg, Ollama, Zod schemas, job pipeline and local persistence. Ollama stays at 127.0.0.1:11434.

Browser audio bypasses Vercel body limits: an authorized server handler issues a 120-second single-use upload ticket, then the browser sends its audio form directly to the gateway. Gateway uploads have a 25 MB limit and 120-second request limit. Processing is asynchronous; the browser polls the job and can retry. Failed inference retains server audio. Failed uploads retain the Blob in the open browser tab; closing or refreshing that tab before upload succeeds loses that Blob.

The demo access code grants access to a shared reviewer workspace. It is not a personal account system. Only recordings created through this gateway are listed remotely. Existing private recordings are excluded by a persisted manifest. Share links require explicit creation, and allow read-only access without the access code. Do not give reviewers the code unless shared visibility among code holders is acceptable.

## Local configuration

Generate credentials with `openssl rand -hex 32` and store outside Git in a private env file. Set `AI_GATEWAY_SECRET` on the Mac and the same value as `AI_BACKEND_SECRET` on Vercel. Set `AI_DEMO_ACCESS_CODE` only on Vercel. Never place these in NEXT_PUBLIC variables.

Run the isolated backend with the existing package manager:

```
pnpm dev --hostname 127.0.0.1 --port 3002
node --env-file=/absolute/private/gateway.env scripts/ai-gateway.mjs
```

Both processes need the gateway secret in their environment. The isolated Next process must NOT have AI_BACKEND_URL set, or it would proxy recursively. Gateway requires an exact `AI_GATEWAY_ORIGIN` (the production Vercel origin), a loopback `AI_GATEWAY_UPSTREAM`, and an optional `AI_GATEWAY_DAILY_JOBS` (default six inference requests including retries and questions). Run only one gateway instance. A single active job or Q&A is allowed. The quota persists on disk; short request throttling is process-local. This is demo abuse containment, not a production multi-tenant service.

Keep `.data` on the Mac or set `AI_DATA_DIR` for the Next process to an approved persistent location. Gateway manifest remains under its working directory's `.data`. Back up both. No cloud database or storage account is provisioned: the Mac is the persistent backend, so completed local recordings require it online. Seeded meetings remain usable offline. A shared Mac recording returns unavailable when its host is offline.

## Tunnel (requires exposure approval)

cloudflared is not installed yet. After approval, install it and either create a stable named tunnel for a domain you control or use:

```
cloudflared tunnel --url http://127.0.0.1:8787
```

A quick tunnel URL changes on restart; update AI_BACKEND_URL on Vercel and redeploy. It is suitable for a supervised demo, not permanent hosting. Expose only port 8787. Do not tunnel port 3000, 3002, or 11434. Keep the app server and Ollama bound to loopback. For a named tunnel, add Cloudflare access controls where compatible with the ticket upload flow; service-token-only Access policies would block direct browser uploads unless explicitly configured for them.

## Vercel (requires authentication and deployment approval)

Import the GitHub repository, framework Next.js, build `pnpm build`, output default, Node 22 or newer. Set AI_BACKEND_URL (HTTPS gateway URL), AI_BACKEND_SECRET, and AI_DEMO_ACCESS_CODE as server secrets. No Mac paths or models belong on Vercel. Seed-only deployment may omit all three; recording remains unavailable. No paid AI services are used. Free-tier Vercel execution and body limits still apply to small JSON requests and proxied playback; supervise demo traffic. Large audio uploads do not pass through Vercel.

## Verification and shutdown

Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e`, and `node --test tests/gateway.test.mjs`. A production test must use real speech over HTTPS, check actual transcript and summaries, refresh the saved meeting, seek audio, and open an explicit share in a fresh browser context. Stop the Mac gateway to verify honest offline behavior.

Stop cloudflared first to remove internet access, then stop the gateway and isolated Next process. Rotate the gateway secret and demo code if disclosed. Never commit private recordings, `.data`, models, env files, or credential files.
