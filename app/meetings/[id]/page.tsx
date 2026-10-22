import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MeetingDetail } from "@/components/meeting-detail";
import { getMeeting, meetings } from "@/lib/meetings";

export function generateStaticParams() { return meetings.map((meeting) => ({ id: meeting.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const meeting = getMeeting((await params).id); return { title: meeting?.title ?? "Meeting" }; }
export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) { const meeting = getMeeting((await params).id); if (!meeting) notFound(); return <MeetingDetail meeting={meeting} />; }
