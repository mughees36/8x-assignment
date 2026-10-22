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
  dueDate?: string;
  supportingTranscript?: string;
};

export type MeetingStatus = "ready" | "processing";
export type MeetingOrigin = "seeded" | "local-recording";

export type Meeting = {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  participants: Participant[];
  summary: string;
  tags: string[];
  status: MeetingStatus;
  origin: MeetingOrigin;
  source: "Zoom" | "Google Meet" | "Microsoft Teams" | "Local recording";
  transcript: TranscriptEntry[];
  decisions: Insight[];
  actionItems: Insight[];
  highlights: Insight[];
  summaries: SummaryTemplates;
  mediaUrl: string;
  audio?: { mimeType: string; originalFileName: string };
};

export const processingStages = ["saving-recording", "transcribing-audio", "generating-summary", "extracting-action-items", "preparing-workspace", "complete"] as const;
export type ProcessingStage = (typeof processingStages)[number];
export type ProcessingJobStatus = "processing" | "complete" | "failed";
export type ProcessingJob = {
  id: string;
  meetingId: string;
  title: string;
  status: ProcessingJobStatus;
  stage: ProcessingStage;
  createdAt: string;
  updatedAt: string;
  error?: string;
  audioMimeType?: string;
};

export type SummaryContent = {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  risks: string[];
  nextSteps: string[];
  actionItems: string[];
};

export type SummaryTemplateName = "General" | "Executive Brief" | "Action-Focused";
export type SummaryTemplates = Record<SummaryTemplateName, SummaryContent>;

export type UserHighlight = {
  id: string;
  meetingId: string;
  title: string;
  timestampSeconds: number;
  createdAt: string;
};

export type MeetingPreferences = {
  starredIds: string[];
  playbackRates: Record<string, number>;
  lastViewedMeetingId?: string;
};
