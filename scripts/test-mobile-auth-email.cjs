const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require(path.resolve('himnario/node_modules/typescript'));
const source = fs.readFileSync('himnario/context/AuthContext.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: false,
} }).outputText;
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const prefs = { language:'es', hymnLanguage:'es', isDarkMode:false, fontSizeMultiplier:1 };
const user = (id='u1', name='Cloud User') => ({ id, email:`${id}@example.com`, name });
const cloud = (revision=1000, favorites=['cloud']) => ({ favorites, playlists:[], recents:[], preferences:{...prefs}, updatedAt:revision });
const session = (revision=1000, syncBlocked=false) => JSON.stringify({ token:'old-token', user:user(), revision, syncBlocked, lastSyncedAt:'1000' });
const reply = (status, data) => ({ status, ok:status>=200 && status<300, json:async()=>data });
const flush = async () => { for (let i=0;i<4;i++) await new Promise(setImmediate); };

function fixture(raw=null, readGate=null) {
  const slots=[], effects=[], requests=[], timers=new Map(), writes=[];
  let cursor=0, scheduled=false, closed=false, value, stored=raw, storageQueue=Promise.resolve(), writeGate=null, timerId=0;
  const local={ favorites:['offline'], playlists:[], recents:[], preferences:{...prefs} };
  function render() { if(closed) return; cursor=0; value=mod.exports.AuthProvider({children:null}).props.value; const pending=effects.splice(0); pending.forEach(fn=>fn()); }
  function schedule() { if(scheduled || closed) return; scheduled=true; queueMicrotask(()=>{scheduled=false;render();}); }
  const same=(a,b)=>a && b && a.length===b.length && a.every((x,i)=>Object.is(x,b[i]));
  const react={
    createContext:()=>({Provider:{}}), createElement:(type,props)=>({type,props}), useContext:()=>value,
    useState(initial) { const i=cursor++; if(!slots[i]) { const slot={value:initial}; slot.set=next=>{const v=typeof next==='function'?next(slot.value):next;if(!Object.is(v,slot.value)){slot.value=v;schedule();}};slots[i]=slot; } return [slots[i].value,slots[i].set]; },
    useRef(initial) { const i=cursor++; return slots[i] ||= {current:initial}; },
    useCallback(fn,deps) { const i=cursor++; if(!slots[i] || !same(slots[i].deps,deps)) slots[i]={fn,deps}; return slots[i].fn; },
    useEffect(fn,deps) { const i=cursor++; if(!slots[i] || !same(slots[i].deps,deps)) { const old=slots[i];slots[i]={deps};effects.push(()=>{old?.cleanup?.();slots[i].cleanup=fn();}); } },
  };
  react.default=react;
  const serialize=fn=>{const next=storageQueue.then(fn);storageQueue=next.catch(()=>{});return next;};
  let backupFailure=false, backupGate=null;
  const backups=new Map();
  const deps={
    '@react-native-async-storage/async-storage':{default:{setItem:async(key,raw)=>{
      if(backupFailure)throw new Error('Disk full');
      if(backupGate)await backupGate.promise;
      backups.set(key,JSON.parse(raw));
    }}},
    react,
    '../utils/authSessionStorage': {
      readAuthSession:()=>serialize(async()=>readGate?await readGate.promise:stored),
      writeAuthSession:raw=>{writes.push(JSON.parse(raw));return serialize(async()=>{if(writeGate)await writeGate.promise;stored=raw;});},
      clearAuthSession:()=>serialize(async()=>{stored=null;}),
    },
    '../utils/pushNotifications':{getStoredPushToken:async()=>null,clearStoredPushToken:async()=>{}},
    '../utils/oauthClient':{performAppleSignIn:async()=>{throw new Error('auth_cancelled');},performGoogleSignIn:async()=>{throw new Error('auth_cancelled');}},
    './FavoritesContext':{useFavorites:()=>({favoriteIds:local.favorites,setAllFavorites})},
    './PlaylistsContext':{usePlaylists:()=>({playlists:local.playlists,setAllPlaylists})},
    './RecentHymnsContext':{useRecentHymns:()=>({recentIds:local.recents,setAllRecents})},
    './LanguageContext':{useLanguage:()=>({...local.preferences,setLanguage,setHymnLanguage})},
    '../theme/ThemeContext':{useTheme:()=>({...local.preferences,toggleTheme,setFontSizeMultiplier})},
  };
  function setAllFavorites(v){local.favorites=v;schedule();}
  function setAllPlaylists(v){local.playlists=v;schedule();}
  function setAllRecents(v){local.recents=v;schedule();}
  function setLanguage(v){local.preferences.language=v;schedule();}
  function setHymnLanguage(v){local.preferences.hymnLanguage=v;schedule();}
  function toggleTheme(){local.preferences.isDarkMode=!local.preferences.isDarkMode;schedule();}
  function setFontSizeMultiplier(v){local.preferences.fontSizeMultiplier=v;schedule();}
  const mod={exports:{}};
  const fetch=(url,options={})=>{
    if(url.endsWith('/auth/logout'))return Promise.resolve(reply(200,{}));
    const gate=deferred();requests.push({url,options,...gate});return gate.promise;
  };
  new Function('require','module','exports','fetch','setTimeout','clearTimeout',compiled)(name=>{
    if(!(name in deps))throw Error(`Unexpected dependency ${name}`);return deps[name];
  },mod,mod.exports,fetch,fn=>{timers.set(++timerId,fn);return timerId;},id=>timers.delete(id));
  render();
  return {
    get auth(){return value;},local,requests,writes,timers,backups,
    setBackupFailure:v=>backupFailure=v, setBackupGate:v=>backupGate=v,
    stored:()=>stored && JSON.parse(stored), setWriteGate:g=>writeGate=g,
    editFavorites:setAllFavorites,
    runTimers(){const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());},
    unmount(){closed=true;slots.forEach(s=>s?.cleanup?.());},
  };
}
async function login(f, {id='u1', revision=1000, favorites=['cloud'], mode='login', password='old'}={}) {
  const operation = mode==='login' ? f.auth.signIn(`${id}@example.com`,password) : f.auth.register('New User',`${id}@example.com`,password);
  await flush();f.requests.at(-1).resolve(reply(200,{token:`token-${id}`,user:user(id),data:cloud(revision,favorites)}));await operation;await flush();
}
async function restored(revision=1000) {
  const f=fixture(session());await flush();f.requests[0].resolve(reply(200,{user:user(),data:cloud(revision)}));await flush();return f;
}

test('community profile updates preserve protected session and send only editable fields', async () => {
  const f=await restored(), before=JSON.stringify(f.local);
  const pending=f.auth.updateProfile({name:'Choir Member',ministry:'corista',choir:'esmirna'});
  const request=f.requests.at(-1);
  assert.ok(request.url.endsWith('/auth/profile'));assert.equal(request.options.method,'PUT');
  assert.deepEqual(JSON.parse(request.options.body),{name:'Choir Member',ministry:'corista',choir:'esmirna'});
  request.resolve(reply(200,{user:{...user('u1','Choir Member'),ministry:'corista',choir:'esmirna',role:'member',badgeVerified:true,emailVerified:true}}));
  await pending;await flush();assert.equal(f.auth.user.ministry,'corista');assert.equal(f.auth.user.choir,'esmirna');assert.equal(f.auth.user.badgeVerified,false);assert.equal(f.auth.token,'old-token');assert.equal(JSON.stringify(f.local),before);f.unmount();
});
test('terms acceptance is versioned, authenticated and persists the server decision',async()=>{
  const f=await restored(),pending=f.auth.acceptUgcTerms(),request=f.requests.at(-1);
  assert.ok(request.url.endsWith('/auth/ugc-terms/accept'));assert.equal(request.options.method,'POST');assert.equal(request.options.headers.Authorization,'Bearer old-token');assert.deepEqual(JSON.parse(request.options.body),{version:'2026-11-17'});
  request.resolve(reply(200,{user:{...user(),emailVerified:true,ugcTermsAccepted:true}}));await pending;await flush();assert.equal(f.stored().user.ugcTermsAccepted,true);assert.equal(f.auth.user.ugcTermsAccepted,true);f.unmount();
});
test('a profile response for another account is rejected and a late response cannot restore logout',async()=>{
  const f=await restored();let pending=f.auth.updateProfile({ministry:'obispo'}).catch(e=>e);
  f.requests.at(-1).resolve(reply(200,{user:{...user('other'),ministry:'obispo',badgeVerified:true}}));assert.equal((await pending).message,'auth_failed');assert.equal(f.auth.user.id,'u1');
  pending=f.auth.updateProfile({ministry:'obispo'}).catch(e=>e);const request=f.requests.at(-1);await f.auth.signOut();request.resolve(reply(200,{user:{...user(),ministry:'obispo',badgeVerified:true}}));assert.equal((await pending).message,'auth_cancelled');assert.equal(f.auth.user,null);f.unmount();
});

// Focused email-flow tests; the hook/storage/network fixture above mirrors test-mobile-auth.cjs.
for (const language of ['es', 'en']) test('recovery sends only normalized email and language: ' + language, async () => {
  const f = fixture(); await flush();
  f.local.preferences.language = language; f.editFavorites(['offline']); await flush();
  const pending = f.auth.requestPasswordRecovery(' User@Example.COM ');
  const req = f.requests.at(-1);
  assert.ok(req.url.endsWith('/auth/recovery/request'));
  assert.equal(req.options.method, 'POST');
  assert.deepEqual(JSON.parse(req.options.body), {email:'user@example.com', language});
  assert.equal(req.options.headers.Authorization, undefined);
  assert.ok(req.options.signal instanceof AbortSignal);
  req.resolve(reply(200, {ok:true})); await pending;
  assert.equal(f.auth.user, null); assert.equal(f.writes.length, 0);
  assert.deepEqual(f.local.favorites, ['offline']); f.unmount();
});

test('legacy reset signature requests email without sending name or new password', async () => {
  const f = fixture(); await flush();
  const pending = f.auth.resetPassword('A@B.COM', 'NEVER-SEND-THIS-PASSWORD', 'NEVER-SEND-THIS-NAME');
  const req = f.requests.at(-1);
  assert.ok(req.url.endsWith('/auth/recovery/request'));
  assert.deepEqual(JSON.parse(req.options.body), {email:'a@b.com', language:'es'});
  assert.ok(!req.url.endsWith('/auth/reset-password'));
  req.resolve(reply(200, {})); await pending; f.unmount();
});

for (const action of ['requestPasswordRecovery', 'requestEmailVerification']) {
  for (const [status, data, expected] of [
    [503, {}, action === 'requestPasswordRecovery' ? 'recovery_unavailable' : 'verification_unavailable'],
    [429, {retryAfterSeconds:120}, 'rate_limited:120'],
    [500, {error:'private server detail'}, 'email_request_failed'],
  ]) test(action + ' handles ' + status + ' without mutating session or collections', async () => {
    const f = await restored(); const before = JSON.stringify(f.local);
    const pending = f.auth[action]('a@b.com').catch(e => e);
    f.requests.at(-1).resolve(reply(status, data));
    assert.equal((await pending).message, expected);
    assert.equal(f.auth.token, 'old-token'); assert.equal(JSON.stringify(f.local), before); f.unmount();
  });
}

test('verification request is authenticated and sends only language', async () => {
  const f = await restored(); const pending = f.auth.requestEmailVerification();
  const req = f.requests.at(-1);
  assert.ok(req.url.endsWith('/auth/verification/request'));
  assert.equal(req.options.method, 'POST');
  assert.equal(req.options.headers.Authorization, 'Bearer old-token');
  assert.deepEqual(JSON.parse(req.options.body), {language:'es'});
  req.resolve(reply(200, {})); await pending;
  assert.equal(f.auth.user.emailVerified, false); f.unmount();
});

test('verification and refresh require a signed-in session', async () => {
  const f = fixture(); await flush();
  await assert.rejects(f.auth.requestEmailVerification(), /auth_cancelled/);
  await assert.rejects(f.auth.refreshUser(), /auth_cancelled/);
  assert.equal(f.requests.length, 0); f.unmount();
});

for (const action of ['requestPasswordRecovery', 'requestEmailVerification', 'refreshUser']) {
  for (const status of [200, 401]) test('late ' + action + ' ' + status + ' cannot affect a newer login', async () => {
    const f = await restored();
    const pending = f.auth[action]('a@b.com').catch(e => e); const req = f.requests.at(-1);
    const body = deferred(); req.resolve({status, ok:status === 200, json:() => body.promise}); await flush();
    await f.auth.signOut(); assert.equal(req.options.signal.aborted, true);
    await login(f, {id:'u2', revision:3000});
    body.resolve({user:{...user(), emailVerified:true}});
    assert.equal((await pending).message, 'auth_cancelled'); await flush();
    assert.equal(f.auth.user.id, 'u2'); assert.equal(f.stored().user.id, 'u2');
    assert.equal(f.auth.user.emailVerified, false); f.unmount();
  });
}

for (const action of ['requestEmailVerification', 'refreshUser']) test(action + ' clears an expired session but keeps offline collections', async () => {
  const f = await restored(); const before = JSON.stringify(f.local);
  const pending = f.auth[action]().catch(e => e);
  f.requests.at(-1).resolve(reply(401, {error:'unauthorized'}));
  assert.equal((await pending).message, 'auth_cancelled'); await flush();
  assert.equal(f.auth.user, null); assert.equal(f.stored(), null);
  assert.equal(JSON.stringify(f.local), before); f.unmount();
});

test('GET me refresh persists verified user without altering revision or offline edits', async () => {
  const f = await restored(); const before = JSON.stringify(f.local);
  const pending = f.auth.refreshUser(); const req = f.requests.at(-1);
  assert.ok(req.url.endsWith('/auth/me'));
  assert.ok(req.options.method === undefined || req.options.method === 'GET');
  assert.equal(req.options.headers.Authorization, 'Bearer old-token');
  assert.equal(req.options.body, undefined);
  req.resolve(reply(200, {user:{...user(), emailVerified:true}}));
  assert.equal((await pending).emailVerified, true); await flush();
  assert.equal(f.auth.user.emailVerified, true); assert.equal(f.stored().user.emailVerified, true);
  assert.equal(f.stored().revision, 1000); assert.equal(f.auth.syncBlocked, false);
  assert.equal(JSON.stringify(f.local), before); f.unmount();
});

test('older account refresh cannot overwrite a newer refresh', async () => {
  const f = await restored(); const first = f.auth.refreshUser().catch(e => e); const firstReq = f.requests.at(-1);
  const second = f.auth.refreshUser(); const secondReq = f.requests.at(-1);
  secondReq.resolve(reply(200, {user:{...user(), emailVerified:true}})); await second;
  firstReq.resolve(reply(200, {user:{...user(), emailVerified:false}}));
  assert.equal((await first).message, 'auth_cancelled'); await flush();
  assert.equal(f.auth.user.emailVerified, true); assert.equal(f.stored().user.emailVerified, true); f.unmount();
});

test('refresh rejects a response for a different account', async () => {
  const f = await restored(); const pending = f.auth.refreshUser().catch(e => e);
  f.requests.at(-1).resolve(reply(200, {user:{...user('other'), emailVerified:true}}));
  assert.equal((await pending).message, 'account_refresh_failed');
  assert.equal(f.auth.user.id, 'u1'); assert.equal(f.auth.user.emailVerified, false); f.unmount();
});

for (const rawValue of [undefined, false, 'true', 1, true]) test('restored emailVerified normalizes strictly: ' + rawValue, async () => {
  const raw = JSON.parse(session()); raw.user.emailVerified = rawValue;
  const f = fixture(JSON.stringify(raw)); await flush();
  assert.equal(f.auth.user.emailVerified, rawValue === true);
  f.requests[0].resolve(reply(200, {data:cloud()})); await flush();
  assert.deepEqual(f.local.favorites, ['offline']); f.unmount();
});

for (const mode of ['login', 'register']) test(mode + ' normalizes verification without blocking sync', async () => {
  const f = fixture(); await flush();
  const pending = mode === 'login' ? f.auth.signIn('u1@example.com', 'old') : f.auth.register('A', 'u1@example.com', '123456789012');
  f.requests.at(-1).resolve(reply(200, {token:'token-u1', user:{...user(), emailVerified:true}, data:cloud()}));
  await pending; await flush(); assert.equal(f.auth.user.emailVerified, true);
  assert.equal(f.stored().user.emailVerified, true); assert.equal(f.auth.syncBlocked, false); f.unmount();
});

test('startup sync updates verification while retaining local collections', async () => {
  const f = fixture(session()); await flush();
  f.requests[0].resolve(reply(200, {user:{...user(), emailVerified:true}, data:cloud()})); await flush();
  assert.equal(f.auth.user.emailVerified, true); assert.equal(f.stored().user.emailVerified, true);
  assert.deepEqual(f.local.favorites, ['offline']); f.unmount();
});

test('unverified users can sync; stale sync response cannot undo verified status', async () => {
  const f = await restored(); assert.equal(f.auth.user.emailVerified, false);
  const sync = f.auth.syncNow(); await flush(); const syncReq = f.requests.at(-1);
  const refresh = f.auth.refreshUser();
  f.requests.at(-1).resolve(reply(200, {user:{...user(), emailVerified:true}})); await refresh;
  syncReq.resolve(reply(200, {updatedAt:2000, user:{...user(), emailVerified:false}})); await sync; await flush();
  assert.equal(f.auth.user.emailVerified, true); assert.equal(f.stored().user.emailVerified, true);
  assert.equal(f.stored().revision, 2000); f.unmount();
});

test('refresh storage already in progress finishes before logout clear', async () => {
  const f = await restored(); const gate = deferred(); f.setWriteGate(gate);
  const pending = f.auth.refreshUser().catch(e => e);
  f.requests.at(-1).resolve(reply(200, {user:{...user(), emailVerified:true}})); await flush();
  const out = f.auth.signOut(); gate.resolve(); await out;
  assert.equal((await pending).message, 'auth_cancelled'); await flush();
  assert.equal(f.auth.token, null); assert.equal(f.stored(), null); f.unmount();
});

for (const action of ['requestPasswordRecovery', 'requestEmailVerification', 'refreshUser']) test(action + ' cancels on provider unmount', async () => {
  const f = await restored(); const pending = f.auth[action]('a@b.com').catch(e => e); const req = f.requests.at(-1);
  f.unmount(); assert.equal(req.options.signal.aborted, true);
  req.resolve(reply(200, {user:{...user(), emailVerified:true}}));
  assert.equal((await pending).message, 'auth_cancelled');
});

for (const override of [undefined, 'https://ebp-himnario-sync-security.example.workers.dev']) test('public API URL override: ' + (override || 'production default'), async () => {
  const previous = process.env.EXPO_PUBLIC_AUTH_SYNC_API_URL;
  let f;
  try {
    if (override) process.env.EXPO_PUBLIC_AUTH_SYNC_API_URL = override;
    else delete process.env.EXPO_PUBLIC_AUTH_SYNC_API_URL;
    f = fixture();
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_AUTH_SYNC_API_URL;
    else process.env.EXPO_PUBLIC_AUTH_SYNC_API_URL = previous;
  }
  await flush();
  const pending = f.auth.requestPasswordRecovery('a@b.com');
  const req = f.requests.at(-1);
  assert.equal(req.url, (override || 'https://ebp-himnario-sync.himnario.workers.dev') + '/auth/recovery/request');
  req.resolve(reply(200, {})); await pending; f.unmount();
});

test('stale sync user cannot overwrite a newer profile name', async () => {
  const f = await restored(); const sync = f.auth.syncNow(); await flush(); const syncReq = f.requests.at(-1);
  const profile = f.auth.updateProfileName('New Name');
  f.requests.at(-1).resolve(reply(200, {user:user('u1', 'New Name')})); await profile;
  syncReq.resolve(reply(200, {updatedAt:2000, user:user('u1', 'Old Name')})); await sync; await flush();
  assert.equal(f.auth.user.displayName, 'New Name'); assert.equal(f.stored().user.displayName, 'New Name'); f.unmount();
});

test('GET me refresh handles rate limits without changing the session', async () => {
  const f = await restored(); const pending = f.auth.refreshUser().catch(e => e);
  f.requests.at(-1).resolve(reply(429, {retryAfterSeconds:90}));
  assert.equal((await pending).message, 'rate_limited:90');
  assert.equal(f.auth.token, 'old-token'); assert.equal(f.auth.user.emailVerified, false); f.unmount();
});
