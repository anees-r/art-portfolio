import { getArtworks, getCollections, getProfile } from '@/lib/nezden/queries';
import { siteOrigin } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  try {
    const [profile, artworks, collections] = await Promise.all([getProfile(), getArtworks(), getCollections()]);
    const o = siteOrigin(profile);
    const latest = [...artworks, ...collections].map((x) => x.updatedAt).filter(Boolean).sort().pop();
    return [
      { url: `${o}/`, lastModified: latest || undefined, changeFrequency: 'weekly', priority: 1 },
      ...collections.map((c) => ({ url: `${o}/collections/${c.slug}`, lastModified: c.updatedAt || undefined, changeFrequency: 'monthly', priority: 0.6 })),
      ...artworks.map((a) => ({
        url: `${o}/work/${a.slug}`,
        lastModified: a.updatedAt || undefined,
        changeFrequency: 'monthly',
        priority: a.featured ? 0.9 : 0.8,
        ...(a.image ? { images: [a.image.src] } : {}),
      })),
    ];
  } catch {
    // Database unreachable: still serve a valid (minimal) sitemap.
    return [{ url: `${siteOrigin(null)}/` }];
  }
}
