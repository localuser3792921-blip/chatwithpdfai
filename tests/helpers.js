const mysql = require('mysql2/promise');
// Sign up via the page's request context (cookie lands in the browser context),
// then mark the email verified in the DB (simulating the verify-link click).
async function createVerifiedUser(page, { credits = 0 } = {}) {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const r = await page.request.post('/api/auth/signup', { data: { email, password: 'testpass123' } });
  if (!r.ok()) throw new Error('signup failed: ' + r.status());
  const userId = (await r.json()).user.id;
  const c = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await c.query('UPDATE users SET email_verified = 1 WHERE id = ?', [userId]);
  if (credits > 0) await c.query('INSERT INTO user_credits (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = ?', [userId, credits, credits]);
  await c.end();
  return { email, userId };
}
module.exports = { createVerifiedUser };
