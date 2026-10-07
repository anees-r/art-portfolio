import { getGallery } from '@/lib/nezden/queries';
import { hostOf } from '@/lib/nezden/normalize';
import { siteOrigin, excerpt, homeSections } from '@/lib/site';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import SocialLinks from '@/components/site/SocialLinks';
import ArtVisual from '@/components/ArtVisual';
import GalleryProvider from '@/components/gallery/GalleryProvider';
import WorkSection from '@/components/gallery/WorkSection';
import CollectionsSection from '@/components/gallery/CollectionsSection';
import HomeMotion from '@/components/gallery/HomeMotion';
import Threads from '@/components/gallery/Threads';
import Reveals from '@/components/motion/Reveals';
import { processStage, pad2 } from '@/components/gallery/format';
import { PRESETS } from '@/lib/nezden/media';

// Rendered per request (never at build time, so builds don't need the database);
// the Nezden reads themselves are cached — see lib/nezden/queries.js.
export const dynamic = 'force-dynamic';

// Process steps are hung across the width (0 = left edge, 1 = right edge), each piece slightly askew.
const STEP_X = [0.06, 0.7, 0.3, 0.94, 0.48, 0.12, 0.82];
const STEP_TILT = [-2.5, 2, -1.5, 3, -2, 1.5, -3];

export async function generateMetadata() {
  try {
    const { profile, hero } = await getGallery();
    const title = `${profile.title} · ${profile.name}`;
    const description = excerpt(profile.subtitle || profile.bio[0] || `Artwork by ${profile.name}.`);
    const image = hero?.image ? [{ url: hero.image.src, width: hero.image.width, height: hero.image.height, alt: hero.image.alt }] : undefined;
    return {
      title,
      description,
      alternates: { canonical: '/' },
      openGraph: { type: 'website', url: `${siteOrigin(profile)}/`, siteName: title, title, description, images: image },
      twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image?.map((i) => i.url) },
    };
  } catch {
    return { title: 'Gallery' };
  }
}

export default async function HomePage() {
  const g = await getGallery();
  const { profile, artworks, collections, steps, social, hero } = g;
  const sections = homeSections(g);
  const tones = Object.fromEntries(collections.map((c) => [c.id, c.tone]));
  const chips = collections
    .filter((c) => c.count > 0)
    .map(({ id, slug, title, description, range, count, tone }) => ({ id, slug, title, description, range, count, tone }));
  const show = Object.fromEntries(sections.map((s) => [s.id, true]));
  const back = profile.nezdenUrl ? { url: profile.nezdenUrl, label: hostOf(profile.nezdenUrl) } : null;

  return (
    <>
      <Nav title={profile.title} sections={sections} home />
      <main id="content">
        <GalleryProvider artworks={artworks} tones={tones} siteName={profile.name}>
          {/* Hero: the entrance */}
          <div className="hero-track" id="top">
            <div className="hero">
              <svg className="thread" data-thread="hero" aria-hidden="true" focusable="false">
                <path className="t-line" />
                <circle className="t-head" r="4" />
              </svg>
              <div className="hero-door" />
              <div className="hero-copy">
                <h1>{profile.title.toUpperCase()}</h1>
                {profile.subtitle && <p className="tag">{profile.subtitle}</p>}
                <div className="by">
                  <b>{profile.name}</b>
                  {profile.roleLine && <span>{profile.roleLine}</span>}
                </div>
              </div>
              <div className="scrollcue" aria-hidden="true">
                <span>Enter</span>
                <i />
              </div>
            </div>
          </div>

          {show.work && <WorkSection heading={profile.intro} chips={chips} />}

          {show.collections && <CollectionsSection collections={collections} />}

          {profile.statement.length > 0 && (
            <section id="why" className="wrap why">
              <div className="label rv">Why I make</div>
              <blockquote>
                {profile.statement.map((p, i) => (
                  <p key={i} className="line">
                    {p}
                  </p>
                ))}
              </blockquote>
            </section>
          )}

          {show.process && (
            <section id="process" className="wrap process">
              <svg className="thread" data-thread="process" aria-hidden="true" focusable="false">
                <path className="t-line" />
                <circle className="t-head" r="3.5" />
              </svg>
              <div className="label rv">Process</div>
              <h2 className="sec rv">From a feeling to a finished piece</h2>
              <div className="flow" id="flow">
                {steps.map((s, i) => {
                  const x = STEP_X[i % STEP_X.length];
                  return (
                    <div
                      className={`step${x > 0.5 ? ' flip' : ''}`}
                      key={s.id}
                      style={{ '--x': x, '--tilt': `${STEP_TILT[i % STEP_TILT.length]}deg` }}
                    >
                      <div className="th">
                        {hero && (
                          <ArtVisual art={hero} variant="tile" decorative sizes="180px" style={processStage(i, steps.length)} />
                        )}
                      </div>
                      <div className="txt">
                        <span className="num">{pad2(i + 1)}</span>
                        <h3>{s.title}</h3>
                        {s.body && <p>{s.body}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {profile.tools.length > 0 && (
            <section id="tools" className="tools">
              <div className="wrap tools-head">
                <div className="label rv">Tools &amp; mediums</div>
                <h2 className="sec rv">Ways I make</h2>
              </div>
              <ul className="sr">
                {profile.tools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {/* Two rows of the same words, sliding past each other as you scroll. */}
              <div className="tool-rows" aria-hidden="true">
                {[1, -1].map((dir) => {
                  const list = dir > 0 ? profile.tools : [...profile.tools].reverse();
                  const words = Array.from({ length: Math.ceil(16 / list.length) }, () => list).flat();
                  return (
                    <div className={`tool-row${dir < 0 ? ' outline' : ''}`} data-dir={dir} key={dir}>
                      <div className="tool-run">
                        {words.map((t, i) => (
                          <span key={i}>
                            <b>{t}</b>
                            <i>✦</i>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {show.about && (
            <section id="about" className="wrap about">
              <div className="portrait rv">
                {profile.portrait ? (
                  <ArtVisual
                    art={{ title: profile.name, image: { src: profile.portrait, alt: `Portrait of ${profile.name}` } }}
                  />
                ) : (
                  <div className="art ph" style={{ background: PRESETS.Moon, width: '100%', height: '100%' }} aria-hidden="true" />
                )}
              </div>
              <div>
                <div className="label rv">About the artist</div>
                <h2 className="sec rv">{profile.name}</h2>
                {profile.bio.map((p, i) => (
                  <p key={i} className="rv">
                    {p}
                  </p>
                ))}
                {profile.focus && (
                  <div className="facts rv">
                    <div>
                      <span className="label">Currently exploring</span>
                      <span className="serif" style={{ fontSize: 24, lineHeight: 1.35 }}>
                        {profile.focus}
                      </span>
                    </div>
                  </div>
                )}
                <SocialLinks links={social} back={back} />
              </div>
            </section>
          )}

          <HomeMotion />
          <Threads />
          <Reveals />
        </GalleryProvider>
      </main>
      <Footer profile={profile} />
    </>
  );
}
