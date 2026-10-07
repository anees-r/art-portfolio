'use client';

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ArtVisual from '@/components/ArtVisual';
import { useGallery } from './GalleryProvider';
import { ScrollTrigger, prefersReducedMotion } from '@/lib/motion';

const works = (n) => `${n} ${n === 1 ? 'work' : 'works'}`;
const rangeLine = (c) => [c.range, works(c.count)].filter(Boolean).join(' · ');

/**
 * "Collections": a pinned journey where a lit path travels node to node as you
 * scroll (each collection's tone washing the room). Hovering a node lifts its
 * cover and brings that collection's details into the panel below; clicking
 * hangs that collection in "Work" above (its own page stays a real link, for
 * new tabs and no-JS).
 */
export default function CollectionsSection({ collections }) {
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
  const [hover, setHover] = useState(null);
  const { requestFilter } = useGallery();

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
  const shownIdx = hover ?? info;

  // A plain click re-hangs the corridor with this collection and glides up to it.
  const pick = (c) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setHover(null);
    requestFilter(c.id, { scroll: true });
  };
  const shown = collections[shownIdx];

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
          <div className="track">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <clipPath id={clipId}>
                  <rect ref={rect} x="0" y="-100" width="70" height="400" />
                </clipPath>
              </defs>
              <path className="base" d={d} />
              <path className="lit" d={d} clipPath={`url(#${clipId})`} />
            </svg>
            {collections.map((c, i) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className={`node${n > 1 && i === 0 ? ' al' : ''}${n > 1 && i === n - 1 ? ' ar' : ''}`}
                ref={(el) => (nodes.current[i] = el)}
                style={{ left: `${pts[i][0] / 10}%`, top: `${pts[i][1] / 2}%` }}
                data-view
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={pick(c)}
              >
                {c.cover && <ArtVisual art={c.cover} variant="tile" decorative sizes="120px" />}
                <b>{c.title}</b>
              </Link>
            ))}
          </div>
          <div className={`jinfo${swap ? ' swap' : ''}`} aria-live="polite">
            {shown && (
              // Keyed so each change (scroll or hover) fades the new details in.
              <div className="jbody" key={shownIdx}>
                <span className="label">{rangeLine(shown)}</span>
                <h3>{shown.title}</h3>
                {shown.description && <p>{shown.description}</p>}
                <Link className="jgo" href={`/collections/${shown.slug}`} tabIndex={-1} onClick={pick(shown)}>
                  Open collection <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>
          <div className="mobile-j">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="rv" onClick={pick(c)}>
                {c.cover && <ArtVisual art={c.cover} variant="tile" decorative sizes="140px" />}
                <span className="label">{rangeLine(c)}</span>
                <h3>{c.title}</h3>
                {c.description && <p>{c.description}</p>}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
