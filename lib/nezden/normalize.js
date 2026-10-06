// Turns raw rows from Nezden's views into the small, validated shapes the UI
// renders. Everything that reaches the browser passes through here, so
// external data can't inject CSS, script URLs or broken layouts.
import { mediaUrl, presetCss } from './media';

/**
 * @typedef {{ src: string, width: number|null, height: number|null, alt: string, color: string|null }} ArtImage
 * @typedef {{ id: number, slug: string, title: string, sort: number|null }} CollectionRef
 * @typedef {{
 *   id: number, slug: string, title: string, year: string|null,
 *   collection: CollectionRef|null, medium: string|null, dimensions: string|null,
 *   description: string|null, note: string|null,
 *   image: ArtImage|null, tile: string|null, placeholder: string|null,
 *   featured: boolean, featuredPosition: number|null, sort: number,
 *   publishedAt: string|null, updatedAt: string|null
 * }} Artwork
 * @typedef {{
 *   id: number, slug: string, title: string, description: string|null, range: string|null,
 *   tone: string|null, sort: number, coverArtworkId: number|null, updatedAt: string|null
 * }} Collection
 * @typedef {{ id: number, label: string, url: string, external: boolean, icon: string, iconColor: string|null, customIcon: string|null }} SocialLink
 * @typedef {{ id: number, title: string, body: string|null }} ProcessStep
 */

export const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
export const int = (v) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
const iso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const SLUG = /^[a-z0-9](?:[a-z0-9_-]{0,190})$/i;
export const slug = (v) => (typeof v === 'string' && SLUG.test(v.trim()) ? v.trim() : null);

// Colours end up in CSS custom properties, so only accept plain colour syntax.
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i;
export const hexColor = (v) => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim() : null);
export const cssColor = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return HEX.test(s) || RGB.test(s) ? s : null;
};

/** Only http(s) and mailto links are allowed out to the page. */
export function safeUrl(v, { allowMailto = false } = {}) {
  const s = str(v);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
    if (allowMailto && u.protocol === 'mailto:') return s;
  } catch {}
  return null;
}

/** "Blank line = paragraph break" → array of paragraphs. */
export const paragraphs = (v) =>
  (str(v) || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** @returns {Artwork|null} */
export function toArtwork(r) {
  const id = int(r.id);
  const s = slug(r.slug);
  const title = str(r.title);
  if (id == null || !s || !title) return null; // unusable row

  const full = mediaUrl(r.imagePath);
  const width = int(r.imageWidth);
  const height = int(r.imageHeight);
  const collectionId = int(r.collectionId);
  const collectionSlug = slug(r.collectionSlug);

  return {
    id,
    slug: s,
    title,
    year: str(r.year),
    collection:
      collectionId != null && collectionSlug
        ? { id: collectionId, slug: collectionSlug, title: str(r.collectionTitle) || 'Untitled collection', sort: int(r.collectionSort) }
        : null,
    medium: str(r.medium),
    dimensions: str(r.dimensions),
    description: str(r.description),
    note: str(r.artistNote),
    image: full
      ? {
          src: full,
          width: width > 0 ? width : null,
          height: height > 0 ? height : null,
          alt: str(r.imageAlt) || title,
          color: hexColor(r.imageColor),
        }
      : null,
    // Tile image: custom thumbnail → generated thumbnail → display image.
    tile: full ? mediaUrl(r.thumbnailPath) || mediaUrl(r.imageThumbPath) || full : null,
    placeholder: full ? null : presetCss(str(r.placeholderPreset)),
    featured: r.isFeatured === true,
    featuredPosition: int(r.featuredPosition),
    sort: int(r.sortInCollection) ?? 0,
    publishedAt: iso(r.publishedAt),
    updatedAt: iso(r.updatedAt),
  };
}

/** @returns {Collection|null} */
export function toCollection(r) {
  const id = int(r.id);
  const s = slug(r.slug);
  const title = str(r.title);
  if (id == null || !s || !title) return null;
  return {
    id,
    slug: s,
    title,
    description: str(r.description),
    range: str(r.yearRange),
    tone: cssColor(r.tone),
    sort: int(r.sort) ?? 0,
    coverArtworkId: int(r.coverArtworkId),
    updatedAt: iso(r.updatedAt),
  };
}

export const DEFAULT_PROFILE = {
  name: 'Anees Rehman',
  roleLine: 'Digital artist · Illustrator · Painter',
  title: 'Gallery',
  subtitle: "A collection of things I've made.",
  intro: "Things I've made",
};

export function toProfile(r) {
  const row = r || {};
  const nav = (v) => v !== false; // missing → shown
  const tools = Array.isArray(row.tools) ? row.tools.map(str).filter(Boolean) : [];
  return {
    name: str(row.displayName) || DEFAULT_PROFILE.name,
    roleLine: str(row.roleLine) ?? (r ? null : DEFAULT_PROFILE.roleLine),
    bio: paragraphs(row.bio),
    statement: paragraphs(row.statement),
    focus: str(row.focus),
    tools,
    portrait: mediaUrl(row.portraitPath),
    title: str(row.title) || DEFAULT_PROFILE.title,
    subtitle: str(row.subtitle) ?? (r ? null : DEFAULT_PROFILE.subtitle),
    intro: str(row.introHeading) || DEFAULT_PROFILE.intro,
    heroArtworkId: int(row.heroArtworkId),
    nav: {
      work: nav(row.navWork),
      collections: nav(row.navCollections),
      process: nav(row.navProcess),
      about: nav(row.navAbout),
    },
    nezdenUrl: safeUrl(row.nezdenUrl),
    artSiteUrl: safeUrl(row.artSiteUrl),
    devSiteUrl: safeUrl(row.devSiteUrl),
  };
}

/** @returns {ProcessStep|null} */
export function toProcessStep(r) {
  const id = int(r.id);
  const title = str(r.title);
  if (id == null || !title) return null;
  return { id, title, body: str(r.body) };
}

const ICONS = new Set(['github', 'instagram', 'linkedin', 'behance', 'mail', 'globe']);

/** @returns {SocialLink|null} */
export function toSocialLink(r) {
  const id = int(r.id);
  const label = str(r.label);
  const url = safeUrl(r.url, { allowMailto: true });
  if (id == null || !label || !url) return null;
  const icon = str(r.icon);
  const isMail = url.startsWith('mailto:');
  return {
    id,
    label,
    url,
    external: !isMail,
    icon: icon && ICONS.has(icon) ? icon : isMail ? 'mail' : 'globe',
    iconColor: cssColor(r.icon_color),
    customIcon: mediaUrl(r.custom_icon_path),
  };
}

/** Hostname for display, e.g. "nezden.com". */
export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};
