import { expect, test, type Page } from "@playwright/test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

async function clearState(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

test.beforeEach(async ({ page }) => clearState(page));

test("dashboard and meetings provide complete navigation", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Turn conversations into momentum." })).toBeVisible();
  await page.getByRole("link", { name: "Review meetings Catch up with summaries and transcripts" }).click();
  await expect(page).toHaveURL(/\/meetings$/);
  await expect(page.getByRole("heading", { name: "Meetings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Product Launch Planning" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recruiting Intelligence Demo" })).toBeVisible();
});

test("meeting search, filters, stars, sorting, and empty state work", async ({ page }) => {
  await page.goto("/meetings");
  const search = page.getByPlaceholder("Search all meeting content");
  await search.fill("Northstar Labs");
  await expect(page.getByRole("link", { name: "Open Product Launch Planning" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Customer Discovery/ })).toHaveCount(0);
  await search.fill("");
  await page.getByLabel("Sort").selectOption("Oldest");
  await expect(page.getByRole("link", { name: "Open Quarterly Roadmap Planning" })).toBeVisible();
  await page.getByRole("button", { name: "Star meeting" }).first().click();
  await page.getByRole("button", { name: "Starred", exact: true }).click();
  await expect(page.getByRole("link", { name: /Open Quarterly Roadmap Planning/ })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await search.fill("no such meeting phrase");
  await expect(page.getByText("No meetings match")).toBeVisible();
});

test("meeting detail exposes player semantics, transcript context, and templates", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await expect(page.getByRole("heading", { name: "Product Launch Planning" })).toBeVisible();
  await expect(page.locator("video").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByLabel("Seek media")).toBeVisible();
  await expect(page.getByLabel("Volume")).toBeVisible();
  await expect(page.getByLabel("Playback speed")).toHaveValue("1");
  await page.getByLabel("Playback speed").selectOption("1.5");
  await expect(page.getByLabel("Playback speed")).toHaveValue("1.5");
  await page.getByRole("button", { name: "Mute" }).click();
  await expect(page.getByRole("button", { name: "Unmute" })).toBeVisible();
  await page.getByRole("button", { name: "Transcript", exact: true }).click();
  await page.getByPlaceholder("Search transcript").fill("security review");
  await expect(page.getByText(/The twelfth is achievable/)).toBeVisible();
  await page.getByText(/The twelfth is achievable/).click();
  await expect(page.getByRole("status")).toContainText("outside the");
  await page.getByRole("button", { name: "Summary", exact: true }).click();
  await page.getByLabel("Summary template").selectOption("Executive Brief");
  await expect(page.getByText(/Leadership brief:/)).toBeVisible();
});

test("action completion persists between detail and aggregate views", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await expect(page.getByText("Due Oct 23, 2026")).toBeVisible();
  await page.getByRole("button", { name: /Mark complete: Complete final security review/ }).click();
  await page.goto("/action-items");
  await expect(page.getByText("Due Oct 23, 2026")).toHaveCount(0);
  await page.getByRole("button", { name: "completed" }).click();
  await expect(page.getByText("Complete final security review by Friday.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "completed" }).click();
  await expect(page.getByText("Complete final security review by Friday.")).toBeVisible();
});

test("personal highlights can be created, followed, and deleted", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await page.getByPlaceholder("Highlight name").fill("Launch opening");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Launch opening · 0:00/)).toBeVisible();
  await page.goto("/highlights");
  await expect(page.getByText("Launch opening", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete Launch opening" }).click();
  await expect(page.getByText("Launch opening", { exact: true })).toHaveCount(0);
});

test("sharing offers a public meeting URL and public meeting view", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await page.locator("video").first().evaluate((media) => {
    Object.defineProperty(media, "duration", { configurable: true, value: 30 });
    media.dispatchEvent(new Event("loadedmetadata"));
  });
  await page.getByRole("button", { name: "Share or clip" }).click();
  const dialog = page.getByRole("dialog", { name: "Share meeting or clip" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input").first()).toHaveValue(/\/share\/product-launch-planning$/);
  await dialog.getByLabel("Clip title").fill("Customer proof");
  await expect(dialog.locator("input").last()).toHaveValue(/start=0&end=5&title=Customer%20proof/);
  await page.getByRole("button", { name: "Close" }).click();
  await page.goto("/share/product-launch-planning");
  await expect(page.getByText("Shared meeting")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meeting transcript" })).toBeVisible();
  await expect(page.getByText(/simulated 0:18/)).toBeVisible();
});

test("clip URL renders nearby transcript context and honest media disclosure", async ({ page }) => {
  await page.goto("/share/product-launch-planning?start=0&end=5&title=Key%20moment");
  await expect(page.getByText("Shared clip")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key moment" })).toBeVisible();
  await expect(page.getByText(/This short sample video demonstrates player and clip controls/)).toBeVisible();
  await expect(page.getByText(/Showing the nearest meeting context instead/)).toBeVisible();
  await expect(page.getByText(/simulated 0:18/)).toBeVisible();
});

test("desktop uses sidebar while mobile uses bottom navigation", async ({ page }, testInfo) => {
  await page.goto("/meetings");
  const desktopNav = page.getByRole("navigation", { name: "Primary", exact: true });
  const mobileNav = page.getByRole("navigation", { name: "Mobile primary" });
  if (testInfo.project.name === "mobile") {
    await expect(desktopNav).toBeHidden();
    await expect(mobileNav).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meetings" })).toBeVisible();
  } else {
    await expect(desktopNav).toBeVisible();
    await expect(mobileNav).toBeHidden();
  }
});

test("local meeting setup requests permission only after an explicit action", async ({ page }) => {
  let microphoneRequests = 0;
  await page.route("**/api/local-ai/status", (route) => route.fulfill({ json: { ready: true, localOnly: true, message: "Ready for test media.", deploymentNotice: "Local only.", checks: { ffmpeg: { ready: true, detail: "test" }, whisper: { ready: true, detail: "test" }, model: { ready: true, detail: "test" }, ollama: { ready: true, detail: "test" } } } }));
  await page.exposeFunction("noteMicRequest", () => { microphoneRequests += 1; });
  await page.addInitScript(() => {
    const track = { stop() {}, enabled: true };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia: async () => { await (window as unknown as { noteMicRequest: () => void }).noteMicRequest(); return { getTracks: () => [track], getAudioTracks: () => [track] }; },
      enumerateDevices: async () => [{ kind: "audioinput", deviceId: "fake-mic", label: "Playwright fake microphone", groupId: "fake", toJSON() { return this; } }],
    } });
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: class { static isTypeSupported() { return true; } } });
  });
  await page.goto("/meetings/new");
  await expect(page.getByRole("button", { name: "Start Meeting" })).toBeDisabled();
  expect(microphoneRequests).toBe(0);
  await page.getByLabel("Meeting title").fill("Browser lifecycle test");
  await page.getByRole("button", { name: "Check microphone permission" }).click();
  await expect(page.getByText("Microphone permission granted")).toBeVisible();
  expect(microphoneRequests).toBe(1);
  await expect(page.getByRole("button", { name: "Start Meeting" })).toBeEnabled();
});

test("live room records fake browser media and shows honest processing failure with retry", async ({ page }) => {
  await page.addInitScript(() => {
    const track = { stop() {}, enabled: true };
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => stream } });
    class FakeRecorder {
      static isTypeSupported() { return true; } state = "inactive"; mimeType = "audio/webm"; ondataavailable: ((event: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      start() { this.state = "recording"; this.ondataavailable?.({ data: new Blob(["test-audio"], { type: this.mimeType }) }); }
      stop() { this.state = "inactive"; this.onstop?.(); }
    }
    class FakeAnalyser { fftSize = 0; frequencyBinCount = 8; getByteFrequencyData(array: Uint8Array) { array.fill(12); } }
    class FakeAudioContext { createAnalyser() { return new FakeAnalyser(); } createMediaStreamSource() { return { connect() {} }; } close() { return Promise.resolve(); } }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeRecorder });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    sessionStorage.setItem("local-meeting:session-playwright", JSON.stringify({ title: "Lifecycle meeting", deviceId: "", authorizedAt: Date.now() }));
  });
  await page.route("**/api/local-ai/jobs", (route) => route.fulfill({ status: 202, json: { jobId: "job-playwright1", meetingId: "local-playwright1" } }));
  await page.route("**/api/local-ai/jobs/job-playwright1", (route) => route.fulfill({ json: { id: "job-playwright1", meetingId: "local-playwright1", title: "Lifecycle meeting", status: "failed", stage: "transcribing-audio", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: "Whisper test failure; original recording retained." } }));
  await page.goto("/meetings/live/session-playwright");
  await expect(page.getByText("No fake live transcript.")).toBeVisible();
  await page.getByRole("button", { name: "End Meeting" }).click();
  await expect(page.getByText("Saving recording")).toBeVisible();
  await expect(page.getByText(/original recording retained/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "Retry processing" })).toBeVisible();
});

test("quota upload failure keeps recorded audio in the tab for retry", async ({ page }) => {
  await page.addInitScript(() => {
    const track = { stop() {}, enabled: true };
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => stream } });
    class FakeRecorder {
      static isTypeSupported() { return true; } state = "inactive"; mimeType = "audio/webm"; ondataavailable: ((event: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      start() { this.state = "recording"; this.ondataavailable?.({ data: new Blob(["retained-audio"], { type: this.mimeType }) }); }
      stop() { this.state = "inactive"; this.onstop?.(); }
    }
    class FakeAnalyser { fftSize = 0; frequencyBinCount = 8; getByteFrequencyData(array: Uint8Array) { array.fill(12); } }
    class FakeAudioContext { createAnalyser() { return new FakeAnalyser(); } createMediaStreamSource() { return { connect() {} }; } close() { return Promise.resolve(); } }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: FakeRecorder });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    sessionStorage.setItem("local-meeting:session-upload-retry", JSON.stringify({ title: "Retry meeting", deviceId: "", authorizedAt: Date.now() }));
  });
  let uploads = 0;
  await page.route("**/api/upload-ticket", (route) => route.fulfill({ json: { local: true } }));
  await page.route("**/api/local-ai/jobs", (route) => {
    uploads++;
    return route.fulfill(uploads === 1 ? { status: 429, json: { error: "Daily recording limit reached" } } : { status: 202, json: { jobId: "job-uploadretry", meetingId: "local-uploadretry" } });
  });
  await page.route("**/api/local-ai/jobs/job-uploadretry", (route) => route.fulfill({ json: { id: "job-uploadretry", meetingId: "local-uploadretry", title: "Retry meeting", status: "failed", stage: "transcribing-audio", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), error: "Test processing stopped." } }));
  await page.goto("/meetings/live/session-upload-retry");
  await page.getByRole("button", { name: "End Meeting" }).click();
  await expect(page.getByText("Daily recording limit reached")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry upload" })).toBeVisible();
  await page.getByRole("button", { name: "Retry upload" }).click();
  await expect.poll(() => uploads).toBe(2);
  await expect(page.getByRole("button", { name: "Retry processing" })).toBeVisible();
});

test.describe("private local meeting intelligence", () => {
  test("local meetings require explicit token shares that work in a fresh context and enforce clip bounds", async ({ page, request, browser }, testInfo) => {
    const id = `local-playwright-${testInfo.project.name}`;
    const meetingDir = path.join(process.cwd(), ".data", "meetings");
    const recordingDir = path.join(process.cwd(), ".data", "recordings", id);
    const meeting = { id, title: "Private Playwright Meeting", date: "2026-10-23T10:00:00Z", durationSeconds: 20, participants: [{ id: "speaker", name: "Speaker", role: "Recorded locally", initials: "S", color: "#245c45" }], summary: "The team chose Friday for the review.", tags: ["Local AI"], status: "ready", origin: "local-recording", source: "Local recording", transcript: [{ id: "local-t-1", speakerId: "speaker", startSeconds: 4, text: "We chose Friday for the review." }], decisions: [], actionItems: [], highlights: [], summaries: { General: { overview: "The team chose Friday for the review.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] }, "Executive Brief": { overview: "Friday review.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] }, "Action-Focused": { overview: "Prepare for Friday.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] } }, mediaUrl: `/api/local-ai/meetings/${id}/audio`, audio: { mimeType: "audio/webm", originalFileName: "original.media" } };
    await mkdir(meetingDir, { recursive: true }); await mkdir(recordingDir, { recursive: true });
    await writeFile(path.join(meetingDir, `${id}.json`), JSON.stringify(meeting)); await writeFile(path.join(recordingDir, "original.media"), "test-audio");
    let token = "";
    try {
      expect((await request.get(`/share/${id}`)).status()).toBe(404);
      await page.goto(`/meetings/${id}`); await page.getByRole("button", { name: "Share or clip" }).click();
      await expect(page.getByText("Private until you create a link")).toBeVisible();
      await page.getByRole("button", { name: "Create public link" }).click();
      const publicLink = page.getByLabel("Public meeting link"); await expect(publicLink).toHaveValue(/\/share\/[A-Za-z0-9_-]{43}$/);
      token = (await publicLink.inputValue()).split("/").at(-1)!;
      await expect.poll(async () => (await request.get(`/share/${token}`)).status()).toBe(200);
      const context = await browser.newContext(); const fresh = await context.newPage(); await fresh.goto(`/share/${token}?start=2&end=7&title=Review`);
      await expect(fresh.getByRole("heading", { name: "Review" })).toBeVisible(); await expect(fresh.getByText("We chose Friday for the review.")).toBeVisible();
      const media = fresh.locator("video"); await media.evaluate((element) => { Object.defineProperty(element, "duration", { configurable: true, value: 20 }); element.dispatchEvent(new Event("loadedmetadata")); });
      await expect.poll(()=>media.evaluate(element=>(element as HTMLVideoElement).currentTime)).toBe(2);
      await media.evaluate((element) => { Object.defineProperty(element, "currentTime", { configurable: true, writable: true, value: 7.1 }); element.dispatchEvent(new Event("timeupdate")); });
      await expect.poll(()=>media.evaluate(element=>(element as HTMLVideoElement).currentTime)).toBe(7);
      await context.close();
    } finally {
      await rm(path.join(meetingDir, `${id}.json`), { force: true }); await rm(recordingDir, { recursive: true, force: true });
      if (token) await rm(path.join(process.cwd(), ".data", "shares", `${token}.json`), { force: true });
    }
  });

  test("Ask this meeting renders grounded citations and honest errors", async ({ page }, testInfo) => {
    const id = `local-asktest-${testInfo.project.name}`; const meetingDir = path.join(process.cwd(), ".data", "meetings");
    const meeting = { id, title: "Ask Test Meeting", date: "2026-10-23T10:00:00Z", durationSeconds: 20, participants: [{ id: "speaker", name: "Speaker", role: "Recorded locally", initials: "S", color: "#245c45" }], summary: "A test summary.", tags: ["Local AI"], status: "ready", origin: "local-recording", source: "Local recording", transcript: [{ id: "local-t-1", speakerId: "speaker", startSeconds: 4, text: "Friday is the review day." }], decisions: [], actionItems: [], highlights: [], summaries: { General: { overview: "Test.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] }, "Executive Brief": { overview: "Test.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] }, "Action-Focused": { overview: "Test.", keyPoints: [], decisions: [], risks: [], nextSteps: [], actionItems: [] } }, mediaUrl: `/api/local-ai/meetings/${id}/audio`, audio: { mimeType: "audio/webm", originalFileName: "original.media" } };
    await mkdir(meetingDir, { recursive: true }); await writeFile(path.join(meetingDir, `${id}.json`), JSON.stringify(meeting));
    try {
      expect((await page.request.post("/api/local-ai/meetings/local-missing1/ask", { data: { question: "What happened?" } })).status()).toBe(404);
      await page.route(`**/api/local-ai/meetings/${id}/ask`, route => route.fulfill({ json: { answer: "The review is Friday.", citations: [{ transcriptEntryId: "local-t-1", timestampSeconds: 4, text: "Friday is the review day." }] } }));
      await page.goto(`/meetings/${id}`); await page.getByLabel("Question about this meeting").fill("When is the review?"); await page.getByRole("button", { name: "Ask", exact: true }).click();
      await expect(page.getByText("The review is Friday.")).toBeVisible(); await expect(page.getByRole("button", { name: "0:04" })).toBeVisible();
      await page.unroute(`**/api/local-ai/meetings/${id}/ask`); await page.route(`**/api/local-ai/meetings/${id}/ask`, route => route.fulfill({ status: 503, json: { error: "Local AI is unavailable. Make sure Ollama is running, then try again." } }));
      await page.getByRole("button", { name: "What decisions were made?" }).click(); await expect(page.getByText(/Local AI is unavailable/)).toBeVisible();
      await page.getByLabel("Question about this meeting").fill(""); await page.getByRole("button", { name: "Ask", exact: true }).click(); await expect(page.getByText("Enter a question about this meeting.")).toBeVisible();
    } finally { await rm(path.join(meetingDir, `${id}.json`), { force: true }); }
  });
});
