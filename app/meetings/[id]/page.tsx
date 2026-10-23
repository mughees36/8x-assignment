import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MeetingDetail } from "@/components/meeting-detail";
import { getAnyMeeting } from "@/lib/local-ai/meeting-store";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const meeting = await getAnyMeeting((await params).id); return { title: meeting?.title ?? "Meeting" }; }
export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) { const meeting = await getAnyMeeting((await params).id); if (!meeting) notFound(); return <MeetingDetail meeting={meeting} />; }
