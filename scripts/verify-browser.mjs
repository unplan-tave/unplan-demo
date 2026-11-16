/* global document, innerWidth */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { parseSchedule } from '@unplan-tave/parser';
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : {}),
});
let outcome = 'failed';
const checks = [],
  errors = [],
  assets = [];
const artifactDirectory = process.env.ARTIFACT_DIR ?? 'artifacts/conversation';
await mkdir(artifactDirectory, { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  timezoneId: 'Asia/Seoul',
});
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  const origin = new URL(process.env.DEMO_URL).origin;
  await context.route(`${origin}/**`, (route) =>
    route.continue({
      headers: {
        ...route.request().headers(),
        'x-vercel-protection-bypass':
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      },
    }),
  );
}
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('requestfailed', (r) => errors.push(`Failed: ${r.url()}`));
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  if (['script', 'stylesheet'].includes(r.request().resourceType()))
    assets.push({ url: r.url(), status: r.status() });
});
const input = page.getByLabel('어떤 일을 계획하고 있나요?');
const messages = page.locator('article.message');
const draft = page.getByRole('region', { name: '일정 초안', exact: true });
const fixed = {
  referenceInstant: '2026-11-15T01:00:00Z',
  timeZone: 'Asia/Seoul',
};
async function send(text) {
  await input.fill(text);
  await page.getByRole('button', { name: '전송 ↑', exact: true }).click();
  await expect(input).toHaveValue('');
  return messages.nth((await messages.count()) - 1);
}
async function close() {
  await page.getByRole('button', { name: '초안 닫기 · Esc' }).click();
  await expect(draft).toHaveCount(0);
}
try {
  assert.equal(
    (await page.goto(process.env.DEMO_URL ?? 'http://127.0.0.1:5173')).status(),
    200,
  );
  await expect(messages).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '전송 ↑', exact: true }),
  ).toBeDisabled();
  await input.fill('내일 3시 카페 갈 거야');
  await input.fill('모레 음악 들을 거야');
  await input.fill('');
  await expect(messages).toHaveCount(0);
  await expect(page.locator('.candidate')).toHaveCount(0);
  checks.push(
    'composer edits/deletion do not send or create drafts/candidates',
  );
  await page.locator('.contract-panel > summary').click();
  await page
    .getByLabel('검증용 기준 시각', { exact: false })
    .fill(fixed.referenceInstant);
  await page.getByLabel('IANA 시간대').fill(fixed.timeZone);
  await page.locator('.contract-panel > summary').click();
  const core = '음 내일 3시쯤 카페 갈 거야';
  const first = await send(core);
  await expect(
    first.getByRole('button', {
      name: '내일 오전 3시쯤 · 카페 가기 ＋',
      exact: true,
    }),
  ).toBeVisible();
  const pm = first.getByRole('button', {
    name: '내일 오후 3시쯤 · 카페 가기 ＋',
    exact: true,
  });
  await expect(pm).toBeVisible();
  await expect(first.locator('.candidate')).toHaveCount(2);
  await expect(draft).toHaveCount(0);
  const raw = JSON.parse(await first.locator('pre').textContent());
  assert.deepEqual(raw, parseSchedule({ ...fixed, text: core }));
  await pm.focus();
  await page.keyboard.press('Enter');
  await expect(draft.getByLabel('초안 제목')).toHaveValue('카페 가기');
  await expect(draft.getByLabel('초안 날짜')).toHaveValue('2026-11-16');
  await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('15:00');
  await expect(draft).toContainText('근사 시각');
  await expect(draft.getByLabel('초안 제목')).toBeFocused();
  await draft.getByLabel('초안 제목').fill('민수랑 카페');
  await draft.getByLabel('초안 날짜').fill('2026-11-18');
  await draft.getByLabel('초안 시간 (선택)').fill('16:10');
  await expect(draft.getByLabel('초안 날짜')).toHaveValue('2026-11-18');
  await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('16:10');
  await page.keyboard.press('Tab');
  await expect(draft.getByLabel('초안 날짜')).not.toBeFocused();
  await close();
  await expect(pm).toBeFocused();
  await first.locator('.candidate').first().click();
  await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('03:00');
  await expect(draft.getByLabel('초안 제목')).toHaveValue('카페 가기');
  await draft.getByLabel('초안 제목').dispatchEvent('compositionstart');
  await page.keyboard.press('Escape');
  await expect(draft).toHaveCount(1);
  await draft.getByLabel('초안 제목').dispatchEvent('compositionend');
  await draft.getByLabel('초안 제목').dispatchEvent('keydown', {
    key: 'Escape',
    isComposing: true,
    bubbles: true,
  });
  await expect(draft).toHaveCount(1);
  await draft
    .getByLabel('초안 제목')
    .dispatchEvent('keydown', { key: 'Escape', keyCode: 229, bubbles: true });
  await expect(draft).toHaveCount(1);
  await page.screenshot({
    path: join(artifactDirectory, 'desktop.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(draft).toHaveCount(0);
  checks.push(
    'real package equality, exact two candidate labels, AM/PM selection, editable fields, close/reselect/focus, approximate meaning, IME Escape guards',
  );

  await input.fill('내일 3시 음악 들을 거야');
  await input.dispatchEvent('compositionstart');
  await page.keyboard.press('Enter');
  await expect(messages).toHaveCount(1);
  await input.dispatchEvent('compositionend');
  await input.dispatchEvent('keydown', {
    key: 'Enter',
    isComposing: true,
    bubbles: true,
  });
  await expect(messages).toHaveCount(1);
  await input.dispatchEvent('keydown', {
    key: 'Enter',
    keyCode: 229,
    bubbles: true,
  });
  await expect(messages).toHaveCount(1);
  await page.keyboard.press('Shift+Enter');
  await expect(messages).toHaveCount(1);
  await input.fill('모레 오후 4시 음악 들을 거야');
  await page.keyboard.press('Enter');
  await expect(messages).toHaveCount(2);
  await messages.last().locator('.candidate').click();
  await expect(draft.getByLabel('초안 제목')).toHaveValue('음악 듣기');
  await expect(draft.getByLabel('초안 날짜')).toHaveValue('2026-11-17');
  await send('내일 약 먹기');
  await expect(draft.getByLabel('초안 제목')).toHaveValue('음악 듣기');
  await close();
  await first.locator('.candidate').last().click();
  await expect(draft.getByLabel('초안 제목')).toHaveValue('카페 가기');
  await close();
  assert.deepEqual(JSON.parse(await first.locator('pre').textContent()), raw);
  checks.push(
    'IME Enter/229, Shift+Enter, sent-message immutability, independent messages and open draft',
  );
  for (const text of [
    '내일 3시 카페 안 갈 거야',
    '내일 3시 카페 갈까?',
    '내일 3시 오후4시 카페 갈 거야',
    '내일 밤 12시 카페 갈 거야',
    '내일 3시 카페, 모레 4시 병원',
    '내일 3시부터 4시까지 회의',
    '민수가 내일 3시 카페 갈 거야',
    '내일 3시 카페 가기 내일 3시 병원 가기',
  ]) {
    const m = await send(text);
    await expect(m.locator('.candidate')).toHaveCount(0);
  }
  const unknown = await send('내일 3시 뭉게뭉게할 거야');
  await expect(unknown.locator('.candidate')).toHaveCount(0);
  await expect(unknown).toContainText('편집해서 다시 보내');
  checks.push(
    'negative/question/conflict/P1/multi-event/other-actor/unknown title with no positive candidates',
  );
  for (const [text, title] of [
    ['내일', ''],
    ['내일 오후 3시 2 카페 갈 거야', '카페 가기'],
  ]) {
    const m = await send(text);
    await m.locator('.candidate').click();
    await expect(draft.getByLabel('초안 제목')).toHaveValue(title);
    await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('');
    if (title) await expect(draft).toContainText('오후 3시 2');
    await close();
  }
  const emoji = await send('🗓️ 내일\n오후 3시\n카페에 갈 거야');
  await emoji.locator('.candidate').click();
  await expect(draft.getByLabel('초안 제목')).toHaveValue('🗓️ 카페 가기');
  await close();
  const spaced = await send('내일 약                  3시 카페 갈 거야');
  await expect(
    spaced.getByRole('button', {
      name: '내일 오후 3시쯤 · 카페 가기 ＋',
      exact: true,
    }),
  ).toBeVisible();
  checks.push(
    'missing title/date-only, incomplete clock without midnight, emoji/newline provenance',
  );
  const choices = await send('내일이나 모레 3시 카페 갈 거야');
  await expect(choices.locator('.candidate')).toHaveCount(4);
  await choices.locator('.candidate').last().click();
  await expect(draft.getByLabel('초안 날짜')).toHaveValue('2026-11-17');
  await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('15:00');
  await close();
  const multiText = '내일 오후 세 시 카페 가고 모레 저녁 일곱 시 병원 갈 거야';
  const multi = await send(multiText);
  await expect(multi.locator('.candidate')).toHaveCount(2);
  assert.deepEqual(
    JSON.parse(await multi.locator('pre').textContent()),
    parseSchedule({ ...fixed, text: multiText }),
  );
  await multi.locator('.candidate').last().click();
  await expect(draft.getByLabel('초안 제목')).toHaveValue('병원 가기');
  await expect(draft.getByLabel('초안 날짜')).toHaveValue('2026-11-17');
  await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('19:00');
  await close();
  checks.push(
    'P1 four explicit date/time choices and separate actions with Korean/daypart clocks',
  );
  const ordered = await send('내일 오후 3시 카페 가기 전에 은행 들를 거야');
  await expect(ordered).toContainText('카페 가기 전');
  await ordered.locator('.candidate').last().click();
  await expect(draft.getByLabel('초안 제목')).toHaveValue('은행 들르기');
  await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue('');
  await expect(draft).toContainText('카페 가기 전');
  await expect(draft).toContainText('날짜를 이어받았어요');
  await close();
  checks.push(
    'P1 ordering and inherited-date notice survive selection without copying an anchor clock',
  );
  for (const [text, title, date, time] of [
    ['30분 뒤 약 먹기', '약 먹기', '2026-11-15', '10:30'],
    ['2026년 12월 5일 오후 한 시 반 회의', '회의', '2026-12-05', '13:30'],
    ['내일 카페 말고 도서관 갈 거야', '도서관 가기', '2026-11-16', ''],
    [
      '내일 카페에서 책 읽으러 갈 거야',
      '카페에서 책 읽으러 가기',
      '2026-11-16',
      '',
    ],
    ['내일 약 사 올 거야', '약 사 오기', '2026-11-16', ''],
    [
      '내일 오후 세 시 카페 갈 거야'.normalize('NFD'),
      '카페 가기',
      '2026-11-16',
      '15:00',
    ],
  ]) {
    const message = await send(text);
    await expect(page.locator('.source-preview')).toHaveText(text);
    await message.locator('.candidate').first().click();
    await expect(draft.getByLabel('초안 제목')).toHaveValue(title);
    await expect(draft.getByLabel('초안 날짜')).toHaveValue(date);
    await expect(draft.getByLabel('초안 시간 (선택)')).toHaveValue(time);
    await close();
  }
  checks.push(
    'P1 elapsed time, numeric dates, destination correction, purpose/compound titles and NFD input',
  );
  await page.locator('.contract-panel > summary').click();
  await page.getByLabel('IANA 시간대').fill('America/Los_Angeles');
  await page.locator('.contract-panel > summary').click();
  const la = await send('오늘 회의');
  const laRaw = JSON.parse(await la.locator('pre').textContent());
  assert.equal(laRaw.suggestions.groups[0].options[0].value.date, '2026-11-14');
  assert.equal(raw.input.timeZone, 'Asia/Seoul');
  await page.locator('.contract-panel > summary').click();
  await page.getByLabel('IANA 시간대').fill('No/Such');
  await page.locator('.contract-panel > summary').click();
  const bad = await send('내일 회의');
  await expect(bad.locator('.candidate')).toHaveCount(0);
  await page.locator('.contract-panel > summary').click();
  await page.getByLabel('IANA 시간대').fill('Asia/Seoul');
  await page.getByLabel('검증용 기준 시각', { exact: false }).fill('');
  await page.locator('.contract-panel > summary').click();
  const before = Date.now();
  const live = await send('내일 회의');
  const liveRaw = JSON.parse(await live.locator('pre').textContent());
  assert.ok(Date.parse(liveRaw.input.referenceInstant) >= before);
  assert.deepEqual(JSON.parse(await first.locator('pre').textContent()), raw);
  checks.push(
    'per-message reference clock and zone snapshots, LA calendar, invalid-context refusal',
  );
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await ordered.locator('.candidate').last().click();
    await expect(draft.getByLabel('초안 제목')).toBeFocused();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${width}`,
    );
    await page.screenshot({
      path: join(artifactDirectory, `mobile-${width}.png`),
    });
    await close();
    await input.fill('내일 회의');
    await expect(input).toBeVisible();
  }
  checks.push('375px and 320px layout, editor/composer controls and focus');
  const long = '내일 '.repeat(6000);
  await send(long);
  await expect(messages.last().locator('.user-message')).toHaveText(
    long.trim(),
  );
  await input.fill('내일 3시 회의');
  await input.fill('');
  await expect(
    page.getByRole('button', { name: '전송 ↑', exact: true }),
  ).toBeDisabled();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  checks.push(
    '18,000 UTF-16 repeated message, bounded candidate count, composer deletion after send',
  );
  assert.deepEqual(errors, []);
  outcome = 'passed';
} finally {
  await writeFile(
    join(artifactDirectory, 'browser-verification.json'),
    JSON.stringify(
      {
        outcome,
        url: page.url(),
        access: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
          ? 'authenticated-automation-new-context'
          : 'anonymous-new-context',
        browser: await browser.version(),
        checks,
        errors,
        assets,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
