import type { Metadata } from "next";
import { LiveMeetingRoom } from "@/components/live-meeting-room";
export const metadata: Metadata = { title: "Live AI Meeting" };
export default async function LiveMeetingPage({ params }: { params: Promise<{ id: string }> }) { return <LiveMeetingRoom sessionId={(await params).id}/>; }
