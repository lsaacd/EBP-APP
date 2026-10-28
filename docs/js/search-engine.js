(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EBPSearch=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 const containsToken=(text,token)=>token.length<=2?(` ${text} `).includes(` ${token} `):text.includes(token);
 function near(a,b){if(a===b)return true;const limit=a.length>=8?2:1;if(a.length<4||Math.abs(a.length-b.length)>limit)return false;if(a.length===b.length){const different=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])different.push(i);if(different.length===2&&different[1]===different[0]+1&&a[different[0]]===b[different[1]]&&a[different[1]]===b[different[0]])return true;}let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));if(Math.min(...next)>limit)return false;prev=next;}return prev[b.length]<=limit;}
 function create(hymns){
  const records=hymns.map(h=>({h,title:normalize(h.title),lyrics:normalize(h.lyrics),tags:normalize(h.categories.join(' ')),words:normalize(h.title).split(' ')}));
  return function search(raw,{field='all'}={}){
   const q=normalize(raw);if(!q)return hymns.map(h=>({hymn:h,score:0,kind:'',snippet:''}));
   const numeric=String(raw).trim().match(/^(?:(himno|h|estribillo|coro|e)\s*#?\s*|#\s*)?(\d+)$/i);
   const tokens=[...new Set(q.split(' '))].slice(0,20),results=[];
   for(const r of records){let score=0,kind='',snippet='';
    if(numeric&&(field==='all'||field==='number')){const prefix=(numeric[1]||'').toLowerCase(),extra=r.h.id.startsWith('E');if((['e','estribillo','coro'].includes(prefix)&&!extra)||(['h','himno'].includes(prefix)&&extra))continue;const n=String(Number(numeric[2])),id=String(r.h.number);if(id===n){score=2000+(extra?0:10);kind='Número exacto';}else if(id.startsWith(n)){score=800-id.length;kind='Número similar';}}
    else if(field!=='number'){
     const titleOK=field==='all'||field==='title',lyricOK=field==='all'||field==='lyrics';
     if(titleOK&&r.title===q){score=1900;kind='Título exacto';}
     else if(titleOK&&r.title.startsWith(q)){score=1700;kind='Título';}
     else if(titleOK&&r.title.includes(q)){score=1500;kind='Título';}
     else if(titleOK&&tokens.every(t=>r.words.some(w=>w.startsWith(t)))){score=1300;kind='Palabras del título';}
     else if(lyricOK&&r.lyrics.includes(q)){score=1000;kind='Coincidencia en la letra';}
     else if(lyricOK&&tokens.every(t=>containsToken(r.lyrics,t))){score=700;kind='Palabras en la letra';}
     else if(field==='all'&&tokens.every(t=>containsToken(r.title+' '+r.lyrics+' '+r.tags,t))){score=600;kind='Título, letra o categoría';}
     else if(titleOK&&tokens.some(t=>t.length>=4)&&tokens.every(t=>r.words.some(w=>w.startsWith(t)||near(t,w)))){score=350;kind='Título aproximado';}
     if(score&&lyricOK&&kind.includes('letra')){const lines=String(r.h.lyrics).split('\n').filter(Boolean);snippet=lines.find(line=>normalize(line).includes(q))||lines.find(line=>tokens.filter(t=>t.length>2).some(t=>normalize(line).includes(t)))||lines[0]||'';}
    }
    if(score)results.push({hymn:r.h,score,kind,snippet});
   }
   return results.sort((a,b)=>b.score-a.score||Number(a.hymn.id.startsWith('E'))-Number(b.hymn.id.startsWith('E'))||a.hymn.number-b.hymn.number);
  };
 }
 function ranges(text,query){
  const terms=normalize(query).split(' ').filter(t=>t.length>1),map=[],chars=[];let offset=0;
  for(const c of text){const clean=c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();for(const ch of clean){chars.push(/[a-z0-9]/.test(ch)?ch:' ');map.push([offset,offset+c.length]);}offset+=c.length;}
  const flat=chars.join(''),hits=[];for(const term of terms){let pos=flat.indexOf(term);while(pos!==-1){if(term.length>2||(!/[a-z0-9]/.test(flat[pos-1]||' ')&&!/[a-z0-9]/.test(flat[pos+term.length]||' ')))hits.push([map[pos][0],map[pos+term.length-1][1]]);pos=flat.indexOf(term,pos+term.length);}}
  hits.sort((a,b)=>a[0]-b[0]);return hits.reduce((out,hit)=>{const last=out[out.length-1];if(last&&hit[0]<=last[1])last[1]=Math.max(last[1],hit[1]);else out.push(hit);return out;},[]);
 }
 return {create,normalize,ranges};
});
