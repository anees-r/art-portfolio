/**
 * Images are served by Nezden (NEZDEN_MEDIA_BASE, e.g. https://nezden.com/media).
 * The allowed remote pattern is derived from that variable, so it must be set
 * when the app is BUILT as well as at runtime (Coolify: tick "Build Variable").
 */
function mediaPattern() {
  const base = process.env.NEZDEN_MEDIA_BASE || 'https://nezden.com/media';
  try {
    const u = new URL(base);
    return {
      protocol: u.protocol.replace(':', ''),
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: `${u.pathname.replace(/\/$/, '')}/**`,
    };
  } catch {
    return { protocol: 'https', hostname: 'nezden.com', pathname: '/media/**' };
  }
}

const isLocalMedia = /^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(
  (() => { try { return new URL(process.env.NEZDEN_MEDIA_BASE || '').hostname; } catch { return ''; } })()
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [mediaPattern()],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2400],
    // Nezden's files never change (random names, immutable), so cache optimised variants for long.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Only needed when media is served from a private address (the local dev fixture).
    dangerouslyAllowLocalIP: isLocalMedia,
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === '1',
  },
  async redirects() {
    return [{ source: '/artwork/:slug', destination: '/work/:slug', permanent: true }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
