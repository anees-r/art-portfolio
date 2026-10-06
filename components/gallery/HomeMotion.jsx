'use client';

import { useEffect } from 'react';
import { useSmooth } from '@/components/motion/SmoothScroll';
import { gsap, ScrollTrigger, prefersReducedMotion, isMobile } from '@/lib/motion';

/**
 * Scroll choreography for the home page (from the prototype's buildAnim):
 * the hero piece grows out of the dark as you "enter", the statement lights
 * line by line, and the process line fills step by step.
 */
export default function HomeMotion() {
  const smooth = useSmooth();

  useEffect(() => {
    const html = document.documentElement;
    const reduced = prefersReducedMotion();
    let ctx;
    if (!reduced) {
      ctx = gsap.context(() => {
        const art = document.querySelector('#heroArt');
        if (art) {
          gsap.set(art, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0.36, opacity: 0.4, filter: 'blur(2px)' });
          gsap
            .timeline({
              scrollTrigger: { trigger: '.hero-track', start: 'top top', end: 'bottom bottom', scrub: 1.4, invalidateOnRefresh: true },
            })
            .to(art, { scale: () => (isMobile() ? 0.9 : 1), filter: 'blur(0px)', ease: 'none', duration: 1 }, 0)
            .to(art, { opacity: 1, ease: 'none', duration: 0.5 }, 0)
            .to('.hero-copy', { opacity: 0, y: -90, scale: 1.04, ease: 'none', duration: 0.45 }, 0.04)
            .to('.scrollcue', { opacity: 0, duration: 0.08 }, 0)
            .to('.hero-door', { opacity: 0, duration: 0.3 }, 0.3)
            .to(art, { opacity: 0, duration: 0.14 }, 0.9);
        }
        html.classList.remove('motion-pending');
        gsap.from('.hero-copy', { opacity: 0, y: 30, duration: 2.4, ease: 'power3.out', delay: 0.3 });
        gsap.from('.scrollcue', { opacity: 0, duration: 2, delay: 1.6 });

        document.querySelectorAll('.why .line').forEach((l) =>
          gsap.fromTo(l, { opacity: 0.12 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: l, start: 'top 82%', end: 'top 48%', scrub: true } })
        );

        const flow = document.querySelector('#flow');
        if (flow) {
          gsap.to('#flowFill', {
            height: () => flow.offsetHeight - 40,
            ease: 'none',
            scrollTrigger: { trigger: flow, start: 'top 60%', end: 'bottom 60%', scrub: true, invalidateOnRefresh: true },
          });
          flow.querySelectorAll('.step').forEach((s) =>
            ScrollTrigger.create({
              trigger: s,
              start: 'top 62%',
              onEnter: () => s.classList.add('on'),
              onLeaveBack: () => s.classList.remove('on'),
            })
          );
        }
      });
    } else {
      html.classList.remove('motion-pending');
      document.querySelectorAll('.step').forEach((s) => s.classList.add('on'));
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
