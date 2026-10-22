import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Highlighter } from "lucide-react";
import { meetings } from "@/lib/meetings";
import { formatTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function InsightIndex({ type }: { type: "highlights" | "actions" }) {
  const isActions = type === "actions";
  const items = meetings.flatMap((meeting) => (isActions ? meeting.actionItems : meeting.highlights).map((insight) => ({ meeting, insight })));
  return <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-moss-700"><span className="h-px w-6 bg-moss-500" />SHARED INTELLIGENCE</div><h1 className="text-3xl font-semibold tracking-[-.04em]">{isActions ? "Action items" : "Highlights"}</h1><p className="mt-2 text-sm text-[#6f7c74]">{isActions ? "Every commitment, gathered in one place." : "Important moments from across your conversations."}</p><div className="mt-8 grid gap-3 lg:grid-cols-2">{items.map(({ meeting, insight }) => <Card key={`${meeting.id}-${insight.id}`} className="group p-5 hover:border-[#bed5c4]"><div className="flex items-start gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${isActions ? "bg-[#edf3fb] text-[#40679a]" : "bg-[#fff7e4] text-[#956b18]"}`}>{isActions ? <CheckCircle2 size={17} /> : <Highlighter size={17} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-6">{insight.text}</p>{insight.owner && <Badge className="mt-2">{insight.owner}</Badge>}<Link href={`/meetings/${meeting.id}`} className="mt-4 flex items-center justify-between border-t pt-3 text-[11px] text-[#7b8780]"><span className="truncate pr-3">{meeting.title} · {formatTimestamp(insight.timestampSeconds)}</span><ArrowUpRight size={13} className="group-hover:text-moss-600" /></Link></div></div></Card>)}</div></div>;
}
