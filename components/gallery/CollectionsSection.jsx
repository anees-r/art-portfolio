'use client';

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import ArtVisual from '@/components/ArtVisual';
import { useGallery } from './GalleryProvider';
import { ScrollTrigger, prefersReducedMotion } from '@/lib/motion';

const works = (n) => `${n} ${n === 1 ? 'work' : 'works'}`;
const rangeLine = (c) => [c.range, works(c.count)].filter(Boolean).join(' · ');

/**
 * "Collections": a pinned journey where a lit path travels node to node as you
 * scroll (each collection's tone washing the room), followed by arched doors
 * that re-hang the corridor with that collection.
 */
export default function CollectionsSection({ collections }) {
  const { requestFilter } = useGallery();
  const n = collections.length;
  const clipId = useId().replace(/:/g, '');
  const journey = useRef(null);
  const inner = useRef(null);
  const rect = useRef(null);
  const nodes = useRef([]);
  const seq = useRef([]);
  const cur = useRef(-1);
  const [info, setInfo] = useState(0);
  const [swap, setSwap] = useState(false);

  // Path geometry, exactly as the prototype computes it (viewBox 1000×200).
  const { pts, d } = useMemo(() => {
    if (!n) return { pts: [], d: '' };
    const p = collections.map((_, i) => [n === 1 ? 500 : 70 + i * (860 / (n - 1)), 100 + (i % 2 ? -42 : 42)]);
    let path = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = p[i - 1] || p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] || p2;
      path += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    if (n === 1) path += ` L${p[0][0] + 1} ${p[0][1]}`;
    return { pts: p, d: path };
  }, [collections, n]);

  useEffect(() => {
    if (!n) return undefined;
    let timer;
    const setP = (p) => {
      const idx = n === 1 ? 0 : Math.round(p * (n - 1));
      rect.current?.setAttribute('width', n === 1 ? 1000 : 70 + p * 860 + 8);
      nodes.current.forEach((nd, i) => {
        if (!nd) return;
        nd.classList.toggle('lit', i <= idx);
        nd.classList.toggle('cur', i === idx);
      });
      seq.current.forEach((s, i) => s?.classList.toggle('on', i <= idx));
      if (idx !== cur.current) {
        const first = cur.current < 0;
        cur.current = idx;
        inner.current?.style.setProperty('--tone', collections[idx].tone || 'rgba(91,59,181,.28)');
        if (first) {
          setInfo(idx);
        } else {
          setSwap(true);
          clearTimeout(timer);
          timer = setTimeout(() => {
            setInfo(idx);
            setSwap(false);
          }, 380);
        }
      }
    };
    if (prefersReducedMotion()) {
      setP(1);
      return () => clearTimeout(timer);
    }
    setP(0);
    const st = ScrollTrigger.create({
      trigger: journey.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => setP(s.progress),
    });
    return () => {
      st.kill();
      clearTimeout(timer);
    };
  }, [collections, n]);

  if (!n) return null;
  const shown = collections[info];

  const goDoor = (c) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    requestFilter(c.id, { scroll: true });
  };

  return (
    <section id="collections">
      <div className="journey" ref={journey} style={{ height: `${Math.max(2, n) * 80 + 80}vh` }}>
        <div className="journey-in wrap" ref={inner}>
          <div className="jhead">
            <div className="label">Collections</div>
            <div className="jseq">
              {collections.map((c, i) => (
                <Fragment key={c.id}>
                  <span ref={(el) => (seq.current[i] = el)}>{c.title}</span>
                  {i < n - 1 && <span aria-hidden="true">→</span>}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="track" aria-hidden="true">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <clipPath id={clipId}>
                  <rect ref={rect} x="0" y="-100" width="70" height="400" />
                </clipPath>
              </defs>
              <path className="base" d={d} />
              <path className="lit" d={d} clipPath={`url(#${clipId})`} />
            </svg>
            {collections.map((c, i) => (
              <span
                key={c.id}
                className="node"
                ref={(el) => (nodes.current[i] = el)}
                style={{ left: `${pts[i][0] / 10}%`, top: `${pts[i][1] / 2}%` }}
              >
                {c.cover && <ArtVisual art={c.cover} variant="tile" decorative sizes="120px" />}
                <b>{c.title}</b>
              </span>
            ))}
          </div>
          <div className={`jinfo${swap ? ' swap' : ''}`} aria-live="polite">
            {shown && (
              <>
                <span className="label">{rangeLine(shown)}</span>
                <h3>{shown.title}</h3>
                {shown.description && <p>{shown.description}</p>}
              </>
            )}
          </div>
          <div className="mobile-j">
            {collections.map((c) => (
              <article key={c.id} className="rv">
                {c.cover && <ArtVisual art={c.cover} variant="tile" decorative sizes="140px" />}
                <span className="label">{c.range || ''}</span>
                <h3>{c.title}</h3>
                {c.description && <p>{c.description}</p>}
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="wrap">
        <div className="doors">
          {collections.map((c) => (
            <a key={c.id} className="door" href={`/collections/${c.slug}`} data-view onClick={goDoor(c)}>
              <div className={`arch${c.cover ? '' : ' nocover'}`}>
                {c.cover ? (
                  <ArtVisual art={c.cover} variant="tile" decorative sizes="(max-width: 560px) 92vw, 300px" />
                ) : (
                  'Coming soon'
                )}
              </div>
              <div>
                <h3>{c.title}</h3>
                {c.description && <p>{c.description}</p>}
                <p className="label" style={{ marginTop: 8 }}>
                  {rangeLine(c)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
