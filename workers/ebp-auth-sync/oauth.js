import { RequestError, parseJsonBody, validateSync, checkRateLimit } from './security.js';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const DEFAULT_APPLE_CLIENT_IDS = ['com.elbuenpastor'];
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const jwksCache = new Map();

function base64UrlToUint8Array(segment) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (segment.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function uint8ArrayToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseJsonSegment(segment) {
  const bytes = base64UrlToUint8Array(segment);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

function parseCsvList(raw, fallback = []) {
  const items = String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

async function fetchJwksKeys(jwksUrl, { forceRefresh = false, fetchJwks } = {}) {
  const cached = jwksCache.get(jwksUrl);
  const now = Date.now();
  if (!forceRefresh && cached && now - cached.fetchedAt < JWKS_CACHE_TTL_MS) {
    return cached.keys;
  }

  let data;
  if (typeof fetchJwks === 'function') {
    data = await fetchJwks(jwksUrl);
  } else {
    const res = await fetch(jwksUrl, { cf: { cacheTtl: 3600 } });
    if (!res.ok) throw new RequestError(503, 'oauth_provider_unavailable');
    data = await res.json();
  }

  const keys = Array.isArray(data?.keys) ? data.keys : [];
  if (keys.length === 0) throw new RequestError(503, 'oauth_provider_unavailable');
  jwksCache.set(jwksUrl, { keys, fetchedAt: now });
  return keys;
}

/**
 * Cryptographically verifies an RS256 OIDC ID token against a provider JWKS URL.
 */
export async function verifyOidcIdToken(token, {
  jwksUrl,
  validIssuers,
  validAudiences,
  fetchJwks,
}) {
  if (typeof token !== 'string' || token.length < 40 || token.length > 8192) {
    throw new RequestError(401, 'invalid_oauth_token');
  }

  const parts = token.split('.');
  if (parts.length !== 3) throw new RequestError(401, 'invalid_oauth_token');

  let header;
  let payload;
  try {
    header = parseJsonSegment(parts[0]);
    payload = parseJsonSegment(parts[1]);
  } catch {
    throw new RequestError(401, 'invalid_oauth_token');
  }

  if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || !header.kid) {
    throw new RequestError(401, 'invalid_oauth_token');
  }

  let keys = await fetchJwksKeys(jwksUrl, { forceRefresh: false, fetchJwks });
  let jwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
  if (!jwk) {
    // Handle key rotation cleanly on unknown kid.
    keys = await fetchJwksKeys(jwksUrl, { forceRefresh: true, fetchJwks });
    jwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
  }
  if (!jwk) throw new RequestError(401, 'invalid_oauth_token');

  let cryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  } catch {
    throw new RequestError(401, 'invalid_oauth_token');
  }

  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signatureBytes = base64UrlToUint8Array(parts[2]);
  const validSig = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes,
    signingInput,
  );
  if (!validSig) throw new RequestError(401, 'invalid_oauth_token');

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload?.exp !== 'number' || payload.exp < nowSec - 30) {
    throw new RequestError(401, 'oauth_token_expired');
  }
  if (typeof payload?.iat === 'number' && payload.iat > nowSec + 300) {
    throw new RequestError(401, 'invalid_oauth_token');
  }
  if (typeof payload?.sub !== 'string' || !payload.sub.trim()) {
    throw new RequestError(401, 'invalid_oauth_token');
  }
  if (!validIssuers.includes(payload.iss)) {
    throw new RequestError(401, 'invalid_oauth_token');
  }
  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audList.some((a) => validAudiences.includes(a))) {
    throw new RequestError(401, 'invalid_oauth_token');
  }

  return payload;
}

async function verifyAppleNonce(tokenNonce, rawNonce) {
  if (!tokenNonce) return;
  if (typeof rawNonce !== 'string' || !rawNonce.trim()) {
    throw new RequestError(401, 'invalid_oauth_nonce');
  }
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce)),
  );
  const shaHex = uint8ArrayToHex(digest);
  const shaB64Url = uint8ArrayToBase64Url(digest);
  if (tokenNonce !== shaHex && tokenNonce !== shaB64Url && tokenNonce !== rawNonce) {
    throw new RequestError(401, 'invalid_oauth_nonce');
  }
}

function cleanDisplayName(rawName, email) {
  const trimmed = String(rawName || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (trimmed.length >= 2) return trimmed;
  const emailPrefix = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (emailPrefix.length >= 2) return emailPrefix.slice(0, 60);
  return 'Hermano';
}

function isEmailVerifiedClaim(val) {
  return val === true || val === 'true';
}

async function resolveOrCreateOAuthUser(env, {
  provider,
  providerUserId,
  email,
  emailVerified,
  displayName,
  localData,
  randomHex,
  safeParseJson,
}) {
  const now = Date.now();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  // 1. Existing OAuth link by immutable provider subject (works even when Apple omits email on repeat sign-in).
  const existingLink = await env.DB.prepare(
    `SELECT user_id FROM oauth_identities WHERE provider = ?1 AND provider_user_id = ?2`,
  )
    .bind(provider, providerUserId)
    .first();

  let user = null;
  let isNewUser = false;

  if (existingLink?.user_id) {
    user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?1`)
      .bind(existingLink.user_id)
      .first();
  }

  // 2. Auto-link verified email to an existing account so existing favorites, church & Admin role stay intact.
  if (!user && normalizedEmail && emailVerified) {
    const byEmail = await env.DB.prepare(`SELECT * FROM users WHERE lower(email) = ?1`)
      .bind(normalizedEmail)
      .first();
    if (byEmail) {
      user = byEmail;
      const statements = [
        env.DB.prepare(
          `INSERT OR IGNORE INTO oauth_identities (provider, provider_user_id, user_id, email, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5)`,
        ).bind(provider, providerUserId, user.id, normalizedEmail, now),
      ];
      if (user.email_verified_at == null) {
        statements.push(
          env.DB.prepare(`UPDATE users SET email_verified_at = ?1 WHERE id = ?2`).bind(now, user.id),
        );
        user = { ...user, email_verified_at: now };
      }
      await env.DB.batch(statements);
    }
  }

  // 3. First-time sign-in: provision a new account + OAuth link + seed cloud sync from device localData.
  if (!user) {
    if (!normalizedEmail && provider === 'google') {
      throw new RequestError(400, 'oauth_email_required');
    }
    const accountEmail =
      normalizedEmail || `${provider}_${providerUserId.slice(0, 24)}@oauth.himnarioebp.local`;
    const userId = randomHex(16);
    // Unusable random salt/hash so password login can never match an OAuth-only account unless reset via email.
    const dummySalt = randomHex(16);
    const dummyHash = `oauth:${randomHex(32)}`;
    const safeName = cleanDisplayName(displayName, normalizedEmail);
    const merged = validateSync(
      localData || { favorites: [], playlists: [], recents: [], preferences: {} },
    );

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO users (id, email, name, password_hash, password_salt, created_at, email_verified_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      ).bind(userId, accountEmail, safeName, dummyHash, dummySalt, now, emailVerified ? now : null),
      env.DB.prepare(
        `INSERT INTO oauth_identities (provider, provider_user_id, user_id, email, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      ).bind(provider, providerUserId, userId, normalizedEmail || null, now),
      env.DB.prepare(
        `INSERT INTO user_data (user_id, favorites_json, playlists_json, recents_json, preferences_json, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      ).bind(
        userId,
        JSON.stringify(merged.favorites),
        JSON.stringify(merged.playlists),
        JSON.stringify(merged.recents),
        JSON.stringify(merged.preferences),
        now,
      ),
    ]);

    user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?1`).bind(userId).first();
    isNewUser = true;
    return {
      user,
      isNewUser,
      data: { ...merged, updatedAt: now },
    };
  }

  if (user.suspended_at != null) {
    throw new RequestError(403, 'account_suspended');
  }

  const cloudRow = await env.DB.prepare(
    `SELECT favorites_json, playlists_json, recents_json, preferences_json, updated_at
     FROM user_data WHERE user_id = ?1`,
  )
    .bind(user.id)
    .first();

  return {
    user,
    isNewUser,
    data: {
      favorites: safeParseJson(cloudRow?.favorites_json, []),
      playlists: safeParseJson(cloudRow?.playlists_json, []),
      recents: safeParseJson(cloudRow?.recents_json, []),
      preferences: safeParseJson(cloudRow?.preferences_json, {}),
      updatedAt: cloudRow?.updated_at || 0,
    },
  };
}

export async function handleOAuth(request, env, _ctx, deps) {
  const {
    path,
    createSession,
    serializeUser,
    safeParseJson,
    randomHex,
    getClientIp,
    rateLimitResponse,
    json,
    fetchJwks,
  } = deps;

  if (request.method !== 'POST') return null;
  if (path !== '/auth/oauth/apple' && path !== '/auth/oauth/google') return null;

  const clientIp = getClientIp(request);
  const ipCheck = await checkRateLimit(env, `oauth-ip:${clientIp}`, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 25,
    blockDurationMs: 15 * 60 * 1000,
    increment: true,
  });
  if (!ipCheck.allowed) {
    return rateLimitResponse(ipCheck.retryAfterSeconds);
  }

  const { tooLarge, body } = await parseJsonBody(request);
  if (tooLarge) {
    return json({ error: 'payload_too_large', message: 'Request payload too large.' }, 413);
  }

  if (path === '/auth/oauth/apple') {
    const validAudiences = parseCsvList(env.APPLE_CLIENT_IDS, DEFAULT_APPLE_CLIENT_IDS);
    const payload = await verifyOidcIdToken(body.identityToken, {
      jwksUrl: APPLE_JWKS_URL,
      validIssuers: ['https://appleid.apple.com'],
      validAudiences,
      fetchJwks,
    });
    await verifyAppleNonce(payload.nonce, body.rawNonce);

    const fullName = [body.givenName, body.familyName]
      .filter((part) => typeof part === 'string' && part.trim())
      .join(' ')
      .trim();
    const tokenEmail = typeof payload.email === 'string' ? payload.email : '';
    const emailVerified = Boolean(tokenEmail) && isEmailVerifiedClaim(payload.email_verified);

    const { user, data } = await resolveOrCreateOAuthUser(env, {
      provider: 'apple',
      providerUserId: payload.sub,
      email: tokenEmail,
      emailVerified,
      displayName: fullName || body.name || '',
      localData: body.localData,
      randomHex,
      safeParseJson,
    });

    const token = await createSession(env, user.id);
    return json({ token, user: serializeUser(user), data });
  }

  // POST /auth/oauth/google
  const googleAudiences = parseCsvList(env.GOOGLE_CLIENT_IDS, []);
  if (googleAudiences.length === 0) {
    return json({ error: 'oauth_not_configured', message: 'Google Sign-In is not configured.' }, 503);
  }

  const payload = await verifyOidcIdToken(body.idToken, {
    jwksUrl: GOOGLE_JWKS_URL,
    validIssuers: ['https://accounts.google.com', 'accounts.google.com'],
    validAudiences: googleAudiences,
    fetchJwks,
  });

  if (!isEmailVerifiedClaim(payload.email_verified) || typeof payload.email !== 'string') {
    throw new RequestError(401, 'oauth_email_unverified');
  }

  const { user, data } = await resolveOrCreateOAuthUser(env, {
    provider: 'google',
    providerUserId: payload.sub,
    email: payload.email,
    emailVerified: true,
    displayName: payload.name || body.name || '',
    localData: body.localData,
    randomHex,
    safeParseJson,
  });

  const token = await createSession(env, user.id);
  return json({ token, user: serializeUser(user), data });
}

export function clearJwksCacheForTests() {
  jwksCache.clear();
}
