'use client';

import { useEffect, useRef } from 'react';
import { gsap, finePointer } from '@/lib/motion';

/** The prototype's dot + trailing halo, which grows and reads "VIEW" over artwork. */
export default function Cursor() {
  const cur = useRef(null);
  const halo = useRef(null);

  useEffect(() => {
    if (!finePointer()) return undefined;
    document.body.classList.add('has-cursor');
    const cx = gsap.quickTo(cur.current, 'x', { duration: 0.15, ease: 'power3' });
    const cy = gsap.quickTo(cur.current, 'y', { duration: 0.15, ease: 'power3' });
    const hx = gsap.quickTo(halo.current, 'x', { duration: 0.9, ease: 'power3' });
    const hy = gsap.quickTo(halo.current, 'y', { duration: 0.9, ease: 'power3' });
    const move = (e) => {
      cx(e.clientX);
      cy(e.clientY);
      hx(e.clientX);
      hy(e.clientY);
    };
    const over = (e) => halo.current?.classList.toggle('view', !!e.target.closest?.('[data-view]'));
    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseover', over);
    return () => {
      document.body.classList.remove('has-cursor');
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over);
    };
  }, []);

  return (
    <>
      <div id="cur" ref={cur} aria-hidden="true" />
      <div id="halo" ref={halo} aria-hidden="true">
        <span>VIEW</span>
      </div>
    </>
  );
}
