// Self-hosted fonts (bundled at build time; no runtime call to Google).
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/manrope/300.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import './globals.css';

import SmoothScroll from '@/components/motion/SmoothScroll';
import Cursor from '@/components/motion/Cursor';
import Particles from '@/components/motion/Particles';

const origin = (() => {
  try {
    return new URL(process.env.SITE_URL || 'http://localhost:3000');
  } catch {
    return new URL('http://localhost:3000');
  }
})();

export const metadata = {
  metadataBase: origin,
  title: { default: 'Gallery', template: '%s' },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#07040f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Hide the hero copy until GSAP takes over (avoids a flash before the entrance fade).
// Skipped entirely for visitors who prefer reduced motion.
const motionGuard = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-pending')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGuard }} />
      </head>
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <div id="ambient" aria-hidden="true">
          <div className="fog f1" />
          <div className="fog f2" />
          <div className="fog f3" />
          <Particles />
        </div>
        <div className="arch-lines" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <Cursor />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
