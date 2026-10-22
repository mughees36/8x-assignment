import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <div className="grid min-h-[65vh] place-items-center text-center"><div><p className="text-xs font-bold text-moss-600">404</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">That meeting isn’t here</h1><p className="mt-2 text-sm text-[#728078]">It may have moved or you may not have access.</p><Button asChild className="mt-6"><Link href="/meetings">Return to meetings</Link></Button></div></div>; }
