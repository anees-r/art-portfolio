// Server-only connection to Nezden's PostgreSQL database.
//
// Ground rules (see README → "Nezden integration"):
//  * read-only: the connection string carries default_transaction_read_only=on
//  * never migrated from here: drizzle-kit is intentionally NOT a dependency
//  * reads the art_site_* views only (plus the documented social-links query)
import 'server-only';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export class NezdenUnavailableError extends Error {
  constructor(message = 'The gallery data source is unavailable.') {
    super(message);
    this.name = 'NezdenUnavailableError';
  }
}

const READ_ONLY_FLAG = 'default_transaction_read_only';

function createPool() {
  const connectionString = process.env.NEZDEN_DATABASE_URL;
  if (!connectionString) {
    // Logged server-side only; visitors see the generic error page.
    console.error('[nezden] NEZDEN_DATABASE_URL is not set.');
    return null;
  }
  if (!decodeURIComponent(connectionString).includes(READ_ONLY_FLAG)) {
    console.warn(
      `[nezden] NEZDEN_DATABASE_URL has no "${READ_ONLY_FLAG}" option. ` +
        'Add ?options=-c%20default_transaction_read_only%3Don so writes are impossible.'
    );
  }
  const pool = new pg.Pool({
    connectionString,
    max: Number(process.env.NEZDEN_DB_POOL_MAX) || 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
    application_name: 'art-portfolio',
  });
  // An idle client erroring (e.g. the database restarted) must not crash the server.
  pool.on('error', (err) => console.error('[nezden] idle client error:', err.code || '', err.message));
  return pool;
}

// Reuse one pool across hot reloads in development — but only while the
// connection string is unchanged. Editing NEZDEN_DATABASE_URL in .env.local
// replaces the pool instead of silently keeping the old address.
const g = globalThis;
const url = process.env.NEZDEN_DATABASE_URL || '';
if (g.__nezdenPool === undefined || g.__nezdenPoolUrl !== url) {
  g.__nezdenPool?.end().catch(() => {});
  g.__nezdenPool = createPool();
  g.__nezdenPoolUrl = url;
}
const pool = g.__nezdenPool;

export const db = pool ? drizzle(pool, { schema }) : null;

/** Runs a read and converts any failure into a sanitised NezdenUnavailableError. */
export async function read(label, fn) {
  if (!db) throw new NezdenUnavailableError();
  try {
    return await fn(db);
  } catch (err) {
    // Drizzle wraps driver errors; log the underlying cause (never the connection string).
    const cause = err?.cause || err;
    // Node reports "localhost" failures as an AggregateError (one error per IPv4/IPv6
    // address tried) with an empty message, so list the addresses it actually tried.
    const tried = Array.isArray(cause?.errors)
      ? cause.errors.map((e) => `${e.address}:${e.port}`).join(', ')
      : '';
    const detail = cause?.message || (tried ? `could not connect to ${tried}` : String(cause));
    const hint =
      cause?.code === 'ECONNREFUSED'
        ? ` — nothing is accepting connections at ${target()}. Check the host and port in NEZDEN_DATABASE_URL.`
        : '';
    console.error(`[nezden] ${label} failed:`, cause?.code || '', detail + hint);
    throw new NezdenUnavailableError();
  }
}

/** host:port/database from NEZDEN_DATABASE_URL, without credentials, for log messages. */
function target() {
  try {
    const u = new URL(process.env.NEZDEN_DATABASE_URL);
    return `${u.hostname}:${u.port || 5432}${u.pathname}`;
  } catch {
    return 'the configured address';
  }
}