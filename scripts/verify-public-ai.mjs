// Browser end-to-end check using a self-created spoken WAV as Chromium's microphone.
// Keep the WAV and reviewer code under ignored .data; never print either secret or audio.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const origin = process.env.PUBLIC_APP_ORIGIN || 'https://8x-assignment-theta.vercel.app';
const gateway = process.env.REMOTE_GATEWAY_URL;
assert.ok(gateway && process.env.AI_GATEWAY_SECRET, 'Load the private gateway env file before verification');
const code = (await readFile('.data/demo-access.txt', 'utf8')).trim();
const wav = resolve('.data/gateway-verification.wav');
const existingMeetingId = process.env.PUBLIC_AI_EXISTING_MEETING_ID;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  `--use-file-for-fake-audio-capture=${wav}`,
] });

try {
  const context = await browser.newContext({ permissions: ['microphone'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let meetingId = existingMeetingId;
  if (meetingId) {
    const login = await context.request.post(`${origin}/api/demo-access`, { data: { code } });
    assert.equal(login.status(), 200);
    await page.goto(`${origin}/meetings/${meetingId}`);
  } else {
    await page.goto(`${origin}/meetings/new`);
    await page.getByLabel('Meeting title').fill('Public AI verification — spoken fixture');
    await page.getByRole('button', { name: 'Check microphone permission' }).click();
    await page.getByText('Microphone permission granted').waitFor();
    await page.getByLabel('Demo access code').fill(code);
    await page.getByRole('button', { name: 'Start Meeting' }).click();
    await page.waitForURL(/\/meetings\/live\/session-/);
    await page.getByRole('button', { name: 'End Meeting' }).waitFor();
    console.log('Browser MediaRecorder started with self-created spoken audio.');
    await page.waitForTimeout(16_000);
    await page.getByRole('button', { name: 'End Meeting' }).click();
    await page.getByText('Saving recording').waitFor();
    await page.waitForURL(/\/meetings\/local-/, { timeout: 240_000 });
    meetingId = new URL(page.url()).pathname.split('/').at(-1);
  }
  assert.match(meetingId, /^local-[a-z0-9-]+$/);
  await page.getByRole('heading', { name: 'Public AI verification — spoken fixture' }).waitFor();
  const response = await fetch(`${gateway}/api/gateway-data?id=${meetingId}`, { headers: { authorization: `Bearer ${process.env.AI_GATEWAY_SECRET}` } });
  assert.equal(response.status, 200);
  const meeting = await response.json();
  assert.ok(meeting.transcript.some(segment => /Maya|Friday|onboarding/i.test(segment.text)), 'Whisper transcript does not match the spoken fixture');
  assert.ok(meeting.summaries?.General?.overview, 'Ollama summary is missing');
  assert.ok(meeting.actionItems?.length, 'Action extraction is missing');
  assert.ok(meeting.decisions?.length, 'Decision extraction is missing');
  await page.goto(`${origin}/meetings`);
  await page.getByRole('link', { name: 'Open Public AI verification — spoken fixture' }).waitFor();
  await page.getByPlaceholder('Search all meeting content').fill('onboarding checklist');
  await page.getByRole('link', { name: 'Open Public AI verification — spoken fixture' }).waitFor();
  const audio = await page.request.get(`${origin}/api/local-ai/meetings/${meetingId}/audio`, { headers: { range: 'bytes=0-99' } });
  assert.equal(audio.status(), 206);
  await page.goto(`${origin}/meetings/${meetingId}`);
  await page.getByRole('heading', { name: 'Public AI verification — spoken fixture' }).waitFor();
  const video = page.locator('video').first();
  await video.waitFor();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.waitForFunction(() => document.querySelector('video')?.currentTime > 0.1);
  await page.getByRole('button', { name: 'Pause' }).click();
  const seekSegment = meeting.transcript.find(segment => segment.startSeconds > 1 && segment.startSeconds < meeting.durationSeconds - 1);
  assert.ok(seekSegment, 'No seekable transcript segment');
  await page.getByRole('button', { name: 'Transcript', exact: true }).click();
  await page.locator(`#line-${seekSegment.id}`).click();
  await page.waitForFunction(target => Math.abs((document.querySelector('video')?.currentTime ?? 0) - target) < 2.5, seekSegment.startSeconds);
  let qnaStatus = 'skipped';
  if (process.env.PUBLIC_AI_SKIP_QA !== '1') {
    const question = await page.request.post(`${origin}/api/local-ai/meetings/${meetingId}/ask`, { data: { question: 'Who will prepare the onboarding checklist?' } });
    assert.equal(question.status(), 200);
    const answer = await question.json();
    assert.match(JSON.stringify(answer), /Maya/i);
    qnaStatus = String(question.status());
  }
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(`${origin}/share/product-launch-planning`);
  await guestPage.getByText('Shared meeting').waitFor();
  await guestPage.getByRole('heading', { name: 'Product Launch Planning' }).waitFor();
  await guest.close();
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ meetingId, transcriptSegments: meeting.transcript.length, actions: meeting.actionItems.length, decisions: meeting.decisions.length, playback: audio.status(), transcriptSeek: true, dashboardSearch: true, qna: qnaStatus, seededIncognitoShare: true }));
} finally { await browser.close(); }
