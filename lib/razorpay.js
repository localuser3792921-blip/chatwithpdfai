// =================================================================
// Razorpay gateway helpers: create order (Orders API) + verify the
// payment signature (client callback) and webhook signature (server).
// Keys come from process.env (RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET).
// =================================================================
import crypto from 'node:crypto';

export function keyId() { return process.env.RAZORPAY_KEY_ID || null; }
export function configured() { return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET); }

export async function createOrder({ amountPaise, receipt, notes }) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes, payment_capture: 1 }),
  });
  if (!r.ok) throw new Error(`razorpay order ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

function safeEqual(a, b) {
  try { const ba = Buffer.from(a), bb = Buffer.from(b); return ba.length === bb.length && crypto.timingSafeEqual(ba, bb); }
  catch { return false; }
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature || '');
}

export function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(rawBody).digest('hex');
  return safeEqual(expected, signature || '');
}
