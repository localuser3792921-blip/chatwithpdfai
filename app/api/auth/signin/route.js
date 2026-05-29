import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isEmail, clip, getClientIp } from '@/lib/validate';
import { verifyPassword, createSession, sessionCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_FAILS = 5;
const LOCK_MIN = 15;
function flagOn() { return process.env.PRODUCT_MVP_ENABLED === '1' || process.env.TEST_MODE === '1'; }
export async function POST(req) {
  if (!flagOn()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ip = getClientIp(req);
  if (!(await rateLimit({ bucket: 'signin', ip, max: 10, windowMin: 10 }))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
  }
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const email = clip(body.email, 320).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isEmail(email) || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  try {
    const rows = await query('SELECT id, email, name, password_hash, failed_login_attempts, locked_until FROM users WHERE email = ?', [email]);
    const u = rows[0];
    if (u && u.locked_until && new Date(u.locked_until) > new Date()) {
      return NextResponse.json({ error: 'Account temporarily locked after too many failed attempts. Try again later.' }, { status: 429 });
    }
    if (!u || !(await verifyPassword(password, u.password_hash))) {
      if (u) {
        const fails = (u.failed_login_attempts || 0) + 1;
        if (fails >= MAX_FAILS) await query('UPDATE users SET failed_login_attempts = ?, locked_until = NOW() + INTERVAL ? MINUTE WHERE id = ?', [fails, LOCK_MIN, u.id]);
        else await query('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [fails, u.id]);
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    await query('UPDATE users SET last_signin_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [u.id]);
    const token = await createSession(u.id, req);
    const res = NextResponse.json({ ok: true, user: { id: u.id, email: u.email, name: u.name } });
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (e) { console.error('[signin] failed', e); return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 }); }
}
