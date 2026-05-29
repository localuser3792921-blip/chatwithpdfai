const { test, expect } = require('@playwright/test');
const path = require('path');
const { createVerifiedUser } = require('../helpers');

test.beforeEach(async ({ page }) => { await createVerifiedUser(page); });

test('upload a real PDF is processed end to end', async ({ page }) => {
  await page.goto('/upload.html');
  await page.getByTestId('file-input').setInputFiles(path.join(__dirname, '..', 'fixtures', 'sample-3page.pdf'));
  await page.getByTestId('upload-btn').click();
  await expect(page.getByTestId('status')).toContainText(/ready.*3 page/i, { timeout: 28000 });
  await expect(page.getByTestId('doc-pages').first()).toHaveText('3');
});

test('a non-PDF upload is rejected', async ({ page }) => {
  await page.goto('/upload.html');
  await page.getByTestId('file-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a pdf') });
  await page.getByTestId('upload-btn').click();
  await expect(page.getByTestId('status')).toContainText(/only pdf/i, { timeout: 15000 });
});
