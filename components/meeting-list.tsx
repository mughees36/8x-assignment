"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, parseISO } from "date-fns";
import { CalendarDays, ChevronRight, Clock3, Filter, Search, Star, Video } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { loadPreferences, savePreferences } from "@/lib/storage";
import { formatDuration, cn } from "@/lib/utils";
import { AvatarStack } from "@/components/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FilterName = "All meetings" | "My meetings" | "Starred";

export function MeetingList({ meetings }: { meetings: Meeting[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterName>("All meetings");
  const [stars, setStars] = useState<string[]>(() => loadPreferences().starredIds);
  const filtered = useMemo(() => meetings.filter((meeting) => {
    const matchesQuery = `${meeting.title} ${meeting.summary} ${meeting.participants.map((p) => p.name).join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter !== "Starred" || stars.includes(meeting.id));
  }), [meetings, query, filter, stars]);

  function toggleStar(id: string) {
    setStars((current) => {
      const updated = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      savePreferences({ ...loadPreferences(), starredIds: updated });
      return updated;
    });
  }

  return <>
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-moss-700"><span className="h-px w-6 bg-moss-500" />YOUR CONVERSATIONS</div><h1 className="text-3xl font-semibold tracking-[-.04em] md:text-4xl">Meetings</h1><p className="mt-2 max-w-xl text-sm text-[#6f7c74]">Catch up in minutes, remember what matters, and keep work moving.</p></div>
      <Button variant="green"><Video size={16} />Record a meeting</Button>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Card className="p-5"><p className="text-xs font-semibold text-[#7b8780]">TIME CAPTURED</p><p className="mt-2 text-2xl font-semibold tracking-tight">7h 49m</p><p className="mt-1 text-xs text-moss-600">↑ 18% this month</p></Card>
      <Card className="p-5"><p className="text-xs font-semibold text-[#7b8780]">ACTION ITEMS</p><p className="mt-2 text-2xl font-semibold tracking-tight">17</p><p className="mt-1 text-xs text-[#7b8780]">Across 10 meetings</p></Card>
      <Card className="relative overflow-hidden p-5"><div className="absolute -right-8 -top-8 size-28 rounded-full bg-moss-50" /><p className="relative text-xs font-semibold text-[#7b8780]">INSIGHT COVERAGE</p><p className="relative mt-2 text-2xl font-semibold tracking-tight">94%</p><p className="relative mt-1 text-xs text-[#7b8780]">Conversations processed</p></Card>
    </div>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#e9eee8] p-1">
        {(["All meetings", "My meetings", "Starred"] as FilterName[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={cn("whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition", filter === item ? "bg-white text-ink shadow-sm" : "text-[#728078]")}>{item}</button>)}
      </div>
      <div className="flex gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2 sm:w-64"><Search size={15} className="shrink-0 text-[#8b968f]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ca69f]" placeholder="Search meetings" /></label><Button variant="outline" size="icon" aria-label="More filters"><Filter size={16} /></Button></div>
    </div>
    <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-card">
      <div className="hidden grid-cols-[minmax(280px,1.7fr)_150px_125px_120px_44px] border-b bg-[#fafcf9] px-5 py-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#8b968f] md:grid"><span>Meeting</span><span>Date</span><span>Duration</span><span>People</span><span /></div>
      {filtered.map((meeting) => <div key={meeting.id} className="group relative border-b p-4 last:border-0 hover:bg-[#fbfdfb] md:grid md:grid-cols-[minmax(280px,1.7fr)_150px_125px_120px_44px] md:items-center md:px-5 md:py-4">
        <Link href={`/meetings/${meeting.id}`} className="absolute inset-0" aria-label={`Open ${meeting.title}`} />
        <div className="min-w-0 pr-10"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold group-hover:text-moss-700">{meeting.title}</span>{isSameDay(parseISO(meeting.date), new Date("2026-10-21T18:00:00Z")) && <Badge className="border-moss-100 bg-moss-50 text-moss-700">Today</Badge>}</div><p className="mt-1 line-clamp-1 text-xs text-[#7c8881]">{meeting.summary}</p><div className="mt-3 flex items-center gap-3 text-[11px] text-[#79867e] md:hidden"><span className="flex items-center gap-1"><CalendarDays size={12} />{format(parseISO(meeting.date), "MMM d")}</span><span className="flex items-center gap-1"><Clock3 size={12} />{formatDuration(meeting.durationSeconds)}</span></div></div>
        <div className="hidden text-xs text-[#617067] md:block"><span className="block font-medium text-ink">{format(parseISO(meeting.date), "MMM d, yyyy")}</span>{format(parseISO(meeting.date), "h:mm a")}</div>
        <div className="hidden items-center gap-1.5 text-xs text-[#617067] md:flex"><Clock3 size={13} />{formatDuration(meeting.durationSeconds)}</div>
        <div className="hidden md:block"><AvatarStack people={meeting.participants} /></div>
        <div className="absolute right-3 top-3 z-10 flex md:static"><button onClick={() => toggleStar(meeting.id)} className="grid size-8 place-items-center rounded-lg text-[#89948d] hover:bg-[#edf2ed]" aria-label={stars.includes(meeting.id) ? "Unstar meeting" : "Star meeting"}><Star size={15} fill={stars.includes(meeting.id) ? "#d99b2b" : "none"} className={stars.includes(meeting.id) ? "text-[#d99b2b]" : ""} /></button><ChevronRight size={16} className="mt-2 hidden text-[#a3aca6] md:block" /></div>
      </div>)}
      {filtered.length === 0 && <div className="py-16 text-center"><Search className="mx-auto text-[#aab3ad]" /><p className="mt-3 text-sm font-semibold">No meetings found</p><p className="mt-1 text-xs text-[#7d8981]">Try a different search or filter.</p></div>}
    </div>
  </>;
}
