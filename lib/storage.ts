import type { MeetingPreferences, UserHighlight } from "@/lib/types";

const STORAGE_KEY = "eightx-careers:meeting-preferences:v1";
const defaults: MeetingPreferences = { starredIds: [], playbackRates: {} };
const ACTIONS_KEY = "eightx-careers:completed-actions:v1";
const HIGHLIGHTS_KEY = "eightx-careers:user-highlights:v1";

export function loadPreferences(): MeetingPreferences {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export function savePreferences(preferences: MeetingPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function loadCompletedActions(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ACTIONS_KEY) ?? "[]"); } catch { return []; }
}
export function saveCompletedActions(ids: string[]) { if (typeof window !== "undefined") localStorage.setItem(ACTIONS_KEY, JSON.stringify(ids)); }
export function actionKey(meetingId: string, actionId: string) { return `${meetingId}:${actionId}`; }

export function loadUserHighlights(): UserHighlight[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) ?? "[]"); } catch { return []; }
}
export function saveUserHighlights(items: UserHighlight[]) { if (typeof window !== "undefined") localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(items)); }
