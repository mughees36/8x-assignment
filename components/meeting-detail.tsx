"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Check, ChevronDown, Clipboard, Clock3, Download, ExternalLink, Highlighter, ListChecks, MoreHorizontal, Search, Share2, Sparkles } from "lucide-react";
import type { Insight, Meeting } from "@/lib/types";
import { formatDuration, formatTimestamp, cn } from "@/lib/utils";
import { AvatarStack } from "@/components/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Tab = "Summary" | "Transcript";

export function MeetingDetail({ meeting }: { meeting: Meeting }) {
  const [tab, setTab] = useState<Tab>("Summary");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTranscriptId, setActiveTranscriptId] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const people = useMemo(() => new Map(meeting.participants.map((person) => [person.id, person])), [meeting.participants]);
  const filteredTranscript = meeting.transcript.filter((entry) => `${people.get(entry.speakerId)?.name} ${entry.text}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!activeTranscriptId) return;
    document.getElementById(activeTranscriptId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTranscriptId]);

  function jumpTo(timestamp: number, id?: string) {
    setTab("Transcript");
    if (id) setActiveTranscriptId(id);
    // The source clip is a lawful short demo asset; modulo keeps seeking playable while transcript timestamps remain honest.
    if (videoRef.current?.duration) videoRef.current.currentTime = timestamp % videoRef.current.duration;
    videoRef.current?.play().catch(() => undefined);
  }

  async function copySummary() {
    await navigator.clipboard.writeText(meeting.summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/meetings" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6f7c74] hover:text-ink"><ArrowLeft size={15} />Back to meetings</Link>
      <div className="flex gap-2"><Button variant="outline" size="sm"><Download size={14} />Export</Button><Button variant="default" size="sm"><Share2 size={14} />Share</Button><Button variant="outline" size="icon" className="size-8"><MoreHorizontal size={15} /></Button></div>
    </div>
    <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><div className="flex flex-wrap items-center gap-2">{meeting.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div><h1 className="mt-3 text-2xl font-semibold tracking-[-.035em] md:text-3xl">{meeting.title}</h1><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6e7b73]"><span>{format(parseISO(meeting.date), "EEEE, MMMM d · h:mm a")}</span><span className="flex items-center gap-1"><Clock3 size={13} />{formatDuration(meeting.durationSeconds)} simulated meeting</span><span>{meeting.source}</span></div></div>
      <div className="flex items-center gap-3"><AvatarStack people={meeting.participants} max={6} /><span className="text-xs font-medium text-[#65736b]">{meeting.participants.length} participants</span></div>
    </div>
    <div className="mt-7 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.85fr)]">
      <div className="min-w-0 space-y-5">
        <Card className="overflow-hidden bg-[#17211b]">
          <div className="relative aspect-video min-h-[220px] bg-[radial-gradient(circle_at_75%_10%,#42634e,#17211b_52%)]">
            <video ref={videoRef} controls preload="metadata" className="h-full w-full object-cover" poster="/video-poster.svg"><source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />Your browser does not support HTML5 video.</video>
          </div>
          <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between"><span><strong className="text-white/85">Sample media:</strong> short CC0 flower clip hosted by MDN</span><a href="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/80 hover:text-white">View source <ExternalLink size={11} /></a></div>
        </Card>
        <div className="rounded-xl border border-[#d9e7dc] bg-[#f3faf5] px-4 py-3 text-xs leading-relaxed text-[#496052]"><strong>Duration note:</strong> This is a simulated 62-minute meeting record. The playable CC0 sample clip is intentionally much shorter and is provided only to demonstrate native HTML5 media controls. Transcript timestamps describe the simulated meeting timeline.</div>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-5"><div className="flex gap-5">{(["Summary", "Transcript"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={cn("border-b-2 py-4 text-sm font-semibold", tab === item ? "border-moss-600 text-moss-700" : "border-transparent text-[#7a867f]")}>{item}</button>)}</div>{tab === "Transcript" && <label className="hidden items-center gap-2 rounded-lg bg-[#f3f6f2] px-2.5 py-1.5 sm:flex"><Search size={13} className="text-[#88938c]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transcript" className="w-32 bg-transparent text-xs outline-none" /></label>}</div>
          {tab === "Summary" ? <div className="p-5 md:p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-moss-600" />AI summary</h2><button onClick={copySummary} className="flex items-center gap-1.5 text-xs font-semibold text-[#758179] hover:text-ink">{copied ? <Check size={13} /> : <Clipboard size={13} />}{copied ? "Copied" : "Copy"}</button></div><p className="mt-4 text-sm leading-7 text-[#4d5b52]">{meeting.summary}</p><div className="mt-6 border-t pt-5"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#8a958e]">Conversation themes</p><div className="mt-3 flex flex-wrap gap-2">{meeting.tags.concat(["Launch readiness", "Customer value"]).map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div></div> : <div className="max-h-[660px] overflow-y-auto p-3 scrollbar-thin sm:p-5"><label className="mb-3 flex items-center gap-2 rounded-lg bg-[#f3f6f2] px-3 py-2 sm:hidden"><Search size={13} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transcript" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>{filteredTranscript.map((entry) => { const person = people.get(entry.speakerId); return <button id={entry.id} key={entry.id} onClick={() => jumpTo(entry.startSeconds, entry.id)} className={cn("group flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-[#f4f8f3]", activeTranscriptId === entry.id && "bg-moss-50 ring-1 ring-moss-100")}><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: person?.color }}>{person?.initials}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="text-xs">{person?.name}</strong><span className="text-[10px] text-[#929c96]">{formatTimestamp(entry.startSeconds)}</span></span><span className="mt-1 block text-sm leading-6 text-[#536158]">{entry.text}</span></span></button>; })}</div>}
        </Card>
      </div>
      <aside className="min-w-0 space-y-4">
        <InsightCard title="Decisions" icon={<Check size={15} />} tone="green" insights={meeting.decisions} onJump={jumpTo} />
        <InsightCard title="Action items" icon={<ListChecks size={15} />} tone="blue" insights={meeting.actionItems} onJump={jumpTo} />
        <InsightCard title="Key highlights" icon={<Highlighter size={15} />} tone="gold" insights={meeting.highlights} onJump={jumpTo} />
        <Card className="p-4"><button className="flex w-full items-center justify-between text-left"><span><span className="block text-xs font-semibold">Talk-time balance</span><span className="mt-1 block text-[11px] text-[#849087]">8 speakers detected</span></span><ChevronDown size={15} /></button><div className="mt-4 flex h-2 overflow-hidden rounded-full">{meeting.participants.map((person, index) => <span key={person.id} className="h-full" style={{ width: `${[19,17,15,13,12,10,8,6][index] ?? 5}%`, backgroundColor: person.color }} />)}</div></Card>
      </aside>
    </div>
  </div>;
}

function InsightCard({ title, icon, tone, insights, onJump }: { title: string; icon: React.ReactNode; tone: "green" | "blue" | "gold"; insights: Insight[]; onJump: (time: number) => void }) {
  const colors = { green: "bg-moss-50 text-moss-700", blue: "bg-[#edf3fb] text-[#40679a]", gold: "bg-[#fff7e4] text-[#956b18]" };
  return <Card className="overflow-hidden"><div className="flex items-center gap-2 border-b px-4 py-3.5"><span className={cn("grid size-7 place-items-center rounded-lg", colors[tone])}>{icon}</span><h2 className="text-sm font-semibold">{title}</h2><Badge className="ml-auto">{insights.length}</Badge></div><div className="divide-y">{insights.map((insight) => <button key={insight.id} onClick={() => onJump(insight.timestampSeconds)} className="block w-full px-4 py-3.5 text-left hover:bg-[#fafcfa]"><span className="block text-xs leading-5 text-[#46544b]">{insight.text}</span><span className="mt-2 flex items-center justify-between text-[10px] text-[#8a958e]">{insight.owner ? <strong className="font-semibold text-[#68766d]">{insight.owner}</strong> : <span />}<span>{formatTimestamp(insight.timestampSeconds)}</span></span></button>)}</div></Card>;
}
