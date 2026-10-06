'use client';

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import ArtVisual from '@/components/ArtVisual';
import ArtworkMeta from './ArtworkMeta';
import { pad2, viewerTone } from './format';
import { useSmooth } from '@/components/motion/SmoothScroll';
import { gsap, prefersReducedMotion } from '@/lib/motion';

const WORK_PATH = /^\/work\/([^/?#]+)/;
const sourceFor = (slug) =>
  typeof document === 'undefined'
    ? null
    : document.querySelector(`.piece[data-slug="${CSS.escape(slug)}"] .tilt > .art`);

/**
 * The cinematic artwork viewer from the prototype: the piece lifts off the wall
 * and flies into place, the placard staggers in, ←/→/swipe step through the
 * gallery, Esc or Close sends it back to the wall.
 *
 * While open the address bar shows /work/[slug] (a real, shareable page), and
 * the browser Back button closes it.
 */
export default function Viewer({ ref, artworks, tones, siteName }) {
  const smooth = useSmooth();
  const [view, setView] = useState({ open: false, i: 0 });
  const openRef = useRef(false);
  const indexRef = useRef(0);
  const busy = useRef(false);
  const hidden = useRef(null);
  const pending = useRef(null);
  const opener = useRef(null);
  const baseTitle = useRef('');
  const root = useRef(null);
  const stage = useRef(null);
  const meta = useRef(null);
  const bg = useRef(null);
  const closeBtn = useRef(null);
  const count = useRef(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  const art = artworks[view.i];
  const surface = () => stage.current?.querySelector('.art');

  const restoreHidden = () => {
    if (hidden.current) hidden.current.style.opacity = '';
    hidden.current = null;
  };

  const setTitle = (a) => {
    document.title = `${a.title} · ${siteName}`;
  };

  // ---- open ---------------------------------------------------------------
  const open = useCallback(
    (slug, fromEl, { fromHistory = false } = {}) => {
      if (openRef.current) return false;
      const i = artworks.findIndex((a) => a.slug === slug);
      if (i < 0) return false;
      openRef.current = true;
      indexRef.current = i;
      busy.current = true;
      opener.current = document.activeElement;
      baseTitle.current = document.title;
      pending.current = { type: 'open', fromEl };
      if (!fromHistory) history.pushState(history.state, '', `/work/${slug}`);
      setTitle(artworks[i]);
      smooth?.lock(true);
      setView({ open: true, i });
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artworks, smooth]
  );

  useImperativeHandle(ref, () => ({ open }), [open]);

  const runOpen = (fromEl) => {
    const img = surface();
    const metaEls = meta.current ? Array.from(meta.current.children) : [];
    if (root.current) root.current.scrollTop = 0;
    if (reduced.current || !img) {
      gsap.set(bg.current, { opacity: 1 });
      gsap.set([closeBtn.current, count.current], { opacity: 1 });
      busy.current = false;
      closeBtn.current?.focus({ preventScroll: true });
      return;
    }
    // Hold everything invisible until the image is decoded, then fly it in.
    gsap.set(img, { opacity: 0 });
    gsap.set(metaEls, { opacity: 0 });
    const go = () => {
      if (!openRef.current) return;
      const src = fromEl || sourceFor(artworks[indexRef.current].slug);
      const to = img.getBoundingClientRect();
      gsap.set(img, { clearProps: 'transform', opacity: 1 });
      gsap.to(bg.current, { opacity: 1, duration: 1.6, ease: 'power2.out' });
      if (src && to.width > 0) {
        const from = src.getBoundingClientRect();
        hidden.current = src;
        src.style.opacity = 0;
        gsap.fromTo(
          img,
          { x: from.left - to.left, y: from.top - to.top, scale: from.width / to.width, transformOrigin: '0 0' },
          { x: 0, y: 0, scale: 1, duration: 1.7, ease: 'expo.out' }
        );
      } else {
        gsap.fromTo(img, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' });
      }
      gsap.fromTo(metaEls, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.12, delay: 0.9, ease: 'power3.out' });
      gsap.to([closeBtn.current, count.current], {
        opacity: 1,
        duration: 1.2,
        delay: 1,
        onComplete: () => {
          busy.current = false;
        },
      });
      closeBtn.current?.focus({ preventScroll: true });
    };
    const ready = img.tagName === 'IMG' && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    // Don't wait forever on a slow network: start after 1.2s regardless.
    Promise.race([ready, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(go));
  };

  // ---- close --------------------------------------------------------------
  const finishClose = useCallback(() => {
    restoreHidden();
    document.querySelectorAll('.piece .tilt > .art').forEach((el) => (el.style.opacity = ''));
    const img = surface();
    if (img) gsap.set(img, { clearProps: 'transform,opacity,transformOrigin' });
    gsap.set([bg.current, closeBtn.current, count.current], { opacity: 0 });
    openRef.current = false;
    busy.current = false;
    setView((v) => ({ ...v, open: false }));
    smooth?.lock(false);
    if (baseTitle.current) document.title = baseTitle.current;
    opener.current?.focus?.({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smooth]);

  /** Animate the piece back onto the wall (does not touch history). */
  const animateClose = useCallback(() => {
    if (!openRef.current) return;
    const img = surface();
    if (reduced.current || !img) return finishClose();
    busy.current = true;
    const a = artworks[indexRef.current];
    const src = sourceFor(a.slug);
    const sb = src?.getBoundingClientRect();
    gsap.killTweensOf([img, bg.current]);
    gsap.to(meta.current ? Array.from(meta.current.children) : [], { opacity: 0, duration: 0.5, stagger: 0.04 });
    gsap.to([closeBtn.current, count.current], { opacity: 0, duration: 0.5 });
    if (src && sb && sb.bottom > 0 && sb.top < window.innerHeight && Math.abs(sb.width) > 10) {
      const to = img.getBoundingClientRect();
      if (hidden.current && hidden.current !== src) restoreHidden();
      hidden.current = src;
      src.style.opacity = 0;
      const k = sb.width / (to.width / (gsap.getProperty(img, 'scale') || 1));
      gsap.set(img, { transformOrigin: '0 0' });
      gsap.to(img, { x: sb.left - (to.left - gsap.getProperty(img, 'x')), y: sb.top - (to.top - gsap.getProperty(img, 'y')), scale: k, duration: 1.3, ease: 'expo.inOut' });
      gsap.to(bg.current, { opacity: 0, duration: 1.3, ease: 'power2.inOut', onComplete: finishClose });
    } else {
      gsap.to(img, { opacity: 0, duration: 0.9 });
      gsap.to(bg.current, { opacity: 0, duration: 1, onComplete: finishClose });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworks, finishClose]);

  /** User asked to close: step back out of the /work/[slug] history entry. */
  const close = useCallback(() => {
    if (!openRef.current) return;
    if (WORK_PATH.test(location.pathname)) history.back();
    else animateClose();
  }, [animateClose]);

  // ---- step ---------------------------------------------------------------
  const step = useCallback(
    (d) => {
      if (!openRef.current || busy.current) return;
      const n = indexRef.current + d;
      if (n < 0 || n >= artworks.length) return;
      busy.current = true;
      restoreHidden();
      const apply = () => {
        indexRef.current = n;
        history.replaceState(history.state, '', `/work/${artworks[n].slug}`);
        setTitle(artworks[n]);
        setView({ open: true, i: n });
      };
      if (reduced.current) {
        apply();
        busy.current = false;
        return;
      }
      pending.current = { type: 'step', d };
      gsap.to([surface(), meta.current], { opacity: 0, y: d * 14, duration: 0.6, ease: 'power2.in', onComplete: apply });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artworks]
  );

  const runStepIn = (d) => {
    const img = surface();
    if (root.current) root.current.scrollTop = 0;
    gsap.set(meta.current, { opacity: 1, y: 0 });
    if (img) {
      gsap.set(img, { x: 0, y: 0, scale: 1 });
      gsap.fromTo(img, { opacity: 0, y: -d * 20 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' });
    }
    gsap.fromTo(Array.from(meta.current?.children || []), { opacity: 0, y: 16 }, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: 'power3.out',
      onComplete: () => {
        busy.current = false;
      },
    });
  };

  // Run the queued animation once React has painted the new artwork.
  useLayoutEffect(() => {
    const p = pending.current;
    if (!p || !view.open) return;
    pending.current = null;
    if (p.type === 'open') runOpen(p.fromEl);
    else runStepIn(p.d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ---- browser history, keys, swipe --------------------------------------
  useEffect(() => {
    const onPop = () => {
      const m = location.pathname.match(WORK_PATH);
      if (!m) return animateClose();
      const slug = decodeURIComponent(m[1]);
      if (!openRef.current) open(slug, null, { fromHistory: true });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [animateClose, open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!openRef.current) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, step]);

  useEffect(() => {
    const el = root.current;
    let sx = 0;
    let sy = 0;
    const start = (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const end = (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend', end, { passive: true });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchend', end);
    };
  }, [step]);

  // Leaving the page (e.g. via the collection link) must not leave scrolling locked.
  useEffect(
    () => () => {
      if (openRef.current) {
        restoreHidden();
        smooth?.lock(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const tone = art?.collection ? tones[art.collection.id] : null;
  const total = artworks.length;

  return (
    <div
      id="viewer"
      ref={root}
      className={view.open ? 'open' : ''}
      role="dialog"
      aria-modal="true"
      aria-label={art ? art.title : 'Artwork'}
      inert={!view.open}
      data-lenis-prevent
      style={{ '--vtone': viewerTone(tone) }}
    >
      <div className="v-bg" ref={bg} />
      <div className="v-count" ref={count} aria-live="polite">
        {view.open && `${pad2(view.i + 1)} / ${pad2(total)}`}
      </div>
      <button className="v-close" ref={closeBtn} onClick={close}>
        Close <span aria-hidden="true">×</span>
      </button>
      <div className="v-grid">
        <div className="v-stage" ref={stage}>
          {view.open && art && (
            <ArtVisual
              key={art.slug}
              art={art}
              eager
              quality={85}
              sizes="(max-width: 860px) 100vw, 62vw"
            />
          )}
        </div>
        <aside className="v-meta" ref={meta}>
          {view.open && art && (
            <ArtworkMeta
              key={art.slug}
              art={art}
              onNavigate={() => {
                openRef.current = false;
                restoreHidden();
                smooth?.lock(false);
              }}
              nav={
                <div className="v-nav">
                  <button onClick={() => step(-1)} disabled={view.i <= 0}>
                    ← Previous
                  </button>
                  <button onClick={() => step(1)} disabled={view.i >= total - 1}>
                    Next →
                  </button>
                </div>
              }
            />
          )}
        </aside>
      </div>
    </div>
  );
}
