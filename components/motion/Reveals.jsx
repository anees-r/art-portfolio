'use client';

import { useEffect } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/motion';

/** Fades `.rv` elements up as they enter the viewport (prototype: 1.8s, power3.out). */
export default function Reveals({ scope = 'main' }) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      document.querySelectorAll(`${scope} .rv`).forEach((el) =>
        gsap.from(el, { opacity: 0, y: 34, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      );
    });
    return () => ctx.revert();
  }, [scope]);
  return null;
}
