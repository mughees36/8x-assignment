# Tailscale deployment milestone — 2026-10-23

This is a safe engineering milestone note alongside the assignment capture logs. It is not a reconstructed prompt/response capture.

- User declined purchasing a Cloudflare domain and authorized installing Tailscale. The official app installer required interactive administrator authentication, so the approved Tailscale CLI variant was installed with Homebrew and run in userspace mode. The user authorized the device and enabled Funnel in the Tailscale account.
- Funnel target is the authenticated Node gateway on loopback port 8787. Ollama remains on 127.0.0.1:11434; the isolated Next backend remains on 127.0.0.1:3002. Anonymous public gateway access returned 401; authenticated readiness returned 200; an Ollama API path and an unlisted private recording returned 404.
- The public Vercel project was configured with sensitive server-only gateway URL, secret, and reviewer code values. Values are stored outside Git and are intentionally omitted here.
- A browser test fed a self-created spoken audio fixture into real Chrome MediaRecorder on the production site. The audio was uploaded through the public HTTPS Funnel, transcribed by Whisper, processed by Ollama, and saved. The test exposed a Next.js static/dynamic route error; the recorded meeting route was made dynamic and the production fix was verified. Another browser run exposed a server/browser time-zone hydration mismatch; meeting dates now render in labeled UTC.
- The saved private recording was verified through the deployed dashboard, search, actual audio range playback, transcript seeking, decisions, action items, and Q&A. A fresh browser session verified only seeded public sharing. Automatic review rejected publishing the recorded test meeting, so that share was not created.
- Desktop/mobile anonymous production tests passed with exactly ten seeded meetings and playable seekable demo media. Lint, typecheck, and production build passed after the fixes.
- A controlled gateway shutdown made production readiness report `ready: false` with a truthful offline message while `/meetings` still returned HTTP 200. The gateway was restarted and production readiness returned `ready: true`.
- `vercel git connect` still rejects repository linking; CLI production deployments and GitHub pushes work. The Vercel GitHub App needs repository permission for automatic deployment.
