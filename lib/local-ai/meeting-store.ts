import "server-only";
import { meetings as seededMeetings } from "@/lib/meetings";
import { assertSafeId, getLocalMeeting, listLocalMeetings } from "@/lib/local-ai/persistence";

function withPlaybackVersion<T extends { origin?: string; mediaUrl: string }>(meeting: T): T {
  if (meeting.origin !== "local-recording") return meeting;
  const separator = meeting.mediaUrl.includes("?") ? "&" : "?";
  return { ...meeting, mediaUrl: `${meeting.mediaUrl}${separator}playback=wav-v1` };
}

export async function getAllMeetings() {
  const local = await listLocalMeetings();
  return [...local.sort((a, b) => +new Date(b.date) - +new Date(a.date)).map(withPlaybackVersion), ...seededMeetings];
}

export async function getAnyMeeting(id: string) {
  const seeded = seededMeetings.find((meeting) => meeting.id === id);
  if (seeded) return seeded;
  try { const meeting = await getLocalMeeting(assertSafeId(id)); return meeting ? withPlaybackVersion(meeting) : undefined; } catch { return undefined; }
}
