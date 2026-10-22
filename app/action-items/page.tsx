import { InsightIndex } from "@/components/insight-index";
import { getAllMeetings } from "@/lib/local-ai/meeting-store";
export const dynamic = "force-dynamic";
export default async function ActionItemsPage() { return <InsightIndex type="actions" meetings={await getAllMeetings()} />; }
