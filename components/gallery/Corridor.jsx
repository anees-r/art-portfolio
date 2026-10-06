'use client';

import { useLayoutEffect, useRef } from 'react';
import ArtVisual from '@/components/ArtVisual';
import { useGallery } from './GalleryProvider';
import { metaLine, paragraphsOf } from './format';
import { gsap, prefersReducedMotion, finePointer, requestRefresh } from '@/lib/motion';

/**
 * The corridor: works hung one by one in three alternating positions, each with
 * a halo, a floor reflection, scroll parallax and a gentle 3D tilt toward the cursor.
 */
/** Width ÷ height of the work (placeholders hang at 4:5), or null if unknown. */
const ratio = (a) =>
  a.image ? (a.image.width && a.image.height ? +(a.image.width / a.image.height).toFixed(4) : null) : 0.8;

export default function Corridor({ items, empty = 'Nothing is hanging here yet.' }) {
  const { openViewer } = useGallery();
  const root = useRef(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    requestRefresh();
    if (prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      el.querySelectorAll('.piece').forEach((p) => {
        gsap.from(p.querySelector('.frame'), {
          opacity: 0,
          y: 80,
          scale: 0.97,
          duration: 2.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: p, start: 'top 78%' },
        });
        gsap.from(p.querySelector('.cap'), {
          opacity: 0,
          y: 30,
          duration: 2,
          delay: 0.3,
          ease: 'power3.out',
          scrollTrigger: { trigger: p, start: 'top 70%' },
        });
      });

      // Desktop only: parallax drift and cursor tilt.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 860px)', () => {
        const cleanups = [];
        el.querySelectorAll('.piece').forEach((p) => {
          gsap.fromTo(
            p.querySelector('.tilt'),
            { y: 36 },
            { y: -36, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: 1.5 } }
          );
        });
        if (finePointer()) {
          el.querySelectorAll('.piece .frame').forEach((f) => {
            const t = f.querySelector('.tilt');
            const rx = gsap.quickTo(t, 'rotationY', { duration: 1.4, ease: 'power3' });
            const ry = gsap.quickTo(t, 'rotationX', { duration: 1.4, ease: 'power3' });
            const move = (e) => {
              const b = f.getBoundingClientRect();
              rx(((e.clientX - b.left) / b.width - 0.5) * 5);
              ry(-((e.clientY - b.top) / b.height - 0.5) * 5);
            };
            const leave = () => {
              rx(0);
              ry(0);
            };
            f.addEventListener('mousemove', move);
            f.addEventListener('mouseleave', leave);
            cleanups.push(() => {
              f.removeEventListener('mousemove', move);
              f.removeEventListener('mouseleave', leave);
            });
          });
        }
        return () => cleanups.forEach((c) => c());
      });
    }, el);

    return () => ctx.revert();
  }, [items]);

  const onOpen = (a) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab etc.
    const src = e.currentTarget.closest('.piece')?.querySelector('.tilt > .art');
    if (openViewer(a.slug, src)) e.preventDefault();
  };

  return (
    <div className="corridor" id="corridor" ref={root}>
      {items.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        items.map((a, i) => {
          const blurb = paragraphsOf(a.description)[0];
          return (
            <article
              key={a.slug}
              className={`piece pos${i % 3}${a.featured ? ' feat' : ''}`}
              data-slug={a.slug}
              id={`art-${a.slug}`}
            >
              <figure className="frame" data-view>
                <div className="halo" />
                <div className={`tilt${ratio(a) ? ' sized' : ''}`} style={ratio(a) ? { '--ar': ratio(a) } : undefined}>
                  <ArtVisual art={a} sizes="(max-width: 860px) 92vw, 50vw" />
                  <div className="refl" aria-hidden="true">
                    <ArtVisual art={a} decorative sizes="(max-width: 860px) 92vw, 50vw" />
                  </div>
                </div>
                <a className="open" href={`/work/${a.slug}`} aria-label={`View ${a.title}`} onClick={onOpen(a)} />
              </figure>
              <div className="cap">
                <span className="label">{a.collection ? a.collection.title : 'Uncollected'}</span>
                <h3>{a.title}</h3>
                {metaLine(a) && <span className="m">{metaLine(a)}</span>}
                {blurb && <p>{blurb}</p>}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
