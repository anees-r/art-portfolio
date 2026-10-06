import { siteOrigin } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function robots() {
  const origin = siteOrigin(null);
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
