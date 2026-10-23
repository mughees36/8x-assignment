# 8xCareers Meeting Intelligence

A Fathom-inspired Next.js 15 app for browser recording, local Whisper/Ollama processing, grounded meeting Q&A, and explicit read-only sharing. Ten deterministic fictional meetings remain usable without local AI.

## Features and architecture

- Searchable meetings, summaries, transcripts, actions, highlights, playback, responsive navigation, and stable seeded shares.
- Explicit microphone recording followed by FFmpeg conversion, `whisper.cpp` transcription, Ollama structured extraction, progress/failure state, and retry.
- **Ask this meeting** for local recordings. The browser calls this app only; the server reloads the saved transcript, calls loopback Ollama with a JSON schema, validates with Zod, and resolves 1–5 citations to real saved segments. Unsupported questions return a fixed no-evidence answer.
- Local recordings are private by default. Pressing **Create public link** creates a 256-bit random, path-safe token and an immutable snapshot under `.data/shares`. A raw local meeting ID never resolves publicly. Token-backed public audio supports validated byte ranges and works without `localStorage`.
- Clip URLs validate bounds against duration, seek to the start, stop at the end, and show transcript context.

Next.js server routes own filesystem/native/AI access. The browser never receives a filesystem path or calls Ollama. Seeded data lives in `lib/meetings.ts`; local state lives under ignored `.data`.

## Setup and installed defaults

Use Node.js 20+ and pnpm. Local intelligence also needs tools/models installed separately; this repository does not install or download them.

| Environment variable | Installed default |
| --- | --- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` (loopback required) |
| `OLLAMA_MODEL` | `llama3.2:3b` |
| `OLLAMA_ASK_TIMEOUT_MS` | `30000` |
| `FFMPEG_PATH` | `/opt/homebrew/bin/ffmpeg` |
| `WHISPER_CLI_PATH` | `/opt/homebrew/bin/whisper-cli` |
| `WHISPER_MODEL_PATH` | `.local-ai/models/ggml-small.en.bin` |

```bash
pnpm install
pnpm dev
```

Start Ollama and ensure the configured model is present. Open `http://localhost:3000`, choose **New meeting**, enter a title, explicitly grant microphone permission, and start. Ending uploads the encoded audio and begins processing. Permission is never requested on load.

Pipeline: `MediaRecorder` → `.data/recordings/{id}/original.media` → FFmpeg 16 kHz mono WAV → whisper.cpp timestamped JSON → Ollama schema-constrained intelligence → `.data/meetings/{id}.json`. The seekable WAV derivative powers private and shared playback; the original browser encoding remains available for retry/reprocessing. Jobs live in `.data/jobs`. JSON uses a synced temporary file and atomic rename. Silence, permissions, codecs, and unavailable tools produce honest failures.

Sharing stores `.data/shares/{token}.json`; the snapshot does not change if the private meeting changes. Possession of the URL grants access: this demo has no authentication or expiry. Storage supports revocation, but no management UI/API is exposed. Private/public media endpoints accept one full, open, or suffix Range and return `416` for malformed/unsatisfiable ranges.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

Playwright covers seeded desktop/mobile workflows, recording lifecycle, private-by-default routing, explicit share creation, fresh-context access, clip boundaries, grounded Q&A citations, empty questions, and unavailable AI. Media events are synthetic in tests; they do not prove physical microphone capture.

## Deployment, privacy, and limits

Seeded features can run on a normal Node host. Local processing requires a trusted single-machine server, persistent writable storage, native processes, loopback Ollama, and installed models. Typical serverless hosting has ephemeral storage and cannot reach a user laptop’s Ollama, so local processing/sharing is not production-deployable there as written. Back up `.data` before migration. To invalidate a link today, remove only its matching `.data/shares/{token}.json` while stopped.

Strong prototype foundations include server-only AI, loopback enforcement, bounded inputs, Zod schemas, safe IDs/tokens, atomic metadata, evidence-resolved citations, and hardened Range behavior. Demo-only tradeoffs include no auth/tenants, bearer links without expiry, local filesystem storage, no durable queue/locking/monitoring, one generic speaker, no long-transcript retrieval, and no transcript virtualization. Physical microphone and public deployment tests were not run for this milestone.

See [docs/product-decisions.md](docs/product-decisions.md).
