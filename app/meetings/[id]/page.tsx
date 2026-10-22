import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MeetingDetail } from "@/components/meeting-detail";
import { meetings } from "@/lib/meetings";
import { getAnyMeeting } from "@/lib/local-ai/meeting-store";

export function generateStaticParams() { return meetings.map((meeting) => ({ id: meeting.id })); }
export const dynamicParams = true;
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const meeting = await getAnyMeeting((await params).id); return { title: meeting?.title ?? "Meeting" }; }
export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) { const meeting = await getAnyMeeting((await params).id); if (!meeting) notFound(); return <MeetingDetail meeting={meeting} />; }
