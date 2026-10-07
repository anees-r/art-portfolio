'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/motion';

const SIZE = 220; // lens diameter, px
const ZOOM = 2.6;

/**
 * A magnifying glass for the artwork on show. Render it inside `.v-stage`
 * (the viewer overlay or the /work/[slug] page): it adds a toggle beside
 * Close, and while on, a round lens follows the cursor (or a dragged finger)
 * over the piece, showing that spot from the full-size image. "Z" toggles it.
 */
export default function Magnifier({ art }) {
  const [on, setOn] = useState(false);
  const host = useRef(null);
  const lens = useRef(null);
  const src = art?.image?.src;

  // Each artwork starts unmagnified.
  useEffect(() => setOn(false), [art?.slug]);

  // "Z" toggles (unless typing somewhere).
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => {
      if (e.key !== 'z' && e.key !== 'Z') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea,[contenteditable]')) return;
      setOn((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src]);

  useEffect(() => {
    if (!on) return undefined;
    const stage = host.current?.closest('.v-stage');
    const img = stage?.querySelector('.art');
    const L = lens.current;
    if (!img || !L) return undefined;
    // Fetch the full-size image now, so the lens is sharp as soon as it appears.
    new Image().src = src;
    stage.dataset.zoom = 'on';
    img.style.touchAction = 'none'; // a finger drags the lens instead of scrolling

    // The lens glides after the pointer like the cursor's halo (a touch quicker),
    // always showing the spot under its own centre.
    const p = { x: 0, y: 0 };
    let shown = false;
    const render = () => {
      const r = img.getBoundingClientRect();
      const fx = Math.min(1, Math.max(0, (p.x - r.left) / r.width));
      const fy = Math.min(1, Math.max(0, (p.y - r.top) / r.height));
      L.style.transform = `translate3d(${p.x - SIZE / 2}px,${p.y - SIZE / 2}px,0)`;
      L.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
      L.style.backgroundPosition = `${SIZE / 2 - fx * r.width * ZOOM}px ${SIZE / 2 - fy * r.height * ZOOM}px`;
    };
    const tx = gsap.quickTo(p, 'x', { duration: 0.45, ease: 'power3', onUpdate: render });
    const ty = gsap.quickTo(p, 'y', { duration: 0.45, ease: 'power3', onUpdate: render });

    const move = (e) => {
      if (!shown) {
        // Appear where the pointer is, rather than sliding in from the last spot.
        shown = true;
        gsap.killTweensOf(p);
        p.x = e.clientX;
        p.y = e.clientY;
        tx(e.clientX, e.clientX);
        ty(e.clientY, e.clientY);
        render();
        L.style.opacity = 1;
        return;
      }
      tx(e.clientX);
      ty(e.clientY);
    };
    const hide = () => {
      shown = false;
      L.style.opacity = 0;
    };
    const up = (e) => e.pointerType !== 'mouse' && hide(); // lift a finger: lens away
    img.addEventListener('pointermove', move);
    img.addEventListener('pointerdown', move);
    img.addEventListener('pointerleave', hide);
    img.addEventListener('pointerup', up);

    return () => {
      gsap.killTweensOf(p);
      img.removeEventListener('pointermove', move);
      img.removeEventListener('pointerdown', move);
      img.removeEventListener('pointerleave', hide);
      img.removeEventListener('pointerup', up);
      img.style.touchAction = '';
      delete stage.dataset.zoom;
      hide();
    };
  }, [on, src]);

  if (!src) return null; // painted placeholders have nothing to magnify

  return (
    <>
      <span ref={host} hidden />
      <button
        type="button"
        className={`v-zoom${on ? ' on' : ''}`}
        aria-pressed={on}
        aria-label={on ? 'Turn the magnifier off' : 'Magnify the artwork'}
        title={on ? 'Magnifier on (Z)' : 'Magnify (Z)'}
        onClick={() => setOn((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.4 15.4 20.5 20.5" />
          <path d="M7.8 10.5h5.4" />
          {!on && <path d="M10.5 7.8v5.4" />}
        </svg>
      </button>
      <div className="v-lens" ref={lens} aria-hidden="true" style={{ backgroundImage: `url("${src}")` }} />
    </>
  );
}
