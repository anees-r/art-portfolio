import { hostOf } from '@/lib/nezden/normalize';

export default function Footer({ profile }) {
  const year = new Date().getFullYear();
  const artHost = hostOf(profile.artSiteUrl) || 'art.nezden.com';
  const back = profile.nezdenUrl;
  return (
    <footer className="foot">
      <span>
        © {year} {profile.name}
      </span>
      <span>{artHost}</span>
      {back && (
        <a href={back} target="_blank" rel="noopener">
          {hostOf(back)} ↗
        </a>
      )}
    </footer>
  );
}
