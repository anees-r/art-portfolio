import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { getArtworkBySlug, getProfile, getCollections } from '@/lib/nezden/queries';
import { siteOrigin, excerpt } from '@/lib/site';
import ArtVisual from '@/components/ArtVisual';
import Magnifier from '@/components/gallery/Magnifier';
import ArtworkMeta from '@/components/gallery/ArtworkMeta';
import DetailMotion from '@/components/gallery/DetailMotion';
import { pad2, viewerTone } from '@/components/gallery/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const [found, profile] = await Promise.all([getArtworkBySlug(slug), getProfile()]);
    if (!found) notFound();
    const a = found.artwork;
    const title = `${a.title} · ${profile.name}`;
    const description = excerpt(a.description) || [a.year, a.medium, a.collection?.title].filter(Boolean).join(' · ') || `Artwork by ${profile.name}.`;
    const url = `${siteOrigin(profile)}/work/${a.slug}`;
    const images = a.image ? [{ url: a.image.src, width: a.image.width ?? undefined, height: a.image.height ?? undefined, alt: a.image.alt }] : undefined;
    return {
      title,
      description,
      alternates: { canonical: `/work/${a.slug}` },
      openGraph: {
        type: 'article',
        url,
        title,
        description,
        siteName: `${profile.title} · ${profile.name}`,
        images,
        ...(a.publishedAt ? { publishedTime: a.publishedAt } : {}),
        ...(a.updatedAt ? { modifiedTime: a.updatedAt } : {}),
      },
      twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
    };
  } catch (e) {
    unstable_rethrow(e); // let notFound() through
    return { title: 'Gallery' };
  }
}

export default async function WorkPage({ params }) {
  const { slug } = await params;
  const [found, profile, collections] = await Promise.all([getArtworkBySlug(slug), getProfile(), getCollections()]);
  if (!found) notFound();
  const { artwork: a, index, total, prev, next } = found;
  const tone = a.collection ? collections.find((c) => c.id === a.collection.id)?.tone : null;
  const closeHref = `/#art-${a.slug}`;
  const origin = siteOrigin(profile);

  // Structured data for search engines.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: a.title,
    url: `${origin}/work/${a.slug}`,
    ...(a.description ? { description: a.description } : {}),
    ...(a.image ? { image: a.image.src } : {}),
    ...(a.year ? { dateCreated: a.year } : {}),
    ...(a.medium ? { artMedium: a.medium } : {}),
    ...(a.dimensions ? { size: a.dimensions } : {}),
    ...(a.collection ? { isPartOf: { '@type': 'Collection', name: a.collection.title, url: `${origin}/collections/${a.collection.slug}` } } : {}),
    creator: { '@type': 'Person', name: profile.name },
  };

  return (
    <main id="content" className="work-page" style={{ '--vtone': viewerTone(tone) }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="v-bg" />
      <div className="v-count">
        {pad2(index + 1)} / {pad2(total)}
      </div>
      <Link className="v-close" href={closeHref}>
        Close <span aria-hidden="true">×</span>
      </Link>
      <div className="v-grid">
        <div className="v-stage">
          <ArtVisual art={a} priority quality={85} sizes="(max-width: 860px) 100vw, 62vw" />
          <Magnifier art={a} />
        </div>
        <aside className="v-meta">
          <ArtworkMeta
            art={a}
            Heading="h1"
            nav={
              <nav className="v-nav" aria-label="Artworks">
                {prev ? (
                  <Link href={`/work/${prev.slug}`} rel="prev">
                    ← Previous
                  </Link>
                ) : (
                  <span className="off">← Previous</span>
                )}
                {next ? (
                  <Link href={`/work/${next.slug}`} rel="next">
                    Next →
                  </Link>
                ) : (
                  <span className="off">Next →</span>
                )}
                <Link href="/#work">All work</Link>
              </nav>
            }
          />
        </aside>
      </div>
      <DetailMotion
        slug={a.slug}
        prevHref={prev ? `/work/${prev.slug}` : null}
        nextHref={next ? `/work/${next.slug}` : null}
        closeHref={closeHref}
      />
    </main>
  );
}
