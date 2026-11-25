const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');

function makeD1(db) {
  return {
    prepare(sql) {
      let params = [];
      return {
        bind(...args) {
          params = args;
          return this;
        },
        async first() {
          const stmt = db.prepare(sql);
          return stmt.get(...params) ?? null;
        },
        async all() {
          const stmt = db.prepare(sql);
          return { results: stmt.all(...params) };
        },
        async run() {
          const stmt = db.prepare(sql);
          const info = stmt.run(...params);
          return { success: true, meta: { changes: info.changes } };
        },
      };
    },
    async batch(statements) {
      const results = [];
      for (const s of statements) {
        results.push(await s.run());
      }
      return results;
    },
  };
}

function initDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  const schema = fs.readFileSync(path.join(ROOT, 'workers/ebp-auth-sync/schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

function toBase64Url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createRsaKeyPair(kid = 'test-key-1') {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const publicJwk = await crypto.subtle.exportKey('jwk', publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  return { publicJwk, privateKey, kid };
}

async function signJwt(payload, privateKey, kid = 'test-key-1') {
  const headerSeg = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }));
  const payloadSeg = toBase64Url(JSON.stringify(payload));
  const input = `${headerSeg}.${payloadSeg}`;
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(input),
  );
  return `${input}.${toBase64Url(new Uint8Array(sig))}`;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Buffer.from(digest).toString('hex');
}

function makeDeps(db, env, jwksMap) {
  let sessionCounter = 0;
  return {
    createSession: async (_env, userId) => {
      sessionCounter += 1;
      const raw = String(sessionCounter).padStart(64, 'a');
      const hash = await sha256Hex(raw);
      await env.DB.prepare(
        'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)',
      )
        .bind(hash, userId, Date.now(), Date.now() + 86400000)
        .run();
      return raw;
    },
    serializeUser: (u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: u.email_verified_at != null,
      role: u.role === 'admin' && u.email.toLowerCase() === 'isaacduran167@gmail.com' ? 'admin' : 'member',
    }),
    safeParseJson: (raw, fb) => {
      try {
        return raw ? JSON.parse(raw) : fb;
      } catch {
        return fb;
      }
    },
    randomHex: (n = 16) => Buffer.from(crypto.getRandomValues(new Uint8Array(n))).toString('hex'),
    getClientIp: () => '203.0.113.42',
    rateLimitResponse: (secs) =>
      new Response(JSON.stringify({ error: 'rate_limited', retryAfterSeconds: secs }), { status: 429 }),
    json: (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    fetchJwks: async (url) => jwksMap[url] || { keys: [] },
  };
}

test('Apple & Google OAuth verification, account linking, nonce checks, and rejection paths', async () => {
  const oauthMod = await import(pathToFileURL(path.join(ROOT, 'workers/ebp-auth-sync/oauth.js')).href);
  const { handleOAuth, clearJwksCacheForTests } = oauthMod;
  clearJwksCacheForTests();

  const db = initDb();
  const appleKey = await createRsaKeyPair('apple-k1');
  const googleKey = await createRsaKeyPair('google-k1');
  const wrongKey = await createRsaKeyPair('apple-k1');

  const GOOGLE_IOS_CLIENT = '242867050819-vgirqp4m77rrthvhis46kbiajmcg9qce.apps.googleusercontent.com';
  const env = {
    DB: makeD1(db),
    APPLE_CLIENT_IDS: 'com.elbuenpastor',
    GOOGLE_CLIENT_IDS: GOOGLE_IOS_CLIENT,
  };
  const jwksMap = {
    'https://appleid.apple.com/auth/keys': { keys: [appleKey.publicJwk] },
    'https://www.googleapis.com/oauth2/v3/certs': { keys: [googleKey.publicJwk] },
  };
  const deps = makeDeps(db, env, jwksMap);
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Valid Apple first sign-in creates account + seeds localData
  const rawNonce = 'nonce-secret-12345';
  const hashedNonce = await sha256Hex(rawNonce);
  const appleToken1 = await signJwt(
    {
      iss: 'https://appleid.apple.com',
      aud: 'com.elbuenpastor',
      sub: 'apple-sub-001',
      email: 'hermano@icloud.com',
      email_verified: 'true',
      nonce: hashedNonce,
      iat: nowSec,
      exp: nowSec + 600,
    },
    appleKey.privateKey,
    appleKey.kid,
  );
  const res1 = await handleOAuth(
    new Request('https://api.example/auth/oauth/apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identityToken: appleToken1,
        rawNonce,
        givenName: 'Juan',
        familyName: 'Pérez',
        localData: { favorites: ['1', 'E3'], playlists: [], recents: ['1'], preferences: {} },
      }),
    }),
    env,
    null,
    { ...deps, path: '/auth/oauth/apple' },
  );
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.equal(body1.user.name, 'Juan Pérez');
  assert.equal(body1.user.email, 'hermano@icloud.com');
  assert.equal(body1.user.emailVerified, true);
  assert.deepEqual(body1.data.favorites, ['1', 'E3']);

  // 2. Repeat Apple sign-in without name/email resolves same user by sub
  const appleToken2 = await signJwt(
    {
      iss: 'https://appleid.apple.com',
      aud: 'com.elbuenpastor',
      sub: 'apple-sub-001',
      nonce: hashedNonce,
      iat: nowSec,
      exp: nowSec + 600,
    },
    appleKey.privateKey,
    appleKey.kid,
  );
  const res2 = await handleOAuth(
    new Request('https://api.example/auth/oauth/apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken: appleToken2, rawNonce }),
    }),
    env,
    null,
    { ...deps, path: '/auth/oauth/apple' },
  );
  assert.equal(res2.status, 200);
  const body2 = await res2.json();
  assert.equal(body2.user.id, body1.user.id);
  assert.equal(body2.user.name, 'Juan Pérez');

  // 3. Google sign-in with verified email matching existing password account auto-links & keeps existing data/role
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, password_salt, created_at, role)
     VALUES ('admin-u1', 'isaacduran167@gmail.com', 'Isaac', 'hash', 'salt', ?1, 'admin')`,
  ).run(Date.now());
  db.prepare(
    `INSERT INTO user_data (user_id, favorites_json, playlists_json, recents_json, preferences_json, updated_at)
     VALUES ('admin-u1', '["42"]', '[]', '[]', '{}', 1700000000000)`,
  ).run();

  const googleToken = await signJwt(
    {
      iss: 'https://accounts.google.com',
      aud: GOOGLE_IOS_CLIENT,
      sub: 'google-sub-999',
      email: 'isaacduran167@gmail.com',
      email_verified: true,
      name: 'Isaac Duran',
      iat: nowSec,
      exp: nowSec + 600,
    },
    googleKey.privateKey,
    googleKey.kid,
  );
  const res3 = await handleOAuth(
    new Request('https://api.example/auth/oauth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: googleToken }),
    }),
    env,
    null,
    { ...deps, path: '/auth/oauth/google' },
  );
  assert.equal(res3.status, 200);
  const body3 = await res3.json();
  assert.equal(body3.user.id, 'admin-u1');
  assert.equal(body3.user.role, 'admin');
  assert.equal(body3.user.emailVerified, true);
  assert.deepEqual(body3.data.favorites, ['42']);

  // 4. Reject forged signature
  const forgedToken = await signJwt(
    {
      iss: 'https://appleid.apple.com',
      aud: 'com.elbuenpastor',
      sub: 'apple-sub-001',
      nonce: hashedNonce,
      iat: nowSec,
      exp: nowSec + 600,
    },
    wrongKey.privateKey,
    appleKey.kid,
  );
  await assert.rejects(
    () =>
      handleOAuth(
        new Request('https://api.example/auth/oauth/apple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identityToken: forgedToken, rawNonce }),
        }),
        env,
        null,
        { ...deps, path: '/auth/oauth/apple' },
      ),
    (err) => err.status === 401 && err.code === 'invalid_oauth_token',
  );

  // 5. Reject wrong nonce on Apple token
  await assert.rejects(
    () =>
      handleOAuth(
        new Request('https://api.example/auth/oauth/apple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identityToken: appleToken1, rawNonce: 'wrong-nonce' }),
        }),
        env,
        null,
        { ...deps, path: '/auth/oauth/apple' },
      ),
    (err) => err.status === 401 && err.code === 'invalid_oauth_nonce',
  );

  // 6. Reject wrong audience & unverified Google email
  const badAudGoogle = await signJwt(
    {
      iss: 'https://accounts.google.com',
      aud: 'other-app.apps.googleusercontent.com',
      sub: 'google-sub-bad',
      email: 'bad@gmail.com',
      email_verified: true,
      iat: nowSec,
      exp: nowSec + 600,
    },
    googleKey.privateKey,
    googleKey.kid,
  );
  await assert.rejects(
    () =>
      handleOAuth(
        new Request('https://api.example/auth/oauth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: badAudGoogle }),
        }),
        env,
        null,
        { ...deps, path: '/auth/oauth/google' },
      ),
    (err) => err.status === 401 && err.code === 'invalid_oauth_token',
  );

  const unverifiedGoogle = await signJwt(
    {
      iss: 'https://accounts.google.com',
      aud: GOOGLE_IOS_CLIENT,
      sub: 'google-sub-unverified',
      email: 'unverified@gmail.com',
      email_verified: false,
      iat: nowSec,
      exp: nowSec + 600,
    },
    googleKey.privateKey,
    googleKey.kid,
  );
  await assert.rejects(
    () =>
      handleOAuth(
        new Request('https://api.example/auth/oauth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: unverifiedGoogle }),
        }),
        env,
        null,
        { ...deps, path: '/auth/oauth/google' },
      ),
    (err) => err.status === 401 && err.code === 'oauth_email_unverified',
  );
});
