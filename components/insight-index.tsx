"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Circle, Highlighter, Trash2 } from "lucide-react";
import { meetings } from "@/lib/meetings";
import { actionKey, loadCompletedActions, loadUserHighlights, saveCompletedActions, saveUserHighlights } from "@/lib/storage";
import { formatTimestamp } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function InsightIndex({ type }: { type: "highlights" | "actions" }) {
  const actions = type === "actions";
  const [completed, setCompleted] = useState<string[]>([]);
  const [users, setUsers] = useState<ReturnType<typeof loadUserHighlights>>([]);
  const [filter, setFilter] = useState<"pending" | "completed">("pending");

  useEffect(() => {
    setCompleted(loadCompletedActions());
    setUsers(loadUserHighlights());
  }, []);

  const toggle = (key: string) => setCompleted((current) => {
    const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    saveCompletedActions(next);
    return next;
  });
  const seeded = meetings.flatMap((meeting) => (actions ? meeting.actionItems : meeting.highlights).map((insight) => ({ meeting, insight, key: actionKey(meeting.id, insight.id) })));
  const visible = actions ? seeded.filter((item) => completed.includes(item.key) === (filter === "completed")) : seeded;

  function remove(id: string) {
    const next = loadUserHighlights().filter((item) => item.id !== id);
    saveUserHighlights(next);
    setUsers(next);
  }

  return <div>
    <p className="text-xs font-semibold text-moss-700">SHARED INTELLIGENCE</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">{actions ? "Action items" : "Highlights"}</h1>
    <p className="mt-2 text-sm text-[#6f7c74]">{actions ? "Every commitment, with owner, due date, and status shared across meeting views." : "Seeded insights and moments you captured yourself."}</p>
    {actions && <div className="mt-6 inline-flex rounded-xl bg-[#e9eee8] p-1" aria-label="Action status filter">{(["pending", "completed"] as const).map((status) => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter === status ? "bg-white shadow-sm" : ""}`}>{status}</button>)}</div>}

    {!actions && users.length > 0 && <><h2 className="mt-8 text-sm font-semibold">Your highlights</h2><div className="mt-3 grid gap-3 lg:grid-cols-2">{users.map((highlight) => {
      const meeting = meetings.find((item) => item.id === highlight.meetingId);
      return <Card key={highlight.id} className="flex items-start gap-3 p-4"><Highlighter aria-hidden="true" size={17} className="mt-1 shrink-0 text-[#956b18]"/><Link href={`/meetings/${highlight.meetingId}?t=${highlight.timestampSeconds}`} className="min-w-0 flex-1"><strong className="block text-sm">{highlight.title}</strong><span className="mt-1 block text-xs text-[#7b8780]">{meeting?.title} · {formatTimestamp(highlight.timestampSeconds)}</span></Link><button aria-label={`Delete ${highlight.title}`} onClick={() => remove(highlight.id)}><Trash2 size={14}/></button></Card>;
    })}</div></>}

    <h2 className="mt-8 text-sm font-semibold">{actions ? (filter === "pending" ? "Pending" : "Completed") : "Suggested highlights"}</h2>
    <div className="mt-3 grid gap-3 lg:grid-cols-2">{visible.map(({ meeting, insight, key }) => <Card key={key} className="flex items-start gap-3 p-4">
      {actions ? <button onClick={() => toggle(key)} aria-label={`${completed.includes(key) ? "Mark pending" : "Mark complete"}: ${insight.text}`}>{completed.includes(key) ? <CheckCircle2 size={18} className="text-moss-600"/> : <Circle size={18}/>}</button> : <Highlighter aria-hidden="true" size={17} className="text-[#956b18]"/>}
      <Link href={`/meetings/${meeting.id}?t=${insight.timestampSeconds}`} className="min-w-0 flex-1"><p className={`text-sm leading-6 ${completed.includes(key) ? "text-[#89948d] line-through" : ""}`}>{insight.text}</p><span className="mt-2 block text-xs text-[#7b8780]">{meeting.title} · {actions && insight.owner ? `${insight.owner} · ` : ""}{actions && insight.dueDate ? `Due ${format(parseISO(insight.dueDate), "MMM d, yyyy")} · ` : ""}{formatTimestamp(insight.timestampSeconds)}</span></Link>
    </Card>)}{visible.length === 0 && <p role="status" className="col-span-full rounded-2xl border bg-white py-12 text-center text-sm text-[#7b8780]">No {filter} action items.</p>}</div>
  </div>;
}
