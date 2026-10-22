import { InsightIndex } from "@/components/insight-index";
import { getAllMeetings } from "@/lib/local-ai/meeting-store";
export const dynamic = "force-dynamic";
export default async function HighlightsPage() { return <InsightIndex type="highlights" meetings={await getAllMeetings()} />; }
