import { RequestError, parseJsonBody, checkRateLimit } from './security.js';

const ACTION_URLS = new Set([
  'https://himnarioebp.com/account.html',
  'https://security-auth.ebp-himnario.pages.dev/account.html?env=security',
]);
const TTL = { reset: 15 * 60 * 1000, verify: 24 * 60 * 60 * 1000 };
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
async function tokenHash(purpose, token) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${purpose}:${token}`))));
}

export function emailConfigured(env) {
  return env.EMAIL_ENABLED === 'true' && typeof env.EMAIL?.send === 'function' &&
    typeof env.EMAIL_FROM === 'string' && env.EMAIL_FROM.length <= 254 &&
    /^[^\r\n<>]+<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>$/.test(env.EMAIL_FROM) &&
    ACTION_URLS.has(env.ACCOUNT_ACTION_URL);
}

export function emailLanguage(value = 'es') {
  if (value !== 'en' && value !== 'es') throw new RequestError(400, 'invalid_language');
  return value;
}

async function strictBody(request, keys) {
  const { body } = await parseJsonBody(request);
  if (Object.keys(body).some(key => !keys.includes(key))) throw new RequestError(400, 'invalid_request');
  return body;
}

function normalizedEmail(value) {
  if (typeof value !== 'string') throw new RequestError(400, 'invalid_email');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@<>\x00-\x1f\x7f]+@[^\s@<>\x00-\x1f\x7f]+\.[^\s@<>\x00-\x1f\x7f]+$/.test(email)) {
    throw new RequestError(400, 'invalid_email');
  }
  return email;
}

async function quota(env, key, maxAttempts, windowMs = 60 * 60 * 1000) {
  const result = await checkRateLimit(env, key, { windowMs, maxAttempts });
  if (!result.allowed) {
    const error = new RequestError(429, 'rate_limited');
    error.retryAfterSeconds = result.retryAfterSeconds;
    throw error;
  }
}

async function issueQuota(env, purpose, ip, identity) {
  await quota(env, `email-${purpose}-ip:${ip}`, 10);
  await quota(env, `email-${purpose}-identity:${identity}`, 3);
}

// Only the native binding receives the raw token. Neither D1 nor HTTP responses do.
async function sendAction(env, user, purpose, language) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await tokenHash(purpose, token);
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at)
    VALUES (?1, ?2, ?3, ?4)`).bind(digest, user.id, purpose, now + TTL[purpose]).run();
  const link = `${env.ACCOUNT_ACTION_URL}#action=${purpose}&token=${token}&lang=${language}`;
  const en = language === 'en', reset = purpose === 'reset';
  const subject = reset
    ? (en ? 'Reset your Himnario password' : 'Restablece tu contraseña de Himnario')
    : (en ? 'Verify your Himnario email' : 'Verifica tu correo de Himnario');
  const intro = reset
    ? (en ? 'Choose a new password. This link expires in 15 minutes.' : 'Elige una nueva contraseña. Este enlace vence en 15 minutos.')
    : (en ? 'Confirm your email address. This link expires in 24 hours.' : 'Confirma tu correo electrónico. Este enlace vence en 24 horas.');
  const ignore = en ? 'If you did not request this, you can ignore this email.' : 'Si no lo solicitaste, puedes ignorar este correo.';
  try {
    await env.EMAIL.send({
      to: user.email, from: env.EMAIL_FROM, subject,
      text: `${intro}\n\n${link}\n\n${ignore}`,
      html: `<p>${intro}</p><p><a href="${link.replaceAll('&', '&amp;')}">${subject}</a></p><p>${ignore}</p>`,
    });
  } catch {
    // Do not leave a known-undelivered credential active; never log provider errors.
    await env.DB.prepare('DELETE FROM email_tokens WHERE token_hash = ?1').bind(digest).run();
    throw new RequestError(503, 'email_delivery_failed');
  }
}

export async function sendRegistrationVerification(env, user, language, ip) {
  if (!emailConfigured(env)) return false;
  try {
    await issueQuota(env, 'verify', ip, user.id);
    await sendAction(env, user, 'verify', language);
    return true;
  } catch {
    // Account/session creation already succeeded. A resend is available later.
    return false;
  }
}

export async function handleEmailAuth(request, env, ctx, { path, authenticate, serializeUser, hashPassword, json }) {
  const method = request.method;
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  if (path === '/auth/me' && method === 'GET') {
    const user = await authenticate(request, env);
    return user ? json({ user: serializeUser(user) }) : json({ error: 'unauthorized' }, 401);
  }
  const recoveryRequest = path === '/auth/recovery/request' && method === 'POST';
  const verificationRequest = path === '/auth/verification/request' && method === 'POST';
  if (recoveryRequest || verificationRequest) {
    // Same unavailable result for every recovery address; never look up an account first.
    if (!emailConfigured(env)) throw new RequestError(503, recoveryRequest ? 'recovery_unavailable' : 'verification_unavailable');
    let user;
    if (verificationRequest) {
      user = await authenticate(request, env);
      if (!user) throw new RequestError(401, 'unauthorized');
    }
    await quota(env, `email-${recoveryRequest ? 'reset' : 'verify'}-ip:${ip}`, 10);
    const body = await strictBody(request, recoveryRequest ? ['email', 'language'] : ['language']);
    const language = emailLanguage(body.language);
    if (recoveryRequest) {
      const email = normalizedEmail(body.email);
      await quota(env, `email-reset-identity:${email}`, 3);
      // Account lookup AND delivery run outside the response path: missing accounts,
      // provider failures and existing accounts have the same HTTP response/timing.
      const deliver = async () => {
        try {
          const account = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?1').bind(email).first();
          if (account) await sendAction(env, account, 'reset', language);
        } catch { /* Generic acceptance, including provider/D1 delivery failures. */ }
      };
      if (ctx?.waitUntil) ctx.waitUntil(deliver());
      else await deliver();
    } else {
      await quota(env, `email-verify-identity:${user.id}`, 3);
      if (user.email_verified_at == null) await sendAction(env, user, 'verify', language);
    }
    return json({ ok: true });
  }

  const reset = path === '/auth/recovery/complete' && method === 'POST';
  const verify = path === '/auth/verification/complete' && method === 'POST';
  if (!reset && !verify) return null;
  const purpose = reset ? 'reset' : 'verify';
  await quota(env, `email-${purpose}-complete-ip:${ip}`, 30, 15 * 60 * 1000);
  const body = await strictBody(request, reset ? ['token', 'newPassword'] : ['token']);
  if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new RequestError(400, 'invalid_token');
  if (reset && (typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 128)) {
    throw new RequestError(400, 'weak_password');
  }
  const digest = await tokenHash(purpose, body.token);
  const candidate = await env.DB.prepare(`SELECT user_id FROM email_tokens
    WHERE token_hash = ?1 AND purpose = ?2 AND expires_at > ?3`).bind(digest, purpose, Date.now()).first();
  if (!candidate) throw new RequestError(400, 'invalid_token');
  await quota(env, `email-${purpose}-complete-user:${candidate.user_id}`, 10, 15 * 60 * 1000);
  const salt = reset ? hex(crypto.getRandomValues(new Uint8Array(16))) : null;
  const passwordHash = reset ? await hashPassword(body.newPassword, salt) : null;
  const now = Date.now();
  // Every mutation is guarded by the still-live token INSIDE the transaction.
  // D1 batch serializes the entire sequence and rolls back on any error. The
  // pre-read above is only for rate limiting, never authorization to mutate.
  const owner = 'SELECT user_id FROM email_tokens WHERE token_hash = ?1 AND purpose = ?2 AND expires_at > ?3';
  const statements = [reset
    ? env.DB.prepare(`UPDATE users SET password_hash = ?4, password_salt = ?5 WHERE id = (${owner})`).bind(digest, purpose, now, passwordHash, salt)
    : env.DB.prepare(`UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?3) WHERE id = (${owner})`).bind(digest, purpose, now)];
  if (reset) statements.push(env.DB.prepare(`DELETE FROM sessions WHERE user_id = (${owner})`).bind(digest, purpose, now));
  // A reset invalidates all outstanding email credentials; verification invalidates
  // verification links only. The authorizing row is deleted in this last statement.
  statements.push(env.DB.prepare(`DELETE FROM email_tokens WHERE user_id = (${owner})${reset ? '' : " AND purpose = 'verify'"}`).bind(digest, purpose, now));
  const results = await env.DB.batch(statements);
  if (results[0].meta?.changes !== 1) throw new RequestError(400, 'invalid_token');
  return json({ ok: true });
}
