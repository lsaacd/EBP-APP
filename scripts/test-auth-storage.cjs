const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('../himnario/node_modules/typescript');
function fixture({failWrite=false}={}) {
  let secured=null, legacy='legacy-session';
  const events=[];
  const asyncStorage={getItem:async()=>legacy, removeItem:async()=>{events.push('remove-legacy');legacy=null;}};
  const secure={
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
    getItemAsync:async()=>secured,
    setItemAsync:async(k,v)=>{events.push('secure-write');if(failWrite)throw Error('storage unavailable');await new Promise(r=>setTimeout(r,5));secured=v;},
    deleteItemAsync:async()=>{events.push('secure-delete');secured=null;},
  };
  const output=ts.transpileModule(fs.readFileSync(require.resolve('../himnario/utils/authSessionStorage.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  new Function('require','exports','module',output)(id=>id==='expo-secure-store'?secure:asyncStorage,mod.exports,mod);
  return {...mod.exports,events,get secured(){return secured;},get legacy(){return legacy;}};
}
test('legacy bearer token migrates only after successful encrypted persistence',async()=>{
  const f=fixture();assert.equal(await f.readAuthSession(),'legacy-session');
  assert.equal(f.secured,'legacy-session');assert.equal(f.legacy,null);
  assert.deepEqual(f.events,['secure-write','remove-legacy']);
});
test('failed encrypted migration retains legacy data and does not return a plaintext fallback',async()=>{
  const f=fixture({failWrite:true});await assert.rejects(f.readAuthSession());
  assert.equal(f.legacy,'legacy-session');assert.equal(f.secured,null);
});
test('logout removal is ordered after an outstanding write and prevents session resurrection',async()=>{
  const f=fixture();await Promise.all([f.writeAuthSession('new-session'),f.clearAuthSession()]);
  assert.equal(f.secured,null);assert.equal(f.legacy,null);
});
