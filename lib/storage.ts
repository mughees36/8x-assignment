import type { MeetingPreferences } from "@/lib/types";

const STORAGE_KEY = "eightx-careers:meeting-preferences:v1";
const defaults: MeetingPreferences = { starredIds: [], playbackRates: {} };

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
