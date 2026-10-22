export type Participant = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
};

export type TranscriptEntry = {
  id: string;
  speakerId: string;
  startSeconds: number;
  text: string;
};

export type Insight = {
  id: string;
  text: string;
  timestampSeconds: number;
  owner?: string;
};

export type MeetingStatus = "ready" | "processing";

export type Meeting = {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  participants: Participant[];
  summary: string;
  tags: string[];
  status: MeetingStatus;
  source: "Zoom" | "Google Meet" | "Microsoft Teams";
  transcript: TranscriptEntry[];
  decisions: Insight[];
  actionItems: Insight[];
  highlights: Insight[];
};

export type MeetingPreferences = {
  starredIds: string[];
  playbackRates: Record<string, number>;
  lastViewedMeetingId?: string;
};
