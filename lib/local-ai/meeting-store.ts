import "server-only";
import { meetings as seededMeetings } from "@/lib/meetings";
import { assertSafeId, getLocalMeeting, listLocalMeetings } from "@/lib/local-ai/persistence";

export async function getAllMeetings() {
  const local = await listLocalMeetings();
  return [...local.sort((a, b) => +new Date(b.date) - +new Date(a.date)), ...seededMeetings];
}

export async function getAnyMeeting(id: string) {
  const seeded = seededMeetings.find((meeting) => meeting.id === id);
  if (seeded) return seeded;
  try { return await getLocalMeeting(assertSafeId(id)); } catch { return undefined; }
}
