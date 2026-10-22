"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare2, ChevronDown, FileText, Highlighter, Library, Search, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/meetings", label: "Meetings", icon: Library },
  { href: "/highlights", label: "Highlights", icon: Highlighter },
  { href: "/action-items", label: "Action items", icon: CheckSquare2 },
];

function Logo() {
  return <Link href="/meetings" className="flex items-center gap-2.5" aria-label="Eightfold home">
    <span className="grid size-8 place-items-center rounded-[10px] bg-ink text-white shadow-sm"><Sparkles size={16} /></span>
    <span className="font-semibold tracking-[-.02em]">eightfold<span className="text-moss-600">.</span></span>
  </Link>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r bg-[#f8faf7] px-4 py-5 lg:flex">
      <div className="px-2"><Logo /></div>
      <button className="mt-7 flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm">
        <span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#deeee3] text-xs font-bold text-moss-700">8x</span><span><span className="block text-xs font-semibold">8xCareers</span><span className="block text-[10px] text-[#7a867f]">Team workspace</span></span></span><ChevronDown size={14} className="text-[#849087]" />
      </button>
      <nav className="mt-5 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => { const active = pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active ? "bg-[#e8f2ea] text-[#1f6842]" : "text-[#647168] hover:bg-[#eef2ed] hover:text-ink")}><Icon size={17} />{label}</Link>; })}
      </nav>
      <div className="mt-7 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">Workspace</div>
      <nav className="mt-2 space-y-1">
        <Link href="/templates" className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", pathname.startsWith("/templates") ? "bg-[#e8f2ea] text-[#1f6842]" : "text-[#647168] hover:bg-[#eef2ed]")}><FileText size={17} />Templates</Link>
        <Link href="/settings" className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", pathname.startsWith("/settings") ? "bg-[#e8f2ea] text-[#1f6842]" : "text-[#647168] hover:bg-[#eef2ed]")}><Settings size={17} />Settings</Link>
      </nav>
      <div className="mt-auto rounded-2xl bg-ink p-4 text-white noise"><p className="text-xs font-semibold">7-day insight streak</p><p className="mt-1 text-[11px] leading-relaxed text-white/60">Your team captured 24 key moments this week.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-3/4 rounded-full bg-[#62d28f]" /></div></div>
      <div className="mt-4 flex items-center gap-2 border-t pt-4"><span className="grid size-8 place-items-center rounded-full bg-[#dde8df] text-[10px] font-bold text-[#2d6042]">MM</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">Mughees Mustafa</span><span className="block truncate text-[10px] text-[#7a867f]">Workspace admin</span></span><ChevronDown size={14} /></div>
    </aside>
    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-xl md:px-7 lg:px-9">
        <div className="lg:hidden"><Logo /></div>
        <button className="hidden w-[320px] items-center gap-2 rounded-xl border bg-[#f8faf7] px-3 py-2 text-sm text-[#7c8981] lg:flex"><Search size={15} />Search meetings, people, topics<span className="ml-auto rounded border bg-white px-1.5 py-0.5 text-[10px]">⌘ K</span></button>
        <div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full bg-moss-50 px-3 py-1.5 text-xs font-semibold text-moss-700 sm:flex"><span className="size-1.5 rounded-full bg-moss-500" />Recorder ready</span><Link href="/meetings" className="grid size-9 place-items-center rounded-xl border bg-white text-[#657269] lg:hidden"><Search size={16} /></Link></div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-7 md:px-7 lg:px-9 lg:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t bg-white/95 px-3 backdrop-blur lg:hidden">
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex min-w-20 flex-col items-center gap-1 text-[10px] font-semibold", pathname.startsWith(href) ? "text-moss-700" : "text-[#7d8981]")}><Icon size={19} />{label}</Link>)}
      </nav>
    </div>
  </div>;
}
