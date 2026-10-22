import { GlobalSearch } from "@/components/global-search";
import { getAllMeetings } from "@/lib/local-ai/meeting-store";
export const dynamic = "force-dynamic";
export default async function SearchPage(){return <GlobalSearch meetings={await getAllMeetings()}/>}
