import type { Metadata } from "next";
import { MeetingList } from "@/components/meeting-list";
import { getAllMeetings } from "@/lib/local-ai/meeting-store";
import { getReadiness } from "@/lib/local-ai/readiness";

export const metadata: Metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";
export default async function MeetingsPage() { const [meetings, readiness] = await Promise.all([getAllMeetings(), getReadiness()]); return <MeetingList meetings={meetings} canRecord={readiness.ready} />; }
