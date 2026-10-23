# Deployment preparation

Repository: https://github.com/mughees36/8x-assignment

Production URL: https://8x-assignment-theta.vercel.app (unauthenticated seeded demo verified).

GitHub push and Vercel deployment were approved and completed. Cloudflare quick-tunnel creation timed out three times, including HTTP/2 and IPv4 attempts. Tailscale Funnel now exposes only the authenticated gateway at `https://192.tail5320f5.ts.net`; Vercel has `AI_BACKEND_URL`, `AI_BACKEND_SECRET`, and `AI_DEMO_ACCESS_CODE` as sensitive production variables. The public alias is `https://8x-assignment-theta.vercel.app`. Credentials exist privately under `.data/gateway.env`, with the reviewer code under `.data/demo-access.txt`. The public AI browser test captured a self-created spoken fixture with MediaRecorder, then verified real Whisper transcript, Ollama summary/action extraction, audio playback and transcript seek, dashboard search, and grounded Q&A. Public seeded media passed desktop/mobile checks, and the local regression suite previously passed 24/24.

Vercel Hobby rejected the original handler layout for exceeding its 12-function limit. The app now dispatches unchanged API URLs through one catch-all route, with implementation modules under `lib/api`. A separate `.next-ai` build directory keeps the persistent local backend independent of development/test builds. `scripts/configure-gateway.mjs` generates credentials privately and installs sensitive production environment variables. After repository access was granted to the Vercel GitHub App, the CLI reports that `mughees36/8x-assignment` is already connected to this Vercel project. CLI deployment remains available as a manual fallback.

Deployment inputs explicitly exclude private directories using `.vercelignore`; Git ignores alone were insufficient for the initial native CLI artifact. The initial artifacts were removed. Vercel runtime guards additionally forbid reading local meetings/shares when no remote backend is configured. The replacement deployment was verified to show exactly ten seeded meetings and no content at a known local meeting ID. Actual public video playback and seeking passed on desktop and mobile.

## Architecture

Vercel serves Next.js and the ten seeded meetings independently of the Mac. Server handlers use `AI_BACKEND_URL` and `AI_BACKEND_SECRET` to call a loopback Node gateway through an HTTPS Tailscale Funnel. The gateway forwards only approved routes to an isolated Next process on port 3002. That process reuses the existing Whisper, FFmpeg, Ollama, Zod schemas, job pipeline and local persistence. Ollama stays at 127.0.0.1:11434.

Browser audio bypasses Vercel body limits: an authorized server handler issues a 120-second single-use upload ticket, then the browser sends its audio form directly to the gateway. Gateway uploads have a 25 MB limit and 120-second request limit. Processing is asynchronous; the browser polls the job and can retry. Failed inference retains server audio. Failed uploads retain the Blob in the open browser tab; closing or refreshing that tab before upload succeeds loses that Blob.

The demo access code grants access to a shared reviewer workspace. It is not a personal account system. Only recordings created through this gateway are listed remotely. Existing private recordings are excluded by a persisted manifest. Share links require explicit creation, and allow read-only access without the access code. Do not give reviewers the code unless shared visibility among code holders is acceptable.

## Local configuration

Generate credentials with `openssl rand -hex 32` and store outside Git in a private env file. Set `AI_GATEWAY_SECRET` on the Mac and the same value as `AI_BACKEND_SECRET` on Vercel. Set `AI_DEMO_ACCESS_CODE` only on Vercel. Never place these in NEXT_PUBLIC variables.

Run the isolated backend with the existing package manager:

```
NEXT_DIST_DIR=.next-ai pnpm build
NEXT_DIST_DIR=.next-ai node --env-file=.data/gateway.env node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3002
node --env-file=/absolute/private/gateway.env scripts/ai-gateway.mjs
```

Both processes need the gateway secret in their environment. The isolated Next process must NOT have AI_BACKEND_URL set, or it would proxy recursively. Gateway requires an exact `AI_GATEWAY_ORIGIN` (the production Vercel origin), a loopback `AI_GATEWAY_UPSTREAM`, and an optional `AI_GATEWAY_DAILY_JOBS` (default six inference requests including retries and questions). Run only one gateway instance. A single active job or Q&A is allowed. The quota persists on disk; short request throttling is process-local. This is demo abuse containment, not a production multi-tenant service.

Keep `.data` on the Mac or set `AI_DATA_DIR` for the Next process to an approved persistent location. Gateway manifest remains under its working directory's `.data`. Back up both. No cloud database or storage account is provisioned: the Mac is the persistent backend, so completed local recordings require it online. Seeded meetings remain usable offline. A shared Mac recording returns unavailable when its host is offline.

## Tailscale Funnel

The approved Tailscale CLI is installed on this Mac. A userspace daemon stores its state in the ignored `.data` directory and avoids a systemwide VPN. Start it from the project root:

```
tailscaled --tun=userspace-networking --state="$PWD/.data/tailscaled.state" --socket="$PWD/.data/tailscaled.sock" --statedir="$PWD/.data/tailscale"
tailscale --socket="$PWD/.data/tailscaled.sock" up --accept-dns=false
tailscale --socket="$PWD/.data/tailscaled.sock" funnel --bg http://127.0.0.1:8787
tailscale --socket="$PWD/.data/tailscaled.sock" funnel status
```

The first `up` requires a Tailscale account login; the first `funnel` requires enabling Funnel for this device in Tailscale's web console. Funnel assigns an HTTPS `*.ts.net` URL. Set only that exact URL as `AI_BACKEND_URL` on Vercel. The public Funnel port is 443 and its only local target is the authenticated gateway on 8787. Never funnel ports 3000, 3002, or 11434. Tailscale Funnel also needs MagicDNS and HTTPS certificates in the tailnet. [Tailscale's Funnel documentation](https://tailscale.com/docs/features/tailscale-funnel) describes those prerequisites and account limits.

The URL may remain stable while this device remains in the tailnet, but the Mac, daemon, local Next process, gateway, and Ollama must all be running for AI to work. To close public access, run `tailscale --socket="$PWD/.data/tailscaled.sock" funnel reset` before stopping the gateway. The current CLI variant runs as a user process; it does not automatically start after a reboot. Use the startup commands above after restarting the Mac.

## Vercel (requires authentication and deployment approval)

The Vercel project is already deployed with framework Next.js, build `pnpm build`, output default, and Node 24. To rotate credentials or change a Funnel URL, run `DEPLOYMENT_GATEWAY_URL=https://your-host.ts.net node scripts/configure-gateway.mjs --vercel` from the linked project and redeploy. `AI_BACKEND_URL` (HTTPS gateway URL), `AI_BACKEND_SECRET`, and `AI_DEMO_ACCESS_CODE` are server-only production secrets; no `NEXT_PUBLIC_` secret is used. No Mac paths or models belong on Vercel. Seed-only deployment may omit these variables, in which case recording remains unavailable. No paid AI services are used. Free-tier Vercel execution and body limits still apply to small JSON requests and proxied playback; supervise demo traffic. Large audio uploads do not pass through Vercel.

## Verification and shutdown

Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e`, and `node --test tests/gateway.test.mjs`. For a real public speech test, create a private self-spoken fixture at `.data/gateway-verification.wav`, then run `node --env-file=.data/gateway.env scripts/verify-public-ai.mjs`. The script uses Chrome's fake microphone device, but actual MediaRecorder audio travels through the production browser/Funnel/Whisper/Ollama workflow. It checks transcript, summary, decisions, actions, dashboard search, playback, seeking, Q&A, and a seeded public share in a fresh browser context. It creates a private test recording; it never publishes that recording. Daily AI quota may require waiting until the next UTC day before repeat runs. Stop the Mac gateway to verify honest offline behavior.

Reset Tailscale Funnel first to remove internet access, then stop the gateway and isolated Next process. Rotate the gateway secret and demo code if disclosed. Never commit private recordings, `.data`, models, env files, or credential files.
