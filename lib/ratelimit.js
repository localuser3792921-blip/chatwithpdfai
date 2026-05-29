// =================================================================
// Lightweight DB-backed rate limiter: max N actions per IP per window,
// per named bucket. Fail-open if no IP (can't fairly limit). Old rows
// are ignored by the window filter (prune periodically as a follow-up).
// =================================================================
import { query } from '@/lib/db';

export async function rateLimit({ bucket, ip, max, windowMin }) {
  if (!ip) return true;
  try {
    const rows = await query(
      'SELECT COUNT(*) AS c FROM rate_limits WHERE bucket = ? AND ip = ? AND created_at > (NOW() - INTERVAL ? MINUTE)',
      [bucket, ip, windowMin]
    );
    if (Number(rows[0].c) >= max) return false;
    await query('INSERT INTO rate_limits (bucket, ip) VALUES (?, ?)', [bucket, ip]);
    return true;
  } catch (e) {
    console.error('[ratelimit] failed (fail-open)', e.message);
    return true; // never block real users on limiter infra failure
  }
}
