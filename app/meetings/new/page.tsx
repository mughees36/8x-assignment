import type { Metadata } from "next";
import { NewMeetingSetup } from "@/components/new-meeting-setup";
export const metadata: Metadata = { title: "Start AI Meeting", description: "Record and process a meeting privately with local AI." };
export default function NewMeetingPage() { return <NewMeetingSetup/>; }
