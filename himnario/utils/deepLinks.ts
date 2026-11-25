/**
 * Shared Universal Link & custom-scheme deep-link helpers for Himnario El Buen Pastor.
 *
 * Ensures every shared link (`https://himnarioebp.com/...` or `el-buen-pastor-himnario://...`)
 * resolves to the exact in-app screen:
 * - Member profile: `/member/<id>`, `/member/?id=<id>` -> `/member/<id>`
 * - Church / map:   `/churches?id=<id>`, `/churches/<id>` -> `/churches?id=<id>`
 * - Hymn / chorus:  `/hymn/<id>/`, `/himno/<id>/`, `/h/<id>` -> `/hymn/<id>`
 * - Smart app link: `/app`, `/app/` -> `/(tabs)/home`
 */

const SITE_ORIGIN = 'https://himnarioebp.com';

export function profileShareUrl(memberId: string): string {
  const clean = String(memberId || '').trim();
  if (!clean) return `${SITE_ORIGIN}/app/`;
  return `${SITE_ORIGIN}/member/?id=${encodeURIComponent(clean)}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Normalizes an incoming system URL (Universal Link or custom scheme) into a
 * valid Expo Router path. Returns the input untouched when no rewrite is needed.
 */
export function resolveDeepLinkPath(rawInput: string): string {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '/';

  // TrackPlayer notification click deep link — keep the user on their current screen/home safely.
  if (trimmed.includes('notification.click')) {
    return '/(tabs)/home';
  }

  let pathname = trimmed;
  let searchParams: URLSearchParams | null = null;

  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed);
      const isCustomScheme =
        parsed.protocol === 'el-buen-pastor-himnario:' ||
        parsed.protocol.startsWith('com.googleusercontent.apps.');

      // For custom scheme URLs like `el-buen-pastor-himnario://member/abc`,
      // `parsed.host` is `member` and `parsed.pathname` is `/abc`.
      if (isCustomScheme && parsed.host) {
        pathname = `/${parsed.host}${parsed.pathname || ''}`;
      } else {
        pathname = parsed.pathname || '/';
      }
      searchParams = parsed.searchParams;
    } else {
      const qIdx = trimmed.indexOf('?');
      if (qIdx >= 0) {
        pathname = trimmed.slice(0, qIdx) || '/';
        searchParams = new URLSearchParams(trimmed.slice(qIdx + 1));
      }
    }
  } catch {
    return trimmed;
  }

  // Strip trailing slashes (except root `/`)
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // 1. Member profile links: `/member/<id>`, `/member?id=<id>`, `/member/?id=<id>`
  const memberPathMatch = cleanPath.match(/^\/member\/([^/]+)$/i);
  if (memberPathMatch) {
    const id = safeDecode(memberPathMatch[1]).trim();
    if (id) return `/member/${encodeURIComponent(id)}`;
  }
  if (/^\/member$/i.test(cleanPath)) {
    const qId = searchParams?.get('id')?.trim();
    if (qId) return `/member/${encodeURIComponent(qId)}`;
    return '/(tabs)/home';
  }

  // 2. Church links: `/churches?id=<id>`, `/churches/<id>`, `/churches`
  const churchPathMatch = cleanPath.match(/^\/churches\/([^/]+)$/i);
  if (churchPathMatch) {
    const id = safeDecode(churchPathMatch[1]).trim();
    if (id) return `/churches?id=${encodeURIComponent(id)}`;
  }
  if (/^\/churches$/i.test(cleanPath)) {
    const qId = searchParams?.get('id')?.trim();
    if (qId) return `/churches?id=${encodeURIComponent(qId)}`;
    return '/churches';
  }

  // 3. Hymn / chorus links: `/hymn/<id>`, `/himno/<id>`, `/h/<id>`
  const hymnMatch = cleanPath.match(/^\/(?:hymn|himno|h)\/([^/]+)$/i);
  if (hymnMatch) {
    const id = safeDecode(hymnMatch[1]).trim();
    if (id) return `/hymn/${encodeURIComponent(id)}`;
  }

  // 4. Smart app landing link: `/app`
  if (/^\/app$/i.test(cleanPath)) {
    return '/(tabs)/home';
  }

  // 5. Fallback: preserve internal path (with query if present)
  const qs = searchParams && searchParams.toString() ? `?${searchParams.toString()}` : '';
  return `${cleanPath}${qs}`;
}
