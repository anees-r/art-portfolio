'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Shown when Nezden's database can't be reached (or anything else fails).
// Visitors never see the underlying error; it is logged on the server.
export default function GalleryError({ retry, reset }) {
  useEffect(() => {
    document.documentElement.classList.remove('motion-pending');
  }, []);
  const again = () => (retry || reset)?.();
  return (
    <main id="content" className="wrap closed">
      <meta name="robots" content="noindex" />
      <div className="door-l" aria-hidden="true" />
      <div className="label">Gallery</div>
      <h1>The gallery is closed for a moment.</h1>
      <p>The works can&rsquo;t be brought out right now. Please try again in a little while.</p>
      <div className="acts">
        <button onClick={again}>Try again</button>
        <Link href="/">Back to the entrance</Link>
      </div>
    </main>
  );
}
