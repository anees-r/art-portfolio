'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gsap, prefersReducedMotion } from '@/lib/motion';

/**
 * Standalone artwork page: the viewer's entrance (backdrop, image, staggered
 * placard), plus ←/→/Esc and swipe navigation.
 */
export default function DetailMotion({ slug, prevHref, nextHref, closeHref }) {
  const router = useRouter();

  useLayoutEffect(() => {
    document.documentElement.classList.remove('motion-pending');
    window.scrollTo(0, 0);
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.work-page .v-bg', { opacity: 0, duration: 1.4, ease: 'power2.out' });
      gsap.from('.work-page .v-stage .art', { opacity: 0, scale: 0.96, duration: 1.6, ease: 'expo.out' });
      gsap.from('.work-page .v-meta > *', { opacity: 0, y: 22, duration: 1.4, stagger: 0.12, delay: 0.5, ease: 'power3.out' });
      gsap.from(['.work-page .v-close', '.work-page .v-count'], { opacity: 0, duration: 1.2, delay: 0.6 });
    });
    return () => ctx.revert();
  }, [slug]);

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
    const onKey = (e) => {
      if (e.target.closest?.('input,textarea,select')) return;
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref);
      else if (e.key === 'ArrowRight' && nextHref) router.push(nextHref);
      else if (e.key === 'Escape') router.push(closeHref);
    };
    let sx = 0;
    let sy = 0;
    const start = (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const end = (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const to = dx < 0 ? nextHref : prevHref;
      if (to) router.push(to);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchend', end);
    };
  }, [router, prevHref, nextHref, closeHref]);

  return null;
}
