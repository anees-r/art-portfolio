// The art site's data-access layer. UI code calls these functions; it never
// touches SQL. Every function is read-only, server-only and cached.
//
// Caching: each query result is kept in Next's data cache for
// NEZDEN_REVALIDATE_SECONDS (default 60s) under the "nezden" tag. After that the
// next visitor triggers a background re-read, so CMS edits appear within about
// a minute. POST /api/revalidate (when REVALIDATE_SECRET is set) refreshes at once.
import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { asc, sql } from 'drizzle-orm';
import { read } from './db';
import { artSiteArtworks, artSiteCollections, artSiteProfile, artSiteProcessSteps } from './schema';
import { toArtwork, toCollection, toProfile, toProcessStep, toSocialLink } from './normalize';

export const NEZDEN_TAG = 'nezden';
const REVALIDATE = Math.max(5, Number(process.env.NEZDEN_REVALIDATE_SECONDS) || 60);

const cached = (key, fn) =>
  cache(unstable_cache(fn, ['nezden-v1', key], { revalidate: REVALIDATE, tags: [NEZDEN_TAG] }));

const compact = (rows, map) => rows.map(map).filter(Boolean);

// ---------------------------------------------------------------------------
// Raw (cached) reads — one per view
// ---------------------------------------------------------------------------

/** All published artworks, in collection order. @returns {Promise<import('./normalize').Artwork[]>} */
export const getArtworks = cached('artworks', () =>
  read('artworks', async (db) => {
    const rows = await db
      .select()
      .from(artSiteArtworks)
      .orderBy(
        sql`${artSiteArtworks.collectionSort} asc nulls last`,
        asc(artSiteArtworks.sortInCollection),
        asc(artSiteArtworks.id)
      );
    return compact(rows, toArtwork);
  })
);

/** Published collections in order (raw; see getCollections for covers/counts). */
const getCollectionRows = cached('collections', () =>
  read('collections', async (db) => {
    const rows = await db.select().from(artSiteCollections).orderBy(asc(artSiteCollections.sort), asc(artSiteCollections.id));
    return compact(rows, toCollection);
  })
);

/** Artist profile + site settings. The row may be missing → fallbacks. */
export const getProfile = cached('profile', () =>
  read('profile', async (db) => {
    const rows = await db.select().from(artSiteProfile).limit(1);
    return toProfile(rows[0] || null);
  })
);

/** Steps for the "Process" section, in order. */
export const getProcessSteps = cached('process', () =>
  read('process steps', async (db) => {
    const rows = await db
      .select()
      .from(artSiteProcessSteps)
      .orderBy(asc(artSiteProcessSteps.sort), asc(artSiteProcessSteps.id));
    return compact(rows, toProcessStep);
  })
);

/** Social links shown on the art site (query exactly as given in the Nezden brief). */
export const getSocialLinks = cached('social', () =>
  read('social links', async (db) => {
    const res = await db.execute(sql`
      SELECT s.id, s.label, s.url, s.icon, s.icon_color, m.path AS custom_icon_path
      FROM social_link s
      LEFT JOIN media_asset m ON m.id = s.custom_icon_id
      WHERE s.show_on_art_site
      ORDER BY s.sort, s.id`);
    return compact(res.rows, toSocialLink);
  })
);

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Featured artworks ordered by featured_position. */
export async function getFeaturedArtworks() {
  const list = await getArtworks();
  return list
    .filter((a) => a.featured)
    .sort((a, b) => (a.featuredPosition ?? 1e9) - (b.featuredPosition ?? 1e9) || a.id - b.id);
}

/** A lightweight view of an artwork for covers and thumbnails. */
const lite = (a) =>
  a && {
    id: a.id,
    slug: a.slug,
    title: a.title,
    tile: a.tile,
    image: a.image,
    placeholder: a.placeholder,
  };

/**
 * Collections with their cover artwork and work count.
 * cover_artwork_id is a soft reference: if that artwork isn't visible, the
 * collection's first artwork is used instead.
 */
export async function getCollections() {
  const [rows, artworks] = await Promise.all([getCollectionRows(), getArtworks()]);
  return rows.map((c) => {
    const works = artworks.filter((a) => a.collection?.id === c.id);
    const cover = works.find((a) => a.id === c.coverArtworkId) || works[0] || null;
    return { ...c, count: works.length, cover: lite(cover) };
  });
}

/** One collection and its works, or null. */
export async function getCollectionBySlug(s) {
  const [collections, artworks] = await Promise.all([getCollections(), getArtworks()]);
  const collection = collections.find((c) => c.slug === s);
  if (!collection) return null;
  return {
    collection,
    artworks: artworks.filter((a) => a.collection?.id === collection.id),
    collections,
  };
}

/** One artwork plus its neighbours in gallery order, or null. */
export async function getArtworkBySlug(s) {
  const list = await getArtworks();
  const i = list.findIndex((a) => a.slug === s);
  if (i < 0) return null;
  return { artwork: list[i], index: i, total: list.length, prev: lite(list[i - 1]) || null, next: lite(list[i + 1]) || null };
}

/** The hero artwork: profile.hero_artwork_id → first featured → first artwork. */
export function pickHero(profile, artworks, featured) {
  return (
    artworks.find((a) => a.id === profile.heroArtworkId) || featured[0] || artworks[0] || null
  );
}

/** Everything the home page needs, fetched in parallel. */
export async function getGallery() {
  const [profile, artworks, collections, featured, steps, social] = await Promise.all([
    getProfile(),
    getArtworks(),
    getCollections(),
    getFeaturedArtworks(),
    getProcessSteps(),
    getSocialLinks(),
  ]);
  return { profile, artworks, collections, featured, steps, social, hero: pickHero(profile, artworks, featured) };
}

/** Site-wide chrome (nav + footer) for pages other than home. */
export async function getSiteChrome() {
  const [profile, social] = await Promise.all([getProfile(), getSocialLinks()]);
  return { profile, social };
}
