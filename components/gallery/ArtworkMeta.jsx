import { Fragment } from 'react';
import Link from 'next/link';
import { paragraphsOf } from './format';

/**
 * The placard beside an artwork: shared by the cinematic viewer overlay and
 * the standalone /work/[slug] page so both read identically.
 */
export default function ArtworkMeta({ art, Heading = 'h2', nav, onNavigate }) {
  const c = art.collection;
  const rows = [
    ['Year', art.year],
    ['Medium', art.medium],
    ['Size', art.dimensions],
  ].filter((r) => r[1]);
  const desc = paragraphsOf(art.description);

  return (
    <>
      {c ? (
        <Link className="label" href={`/collections/${c.slug}`} onClick={onNavigate}>
          {c.title}
        </Link>
      ) : (
        <span className="label">Uncollected</span>
      )}
      <Heading>{art.title}</Heading>
      {rows.length > 0 && (
        <dl>
          {rows.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
      )}
      {desc.length > 0 && (
        <div className="desc">
          {desc.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {art.note && (
        <div className="note">
          <span className="label">Artist note</span>
          {paragraphsOf(art.note).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {!art.image && <span className="phl">Image coming soon</span>}
      {nav}
    </>
  );
}
