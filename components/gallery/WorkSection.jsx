'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Corridor from './Corridor';
import { useGallery } from './GalleryProvider';
import { useSmooth } from '@/components/motion/SmoothScroll';
import { gsap, prefersReducedMotion, requestRefresh } from '@/lib/motion';

const FEATURED = 'featured';
const UNCOLLECTED = 'uncollected';
const works = (n) => `${n} ${n === 1 ? 'work' : 'works'}`;

/**
 * "Work": heading, filter chips and the corridor, with the prototype's
 * fade-and-rehang filter. It opens on the featured pieces only (so the wall
 * stays short however much is published); everything else is reached by
 * collection, or "Uncollected" for pieces outside any collection. A chosen
 * filter's details sit above its pieces, and the end of the wall offers the
 * other filters.
 */
export default function WorkSection({ heading, chips }) {
  const { artworks, filterRequest } = useGallery();
  const smooth = useSmooth();
  const wrap = useRef(null);
  const after = useRef(null);

  const featured = useMemo(
    () =>
      artworks
        .filter((a) => a.featured)
        .sort((a, b) => (a.featuredPosition ?? 1e9) - (b.featuredPosition ?? 1e9)),
    [artworks]
  );
  const uncollected = useMemo(() => artworks.filter((a) => !a.collection), [artworks]);

  // The filters, in order. With nothing featured, the first one simply shows everything.
  const filters = useMemo(
    () => [
      featured.length
        ? { id: FEATURED, title: 'Featured', count: featured.length }
        : { id: FEATURED, title: 'All', count: artworks.length },
      ...chips,
      ...(uncollected.length
        ? [
            {
              id: UNCOLLECTED,
              title: 'Uncollected',
              count: uncollected.length,
              description: 'Pieces that stand on their own, outside any collection.',
            },
          ]
        : []),
    ],
    [featured, uncollected, artworks, chips]
  );

  const [filter, setFilter] = useState(FEATURED);

  const items = useMemo(() => {
    if (filter === FEATURED) return featured.length ? featured : artworks;
    if (filter === UNCOLLECTED) return uncollected;
    return artworks.filter((a) => a.collection?.id === filter);
  }, [artworks, featured, uncollected, filter]);

  // The chosen collection's (or "Uncollected") details, shown above its pieces.
  const active = filter === FEATURED ? null : filters.find((c) => c.id === filter);

  const apply = (id, scroll) => {
    const el = wrap.current;
    if (id === filter) {
      if (scroll) smooth?.scrollToId('work');
      return;
    }
    if (prefersReducedMotion() || !el) {
      after.current = { scroll, fade: false };
      setFilter(id);
      return;
    }
    gsap.to(el, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        after.current = { scroll, fade: true };
        setFilter(id);
      },
    });
  };

  // Arriving at "/#art-slug" (closing an artwork page) for a piece that isn't on
  // the featured wall: hang its collection instead, so the page can land on it.
  useLayoutEffect(() => {
    const m = /^#art-(.+)$/.exec(decodeURIComponent(location.hash));
    if (!m || (featured.length && featured.some((a) => a.slug === m[1]))) return;
    const art = artworks.find((a) => a.slug === m[1]);
    if (!art || !featured.length) return;
    after.current = { scroll: false, fade: false };
    setFilter(art.collection ? art.collection.id : UNCOLLECTED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Requests from the collections graph.
  useEffect(() => {
    if (filterRequest) apply(filterRequest.id, filterRequest.scroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRequest]);

  useLayoutEffect(() => {
    const a = after.current;
    if (!a) return;
    after.current = null;
    if (a.fade) gsap.fromTo(wrap.current, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    requestRefresh(0);
    if (a.scroll) setTimeout(() => smooth?.scrollToId('work'), 80);
  }, [filter, smooth]);

  return (
    <section id="work" className="wrap">
      <svg className="thread" data-thread="work" aria-hidden="true" focusable="false">
        <path className="t-line" />
        <circle className="t-head" r="3.5" />
      </svg>
      <div className="work-head">
        <div>
          <div className="label rv">Work</div>
          <h2 className="sec rv">{heading}</h2>
        </div>
        {filters.length > 1 && (
          <div className="chips rv" role="group" aria-label="Filter the work">
            {filters.map((c) => (
              <button
                key={c.id}
                className={`chip${filter === c.id ? ' on' : ''}`}
                aria-pressed={filter === c.id}
                onClick={() => apply(c.id, false)}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={wrap}>
        {active && (
          <div className="work-col" style={active.tone ? { '--tone': active.tone } : undefined}>
            <span className="label">
              {active.id === UNCOLLECTED ? 'Uncollected' : 'Collection'}
              {active.range ? ` · ${active.range}` : ''} · {works(active.count)}
            </span>
            <h3>{active.title}</h3>
            {active.description && <p>{active.description}</p>}
          </div>
        )}
        <Corridor items={items} />
        {/* A lead-in to the collections section that follows. */}
        {filters.length > 1 && (
          <div className="wall-end">
            <span className="label">{filter === FEATURED ? 'There’s more' : 'Keep exploring'}</span>
            <h3>{filter === FEATURED ? 'See every piece, collection by collection' : 'Wander into another room'}</h3>
            <i className="wall-cue" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}
