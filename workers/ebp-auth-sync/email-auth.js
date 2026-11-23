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

const EMAIL_ASSET_BASE = 'https://audio.himnarioebp.com/email';
const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function renderGlorifyEmail({ en, reset, link, userName }) {
  const bannerUrl = en
    ? `${EMAIL_ASSET_BASE}/email-notif-banner-en.png`
    : `${EMAIL_ASSET_BASE}/email-notif-banner-es.png`;
  const logoUrl = `${EMAIL_ASSET_BASE}/appicon-ebp-white.png`;
  const safeLink = escapeHtml(link);
  const firstName =
    typeof userName === 'string' && userName.trim()
      ? userName.trim().split(/\s+/)[0].slice(0, 40)
      : '';

  const headline = reset
    ? en
      ? 'Reset your password'
      : 'Restablece tu contraseña'
    : en
      ? firstName
        ? `Hello ${escapeHtml(firstName)}, welcome to Himnario El Buen Pastor!`
        : 'Hello and welcome to Himnario El Buen Pastor!'
      : firstName
        ? `¡Hola ${escapeHtml(firstName)}, bienvenido a Himnario El Buen Pastor!`
        : '¡Hola y bienvenido a Himnario El Buen Pastor!';

  const paragraph1 = reset
    ? en
      ? 'We received a request to reset the password for your Himnario El Buen Pastor account. Click the button below to choose a new password.'
      : 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de Himnario El Buen Pastor. Toca el botón de abajo para elegir una nueva contraseña.'
    : en
      ? 'We are so glad to have you in our community! Wherever you are on your walk of faith, it is a blessing to praise God together through hymns and Scripture.'
      : '¡Nos alegra mucho tenerte en nuestra comunidad! Dondequiera que estés en tu caminar de fe, es una bendición alabar a Dios juntos a través de los himnos y las Escrituras.';

  const paragraph2Lead = reset
    ? en
      ? 'For your security,'
      : 'Por tu seguridad,'
    : en
      ? 'To get started,'
      : 'Para comenzar,';

  const paragraph2Body = reset
    ? en
      ? 'this link will expire in 15 minutes.'
      : 'este enlace vencerá en 15 minutos.'
    : en
      ? 'please verify your account by clicking the button below. This link expires in 24 hours.'
      : 'por favor verifica tu cuenta tocando el botón de abajo. Este enlace vence en 24 horas.';

  const ctaLabel = reset
    ? en
      ? 'RESET YOUR PASSWORD'
      : 'RESTABLECER CONTRASEÑA'
    : en
      ? 'VERIFY YOUR ACCOUNT'
      : 'VERIFICAR TU CUENTA';

  const footnote = reset
    ? en
      ? 'If you did not request a password reset, you can safely ignore this email—your account remains secure.'
      : 'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo con tranquilidad; tu cuenta sigue segura.'
    : en
      ? 'Verifying your email unlocks cloud sync across devices and lets you participate in the Verse of the Day community. If you did not create this account, you can safely ignore this email.'
      : 'Verificar tu correo activa la sincronización en la nube entre tus dispositivos y te permite participar en la comunidad del Versículo de Hoy. Si no creaste esta cuenta, puedes ignorar este correo.';

  const fallbackLabel = en
    ? 'If the button does not work, copy and paste this link into your browser:'
    : 'Si el botón no funciona, copia y pega este enlace en tu navegador:';

  const motto = en
    ? '“Truth, honesty, justice, holiness, and charity”'
    : '“Verdad, honestidad, justicia, santidad y caridad”';

  return `<!DOCTYPE html>
<html lang="${en ? 'en' : 'es'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(reset ? (en ? 'Reset your password' : 'Restablece tu contraseña') : (en ? 'Verify your account' : 'Verifica tu cuenta'))}</title>
</head>
<body style="margin:0;padding:0;background-color:#121110;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#121110;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#1F1B18;border-radius:18px;overflow:hidden;border:1px solid #302A25;">
          <!-- Hero Banner -->
          <tr>
            <td style="padding:0;line-height:0;font-size:0;background-color:#FAF5EE;">
              <img src="${bannerUrl}" alt="Himnario El Buen Pastor" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
            </td>
          </tr>
          <!-- Main Body -->
          <tr>
            <td style="padding:36px 32px 32px 32px;background-color:#1F1B18;color:#F7F3EE;">
              <h1 style="margin:0 0 22px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:30px;line-height:1.22;font-weight:700;letter-spacing:-0.02em;color:#FFFFFF;">
                ${headline}
              </h1>
              <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#E5DFD7;">
                ${paragraph1}
              </p>
              <p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#E5DFD7;">
                <strong style="color:#FFFFFF;font-weight:700;">${paragraph2Lead}</strong> ${paragraph2Body}
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px 0;">
                <tr>
                  <td align="center" bgcolor="#7D1D24" style="border-radius:12px;">
                    <a href="${safeLink}" target="_blank" style="display:block;padding:16px 24px;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:12px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;font-size:13.5px;line-height:1.55;color:#B8AEA4;">
                ${footnote}
              </p>
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#8F857B;">
                ${fallbackLabel}
              </p>
              <p style="margin:0;font-size:12px;line-height:1.45;word-break:break-all;">
                <a href="${safeLink}" style="color:#E08E93;text-decoration:underline;">${safeLink}</a>
              </p>
            </td>
          </tr>
          <!-- Branded Footer -->
          <tr>
            <td style="padding:22px 32px 26px 32px;background-color:#171412;border-top:1px solid #2D2723;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="44" valign="middle" style="padding-right:12px;">
                    <img src="${logoUrl}" alt="El Buen Pastor" width="38" height="38" style="display:block;width:38px;height:38px;border-radius:9px;border:0;" />
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 2px 0;font-size:13.5px;font-weight:700;color:#F7F3EE;">
                      Himnario El Buen Pastor
                    </p>
                    <p style="margin:0;font-size:12px;font-style:italic;color:#A59B91;">
                      ${motto}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    : (en ? 'Welcome! Verify your Himnario email' : '¡Bienvenido! Verifica tu correo de Himnario');
  const intro = reset
    ? (en ? 'Choose a new password. This link expires in 15 minutes.' : 'Elige una nueva contraseña. Este enlace vence en 15 minutos.')
    : (en ? 'Confirm your email address. This link expires in 24 hours.' : 'Confirma tu correo electrónico. Este enlace vence en 24 horas.');
  const ignore = en ? 'If you did not request this, you can ignore this email.' : 'Si no lo solicitaste, puedes ignorar este correo.';
  const html = renderGlorifyEmail({ en, reset, link, userName: user.name });
  try {
    await env.EMAIL.send({
      to: user.email, from: env.EMAIL_FROM, subject,
      text: `${intro}\n\n${link}\n\n${ignore}`,
      html,
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
          const account = await env.DB.prepare('SELECT id, email, name FROM users WHERE email = ?1').bind(email).first();
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
  if (reset && (typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 128)) {
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
