// Health check for Coolify. The app itself is "up" even if Nezden's database
// is briefly unreachable (pages then show the closed-gallery state), so this
// reports database reachability without failing the container.
import { sql } from 'drizzle-orm';
import { read } from '@/lib/nezden/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let database = 'ok';
  try {
    await read('health', (db) => db.execute(sql`SELECT 1 FROM art_site_profile LIMIT 1`));
  } catch {
    database = 'unreachable';
  }
  return Response.json({ status: 'ok', database }, { headers: { 'Cache-Control': 'no-store' } });
}
