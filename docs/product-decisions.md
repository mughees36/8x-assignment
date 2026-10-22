# Product decisions

## Prioritization

The assignment prioritizes the post-meeting loop: find a conversation, understand what happened, return to evidence, and move commitments forward. That makes search, transcript navigation, multiple summary lenses, persistent actions, personal highlights, and trustworthy sharing higher-value than broad settings or decorative dashboard modules. Accessibility and responsive behavior are treated as product requirements, not cleanup work.

## Why recording infrastructure is excluded

Real recording requires calendar and conferencing integrations, consent UX, durable media storage, ingestion queues, transcription, speaker diarization, retry behavior, security controls, retention policy, and operational monitoring. A superficial implementation would create misleading product claims while contributing little to evaluation of the core workflow. This prototype therefore starts after ingestion, uses explicit fictional data, and labels the short sample media honestly.

## Long meeting handling

Long conversations need fast movement between compressed understanding and primary evidence. The product provides summary templates, extracted decisions and actions, full-text transcript search, timestamp links, and optional transcript auto-scroll. Transcript panels have a bounded height so the page remains navigable. At production scale, transcript virtualization, server-side indexed search, chapter generation, and progressive loading would keep multi-hour meetings responsive.

The simulated meeting timeline is intentionally preserved even though the sample video is much shorter. Seeking occurs only when a timestamp exists in the actual media; otherwise the transcript scrolls and the interface explains why playback did not move. Public clip views show nearby transcript context when a short media range contains no simulated transcript line.

## Future work

1. Add authenticated workspaces, role-based access, and revocable share links.
2. Replace seeded data with an ingestion pipeline and durable database.
3. Add collaborative action assignment, reminders, comments, and audit history.
4. Index transcripts for typo-tolerant search, ranking, and saved queries.
5. Virtualize long transcripts and generate semantic chapters.
6. Store clips as share records with expiry, permissions, and analytics.
7. Add tested captions, downloadable transcripts, and richer screen-reader announcements.
8. Add visual regression and accessibility automation alongside behavioral e2e coverage.
