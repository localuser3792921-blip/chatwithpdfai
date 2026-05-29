const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { createVerifiedUser } = require('../helpers');

test('ask a question and get a cited answer', async ({ page }) => {
  await createVerifiedUser(page);
  const pdf = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample-3page.pdf'));
  const up = await page.request.post('/api/documents/upload', { multipart: { file: { name: 'sample-3page.pdf', mimeType: 'application/pdf', buffer: pdf } } });
  expect(up.ok()).toBeTruthy();
  const docId = (await up.json()).document.id;
  await page.goto(`/chat?doc=${docId}`);
  await page.getByTestId('question').fill('What is the invoice total amount due?');
  await page.getByTestId('ask-btn').click();
  await expect(page.getByTestId('answer')).toContainText(/4250/, { timeout: 30000 });
  await expect(page.getByTestId('cite-pages')).toContainText(/2/);
});
