"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

export function PublicShare({ meeting, start, end, title }: { meeting: Meeting; start?: number; end?: number; title?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const isClip = start !== undefined || end !== undefined;
  const validClip = start !== undefined && end !== undefined && start >= 0 && start < duration && end > start && end <= duration;

  useEffect(() => {
    if (video.current && validClip && start !== undefined) video.current.currentTime = start;
  }, [start, validClip]);

  const transcript = useMemo(() => {
    if (!isClip) return meeting.transcript;
    const lower = start ?? 0;
    const upper = end ?? lower;
    const withinRange = meeting.transcript.filter((entry) => entry.startSeconds >= lower && entry.startSeconds <= upper);
    if (withinRange.length) return withinRange;
    return [...meeting.transcript]
      .sort((a, b) => Math.abs(a.startSeconds - lower) - Math.abs(b.startSeconds - lower))
      .slice(0, 3)
      .sort((a, b) => a.startSeconds - b.startSeconds);
  }, [end, isClip, meeting.transcript, start]);

  const people = useMemo(() => new Map(meeting.participants.map((person) => [person.id, person])), [meeting.participants]);
  const hasTranscriptInClip = isClip && meeting.transcript.some((entry) => entry.startSeconds >= (start ?? 0) && entry.startSeconds <= (end ?? start ?? 0));

  return <div className="min-h-screen bg-[#f5f7f3]">
    <header className="border-b bg-white px-5 py-4"><div className="mx-auto flex max-w-5xl items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-[10px] bg-ink text-white"><Sparkles aria-hidden="true" size={16}/></span>eightfold<span className="text-moss-600">.</span><span className="ml-auto text-xs font-normal text-[#748078]">Public shared view</span></div></header>
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-moss-700">{isClip ? "Shared clip" : "Shared meeting"}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title || meeting.title}</h1>
      {title && <p className="mt-2 text-sm text-[#718077]">From {meeting.title}</p>}
      <div className="mt-6 overflow-hidden rounded-2xl bg-ink"><video aria-label={`${meeting.title} sample media`} ref={video} controls src={meeting.mediaUrl} poster="/video-poster.svg" className="aspect-video w-full" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => { if (validClip && end !== undefined && event.currentTarget.currentTime >= end) { event.currentTarget.pause(); event.currentTarget.currentTime = end; } }}/></div>
      <div className="mt-3 rounded-xl border border-[#d9e7dc] bg-[#f3faf5] p-3 text-xs leading-relaxed text-[#496052]"><strong>Demo media:</strong> This short sample video demonstrates player and clip controls. Transcript times belong to the simulated {formatTimestamp(meeting.durationSeconds)} meeting and may extend beyond the actual media.</div>
      {isClip && duration > 0 && !validClip && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">This clip range is incomplete or outside the available sample media ({formatTimestamp(Math.floor(duration))}). The player was not automatically seeked.</p>}
      <section className="mt-7 rounded-2xl border bg-white p-5" aria-labelledby="public-summary"><h2 id="public-summary" className="text-sm font-semibold">Summary</h2><p className="mt-3 text-sm leading-7 text-[#526057]">{meeting.summary}</p></section>
      <section className="mt-5 overflow-hidden rounded-2xl border bg-white" aria-labelledby="public-transcript"><div className="border-b px-5 py-4"><h2 id="public-transcript" className="text-sm font-semibold">{isClip ? "Transcript context" : "Meeting transcript"}</h2>{isClip && !hasTranscriptInClip && <p className="mt-1 text-xs text-[#718077]">No simulated transcript line falls inside this short media range. Showing the nearest meeting context instead.</p>}</div>{transcript.length ? transcript.map((entry) => <div key={entry.id} className="border-b px-5 py-4 last:border-0"><span className="text-[10px] font-semibold text-moss-700">{people.get(entry.speakerId)?.name ?? "Speaker"} · simulated {formatTimestamp(entry.startSeconds)}</span><p className="mt-1 text-sm leading-6 text-[#526057]">{entry.text}</p></div>) : <p className="p-8 text-center text-sm text-[#7b8780]">No transcript is available for this meeting.</p>}</section>
    </main>
  </div>;
}
