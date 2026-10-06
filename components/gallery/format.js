// Small formatting helpers safe for both server and client components.

/** "Blank line = paragraph break" (Nezden's plain-text convention). */
export const paragraphsOf = (text) =>
  String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const pad2 = (n) => String(n).padStart(2, '0');

/** Collection tone at the viewer's stronger alpha, as in the prototype. */
export const viewerTone = (tone) =>
  tone ? (tone.startsWith('rgba') ? tone.replace(/[\d.]+\s*\)$/, '.55)') : tone) : 'rgba(42,26,92,.85)';

/** "2024 · Digital painting" */
export const metaLine = (art) => [art.year, art.medium].filter(Boolean).join(' · ');

/** Process thumbnails develop from a grey sketch to the finished colour piece. */
const STAGES = [
  ['grayscale(1) contrast(1.6) brightness(1.3) blur(3px)', 0.35],
  ['grayscale(1) contrast(1.4) brightness(.9)', 0.55],
  ['grayscale(.7) saturate(.7) brightness(.85)', 0.75],
  ['saturate(.9) brightness(.92) blur(.6px)', 0.9],
  ['none', 1],
];
export const processStage = (i, n) => {
  const k = n <= 1 ? 4 : Math.round((i / (n - 1)) * 4);
  const [filter, opacity] = STAGES[k];
  return { filter, opacity };
};
