'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSmooth } from '@/components/motion/SmoothScroll';
import { ScrollTrigger, prefersReducedMotion } from '@/lib/motion';

/**
 * Fixed signage nav + full-screen mobile menu.
 * On the home page links glide to their section; elsewhere they lead home.
 */
export default function Nav({ title, sections, home = false }) {
  const smooth = useSmooth();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const closeBtn = useRef(null);
  const menuBtn = useRef(null);

  // Active section highlighting (home only).
  useEffect(() => {
    if (!home || prefersReducedMotion()) return undefined;
    const triggers = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean)
      .map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (t) => setActive((cur) => (t.isActive ? el.id : cur === el.id ? null : cur)),
        })
      );
    return () => triggers.forEach((t) => t.kill());
  }, [home, sections]);

  const toggle = (on) => {
    setOpen(on);
    smooth?.lock(on);
    if (on) requestAnimationFrame(() => closeBtn.current?.focus());
    else menuBtn.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && toggle(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = (id) => (e) => {
    if (!home) {
      if (open) toggle(false);
      return; // normal navigation to "/#id"
    }
    e.preventDefault();
    if (open) toggle(false);
    smooth?.scrollToId(id);
    history.replaceState(history.state, '', id === 'top' ? '/' : `/#${id}`);
  };

  const href = (id) => (id === 'top' ? '/' : `/#${id}`);

  return (
    <>
      <header className="nav" id="nav">
        <Link className="sign mark" href="/" onClick={go('top')}>
          {title}
        </Link>
        <nav aria-label="Sections">
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                <Link className={`sign${active === s.id ? ' on' : ''}`} href={href(s.id)} onClick={go(s.id)}>
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          ref={menuBtn}
          className="menu-btn"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => toggle(true)}
        >
          Menu
        </button>
      </header>
      <div
        id="menu"
        className={open ? 'open' : ''}
        role="dialog"
        aria-label="Menu"
        aria-modal="true"
        inert={!open}
      >
        <button className="x" ref={closeBtn} onClick={() => toggle(false)}>
          Close
        </button>
        {!home && (
          <Link href="/" onClick={go('top')}>
            Gallery
          </Link>
        )}
        {sections.map((s) => (
          <Link key={s.id} href={href(s.id)} onClick={go(s.id)}>
            {s.label}
          </Link>
        ))}
      </div>
    </>
  );
}
