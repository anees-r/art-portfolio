// Social links from Nezden (preset icon, or a custom icon drawn as a monochrome mask).

const PATHS = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  behance: (
    <>
      <path d="M3 6.5h5.2a2.6 2.6 0 0 1 0 5.2H3zM3 11.7h5.9a2.9 2.9 0 0 1 0 5.8H3z" />
      <path d="M14 13.6h7a3.5 3.5 0 1 0-1 2.6" />
      <path d="M15 7.5h5" />
    </>
  ),
  github: (
    <path d="M9 19c-4.3 1.4-4.3-2.1-6-2.6m12 5.1v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.6 2.8 5.6 3.1 5.6 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.8 5.7 5.5 6a3 3 0 0 0-.8 2.3v3.6" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-6M11.5 13a2.5 2.5 0 0 1 5 0v3.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
};

function Icon({ link }) {
  if (link.customIcon) {
    return (
      <span
        className="ico mask"
        aria-hidden="true"
        style={{ '--src': `url("${link.customIcon}")`, ...(link.iconColor ? { '--ico': link.iconColor } : null) }}
      />
    );
  }
  return (
    <span className="ico" aria-hidden="true" style={link.iconColor ? { color: link.iconColor } : undefined}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {PATHS[link.icon] || PATHS.globe}
      </svg>
    </span>
  );
}

export default function SocialLinks({ links, back }) {
  if (!links?.length && !back) return null;
  return (
    <div className="links rv">
      {links.map((l) => (
        <a key={l.id} href={l.url} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          <Icon link={l} />
          {l.label}
          {l.external ? ' ↗' : ''}
        </a>
      ))}
      {back && (
        <a href={back.url} target="_blank" rel="noopener">
          {back.label} ↗
        </a>
      )}
    </div>
  );
}
