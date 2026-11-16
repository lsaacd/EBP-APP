import { RequestError, parseJsonBody, validateSync, checkRateLimit, secureResponse } from './security.js';
import { handleEmailAuth, emailLanguage, sendRegistrationVerification } from './email-auth.js';
/**
 * Cloudflare Worker: EBP Himnario Auth & Cloud Sync Service
 * Backed by Cloudflare D1 (ebp-himnario-db)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-EBP-Client',
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function rateLimitResponse(retryAfterSeconds, message) {
  const secs = Math.max(1, Math.ceil(retryAfterSeconds || 60));
  return jsonResponse(
    {
      error: 'rate_limited',
      retryAfterSeconds: secs,
      message: message || `Too many attempts. Please wait ${secs} seconds and try again.`,
    },
    429,
    { 'Retry-After': String(secs) },
  );
}

function getClientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    '0.0.0.0'
  );
}

async function ensureMinDuration(startMs, minMs = 120) {
  const elapsed = Date.now() - startMs;
  if (elapsed < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
  }
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function randomHex(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return toHex(derived);
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function computeInitials(name, email) {
  const trimmed = String(name || '').trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const emailPrefix = String(email || '').split('@')[0] || 'U';
  return emailPrefix.slice(0, 2).toUpperCase();
}

function serializeUser(user) {
  return {
    id: user.id, email: user.email, name: user.name,
    initials: computeInitials(user.name, user.email),
    emailVerified: user.email_verified_at != null,
  };
}

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+([a-f0-9]{64})$/i);
  if (!match) return null;
  const tokenHash = await sha256Hex(match[1]);
  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.created_at, u.email_verified_at, s.token_hash
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?1 AND s.expires_at > ?2`,
  )
    .bind(tokenHash, now)
    .first();
  return row || null;
}

async function createSession(env, userId) {
  const rawToken = randomHex(32);
  const tokenHash = await sha256Hex(rawToken);
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24 * 30; // New sessions expire after 30 days
  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)`,
  )
    .bind(tokenHash, userId, now, expiresAt)
    .run();
  return rawToken;
}

const handler = {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/health' && request.method === 'GET') {
        return jsonResponse({ ok: true, service: 'ebp-himnario-sync' });
      }

      const emailResponse = await handleEmailAuth(request, env, ctx, {
        path, authenticate: authenticateRequest, serializeUser, hashPassword, json: jsonResponse,
      });
      if (emailResponse) return emailResponse;

      if (path === '/auth/register' && request.method === 'POST') {
        const startMs = Date.now();
        const clientIp = getClientIp(request);

        const ipAttemptCheck = await checkRateLimit(env, `reg-attempt:${clientIp}`, {
          windowMs: 60 * 60 * 1000,
          maxAttempts: 8,
          blockDurationMs: 15 * 60 * 1000,
          increment: true,
        });
        if (!ipAttemptCheck.allowed) {
          return rateLimitResponse(ipAttemptCheck.retryAfterSeconds);
        }

        const ipCreateCheck = await checkRateLimit(env, `reg-create:${clientIp}`, {
          windowMs: 60 * 60 * 1000,
          maxAttempts: 3,
          blockDurationMs: 60 * 60 * 1000,
          increment: false,
        });
        if (!ipCreateCheck.allowed) {
          return rateLimitResponse(ipCreateCheck.retryAfterSeconds);
        }

        const { tooLarge, body } = await parseJsonBody(request);
        if (tooLarge) {
          return jsonResponse({ error: 'payload_too_large', message: 'Request payload too large.' }, 413);
        }
        if (body.website) {
          await ensureMinDuration(startMs, 150);
          return rateLimitResponse(300);
        }

        if (typeof body.email !== 'string' || typeof body.password !== 'string') throw new RequestError(400, 'invalid_credentials');
        const email = String(body.email || '')
          .trim()
          .toLowerCase();
        if (typeof body.name !== 'string') throw new RequestError(400, 'invalid_name');
        const name = body.name.trim();
        const password = String(body.password || '');
        const language = emailLanguage(body.language ?? body.localData?.preferences?.language);

        if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return jsonResponse({ error: 'invalid_email', message: 'Invalid email address.' }, 400);
        }
        if (!name || name.length < 2 || name.length > 100) {
          return jsonResponse({ error: 'invalid_name', message: 'Please enter your name.' }, 400);
        }
        if (!password || password.length < 12 || password.length > 128) {
          return jsonResponse(
            { error: 'weak_password', message: 'Password must be at least 12 characters.' },
            400,
          );
        }

        const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?1`)
          .bind(email)
          .first();
        if (existing) {
          await ensureMinDuration(startMs, 120);
          return jsonResponse(
            { error: 'email_exists', message: 'An account with this email already exists.' },
            409,
          );
        }

        // Count successful account creation against IP quota
        const creationQuota = await checkRateLimit(env, `reg-create:${clientIp}`, {
          windowMs: 60 * 60 * 1000,
          maxAttempts: 3,
          blockDurationMs: 60 * 60 * 1000,
          increment: true,
        });

        if (!creationQuota.allowed) return rateLimitResponse(creationQuota.retryAfterSeconds);
        const userId = randomHex(16);
        const saltHex = randomHex(16);
        const passwordHash = await hashPassword(password, saltHex);
        const now = Date.now();

        const merged = validateSync(body.localData || { favorites: [], playlists: [], recents: [], preferences: {} });

        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO users (id, email, name, password_hash, password_salt, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
          ).bind(userId, email, name, passwordHash, saltHex, now),
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

        const token = await createSession(env, userId);
        const emailDelivered = await sendRegistrationVerification(env, { id: userId, email }, language, clientIp);
        return jsonResponse({
          token,
          emailDeliveryPending: !emailDelivered,
          user: {
            id: userId,
            email,
            name,
            initials: computeInitials(name, email),
            emailVerified: false,
          },
          data: { ...merged, updatedAt: now },
        });
      }

      if (path === '/auth/login' && request.method === 'POST') {
        const startMs = Date.now();
        const clientIp = getClientIp(request);

        const ipCheck = await checkRateLimit(env, `login-ip:${clientIp}`, {
          windowMs: 15 * 60 * 1000,
          maxAttempts: 20,
          blockDurationMs: 15 * 60 * 1000,
          increment: true,
        });
        if (!ipCheck.allowed) {
          return rateLimitResponse(ipCheck.retryAfterSeconds);
        }

        const { tooLarge, body } = await parseJsonBody(request);
        if (tooLarge) {
          return jsonResponse({ error: 'payload_too_large', message: 'Request payload too large.' }, 413);
        }
        if (body.website) {
          await ensureMinDuration(startMs, 150);
          return rateLimitResponse(300);
        }

        if (typeof body.email !== 'string' || typeof body.password !== 'string') throw new RequestError(400, 'invalid_credentials');
        const email = String(body.email || '')
          .trim()
          .toLowerCase();
        const password = String(body.password || '');

        if (!email || !password || email.length > 254 || password.length > 128) {
          return jsonResponse(
            { error: 'missing_credentials', message: 'Email and password are required.' },
            400,
          );
        }

        const ipEmailKey = `login-fail:${clientIp}:${email}`;
        const lockCheck = await checkRateLimit(env, ipEmailKey, {
          windowMs: 15 * 60 * 1000,
          maxAttempts: 5,
          increment: true,
        });
        if (!lockCheck.allowed) {
          return rateLimitResponse(lockCheck.retryAfterSeconds);
        }

        const user = await env.DB.prepare(
          `SELECT id, email, name, password_hash, password_salt, email_verified_at FROM users WHERE email = ?1`,
        )
          .bind(email)
          .first();
        if (!user) {
          await hashPassword(password, '00000000000000000000000000000000');

          await ensureMinDuration(startMs, 120);
          return jsonResponse(
            { error: 'invalid_credentials', message: 'Incorrect email or password.' },
            401,
          );
        }

        const computedHash = await hashPassword(password, user.password_salt);
        if (!timingSafeEqualHex(computedHash, user.password_hash)) {

          await ensureMinDuration(startMs, 120);
          return jsonResponse(
            { error: 'invalid_credentials', message: 'Incorrect email or password.' },
            401,
          );
        }



        const cloudRow = await env.DB.prepare(
          `SELECT favorites_json, playlists_json, recents_json, preferences_json, updated_at
           FROM user_data WHERE user_id = ?1`,
        )
          .bind(user.id)
          .first();

        const merged = {
          favorites: safeParseJson(cloudRow?.favorites_json, []),
          playlists: safeParseJson(cloudRow?.playlists_json, []),
          recents: safeParseJson(cloudRow?.recents_json, []),
          preferences: safeParseJson(cloudRow?.preferences_json, {}),
        };
        const now = cloudRow?.updated_at || 0;

        const token = await createSession(env, user.id);
        return jsonResponse({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            initials: computeInitials(user.name, user.email),
            emailVerified: user.email_verified_at != null,
          },
          data: { ...merged, updatedAt: now },
        });
      }

      if (path === '/auth/reset-password' && request.method === 'POST') {
        return jsonResponse({ error: 'recovery_unavailable', message: 'Secure account recovery is temporarily unavailable.' }, 503);
      }

      if (path === '/auth/profile' && request.method === 'PUT') {
        const authUser = await authenticateRequest(request, env);
        if (!authUser) return jsonResponse({ error: 'unauthorized' }, 401);

        const { tooLarge, body } = await parseJsonBody(request);
        if (tooLarge) {
          return jsonResponse({ error: 'payload_too_large' }, 413);
        }
        if (typeof body.name !== 'string') throw new RequestError(400, 'invalid_name');
        const name = body.name.trim();
        if (!name || name.length < 2 || name.length > 100) {
          return jsonResponse({ error: 'invalid_name' }, 400);
        }

        await env.DB.prepare(`UPDATE users SET name = ?1 WHERE id = ?2`)
          .bind(name, authUser.id)
          .run();

        return jsonResponse({
          user: {
            id: authUser.id,
            email: authUser.email,
            name,
            initials: computeInitials(name, authUser.email),
            emailVerified: authUser.email_verified_at != null,
          },
        });
      }

      if (path === '/sync' && request.method === 'GET') {
        const authUser = await authenticateRequest(request, env);
        if (!authUser) return jsonResponse({ error: 'unauthorized' }, 401);

        const row = await env.DB.prepare(
          `SELECT favorites_json, playlists_json, recents_json, preferences_json, updated_at
           FROM user_data WHERE user_id = ?1`,
        )
          .bind(authUser.id)
          .first();

        return jsonResponse({
          user: {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            initials: computeInitials(authUser.name, authUser.email),
            emailVerified: authUser.email_verified_at != null,
          },
          data: {
            favorites: safeParseJson(row?.favorites_json, []),
            playlists: safeParseJson(row?.playlists_json, []),
            recents: safeParseJson(row?.recents_json, []),
            preferences: safeParseJson(row?.preferences_json, {}),
            updatedAt: row?.updated_at || 0,
          },
        });
      }

      if (path === '/sync' && request.method === 'PUT') {
        const authUser = await authenticateRequest(request, env);
        if (!authUser) return jsonResponse({ error: 'unauthorized' }, 401);

        const syncRateCheck = await checkRateLimit(env, `sync-put:${authUser.id}`, {
          windowMs: 60 * 1000,
          maxAttempts: 60,
          blockDurationMs: 60 * 1000,
          increment: true,
        });
        if (!syncRateCheck.allowed) {
          return rateLimitResponse(syncRateCheck.retryAfterSeconds);
        }

        const { tooLarge, body } = await parseJsonBody(request);
        if (tooLarge) {
          return jsonResponse({ error: 'payload_too_large' }, 413);
        }

        const { favorites, playlists, recents, preferences } = validateSync(body);
        const expected = body.expectedRevision;
        if (!Number.isSafeInteger(expected) || expected < 0) {
          return jsonResponse({ error: 'sync_conflict' }, 409);
        }
        const now = Math.max(Date.now(), expected + 1);
        const result = await env.DB.prepare(
          `INSERT INTO user_data (user_id, favorites_json, playlists_json, recents_json, preferences_json, updated_at)
           SELECT ?1, ?2, ?3, ?4, ?5, ?6 WHERE ?7 = 0
           ON CONFLICT(user_id) DO UPDATE SET
             favorites_json = ?2, playlists_json = ?3, recents_json = ?4,
             preferences_json = ?5, updated_at = ?6
           WHERE user_data.updated_at = ?7`,
        ).bind(authUser.id, JSON.stringify(favorites), JSON.stringify(playlists),
          JSON.stringify(recents), JSON.stringify(preferences), now, expected).run();
        // With expected > 0 the INSERT SELECT above has no input; use conditional UPDATE.
        let changes = result.meta?.changes || 0;
        if (expected > 0) {
          const updated = await env.DB.prepare(`UPDATE user_data SET favorites_json=?2,
            playlists_json=?3, recents_json=?4, preferences_json=?5, updated_at=?6
            WHERE user_id=?1 AND updated_at=?7`).bind(authUser.id, JSON.stringify(favorites),
            JSON.stringify(playlists), JSON.stringify(recents), JSON.stringify(preferences), now, expected).run();
          changes = updated.meta?.changes || 0;
        }
        if (!changes) return jsonResponse({ error: 'sync_conflict' }, 409);
        return jsonResponse({ ok: true, updatedAt: now });
      }

      if (path === '/auth/logout' && request.method === 'POST') {
        const authUser = await authenticateRequest(request, env);
        if (authUser) {
          await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?1`)
            .bind(authUser.token_hash)
            .run();
        }
        return jsonResponse({ ok: true });
      }

      if (path === '/auth/account' && request.method === 'DELETE') {
        const authUser = await authenticateRequest(request, env);
        if (!authUser) return jsonResponse({ error: 'unauthorized' }, 401);

        await env.DB.batch([
          env.DB.prepare(`DELETE FROM user_data WHERE user_id = ?1`).bind(authUser.id),
          env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?1`).bind(authUser.id),
          env.DB.prepare(`DELETE FROM email_tokens WHERE user_id = ?1`).bind(authUser.id),
          env.DB.prepare(`DELETE FROM users WHERE id = ?1`).bind(authUser.id),
        ]);

        return jsonResponse({ ok: true });
      }

      return jsonResponse({ error: 'not_found' }, 404);
    } catch (err) {
      if (err instanceof RequestError && err.status === 429 && err.retryAfterSeconds) {
        return rateLimitResponse(err.retryAfterSeconds);
      }
      return jsonResponse(
        { error: err instanceof RequestError ? err.code : 'service_unavailable' },
        err instanceof RequestError ? err.status : 503,
      );
    }
  },
};


export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    if (origin && !['https://himnarioebp.com', 'https://www.himnarioebp.com', 'https://security-auth.ebp-himnario.pages.dev'].includes(origin)) {
      return secureResponse(request, jsonResponse({ error: 'origin_not_allowed' }, 403));
    }
    return secureResponse(request, await handler.fetch(request, env, ctx));
  },
};
