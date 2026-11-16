const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const base = path.resolve(__dirname, '../workers/ebp-auth-sync');
const worker = import(pathToFileURL(path.join(base, 'index.js'))).then(m => m.default);
const security = import(pathToFileURL(path.join(base, 'security.js')));

function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(path.join(base, 'schema.sql'), 'utf8'));
  const DB = {
    prepare(query) {
      let values = {};
      const stmt = sql.prepare(query);
      stmt.setAllowUnknownNamedParameters(true);
      const adapter = {
        bind(...args) { values = Object.fromEntries(args.map((v,i) => [String(i+1), v])); return adapter; },
        async first() { return stmt.get(values) || null; },
        async run() { const r = stmt.run(values); return { meta: { changes: Number(r.changes) } }; },
      };
      return adapter;
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try { const r = await Promise.all(statements.map(s => s.run())); sql.exec('COMMIT'); return r; }
      catch (e) { sql.exec('ROLLBACK'); throw e; }
    },
  };
  const env = { DB };
  async function call(route, method='GET', body, token, extra={}) {
    const headers = { 'Content-Type':'application/json', 'CF-Connecting-IP':'192.0.2.1', ...extra };
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = new Request(`https://example.test${route}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return (await worker).fetch(req, env);
  }
  return { sql, env, call };
}
const snapshot = (favorites=[]) => ({ favorites, playlists:[], recents:[], preferences:{language:'es'} });
async function register(f, email='one@example.test', ip='192.0.2.1') {
  const r = await f.call('/auth/register','POST',{email, name:'Test Person',password:'test-password-987',localData:snapshot(['1'])},null,{'CF-Connecting-IP':ip});
  assert.equal(r.status,200,await r.clone().text()); return r.json();
}

test('email and name can never reset a password; errors and private responses are not cached', async () => {
  const f=fixture(), account=await register(f);
  const before=f.sql.prepare('SELECT password_hash FROM users').get().password_hash;
  const r=await f.call('/auth/reset-password','POST',{email:'one@example.test',name:'Test Person',newPassword:'attacker-password'});
  assert.equal(r.status,503); assert.equal((await r.json()).error,'recovery_unavailable');
  assert.equal(f.sql.prepare('SELECT password_hash FROM users').get().password_hash,before);
  assert.equal((await f.call('/sync','GET',undefined,account.token)).headers.get('Cache-Control'),'no-store');
});
test('CORS allows only intended web origins and still supports native clients', async () => {
  const f=fixture();
  const r=await f.call('/health','GET',undefined,null,{Origin:'https://evil.example'});
  assert.equal(r.status,403); assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
  const allowed=await f.call('/health','GET',undefined,null,{Origin:'https://himnarioebp.com'});
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),'https://himnarioebp.com');
  assert.equal((await f.call('/health')).status,200);
});
test('cross-account sync stays scoped; stale and legacy writers cannot erase newer changes', async () => {
  const f=fixture(), a=await register(f), b=await register(f,'two@example.test','192.0.2.2');
  const results=await Promise.all([['2'],['3']].map(ids=>f.call('/sync','PUT',{...snapshot(ids),expectedRevision:a.data.updatedAt},a.token)));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.deepEqual((await (await f.call('/sync','GET',undefined,b.token)).json()).data.favorites,['1']);
  assert.equal((await f.call('/sync','PUT',snapshot([]),a.token)).status,409);
  assert.equal((await f.call('/sync','GET',undefined,'0'.repeat(64))).status,401);
  const current=(await (await f.call('/sync','GET',undefined,a.token)).json()).data;
  assert.equal((await f.call('/sync','PUT',{...snapshot([]),expectedRevision:current.updatedAt},a.token)).status,200);
  assert.deepEqual((await (await f.call('/sync','GET',undefined,a.token)).json()).data.favorites,[]);
});
test('login does not import another account or stale guest collections', async () => {
  const f=fixture(); await register(f);
  const r=await f.call('/auth/login','POST',{email:'one@example.test',password:'test-password-987',localData:snapshot(['999'])});
  assert.equal(r.status,200); assert.deepEqual((await r.json()).data.favorites,['1']);
});
test('parallel rate counters enforce the quota; database failure fails closed', async () => {
  const { checkRateLimit }=await security, f=fixture();
  const r=await Promise.all(Array.from({length:30},()=>checkRateLimit(f.env,'same-key',{windowMs:60000,maxAttempts:5})));
  assert.equal(r.filter(x=>x.allowed).length,5);
  const broken={DB:{prepare(){throw Error('database secret diagnostic');}}};
  const req=new Request('https://example.test/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const response=await (await worker).fetch(req,broken);
  assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/secret diagnostic/);
});
test('streamed byte limits, malformed JSON and nested payload validation reject hostile input', async () => {
  const { parseJsonBody, validateSync }=await security;
  await assert.rejects(()=>parseJsonBody(new Request('https://example.test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"value":"'+'é'.repeat(40000)+'"}'})),e=>e.status===413);
  await assert.rejects(()=>parseJsonBody(new Request('https://example.test',{method:'POST',headers:{'Content-Type':'application/json'},body:'[]'})),e=>e.status===400);
  await assert.rejects(()=>parseJsonBody(new Request('https://example.test',{method:'POST',body:'{}'})),e=>e.status===415);
  assert.throws(()=>validateSync({...snapshot(),preferences:{admin:true}}));
  assert.throws(()=>validateSync({...snapshot(),playlists:[{id:'p',name:'x',createdAt:1,hymnIds:['<script>']}]}));
  assert.deepEqual(validateSync(snapshot(['315 A','E124'])).favorites,['315 A','E124']);
});
test('expired and revoked sessions fail; account deletion cannot target a different user', async () => {
  const f=fixture(),a=await register(f),b=await register(f,'two@example.test','192.0.2.2');
  const r=await f.call('/auth/account','DELETE',undefined,a.token);
  assert.equal(r.status,200);
  assert.equal((await f.call('/sync','GET',undefined,a.token)).status,401);
  assert.equal((await f.call('/sync','GET',undefined,b.token)).status,200);
  f.sql.prepare('UPDATE sessions SET expires_at = 1').run();
  assert.equal((await f.call('/sync','GET',undefined,b.token)).status,401);
});
