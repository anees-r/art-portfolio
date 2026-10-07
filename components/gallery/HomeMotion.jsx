'use client';

import { useEffect } from 'react';
import { useSmooth } from '@/components/motion/SmoothScroll';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/motion';

/**
 * Scroll choreography for the home page (from the prototype's buildAnim):
 * the hero copy lifts away as you "enter", the statement lights
 * line by line. The thread through the page lives in Threads.
 */
export default function HomeMotion() {
  const smooth = useSmooth();

  useEffect(() => {
    const html = document.documentElement;
    const reduced = prefersReducedMotion();
    let ctx;
    if (!reduced) {
      ctx = gsap.context(() => {
        // The scroll fade uses explicit start values, and the entrance animates the
        // copy's children rather than the copy itself: if both drove the same
        // element, a scroll during the entrance (or landing part-way down) could
        // record a half-faded start, leaving the hero empty when you scroll back up.
        if (document.querySelector('.hero-track')) {
          gsap
            .timeline({
              scrollTrigger: { trigger: '.hero-track', start: 'top top', end: 'bottom bottom', scrub: 1.4, invalidateOnRefresh: true },
            })
            .fromTo('.hero-copy', { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -90, scale: 1.04, ease: 'none', duration: 0.45 }, 0.04)
            .fromTo('.scrollcue', { opacity: 1 }, { opacity: 0, duration: 0.08 }, 0)
            .fromTo('.hero-door', { opacity: 1 }, { opacity: 0, duration: 0.3 }, 0.3);
        }
        html.classList.remove('motion-pending');
        gsap.from('.hero-copy > *', { opacity: 0, y: 30, duration: 2.4, ease: 'power3.out', delay: 0.3, stagger: 0.12 });
        gsap.from('.scrollcue span', { opacity: 0, duration: 2, delay: 1.6 });

        // "Ways I make": the two rows of words slide in opposite directions with scroll.
        document.querySelectorAll('.tool-row').forEach((row) => {
          const dir = Number(row.dataset.dir) || 1;
          gsap.fromTo(
            row.querySelector('.tool-run'),
            { xPercent: dir > 0 ? -30 : 0 },
            {
              xPercent: dir > 0 ? 0 : -30,
              ease: 'none',
              scrollTrigger: { trigger: '.tools', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
            }
          );
        });

        document.querySelectorAll('.why .line').forEach((l) =>
          gsap.fromTo(l, { opacity: 0.12 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: l, start: 'top 82%', end: 'top 48%', scrub: true } })
        );
      });
    } else {
      html.classList.remove('motion-pending');
    }

    // Arriving with a hash (e.g. "/#about", or "/#art-slug" when closing an artwork page).
    const id = decodeURIComponent(location.hash.slice(1));
    // After a client-side navigation Next.js may still reset the scroll position
    // once the page commits, so re-check shortly after and settle on the target.
    let raf;
    const timers = [];
    const target = id && document.getElementById(id);
    if (target) {
      const land = () => {
        const top = target.getBoundingClientRect().top;
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (Math.abs(top - margin) > 4) smooth?.scrollToId(id, { immediate: true });
      };
      raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        land();
      });
      timers.push(setTimeout(land, 250), setTimeout(land, 700));
    }

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      ctx?.revert();
    };
  }, [smooth]);

  return null;
}
