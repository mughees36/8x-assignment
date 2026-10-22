import type { Meeting, Participant, TranscriptEntry } from "@/lib/types";

const people: Participant[] = [
  { id: "maya", name: "Maya Chen", role: "VP Product", initials: "MC", color: "#245c45" },
  { id: "jonah", name: "Jonah Brooks", role: "Product Marketing", initials: "JB", color: "#79593a" },
  { id: "priya", name: "Priya Nair", role: "Engineering Lead", initials: "PN", color: "#4b5f93" },
  { id: "theo", name: "Theo Martin", role: "Design Lead", initials: "TM", color: "#8b4e65" },
  { id: "imani", name: "Imani Wilson", role: "Customer Success", initials: "IW", color: "#8a6b22" },
  { id: "lucas", name: "Lucas Silva", role: "Revenue Operations", initials: "LS", color: "#3b7180" },
  { id: "aisha", name: "Aisha Rahman", role: "Content Strategy", initials: "AR", color: "#6e4f88" },
  { id: "owen", name: "Owen Park", role: "Data & Insights", initials: "OP", color: "#4c6d37" },
  { id: "sara", name: "Sara Ali", role: "Account Executive", initials: "SA", color: "#9a513d" },
  { id: "noah", name: "Noah Williams", role: "Talent Partner", initials: "NW", color: "#42658a" },
];

const launchTranscript: TranscriptEntry[] = [
  ["maya", 18, "Thanks, everyone. Today we need to leave with a launch date, a clear audience, and owners for every remaining risk."],
  ["jonah", 124, "The strongest positioning from our research is not ‘another analytics dashboard.’ It is the fastest way for hiring teams to understand every candidate conversation."],
  ["owen", 248, "That language tracks with the data. Time-to-insight tested twenty-eight percent better than feature-led messaging in the concept survey."],
  ["theo", 391, "The product tour now follows that story: capture, understand, then act. We have reduced the first-run flow from seven screens to four."],
  ["priya", 526, "Engineering is comfortable with the core workflow. Speaker identification is at ninety-four percent on our English test set, above the launch threshold."],
  ["imani", 653, "For customer success, the concern is expectation setting. We should say speaker labels can be edited and avoid implying every accent is equally accurate on day one."],
  ["aisha", 778, "I’ll add a plain-language accuracy note to the launch page and help center. It can be confident without overselling."],
  ["lucas", 902, "On packaging, the proposal is a fourteen-day Pro trial with no card. Teams keep their recordings but advanced insights pause if they do not convert."],
  ["maya", 1027, "Decision: we will use the no-card trial. It removes friction, and the retention behavior is fair and easy to explain."],
  ["jonah", 1150, "For timing, Tuesday the twelfth gives press a clean news cycle and leaves three working days for support before the weekend."],
  ["priya", 1276, "The twelfth is achievable if the final security review closes by Friday. The calendar integration fix is already in staging."],
  ["owen", 1403, "I can deliver the launch dashboard by Monday. The north-star event will be a shared insight, with activation defined as two meetings processed and one share."],
  ["theo", 1532, "The empty states still need polish. I’ll pair with Priya tomorrow and provide final assets before three p.m."],
  ["imani", 1658, "We have six design partners willing to provide quotes. Northstar Labs has approved attribution, and their result is specific: four hours saved per recruiter each week."],
  ["aisha", 1781, "That should be the hero proof point. I’ll get legal approval and produce a short case-study card rather than a distracting carousel."],
  ["lucas", 1904, "Sales needs the comparison sheet forty-eight hours before launch. The biggest objection will be why this is different from a generic meeting recorder."],
  ["jonah", 2029, "I own the competitive one-pager. The answer is workflow depth: recruiting-specific summaries, scorecard signals, and searchable candidate history."],
  ["maya", 2151, "Let’s hold the line there. We are launching for talent teams first, not every possible meeting. Focus is part of the strategy."],
  ["priya", 2268, "One risk: the export queue slows under ten times normal traffic. It does not affect recording or summaries, but bulk exports may take several minutes."],
  ["owen", 2397, "I can model expected launch traffic from the waitlist and share an hourly forecast today, so engineering has a realistic load profile."],
  ["theo", 2520, "Could we show export progress instead of a blocking spinner? That turns a scaling limitation into a predictable background task."],
  ["priya", 2644, "Yes. Decision: background exports with a completion notification. I’ll own it, scoped to email notification for launch."],
  ["imani", 2773, "Support coverage is ready from eight a.m. Eastern. I need the known-issues list and escalation contacts by end of day Monday."],
  ["aisha", 2891, "The webinar is booked for Thursday after launch. Maya will host, Jonah will demo, and I’ll send the final run-of-show tomorrow."],
  ["lucas", 3016, "Pipeline attribution will use the launch campaign field in HubSpot. I’ll QA the routing with Sara before we turn campaigns on."],
  ["maya", 3138, "We have the date: Tuesday the twelfth at nine a.m. Eastern. The only go or no-go gate is security sign-off by Friday."],
  ["jonah", 3260, "I’ll schedule the announcement, customer email, and social sequence, all pointing to the same focused talent-team narrative."],
  ["owen", 3385, "I’ll post live activation, processing latency, and trial starts in the launch channel. Alerts will trigger if latency exceeds eight minutes."],
  ["imani", 3510, "I’ll brief support using today’s decisions and run a thirty-minute simulation on Monday. That gives us one final feedback loop."],
  ["maya", 3662, "Recap: launch on the twelfth, talent teams are the audience, no-card trial, and security review is the gate. Owners are captured—thank you."],
].map(([speakerId, startSeconds, text], index) => ({ id: `t-${index + 1}`, speakerId: String(speakerId), startSeconds: Number(startSeconds), text: String(text) }));

const genericTranscript = (ids: string[], topic: string): TranscriptEntry[] => [
  { id: `${topic}-1`, speakerId: ids[0], startSeconds: 42, text: `Let’s align on the goal for ${topic} and make the tradeoffs explicit.` },
  { id: `${topic}-2`, speakerId: ids[1] ?? ids[0], startSeconds: 384, text: "The customer signal is consistent, but we should validate it with one more cohort before scaling." },
  { id: `${topic}-3`, speakerId: ids[2] ?? ids[0], startSeconds: 811, text: "I’ll own the follow-up and share a written recommendation with the team tomorrow." },
];

const baseMeetings: Omit<Meeting, "origin" | "transcript" | "decisions" | "actionItems" | "highlights" | "summaries" | "mediaUrl">[] = [
  { id: "product-launch-planning", title: "Product Launch Planning", date: "2026-10-21T15:00:00Z", durationSeconds: 3720, participants: people.slice(0, 8), summary: "The team aligned on an October 12 launch for talent teams, confirmed a no-card Pro trial, and made security sign-off the sole go/no-go gate.", tags: ["Launch", "Product", "Go-to-market"], status: "ready", source: "Zoom" },
  { id: "customer-discovery", title: "Customer Discovery", date: "2026-10-20T17:00:00Z", durationSeconds: 2040, participants: [people[4], people[8], people[7]], summary: "A design partner shared how recruiting teams review interview notes and where handoffs currently break down.", tags: ["Customer", "Research"], status: "ready", source: "Zoom" },
  { id: "engineering-standup", title: "Engineering Standup", date: "2026-10-19T10:00:00Z", durationSeconds: 720, participants: [people[2], people[7], people[0], people[3], people[5]], summary: "The team surfaced launch blockers, confirmed owners, and aligned on the day’s integration work.", tags: ["Engineering", "Daily"], status: "ready", source: "Google Meet" },
  { id: "sales-discovery", title: "Sales Discovery", date: "2026-10-17T16:00:00Z", durationSeconds: 2820, participants: [people[8], people[5], people[4], people[0]], summary: "Explored the prospect’s recruiting workflow, current tool gaps, and success criteria for a pilot.", tags: ["Sales", "Discovery"], status: "ready", source: "Microsoft Teams" },
  { id: "design-review", title: "Design Review", date: "2026-10-16T13:00:00Z", durationSeconds: 1680, participants: [people[3], people[0], people[2], people[4]], summary: "Simplified first-run onboarding and agreed to test progressive guidance instead of a multi-step tour.", tags: ["Design", "Onboarding"], status: "ready", source: "Google Meet" },
  { id: "weekly-product-sync", title: "Weekly Product Sync", date: "2026-10-15T14:30:00Z", durationSeconds: 2460, participants: [people[0], people[2], people[3], people[7], people[4], people[1]], summary: "Reviewed onboarding metrics, resolved the export workflow, and prioritized calendar reliability for the next sprint.", tags: ["Product", "Weekly"], status: "ready", source: "Zoom" },
  { id: "one-on-one", title: "One-on-One", date: "2026-10-13T12:30:00Z", durationSeconds: 1080, participants: [people[0], people[9]], summary: "Discussed current priorities, growth goals, and where additional support would create the most leverage.", tags: ["1:1", "People"], status: "ready", source: "Microsoft Teams" },
  { id: "sprint-retrospective", title: "Sprint Retrospective", date: "2026-10-10T16:30:00Z", durationSeconds: 3120, participants: [people[2], people[7], people[0], people[3], people[5], people[4], people[1]], summary: "Reflected on delivery flow and committed to smaller reviews, clearer ownership, and earlier risk escalation.", tags: ["Engineering", "Retrospective"], status: "ready", source: "Zoom" },
  { id: "marketing-campaign-review", title: "Marketing Campaign Review", date: "2026-10-08T15:00:00Z", durationSeconds: 2280, participants: [people[1], people[6], people[3], people[0], people[7]], summary: "Reviewed campaign performance and focused the next iteration on time-to-insight messaging and customer proof.", tags: ["Marketing", "Campaign"], status: "ready", source: "Google Meet" },
  { id: "quarterly-roadmap-planning", title: "Quarterly Roadmap Planning", date: "2026-10-02T14:00:00Z", durationSeconds: 3480, participants: people.slice(0, 8), summary: "Prioritized the quarter around launch quality, recruiting-specific intelligence, and dependable integrations.", tags: ["Roadmap", "Quarterly"], status: "ready", source: "Zoom" },
];

export const meetings: Meeting[] = baseMeetings.map((meeting) => ({
  ...meeting,
  origin: "seeded",
  mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  transcript: meeting.id === "product-launch-planning" ? launchTranscript : genericTranscript(meeting.participants.map((person) => person.id), meeting.id),
  decisions: meeting.id === "product-launch-planning" ? [
    { id: "d1", text: "Launch on Tuesday the 12th at 9:00 AM Eastern.", timestampSeconds: 3138 },
    { id: "d2", text: "Offer a 14-day Pro trial without requiring a card.", timestampSeconds: 1027 },
    { id: "d3", text: "Position the launch specifically for talent teams.", timestampSeconds: 2151 },
    { id: "d4", text: "Run bulk exports in the background with email notification.", timestampSeconds: 2644 },
  ] : [{ id: `${meeting.id}-d`, text: "Proceed with the focused recommendation discussed by the team.", timestampSeconds: 811 }],
  actionItems: meeting.id === "product-launch-planning" ? [
    { id: "a1", text: "Complete final security review by Friday.", owner: "Priya Nair", dueDate: "2026-10-23", timestampSeconds: 1276 },
    { id: "a2", text: "Publish launch measurement dashboard by Monday.", owner: "Owen Park", dueDate: "2026-10-26", timestampSeconds: 1403 },
    { id: "a3", text: "Deliver competitive one-pager 48 hours before launch.", owner: "Jonah Brooks", dueDate: "2026-10-25", timestampSeconds: 2029 },
    { id: "a4", text: "Brief support and run launch simulation.", owner: "Imani Wilson", dueDate: "2026-10-26", timestampSeconds: 3510 },
  ] : [{ id: `${meeting.id}-a`, text: "Share the written follow-up with the team tomorrow.", owner: meeting.participants[1]?.name, dueDate: new Date(new Date(meeting.date).getTime() + 86_400_000).toISOString().slice(0, 10), timestampSeconds: 811 }],
  highlights: meeting.id === "product-launch-planning" ? [
    { id: "h1", text: "Time-to-insight messaging tested 28% better than feature-led copy.", timestampSeconds: 248 },
    { id: "h2", text: "Northstar Labs reports four recruiter hours saved each week.", timestampSeconds: 1658 },
    { id: "h3", text: "Speaker identification reached 94% on the English test set.", timestampSeconds: 526 },
  ] : [{ id: `${meeting.id}-h`, text: meeting.summary, timestampSeconds: 384 }],
  summaries: {
    General: {
      overview: meeting.summary,
      keyPoints: ["The group aligned on the primary outcome and audience.", "Customer evidence shaped the recommendation.", "Owners and follow-up timing were made explicit."],
      decisions: ["Proceed with the focused recommendation discussed by the team."],
      risks: ["Dependencies and final review timing could affect delivery."],
      nextSteps: ["Share the written recap and validate the remaining dependency."],
      actionItems: ["Owner to circulate the follow-up by the next business day."],
    },
    "Executive Brief": {
      overview: `Leadership brief: ${meeting.summary}`,
      keyPoints: ["Strategic focus is narrower and easier to communicate.", "The evidence supports moving forward with a measured rollout."],
      decisions: ["Maintain the chosen scope and success criteria."],
      risks: ["Execution confidence depends on clearing the final operational gate."],
      nextSteps: ["Confirm readiness, then communicate the decision across teams."],
      actionItems: ["Executive owner to review status at the next checkpoint."],
    },
    "Action-Focused": {
      overview: `Execution plan: ${meeting.summary}`,
      keyPoints: ["Work is organized around named owners.", "The immediate priority is removing the remaining blocker."],
      decisions: ["Use the agreed plan as the source of truth."],
      risks: ["Late handoffs may compress validation time."],
      nextSteps: ["Complete assigned work, post evidence, and escalate blockers early."],
      actionItems: meeting.id === "product-launch-planning" ? ["Priya: complete the security review by Friday.", "Owen: publish the dashboard by Monday.", "Jonah: deliver the competitive one-pager.", "Imani: run the support simulation."] : ["Share the written follow-up tomorrow."],
    },
  },
}));

export function getMeeting(id: string) {
  return meetings.find((meeting) => meeting.id === id);
}
