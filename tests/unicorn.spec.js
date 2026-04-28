// @ts-check
const { test, expect } = require('@playwright/test');

async function terminalText(page) {
  return page.locator('#terminal').evaluate((terminal) => terminal.textContent || '');
}

async function waitForPrompt(page) {
  await expect.poll(() => terminalText(page), { timeout: 45_000 }).toContain('>>>');
}

async function setScript(page, script) {
  await page.evaluate((value) => {
    window.editor.setValue(value);
  }, script);
}

async function runScript(page, script) {
  await setScript(page, script);
  await page.locator('#run_button').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForPrompt(page);
});

test('boots the selected firmware to a MicroPython prompt', async ({ page }) => {
  await expect.poll(() => terminalText(page)).toContain('MicroPython');
  await expect.poll(() => terminalText(page)).toContain('>>>');
});

test('runs Python from the editor and writes output to the terminal', async ({ page }) => {
  await runScript(page, "print('playwright-ok')");

  await expect.poll(() => terminalText(page), { timeout: 45_000 }).toContain('playwright-ok');
});

test('runs pyboard LED code and updates the emulated board state', async ({ page }) => {
  await runScript(page, 'import pyb\npyb.LED(1).on()');

  await expect.poll(() => {
    return page.locator('#red_led').evaluate((element) => getComputedStyle(element).display);
  }, { timeout: 45_000 }).not.toBe('none');
});
