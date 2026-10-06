# Art Portfolio — art.nezden.com

The public art gallery. A Next.js (JavaScript) site that **reads** artwork from
Nezden's PostgreSQL database and presents it with the prototype's design and
motion. It has **no CMS, no admin, no login and no database of its own** —
artwork is created and edited in Nezden (nezden.com/keeper → Art).

```
Nezden CMS ──► Nezden database ──(read-only art_site_* views)──► Art Portfolio ──► visitors
```

## Quick start (local)

Requirements: Node 20.9+ and Docker Desktop.

```bash
npm install
cp .env.example .env.local        # defaults point at the dev fixture below
npm run dev:db                    # optional: stand-in Nezden DB + media server
npm run dev                       # http://localhost:3000
```

`npm run dev:db` starts **docker-compose.dev.yml**: a throwaway Postgres on port
5433 loaded with `dev/fixture.sql` (same names and columns as Nezden's views,
with the prototype's sample gallery) and an nginx on 8090 serving `dev/media`.
It's only so the site runs without Nezden. If you run Nezden locally, skip it
and point `NEZDEN_DATABASE_URL` / `NEZDEN_MEDIA_BASE` at Nezden instead.
Reset the sample data with `npm run dev:db:reset`.

## Environment variables

All are server-side; nothing is sent to the browser.

| Variable | Required | Purpose |
|---|---|---|
| `NEZDEN_DATABASE_URL` | yes | Nezden's connection string **plus** `options=-c%20default_transaction_read_only%3Don` (join with `&` if it already has `?…`). The app warns at startup if the read-only option is missing. |
| `NEZDEN_MEDIA_BASE` | yes | Public base for Nezden's images, e.g. `https://nezden.com/media`. Also needed **at build time** (it sets next/image's allowed host). |
| `SITE_URL` | recommended | This site's public origin, e.g. `https://art.nezden.com` — canonical URLs, Open Graph, sitemap. Falls back to `art_site_url` from Nezden's profile. |
| `NEZDEN_REVALIDATE_SECONDS` | no | How long Nezden data is cached (default `60`). |
| `REVALIDATE_SECRET` | no | Enables `POST /api/revalidate` for instant refresh (404 when unset). |
| `NEZDEN_DB_POOL_MAX` | no | Max DB connections from this app (default `5`). |
| `NEXT_IMAGE_UNOPTIMIZED` | no | `1` serves Nezden's images as-is instead of resizing them (saves CPU). |

## Deploying on Coolify

1. New resource → this Git repository → **Dockerfile** build pack. Port `3000`.
2. Set the environment variables above. Tick **Build Variable** for
   `NEZDEN_MEDIA_BASE` and `SITE_URL`.
3. Same server as Nezden? Use the database's **internal** URL (host = the
   Postgres container name) and put this app on the same Docker network (same
   project/destination, or "Connect to predefined network"). Otherwise expose
   Nezden's Postgres on a public port with SSL and add `sslmode=require`.
4. Health check: `GET /api/health` → `{"status":"ok","database":"ok"|"unreachable"}`.
   It stays 200 when the database blips so the container isn't restarted; pages
   show the "gallery is closed" state meanwhile.

The build never connects to the database (every page renders on request), so
images build fine even when the database is only reachable on the internal network.

## How fresh is the content?

Each Nezden query is cached server-side for `NEZDEN_REVALIDATE_SECONDS`. After
that, the next visitor triggers a background re-read, so a CMS edit shows up
within about a minute without any sync job. If the database is briefly down,
visitors keep seeing the last good copy. For instant updates, have Nezden (or
you) call:

```bash
curl -X POST https://art.nezden.com/api/revalidate -H "x-revalidate-secret: $REVALIDATE_SECRET"
```

## Nezden integration rules (from the handoff brief)

- **Read-only.** Only `SELECT`s, enforced by the connection's read-only option.
- **Never migrate Nezden's database.** The views are declared in
  `lib/nezden/schema.js` with Drizzle's `.existing()`, and `drizzle-kit` is
  deliberately not installed. If a column is missing, add it in Nezden.
- **Views only:** `art_site_artworks`, `art_site_collections`, `art_site_profile`,
  `art_site_process_steps`, plus the documented social-links query.
- Every row is validated in `lib/nezden/normalize.js` before rendering
  (colours, URLs, slugs and media paths), so bad data can't break the layout or
  inject markup.

## Routes

| Route | What |
|---|---|
| `/` | The gallery: hero → work corridor (collection filter) → collections journey + doors → why I make → process → tools → about. Sections follow Nezden's `nav_*` switches and hide when empty. |
| `/work/[slug]` | An artwork. From the gallery it opens as the cinematic overlay (URL updates; Back/Esc closes); loaded directly it's a full page with metadata, Open Graph and JSON-LD. `/artwork/[slug]` redirects here. |
| `/collections/[slug]` | One collection's works. |
| `/sitemap.xml`, `/robots.txt` | Generated from Nezden data. |
| `/api/health`, `/api/revalidate` | Ops endpoints (see above). |

## Code map

```
app/                      routes, loading / error / not-found states, sitemap, API
lib/nezden/db.js          server-only pg pool + Drizzle, sanitised errors
lib/nezden/schema.js      the Nezden views (.existing(), never migrated)
lib/nezden/queries.js     getArtworks, getFeaturedArtworks, getArtworkBySlug,
                          getCollections, getCollectionBySlug, getProfile,
                          getProcessSteps, getSocialLinks, getGallery (all cached)
lib/nezden/normalize.js   row validation → view models
lib/nezden/media.js       mediaUrl() and the placeholder presets
components/gallery/       corridor, viewer, journey/doors, work filter, motion
components/motion/        Lenis smooth scroll, cursor halo, particles, reveals
components/site/          nav, footer, social links
dev/                      DEV-ONLY fixture SQL, sample media, nginx config
```

Motion uses GSAP + ScrollTrigger, Lenis and three.js (loaded lazily after the
page is idle). Visitors with `prefers-reduced-motion` get the prototype's static
fallbacks: no smooth scrolling, particles or scroll choreography, and the viewer
opens instantly.

## Notes

- Artworks without an uploaded image are painted with their `placeholder_preset`
  at 4:5 and labelled "Image coming soon".
- Each artwork's shape is reserved from Nezden's `image_width`/`image_height`,
  so nothing jumps while images load.
- Bad slugs show the gallery's 404 page with `noindex`. Because the page
  streams behind a loading state, the HTTP status is 200 (Next.js's documented
  "soft 404"); search engines still drop it via `noindex`.
