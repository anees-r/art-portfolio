'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Corridor from './Corridor';
import { useGallery } from './GalleryProvider';
import { useSmooth } from '@/components/motion/SmoothScroll';
import { gsap, prefersReducedMotion, requestRefresh } from '@/lib/motion';

/** "Work": heading, collection chips and the corridor, with the prototype's fade-and-rehang filter. */
export default function WorkSection({ heading, chips }) {
  const { artworks, filterRequest } = useGallery();
  const smooth = useSmooth();
  const [filter, setFilter] = useState('all');
  const wrap = useRef(null);
  const after = useRef(null);

  const items = useMemo(
    () => (filter === 'all' ? artworks : artworks.filter((a) => a.collection?.id === filter)),
    [artworks, filter]
  );

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

  // Requests from the collection doors.
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
      <div className="work-head">
        <div>
          <div className="label rv">Work</div>
          <h2 className="sec rv">{heading}</h2>
        </div>
        {chips.length > 0 && (
          <div className="chips rv" role="group" aria-label="Filter by collection">
            {[{ id: 'all', title: 'All' }, ...chips].map((c) => (
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
        <Corridor items={items} />
      </div>
    </section>
  );
}
