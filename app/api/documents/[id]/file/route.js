import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { documents } from '@/lib/store/documents';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function flagOn() { return process.env.PRODUCT_MVP_ENABLED === '1' || process.env.TEST_MODE === '1'; }

export async function GET(req, { params }) {
  if (!flagOn()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const id = Number(params?.id);
  if (!(id > 0)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const u = await getCurrentUser(req);
    if (!u) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    const doc = await documents.getDocument(id);
    if (!doc || Number(doc.user_id) !== Number(u.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!doc.disk_path) return NextResponse.json({ error: 'File unavailable' }, { status: 404 });
    const buf = await fs.readFile(doc.disk_path);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="document.pdf"',
        'Content-Length': String(buf.length),
        'Cache-Control': 'private, max-age=120',
      },
    });
  } catch (e) {
    if (e && e.code === 'ENOENT') return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    console.error('[documents/:id/file] failed', e);
    return NextResponse.json({ error: 'Could not load file' }, { status: 500 });
  }
}
