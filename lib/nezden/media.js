// Media URLs and placeholder paintings, per the Nezden integration brief.

const DEFAULT_MEDIA_BASE = 'https://nezden.com/media';

function mediaBase() {
  return (process.env.NEZDEN_MEDIA_BASE || DEFAULT_MEDIA_BASE).replace(/\/+$/, '');
}

/**
 * Image columns hold a path relative to Nezden's media root, e.g. "2026/10/aB3d.webp".
 * Anything that isn't a plain relative path (absolute URLs, "..", backslashes) is rejected.
 */
export function mediaUrl(path) {
  if (typeof path !== 'string') return null;
  const p = path.trim().replace(/^\/+/, '');
  if (!p || p.includes('..') || p.includes('\\') || /^[a-z][a-z0-9+.-]*:/i.test(p)) return null;
  return `${mediaBase()}/${p.split('/').map(encodeURIComponent).join('/')}`;
}

export const PRESETS = {
  Moon: 'radial-gradient(circle at 50% 70%,#e7d6ff 0,#a98bf0 8%,#5a35b8 30%,#1d1040 62%,#0a0613 85%)',
  Ink: 'conic-gradient(from 200deg at 40% 60%,#2a1760,#7b4fe0,#e08bc4,#2a1760)',
  Dawn: 'linear-gradient(180deg,#0c0720 0,#2a1760 45%,#8f6be8 78%,#f1c6e4 100%)',
  Lights: 'radial-gradient(ellipse at 30% 30%,#b79cf5,transparent 50%),radial-gradient(ellipse at 75% 70%,#e08bc4,transparent 55%),#1a0f38',
  Ripples: 'repeating-radial-gradient(circle at 80% 50%,#2a1760 0 6px,#1a0f38 6px 14px)',
  Stars: 'radial-gradient(circle at 70% 25%,#fff 0,#d3c1fa 3%,transparent 4%),radial-gradient(circle at 20% 60%,#d3c1fa 0,transparent 1.6%),radial-gradient(circle at 45% 20%,#d3c1fa 0,transparent 1.2%),linear-gradient(160deg,#1d1040,#0a0613)',
  Fog: 'linear-gradient(100deg,#0a0613,#3b2181 40%,#a98bb8 70%,#e08bc4)',
  Dome: 'radial-gradient(circle at 50% 100%,#f1c6e4 0,#b79cf5 14%,#7b4fe0 34%,#1d1040 62%,#0a0613 85%)',
  Shed: 'linear-gradient(200deg,#0a0613 10%,#3b2181 45%,#e08bc4 88%)',
  Light: 'radial-gradient(circle at 20% 85%,#f1c6e4,transparent 42%),linear-gradient(180deg,#0c0720,#4a2a9c 62%,#b79cf5)',
  Depth: 'radial-gradient(circle at 50% 50%,#d3c1fa 0,#7b4fe0 9%,transparent 10%),repeating-radial-gradient(circle at 50% 50%,#1a0f38 0 10px,#241647 10px 22px)',
  Slow: 'repeating-linear-gradient(100deg,#1d1040 0 18px,#2a1760 18px 36px),#0a0613',
  Geometry: 'conic-gradient(from 45deg at 50% 50%,#1d1040,#7b4fe0,#1d1040,#b79cf5,#1d1040)',
  Lantern: 'radial-gradient(circle at 50% 40%,#ffe9c9 0,#e08bc4 5%,transparent 32%),linear-gradient(180deg,#0a0613,#2a1760)',
  Field: 'repeating-linear-gradient(95deg,#4a2a9c 0 3px,#7b4fe0 3px 6px,#2a1760 6px 14px),linear-gradient(#0a0613,#150e29)',
  Violet: 'linear-gradient(180deg,#150e29,#7b4fe0 55%,#d3c1fa)',
  Unnamed: 'radial-gradient(circle at 30% 30%,#5a35b8,transparent 50%),radial-gradient(circle at 70% 75%,#a98bb8,transparent 50%),#0a0613',
  Hourglass: 'conic-gradient(from 90deg at 50% 50%,#0a0613,#5a35b8,#e08bc4,#0a0613)',
};

export const presetCss = (name) => (Object.hasOwn(PRESETS, name) ? PRESETS[name] : PRESETS.Moon);
