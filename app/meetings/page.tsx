import type { Metadata } from "next";
import { MeetingList } from "@/components/meeting-list";
import { meetings } from "@/lib/meetings";

export const metadata: Metadata = { title: "Meetings" };
export default function MeetingsPage() { return <MeetingList meetings={meetings} />; }
