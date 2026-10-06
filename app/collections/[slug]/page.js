import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { getCollectionBySlug, getGallery } from '@/lib/nezden/queries';
import { siteOrigin, excerpt, homeSections } from '@/lib/site';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import GalleryProvider from '@/components/gallery/GalleryProvider';
import Corridor from '@/components/gallery/Corridor';
import Reveals from '@/components/motion/Reveals';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const [found, g] = await Promise.all([getCollectionBySlug(slug), getGallery()]);
    const { profile } = g;
    if (!found) notFound();
    const c = found.collection;
    const title = `${c.title} · ${profile.name}`;
    const description = excerpt(c.description) || `${c.title}, a collection by ${profile.name}.`;
    const cover = found.artworks.find((a) => a.id === c.cover?.id)?.image;
    const images = cover ? [{ url: cover.src, width: cover.width ?? undefined, height: cover.height ?? undefined, alt: cover.alt }] : undefined;
    return {
      title,
      description,
      alternates: { canonical: `/collections/${c.slug}` },
      openGraph: { type: 'website', url: `${siteOrigin(profile)}/collections/${c.slug}`, title, description, images },
      twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
    };
  } catch (e) {
    unstable_rethrow(e); // let notFound() through
    return { title: 'Gallery' };
  }
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const [found, g] = await Promise.all([getCollectionBySlug(slug), getGallery()]);
  if (!found) notFound();
  const { collection: c, artworks, collections } = found;
  const { profile } = g;
  const tones = Object.fromEntries(collections.map((x) => [x.id, x.tone]));
  const others = collections.filter((x) => x.count > 0);

  return (
    <>
      <Nav title={profile.title} sections={homeSections(g)} />
      <main id="content">
        <GalleryProvider artworks={artworks} tones={tones} siteName={profile.name}>
          <section className="wrap" id="work">
            <div className="col-head" style={c.tone ? { '--tone': c.tone } : undefined}>
              <span className="label rv">
                Collection{c.range ? ` · ${c.range}` : ''} · {c.count} {c.count === 1 ? 'work' : 'works'}
              </span>
              <h1 className="sec rv">{c.title}</h1>
              {c.description && <p className="rv">{c.description}</p>}
              <nav className="chips rv" aria-label="Collections">
                <Link className="chip" href="/#work">
                  All
                </Link>
                {others.map((x) => (
                  <Link
                    key={x.id}
                    className={`chip${x.id === c.id ? ' on' : ''}`}
                    href={`/collections/${x.slug}`}
                    aria-current={x.id === c.id ? 'page' : undefined}
                  >
                    {x.title}
                  </Link>
                ))}
              </nav>
            </div>
            <Corridor items={artworks} empty="Nothing from this collection is hanging yet." />
          </section>
          <Reveals />
        </GalleryProvider>
      </main>
      <Footer profile={profile} />
    </>
  );
}
