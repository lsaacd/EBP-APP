const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require(path.resolve('himnario/node_modules/typescript'));
const source = fs.readFileSync('himnario/context/AuthContext.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React,
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

 test('logout during secure read prevents restore and queues durable clear',async()=>{
  const gate=deferred(), f=fixture(null,gate);await flush();const out=f.auth.signOut();gate.resolve(session());await out;await flush();assert.equal(f.auth.token,null);assert.equal(f.requests.length,0);assert.equal(f.stored(),null);assert.equal(f.writes.length,0);f.unmount();
});
test('late startup GET body cannot resurrect a logged-out session',async()=>{
  const f=fixture(session());await flush();const body=deferred();f.requests[0].resolve({status:200,ok:true,json:()=>body.promise});await flush();await f.auth.signOut();body.resolve({user:user(),data:cloud(2000)});await flush();assert.equal(f.auth.token,null);assert.equal(f.stored(),null);assert.equal(f.writes.length,0);f.unmount();
});
for(const mode of ['login','register'])test(`late ${mode} response cannot undo logout or replace local data`,async()=>{
  const f=fixture();await flush();const pending=(mode==='login'?f.auth.signIn('a@b.com','old'):f.auth.register('A','a@b.com','123456789012')).catch(e=>e);await flush();await f.auth.signOut();f.requests[0].resolve(reply(200,{token:'late',user:user(),data:cloud()}));const error=await pending;await flush();assert.equal(error.message,'auth_cancelled');assert.equal(f.auth.token,null);assert.deepEqual(f.local.favorites,['offline']);assert.equal(f.writes.length,0);f.unmount();
});
test('storage write already in progress finishes before logout clear',async()=>{
  const f=fixture();await flush();const gate=deferred();f.setWriteGate(gate);const pending=f.auth.signIn('a@b.com','old').catch(e=>e);await flush();f.requests[0].resolve(reply(200,{token:'new',user:user(),data:cloud()}));await flush();assert.equal(f.writes.length,1);const out=f.auth.signOut();gate.resolve();await out;assert.equal((await pending).message,'auth_cancelled');await flush();assert.equal(f.stored(),null);assert.equal(f.auth.token,null);f.unmount();
});
for(const status of [200,401])test(`late profile ${status} cannot overwrite or clear a newer login`,async()=>{
  const f=await restored();const pending=f.auth.updateProfileName('Old Name').catch(e=>e);await flush();const old=f.requests.at(-1);await f.auth.signOut();await login(f,{id:'u2',revision:3000});old.resolve(reply(status,{user:user('u1','Stale Name')}));assert.equal((await pending).message,'auth_cancelled');await flush();assert.equal(f.auth.user.id,'u2');assert.equal(f.stored().user.id,'u2');assert.equal(f.auth.isSyncing,false);f.unmount();
});
test('409 retains all local data and stale revision; manual and automatic pushes stay blocked',async()=>{
  const f=await restored();const before=JSON.stringify(f.local);const pending=f.auth.syncNow().catch(e=>e);await flush();const put=f.requests.at(-1);assert.equal(JSON.parse(put.options.body).expectedRevision,1000);put.resolve(reply(409,{error:'sync_conflict',updatedAt:2000}));assert.equal((await pending).message,'sync_conflict');await flush();assert.equal(JSON.stringify(f.local),before);assert.equal(f.auth.syncBlocked,true);assert.equal(f.stored().revision,1000);assert.equal(f.stored().syncBlocked,true);const count=f.requests.length;await assert.rejects(f.auth.syncNow(),/sync_conflict/);f.editFavorites(['new-local']);await flush();f.runTimers();await flush();assert.equal(f.requests.length,count);f.unmount();
});
test('startup revision mismatch preserves offline collections and blocks stale pushes',async()=>{
  const f=await restored(2000);assert.deepEqual(f.local.favorites,['offline']);assert.equal(f.auth.syncBlocked,true);assert.equal(f.stored().revision,1000);assert.equal(f.auth.lastSyncedAt,new Date(1000).toISOString());await assert.rejects(f.auth.syncNow(),/sync_conflict/);assert.equal(f.requests.length,1);f.unmount();
});
test('legacy missing revision stays blocked even when GET has a revision',async()=>{
  const raw=JSON.parse(session());delete raw.revision;const f=fixture(JSON.stringify(raw));await flush();f.requests[0].resolve(reply(200,{data:cloud()}));await flush();assert.equal(f.auth.syncBlocked,true);assert.deepEqual(f.local.favorites,['offline']);await assert.rejects(f.auth.syncNow(),/sync_conflict/);assert.equal(f.stored().revision,null);f.unmount();
});
test('successful PUT uses expectedRevision, retains edits made in flight, saves ISO time',async()=>{
  const f=await restored();const pending=f.auth.syncNow();await flush();const put=f.requests.at(-1);assert.equal(JSON.parse(put.options.body).expectedRevision,1000);f.editFavorites(['newer-local']);await flush();put.resolve(reply(200,{updatedAt:2000}));await pending;await flush();assert.deepEqual(f.local.favorites,['newer-local']);assert.equal(f.stored().revision,2000);assert.equal(f.auth.lastSyncedAt,new Date(2000).toISOString());f.unmount();
});
test('overlapping manual PUTs serialize and use the newly acknowledged revision',async()=>{
  const f=await restored();const first=f.auth.syncNow(),second=f.auth.syncNow();await flush();assert.equal(f.requests.length,2);f.requests[1].resolve(reply(200,{updatedAt:2000}));await first;await flush();assert.equal(f.requests.length,3);assert.equal(JSON.parse(f.requests[2].options.body).expectedRevision,2000);f.requests[2].resolve(reply(200,{updatedAt:3000}));await second;f.unmount();
});
test('login omits localData, accepts existing short passwords, and applies authoritative cloud',async()=>{
  const f=fixture();await flush();await login(f,{password:'old'});const body=JSON.parse(f.requests[0].options.body);assert.equal('localData' in body,false);assert.deepEqual(f.local.favorites,['cloud']);assert.equal(f.auth.lastSyncedAt,new Date(1000).toISOString());assert.equal(f.stored().revision,1000);assert.equal(f.auth.syncBlocked,false);f.unmount();
});
test('registration requires 8 characters and alone may send initial localData',async()=>{
  const f=fixture();await flush();await assert.rejects(f.auth.register('A','a@b.com','1234567'),/password_too_short/);assert.equal(f.requests.length,0);await login(f,{mode:'register',password:'12345678'});const body=JSON.parse(f.requests[0].options.body);assert.deepEqual(body.localData.favorites,['offline']);f.unmount();
});
test('legacy resetPassword delegates to email recovery without sending password or name',async()=>{
  const f=fixture();await flush();const pending=f.auth.resetPassword('a@b.com','password','A').catch(e=>e);await flush();assert.equal(f.requests.length,1);const body=JSON.parse(f.requests[0].options.body);assert.equal('password' in body,false);assert.equal('name' in body,false);f.requests[0].resolve(reply(503,{error:'recovery_unavailable'}));assert.equal((await pending).message,'recovery_unavailable');f.unmount();
});
test('late sync 401 cannot clear a newer login',async()=>{
  const f=await restored();const pending=f.auth.syncNow().catch(e=>e);await flush();const put=f.requests.at(-1);await f.auth.signOut();await login(f,{id:'u2',revision:3000});put.resolve(reply(401,{}));assert.equal((await pending).message,'auth_cancelled');await flush();assert.equal(f.auth.user.id,'u2');assert.equal(f.stored().user.id,'u2');f.unmount();
});


test('cloud replacement backs up current guest collections without credentials',async()=>{
  const f=fixture();await flush();await login(f);const backup=f.backups.get('@himnario_auth_local_backup_v1:guest');assert.deepEqual(backup.data.favorites,['offline']);assert.equal(backup.priorAccountId,null);assert.equal('token' in backup,false);assert.equal('user' in backup,false);assert.deepEqual(f.local.favorites,['cloud']);f.unmount();
});
test('cloud replacement backs up under prior account, not incoming account',async()=>{
  const f=await restored();await login(f,{id:'u2'});const backup=f.backups.get('@himnario_auth_local_backup_v1:account:u1');assert.equal(backup.priorAccountId,'u1');assert.deepEqual(backup.data.favorites,['offline']);assert.equal(f.backups.has('@himnario_auth_local_backup_v1:account:u2'),false);f.unmount();
});
test('backup failure aborts before cloud replacement or credential write',async()=>{
  const f=fixture();await flush();f.setBackupFailure(true);const pending=f.auth.signIn('a@b.com','old').catch(e=>e);await flush();f.requests[0].resolve(reply(200,{token:'new',user:user(),data:cloud()}));assert.equal((await pending).message,'local_backup_failed');await flush();assert.deepEqual(f.local.favorites,['offline']);assert.equal(f.auth.token,null);assert.equal(f.writes.length,0);f.unmount();
});
test('edits during backup I/O abort replacement and retain the newer local data',async()=>{
  const f=fixture();await flush();const gate=deferred();f.setBackupGate(gate);const pending=f.auth.signIn('a@b.com','old').catch(e=>e);await flush();f.requests[0].resolve(reply(200,{token:'new',user:user(),data:cloud()}));await flush();f.editFavorites(['edited-during-backup']);await flush();gate.resolve();assert.equal((await pending).message,'local_backup_failed');await flush();assert.deepEqual(f.local.favorites,['edited-during-backup']);assert.equal(f.auth.token,null);assert.equal(f.writes.length,0);f.unmount();
});
test('resolveSyncConflict("local") fetches latest cloud revision, pushes local data, and resumes sync',async()=>{
  const f=await restored(2000);assert.equal(f.auth.syncBlocked,true);const pending=f.auth.resolveSyncConflict('local');await flush();const get=f.requests.at(-1);assert.equal(get.options.method,undefined);get.resolve(reply(200,{user:user(),data:cloud(2000,['cloud-only'])}));await flush();const put=f.requests.at(-1);assert.equal(put.options.method,'PUT');const body=JSON.parse(put.options.body);assert.equal(body.expectedRevision,2000);assert.deepEqual(body.favorites,['offline']);put.resolve(reply(200,{updatedAt:3000}));await pending;await flush();assert.equal(f.auth.syncBlocked,false);assert.deepEqual(f.local.favorites,['offline']);assert.equal(f.stored().revision,3000);assert.equal(f.stored().syncBlocked,false);assert.equal(f.auth.lastSyncedAt,new Date(3000).toISOString());f.unmount();
});
test('resolveSyncConflict("cloud") backs up local data, applies cloud data, and resumes sync',async()=>{
  const f=await restored(2000);assert.equal(f.auth.syncBlocked,true);const pending=f.auth.resolveSyncConflict('cloud');await flush();const get=f.requests.at(-1);get.resolve(reply(200,{user:user(),data:cloud(2000,['cloud-only'])}));await pending;await flush();assert.equal(f.auth.syncBlocked,false);assert.deepEqual(f.local.favorites,['cloud-only']);assert.equal(f.stored().revision,2000);assert.equal(f.stored().syncBlocked,false);assert.equal(f.auth.lastSyncedAt,new Date(2000).toISOString());const backup=f.backups.get('@himnario_auth_local_backup_v1:account:u1');assert.deepEqual(backup.data.favorites,['offline']);const count=f.requests.length;f.runTimers();await flush();assert.equal(f.requests.length,count);f.unmount();
});
test('resolveSyncConflict("cloud") aborts and stays blocked if local backup fails',async()=>{
  const f=await restored(2000);f.setBackupFailure(true);const pending=f.auth.resolveSyncConflict('cloud').catch(e=>e);await flush();f.requests.at(-1).resolve(reply(200,{user:user(),data:cloud(2000,['cloud-only'])}));assert.equal((await pending).message,'local_backup_failed');await flush();assert.equal(f.auth.syncBlocked,true);assert.deepEqual(f.local.favorites,['offline']);f.unmount();
});
test('startup restore with matching revision and identical snapshot does not trigger redundant PUT /sync',async()=>{
  const f=fixture(session());await flush();f.requests[0].resolve(reply(200,{user:user(),data:cloud(1000,['offline'])}));await flush();assert.equal(f.auth.syncBlocked,false);f.runTimers();await flush();assert.equal(f.requests.length,1);f.unmount();
});
