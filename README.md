# 8xCareers Meeting Intelligence

A production-ready, Fathom-inspired meeting intelligence experience built with Next.js App Router, React, TypeScript, Tailwind CSS, reusable shadcn-style primitives, Lucide icons, and date-fns.

## Run locally

```bash
pnpm install
pnpm dev
```

Validation commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Demo data and media

All meetings, people, summaries, transcripts, decisions, action items, and highlights are fictional seeded data. “Product Launch Planning” represents a simulated 62-minute conversation; its timestamps span the simulated meeting and do not claim to match the media.

The native HTML5 player uses MDN’s public `flower.mp4` interactive-example asset, identified by MDN as CC0 media: `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`. It is a short visual sample for demonstrating browser playback controls and is clearly labeled as such in the product UI.

The architecture is Vercel-compatible and uses static generation for seeded meeting detail routes.
