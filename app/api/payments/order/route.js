import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createOrder, keyId, configured } from '@/lib/razorpay';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function flagOn() { return process.env.PRODUCT_MVP_ENABLED === '1' || process.env.TEST_MODE === '1'; }
export async function POST(req) {
  if (!flagOn()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!configured()) return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 });
  const u = await getCurrentUser(req);
  if (!u) return NextResponse.json({ error: 'Please sign in to buy credits' }, { status: 401 });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const packCode = typeof body.packCode === 'string' ? body.packCode : '';
  try {
    const packs = await query('SELECT id, code, name, price_inr, credits FROM credit_packs WHERE code = ? AND active = 1', [packCode]);
    const pack = packs[0];
    if (!pack) return NextResponse.json({ error: 'Unknown pack' }, { status: 404 });
    const order = await createOrder({ amountPaise: pack.price_inr * 100, receipt: `cwpai_${u.id}_${Date.now()}`, notes: { userId: String(u.id), packCode: pack.code, credits: String(pack.credits) } });
    await query('INSERT INTO purchases (user_id, pack_id, razorpay_order_id, amount_inr, credits, status) VALUES (?,?,?,?,?,?)', [u.id, pack.id, order.id, pack.price_inr, pack.credits, 'created']);
    return NextResponse.json({ ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: keyId(), pack: { name: pack.name, credits: pack.credits, priceInr: pack.price_inr } });
  } catch (e) { console.error('[pay/order] failed', e); return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 }); }
}
