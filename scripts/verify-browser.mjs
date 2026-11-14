import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : {}),
});
const checks = [];
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  timezoneId: 'Asia/Seoul',
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400)
    errors.push(`HTTP ${response.status()} ${response.url()}`);
});
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const input = page.getByLabel('어떤 일을 계획하고 있나요?');
const add = page.getByRole('button', { name: '할 일 추가' });
const date = page.locator('.result-list > div').nth(0);
const time = page.locator('.result-list > div').nth(1);
const title = page.locator('.result-list > div').nth(2);
const draft = page.getByRole('region', { name: '일정 초안', exact: true });
await mkdir('artifacts', { recursive: true });

try {
  await page.goto(process.env.DEMO_URL ?? 'http://127.0.0.1:5173');
  await expect(add).toBeDisabled();
  await expect(draft).toHaveCount(0);
  await page.locator('.contract-panel > summary').click();
  await page.getByLabel('기준 시각 (ISO 8601)').fill('2026-11-14T01:00:00Z');
  await page.getByLabel('IANA 시간대').fill('Asia/Seoul');
  await page.locator('.contract-panel > summary').click();

  for (const [text, state, enabled] of [
    ['다음', 'incomplete', false],
    ['다음 주', 'resolved', false],
    ['다음 주 월요일에', 'resolved', true],
    ['다음 주 월요일에 오후', 'resolved', true],
  ]) {
    await page
      .locator('.example-list button')
      .filter({ hasText: new RegExp(`^${text}↗$`, 'u') })
      .click();
    await expect(input).toHaveValue(text);
    await expect(date).toContainText(state);
    if (enabled) await expect(add).toBeEnabled();
    else await expect(add).toBeDisabled();
    await expect(draft).toHaveCount(0);
  }
  checks.push(
    'example selection, incomplete/range/single date states, no automatic draft',
  );

  await input.fill('다음 주 월요일에');
  await expect(date).toContainText('2026-11-16');
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(draft).toBeVisible();
  await expect(page.getByLabel('초안 제목')).toHaveValue('');
  await expect(page.getByLabel('초안 제목')).toBeFocused();
  await expect(page.getByLabel('초안 날짜')).toHaveValue('2026-11-16');
  await expect(page.getByLabel('초안 시간 (선택)')).toHaveValue('');
  await page.getByLabel('초안 제목').fill('제목 편집');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('초안 날짜')).toBeFocused();
  await page.screenshot({
    path: 'artifacts/titleless-draft-desktop.png',
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(draft).toHaveCount(0);
  await expect(add).toBeFocused();
  checks.push(
    'titleless draft, blank optional time, editing, keyboard Enter/Tab/Escape and focus return',
  );

  await input.fill('내일 오후 3시 2');
  await expect(time).toContainText('incomplete');
  await expect(date).toContainText('2026-11-15');
  await expect(title).toContainText('none');
  await add.click();
  await expect(page.getByLabel('초안 시간 (선택)')).toHaveValue('');
  await expect(draft).toContainText('오후 3시 2');
  await page.getByLabel('초안 제목').fill('입력 중인 초안');
  await input.fill('내일 오후 3시 회의');
  await expect(time).toContainText('15:00');
  await expect(page.getByLabel('초안 제목')).toHaveValue('입력 중인 초안');
  await expect(page.getByLabel('초안 시간 (선택)')).toHaveValue('');
  await page.getByRole('button', { name: '초안 닫기' }).click();
  await add.click();
  await expect(page.getByLabel('초안 제목')).toHaveValue('회의');
  await expect(page.getByLabel('초안 시간 (선택)')).toHaveValue('15:00');
  await page.getByRole('button', { name: '초안 닫기' }).click();
  checks.push(
    'incomplete time stays blank, captured draft survives input edits, resolved time/title transfer',
  );

  for (const text of [
    '내일 3시 회의',
    '내일 24:00 회의',
    '오늘 내일 회의',
    '오후3시 회의',
    '다음',
    '다음 주',
    '내일 매주 월요일 회의',
    '내일 3시부터 4시까지',
  ]) {
    await input.fill(text);
    await expect(add).toBeDisabled();
  }
  await input.fill('내일 매주 월요일 회의');
  await page.locator('.recognition-details > summary').click();
  await expect(page.locator('.recognition-details')).toContainText(
    'unsupported-expression',
  );
  await input.fill('회의 🗓️ 내일 오후3시 준비');
  await expect(page.getByLabel('인식한 원문')).toContainText(
    '회의 🗓️ 내일 오후3시 준비',
  );
  await expect(page.getByLabel('필드 추론 근거')).toContainText(
    'meridiem-to-24-hour',
  );
  await expect(title).toContainText('회의 🗓️ 준비');
  await page.locator('.recognition-details > summary').click();
  checks.push(
    'ambiguous/invalid/missing dates and unsupported guards disable action; source spans and derivations visible',
  );

  await page.locator('.contract-panel > summary').click();
  await page.getByLabel('IANA 시간대').fill('Invalid/Zone');
  await expect(page.getByRole('alert')).toContainText('unsupported-time-zone');
  await expect(add).toBeDisabled();
  await page.getByLabel('IANA 시간대').fill('Asia/Seoul');
  await page.getByLabel('기준 시각 (ISO 8601)').fill('invalid');
  await expect(page.getByRole('alert')).toContainText(
    'invalid-reference-instant',
  );
  await expect(add).toBeDisabled();
  await page.getByLabel('기준 시각 (ISO 8601)').fill('2026-11-14T01:00:00Z');
  await page.locator('.contract-panel > summary').click();
  checks.push(
    'invalid-context messages and disabled action, followed by recovery',
  );

  await input.fill('내일 오후');
  await input.focus();
  // Composition events exercise rerenders during IME; a native Korean IME remains a manual check.
  await input.dispatchEvent('compositionstart', { data: '' });
  await page.keyboard.insertText(' 3시');
  await expect(input).toBeFocused();
  await input.dispatchEvent('compositionend', { data: ' 3시' });
  await expect(time).toContainText('15:00');
  await expect(input).toBeFocused();
  checks.push(
    'composition events and text updates preserve textarea focus (synthetic IME)',
  );

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await input.fill('내일 오후 3시 2');
    await add.click();
    await expect(page.getByLabel('초안 제목')).toBeFocused();
    const dimensions = await page.locator('html').evaluate((element) => ({
      scroll: element.scrollWidth,
      viewport: element.clientWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.viewport,
      `horizontal overflow at ${width}px`,
    );
    await expect(page.getByLabel('초안 시간 (선택)')).toHaveValue('');
    await page.screenshot({
      path: `artifacts/incomplete-draft-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press('Escape');
  }
  checks.push(
    '375px and 320px layouts, no horizontal overflow, editable incomplete draft and keyboard dismissal',
  );
  assert.deepEqual(errors, []);
  checks.push('no browser console/page errors');
  await writeFile(
    'artifacts/browser-verification.json',
    JSON.stringify(
      { browser: await browser.version(), checks, errors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally {
  await browser.close();
}
