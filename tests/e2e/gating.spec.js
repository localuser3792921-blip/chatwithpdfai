const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

test('product requires login + a verified email', async ({ page }) => {
  const pdf = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample-3page.pdf'));
  const mp = { multipart: { file: { name: 's.pdf', mimeType: 'application/pdf', buffer: pdf } } };
  // not signed in -> 401
  let r = await page.request.post('/api/documents/upload', mp);
  expect(r.status()).toBe(401);
  // signed up but not verified -> 403
  const email = `e2e_gate_${Date.now()}@example.com`;
  const s = await page.request.post('/api/auth/signup', { data: { email, password: 'testpass123' } });
  expect(s.ok()).toBeTruthy();
  r = await page.request.post('/api/documents/upload', mp);
  expect(r.status()).toBe(403);
  // verify -> allowed
  const uid = (await s.json()).user.id;
  const c = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await c.query('UPDATE users SET email_verified = 1 WHERE id = ?', [uid]); await c.end();
  r = await page.request.post('/api/documents/upload', mp);
  expect(r.ok()).toBeTruthy();
});
