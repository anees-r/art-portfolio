// Optional instant refresh after a CMS edit in Nezden:
//   curl -X POST https://art.nezden.com/api/revalidate -H "x-revalidate-secret: $REVALIDATE_SECRET"
// Disabled (404) unless REVALIDATE_SECRET is set. Without it, content still
// refreshes on its own every NEZDEN_REVALIDATE_SECONDS.
import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NEZDEN_TAG } from '@/lib/nezden/queries';

export const dynamic = 'force-dynamic';

function authorised(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return new Response('Not found', { status: 404 });
  if (!authorised(request.headers.get('x-revalidate-secret'), secret)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  // expire: 0 → the next visitor gets fresh data rather than the stale copy.
  revalidateTag(NEZDEN_TAG, { expire: 0 });
  return Response.json({ ok: true, revalidated: NEZDEN_TAG, at: new Date().toISOString() });
}

export function GET() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}
