import Image from 'next/image';

/**
 * Renders an artwork surface: Nezden's image through next/image, or — when no
 * image has been uploaded — the painted placeholder preset at 4:5.
 *
 * variant "full" uses the display image (≤2400px); "tile" uses the custom
 * thumbnail → 640px thumbnail → display image, as the Nezden brief specifies.
 */
export default function ArtVisual({
  art,
  variant = 'full',
  className = '',
  sizes = '100vw',
  priority = false,
  decorative = false,
  quality,
  eager = false,
  style,
}) {
  if (!art) return null;
  const img = art.image;
  const src = variant === 'tile' ? art.tile || img?.src : img?.src;
  const alt = decorative ? '' : img?.alt || art.title;

  if (!src) {
    return (
      <div
        className={`art ph ${className}`}
        style={{ background: art.placeholder, '--ar': 0.8, ...style }}
        {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `${art.title} (placeholder)` })}
      />
    );
  }

  const bg = img?.color ? { backgroundColor: img.color } : null;
  // --ar reserves the artwork's shape before it loads (no layout shift; lets the viewer measure it).
  const ar = img?.width && img?.height ? { '--ar': +(img.width / img.height).toFixed(4) } : null;
  const common = {
    className: `art${ar ? ' sized' : ''} ${className}`,
    alt,
    style: { ...bg, ...ar, ...style },
    ...(decorative ? { 'aria-hidden': true } : {}),
  };

  if (img?.width && img?.height) {
    return (
      <Image
        {...common}
        src={src}
        width={img.width}
        height={img.height}
        sizes={sizes}
        preload={priority}
        quality={quality}
        {...(eager && !priority ? { loading: 'eager' } : {})}
      />
    );
  }
  // No stored dimensions: fall back to a plain, lazily loaded image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...common} src={src} loading={priority || eager ? 'eager' : 'lazy'} decoding="async" />;
}
