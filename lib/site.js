// Site-level helpers shared by metadata, sitemap and pages (server side).
import 'server-only';

/** Public origin of the site: SITE_URL → Nezden profile's art_site_url → localhost. */
export function siteOrigin(profile) {
  const candidates = [process.env.SITE_URL, profile?.artSiteUrl, 'http://localhost:3000'];
  for (const c of candidates) {
    try {
      if (c) return new URL(c).origin;
    } catch {}
  }
  return 'http://localhost:3000';
}

/** First paragraph trimmed to a meta-description length. */
export function excerpt(text, max = 160) {
  const s = String(text || '').split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** Which home sections exist, honouring the profile's nav_* switches and the data present. */
export function homeSections(g) {
  const { profile, artworks, collections, steps } = g;
  return [
    ['work', 'Work', profile.nav.work],
    ['collections', 'Collections', profile.nav.collections && collections.length > 0],
    ['process', 'Process', profile.nav.process && steps.length > 0],
    ['about', 'About', profile.nav.about],
  ]
    .filter((s) => s[2])
    .map(([id, label]) => ({ id, label }));
}
