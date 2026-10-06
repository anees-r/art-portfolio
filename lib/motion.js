// Shared animation setup for client components.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer:fine)').matches;

export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 860;

let refreshTimer;
/** Debounced ScrollTrigger.refresh — many components ask for one after layout changes. */
export function requestRefresh(delay = 60) {
  if (typeof window === 'undefined') return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), delay);
}
