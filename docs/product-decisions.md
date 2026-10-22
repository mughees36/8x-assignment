# Product and architecture decisions

## Trust model

Seeded meetings are deterministic demo fixtures with stable public URLs. Recorded meetings are private server files addressed by validated local IDs. Public local shares are explicit, immutable snapshots addressed only by a random 256-bit bearer token. Opening a meeting or share dialog writes nothing; **Create public link** performs the privacy transition. Public audio first validates the token/snapshot before locating media. Tokens are fixed-length base64url and JSON writes use mode `0600`, sync, and atomic rename.

There is no share expiry/authentication. Storage-level revocation exists, but the current UI does not expose it. A production build needs authenticated share management, audit history, expiry, and authorization on every private meeting route.

## Local processing and Q&A boundary

Native dependencies and Ollama run with the Next.js server on one trusted host. The browser records/uploads media but never contacts Ollama, reads paths, or executes tools. Ollama must be loopback. Stable API errors prevent process output, internal exceptions, and paths crossing the boundary.

Processing retains original media, converts a WAV, transcribes timestamped segments, requests schema-constrained intelligence, validates it, and atomically publishes the meeting. Failures preserve stage/media for retry. There is no distributed queue, lock, quota, retention worker, or malware scanning.

Q&A reloads the persisted transcript instead of accepting browser evidence. Questions are 1–500 trimmed characters; temperature is zero; output must match `{answer, sourceIndexes}`. An answer is surfaced only with indexes that resolve to real transcript segments, and the API returns server-derived timestamp/text citations. Empty evidence is replaced with fixed no-evidence copy. This structurally grounds citations but does not prove sentence-level entailment. Production needs retrieval/chunking, injection defenses, rate limits, observability, and evals.

## Media, clips, and recovery

Private and public audio have separate endpoints and a shared single-range parser. Valid normal/open/suffix ranges return `200`/`206`; malformed, multi-range, empty, and unsatisfiable requests return `416`. Paths never appear in responses.

Clip bounds must be finite, ordered, nonnegative, and within snapshot duration. The client seeks at metadata load, restarts at the start if needed, and pauses at the end. Seeded media retains its disclosure because its simulated timeline exceeds the short CC0 sample.

Microphone permission follows a named user action; the live room never fabricates interim text. Q&A offers keyboard submit, examples, loading, empty/unavailable/timeout/invalid-output states, and citation buttons that open transcript evidence. If readiness fails, correct the dependency and retry; if speech is absent, fail rather than invent content.

## Production boundary

The UI, validation, atomic metadata, and privacy routing are strong prototype foundations. Production requires authenticated tenants, durable object/database storage, encryption/key management, consent/retention policy, idempotent workers, diarization, share management, abuse controls, backups, metrics, and deployment-specific AI infrastructure. Serverless platforms generally cannot persist `.data` or reach an end user’s loopback Ollama.

Automated checks use synthetic fixture files and mocked AI responses. They do not claim physical microphone testing, real Whisper/Ollama quality evaluation, a codec matrix, or public deployment validation.
