'use client';

// Last-resort boundary (the root layout itself failed). Kept self-contained.
export default function GlobalError({ retry, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', background: '#07040f', color: '#efeaff', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,56px)' }}>
        <div>
          <h1 style={{ fontWeight: 300, fontSize: 'clamp(40px,7vw,88px)', lineHeight: 1, margin: '0 0 24px' }}>The gallery is closed for a moment.</h1>
          <button onClick={() => (retry || reset)?.()} style={{ font: '12px/1 system-ui, sans-serif', letterSpacing: '.24em', textTransform: 'uppercase', color: '#a89fc4', background: 'none', border: 0, borderBottom: '1px solid rgba(185,166,242,.38)', padding: '0 0 6px', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
