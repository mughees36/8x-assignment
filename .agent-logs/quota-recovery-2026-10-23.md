# AI demo quota recovery — 2026-10-23

The shared gateway's original daily limit counted recording jobs, retries, and meeting questions together. Six requests exhausted the allowance while the AI host remained healthy. The private local gateway configuration was raised to 20 recording jobs per UTC day without changing or publishing credentials.

This milestone separates recording and question quotas, retains existing usage on upgrade, makes the upload retry action explicit while the browser tab still holds the recording, and adds gateway and desktop/mobile browser regression tests. No private recordings, transcripts, secrets, or model files are included in this log.
