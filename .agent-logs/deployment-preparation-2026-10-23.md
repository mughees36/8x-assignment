# Deployment preparation milestone

This is an engineering milestone note, not an automatically captured conversation transcript. Existing capture hooks and historical session logs are preserved without changes.

Request: prepare the existing app for GitHub/Vercel with secure access to local Whisper and Ollama, and stop before publication or exposure for approval.

Audit: existing Next.js 15.5.28 app, pnpm lockfile, main branch, no conflicting remote, target GitHub repository has no refs. Ollama listens only on loopback; llama3.2:3b and Whisper/FFmpeg installations are reused. No new model downloaded. cloudflared, gh and vercel were not found on PATH.

Changes: protected gateway with route allowlist, one-use CORS-scoped upload tickets, bounded uploads, daily inference quota, concurrency control, remote storage adapters, server secret authentication, reviewer code cookie, original upload retry, expanded ignores, deployment documentation. Gateway manifest excludes pre-existing private recordings. Reviewer code holders share demo-created recordings. Seeded product remains independent of Mac availability.

Verification actually run: lint passed; TypeScript passed; production build passed using pnpm (npm executable unavailable); 24 Playwright journeys passed on desktop/mobile; gateway security test passed against isolated fake upstream (authentication, allowlist, hidden private recording, origin rejection, single-use tickets). The new remote production path has not been tested over a public tunnel. No production URL claimed.

Secret-pattern checks on tracked capture files returned no matches. Private storage, model folders and env files are ignored. No private recording was staged. GitHub push, credential creation, CLI installation, tunnel exposure, account login and deployment remain pending approval.
