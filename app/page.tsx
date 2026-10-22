import Link from "next/link";
import { ArrowRight, CheckSquare2, Highlighter, Mic, Search, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAllMeetings } from "@/lib/local-ai/meeting-store";
import { getReadiness } from "@/lib/local-ai/readiness";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [meetings, readiness] = await Promise.all([getAllMeetings(), getReadiness()]);
  const recent = meetings.slice(0, 3);
  const cards = [["/meetings", Video, "Review meetings", "Catch up with summaries and transcripts"], ["/search", Search, "Search everything", "Find people, decisions, actions, and moments"], ["/action-items", CheckSquare2, "Move work forward", "Review and complete open commitments"]] as const;
  return <div><p className="text-xs font-semibold text-moss-700">GOOD MORNING</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] md:text-4xl">Turn conversations into momentum.</h1>
    <div className="flex flex-wrap items-end justify-between gap-4"><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68766d]">Review recent meetings, find a decision, or move an action item forward.</p>{readiness.ready ? <Link href="/meetings/new" className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white"><Mic size={15}/>Start AI Meeting</Link> : <span className="text-xs text-[#7a867f]">Local AI recording is unavailable on this server.</span>}</div>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{cards.map(([href, Icon, title, description]) => <Link key={href} href={href}><Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-[#b9d3c0]"><Icon size={19} className="text-moss-700"/><h2 className="mt-5 text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-[#77837b]">{description}</p><ArrowRight size={15} className="mt-5 text-moss-700"/></Card></Link>)}</div>
    <div className="mt-10 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent meetings</h2><Link href="/meetings" className="text-xs font-semibold text-moss-700">View all →</Link></div>
    <div className="mt-3 grid gap-3">{recent.map((meeting) => <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card hover:border-[#bdd4c3]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-700"><Highlighter size={17}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{meeting.title}</strong><span className="mt-1 block truncate text-xs text-[#7a867f]">{meeting.summary}</span></span><ArrowRight size={15}/></Link>)}</div>
  </div>;
}
