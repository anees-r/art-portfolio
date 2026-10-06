import Link from 'next/link';

export const metadata = { title: 'Not found', robots: { index: false } };

export default function NotFound() {
  return (
    <main id="content" className="wrap closed">
      <div className="door-l" aria-hidden="true" />
      <div className="label">404</div>
      <h1>This room is empty.</h1>
      <p>Nothing is hanging here. The piece may have been moved, renamed or taken down.</p>
      <div className="acts">
        <Link href="/#work">See the work</Link>
        <Link href="/">Back to the entrance</Link>
      </div>
    </main>
  );
}
