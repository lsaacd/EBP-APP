export class RequestError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

export async function parseJsonBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) {
    throw new RequestError(415, 'unsupported_media_type');
  }
  const limit = 65536;
  if (Number(request.headers.get('Content-Length')) > limit) throw new RequestError(413, 'payload_too_large');
  const reader = request.body?.getReader();
  const chunks = []; let length = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > limit) { await reader.cancel(); throw new RequestError(413, 'payload_too_large'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let body;
  try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new RequestError(400, 'invalid_json'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError(400, 'invalid_json');
  return { tooLarge: false, body };
}

export function validateSync(value) {
  const invalid = () => { throw new RequestError(400, 'invalid_sync_data'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  function ids(items, max) {
    if (!Array.isArray(items) || items.length > max) invalid();
    if (items.some(id => typeof id !== 'string' || !/^(?:E)?\d{1,4}(?: [AB])?$/.test(id))) invalid();
    return [...new Set(items)];
  }
  const favorites = ids(value.favorites, 1000), recents = ids(value.recents, 10);
  if (!Array.isArray(value.playlists) || value.playlists.length > 200) invalid();
  const playlists = value.playlists.map(p => {
    if (!p || typeof p.id !== 'string' || !/^[\w-]{1,100}$/.test(p.id) ||
        typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100 ||
        !Number.isSafeInteger(p.createdAt) || p.createdAt < 0) invalid();
    return { id: p.id, name: p.name.trim(), hymnIds: ids(p.hymnIds, 1000), createdAt: p.createdAt };
  });
  if (new Set(playlists.map(p => p.id)).size !== playlists.length) invalid();
  const prefs = value.preferences;
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) invalid();
  const allowed = ['language', 'hymnLanguage', 'isDarkMode', 'fontSizeMultiplier'];
  if (Object.keys(prefs).some(k => !allowed.includes(k))) invalid();
  if (prefs.language !== undefined && !['es','en'].includes(prefs.language)) invalid();
  if (prefs.hymnLanguage !== undefined && !['es','en'].includes(prefs.hymnLanguage)) invalid();
  if (prefs.isDarkMode !== undefined && typeof prefs.isDarkMode !== 'boolean') invalid();
  if (prefs.fontSizeMultiplier !== undefined && (!Number.isFinite(prefs.fontSizeMultiplier) || prefs.fontSizeMultiplier < 12 / 22 || prefs.fontSizeMultiplier > 64 / 22)) invalid();
  return { favorites, playlists, recents, preferences: { ...prefs } };
}

// A single SQLite statement serializes increments; no read/modify/write race.
export async function checkRateLimit(env, rawKey, { windowMs, maxAttempts, blockDurationMs = 0, increment = true }) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rl:' + rawKey));
  const key = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join('');
  const now = Date.now();
  let row;
  if (increment) {
    row = await env.DB.prepare(`INSERT INTO rate_limits (bucket_key, attempts, window_start, blocked_until)
      VALUES (?1, 1, ?2, 0)
      ON CONFLICT(bucket_key) DO UPDATE SET
        attempts = CASE WHEN window_start <= ?3 AND blocked_until <= ?2 THEN 1 ELSE attempts + 1 END,
        window_start = CASE WHEN window_start <= ?3 AND blocked_until <= ?2 THEN ?2 ELSE window_start END
      RETURNING attempts, window_start, blocked_until`).bind(key, now, now - windowMs).first();
  } else {
    row = await env.DB.prepare('SELECT attempts, window_start, blocked_until FROM rate_limits WHERE bucket_key = ?1').bind(key).first();
  }
  // Database failures deliberately propagate: never authorize expensive auth work without limits.
  const until = row ? Math.max(row.window_start + windowMs, row.blocked_until) : 0;
  const exhausted = row && row.window_start > now - windowMs && (increment ? row.attempts > maxAttempts : row.attempts >= maxAttempts);
  if (exhausted || row?.blocked_until > now) {
    if (increment && blockDurationMs && row.blocked_until <= now) {
      await env.DB.prepare('UPDATE rate_limits SET blocked_until = MAX(blocked_until, ?2) WHERE bucket_key = ?1').bind(key, now + blockDurationMs).run();
    }
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((Math.max(until, now + (increment ? blockDurationMs : 0)) - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function secureResponse(request, response) {
  const headers = new Headers(response.headers);
  headers.delete('Access-Control-Allow-Origin');
  const origin = request.headers.get('Origin');
  if (['https://himnarioebp.com', 'https://www.himnarioebp.com', 'https://security-auth.ebp-himnario.pages.dev'].includes(origin)) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  return new Response(response.body, { status: response.status, headers });
}
