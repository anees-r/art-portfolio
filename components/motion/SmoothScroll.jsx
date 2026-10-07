'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion, requestRefresh } from '@/lib/motion';

const SmoothCtx = createContext(null);

/**
 * Lenis smooth scrolling driven by GSAP's ticker (as in the prototype), plus a
 * scroll lock shared by the menu and the artwork viewer.
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const locks = useRef(0);

  useEffect(() => {
    // Release the "hidden until GSAP" guard set in <head>, if a page didn't.
    const release = setTimeout(() => document.documentElement.classList.remove('motion-pending'), 3500);
    const onResize = () => requestRefresh(250);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(() => requestRefresh(0));

    if (prefersReducedMotion()) {
      return () => {
        clearTimeout(release);
        window.removeEventListener('resize', onResize);
      };
    }

    let lenis;
    try {
      lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.4,
      });
    } catch {
      lenis = null;
    }
    if (!lenis) return undefined;
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      clearTimeout(release);
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lenis keeps its own scroll position across client-side navigations, so a new
  // page could open at the old one's depth. Start each new page at the top —
  // except for "#section" links (the page lands those itself) and back/forward.
  const pathname = usePathname();
  const popped = useRef(false);
  const firstPath = useRef(true);
  useEffect(() => {
    const onPop = () => (popped.current = true);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const wasPop = popped.current;
    popped.current = false;
    if (wasPop || location.hash) return;
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    requestRefresh(0);
  }, [pathname]);

  const lock = useCallback((on) => {
    locks.current = Math.max(0, locks.current + (on ? 1 : -1));
    const locked = locks.current > 0;
    const lenis = lenisRef.current;
    if (lenis) locked ? lenis.stop() : lenis.start();
    document.documentElement.style.overflow = locked ? 'hidden' : '';
  }, []);

  const scrollToY = useCallback((y, { immediate = false } = {}) => {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 2.2, force: true });
    else window.scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const scrollToId = useCallback(
    (id, opts) => {
      if (id === 'top') return scrollToY(0, opts);
      const el = document.getElementById(id);
      if (!el) return;
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      scrollToY(el.getBoundingClientRect().top + window.scrollY - margin, opts);
    },
    [scrollToY]
  );

  const value = useMemo(() => ({ lock, scrollToId, scrollToY, lenis: lenisRef }), [lock, scrollToId, scrollToY]);
  return <SmoothCtx.Provider value={value}>{children}</SmoothCtx.Provider>;
}

export const useSmooth = () => useContext(SmoothCtx);
