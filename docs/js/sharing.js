'use strict';
(() => {
 const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
 const dialog=make('dialog','share-dialog');dialog.setAttribute('aria-labelledby','share-heading');
 const header=make('div','share-heading'),heading=make('h2','','Compartir alabanza');heading.id='share-heading';
 const close=make('button','share-close','×');close.type='button';close.setAttribute('aria-label','Cerrar opciones para compartir');close.onclick=()=>dialog.close();header.append(heading,close);
 const subtitle=make('p','share-subtitle'),grid=make('div','share-options'),note=make('p','share-note'),status=make('p','share-status');status.setAttribute('role','status');
 dialog.append(header,subtitle,grid,note,status);document.body.append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 let opener;
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 const label=h=>`${String(h.id).startsWith('E')?'Estribillo':'Himno'} ${h.number}`;
 const publicURL=h=>{const u=new URL(location.href);if(!/^https?:$/.test(u.protocol)||['localhost','127.0.0.1','[::1]'].includes(u.hostname))return '';u.hash=`himno=${encodeURIComponent(h.id)}`;return u.href;};
 const text=h=>`${label(h)} · ${h.title}\nHimnario El Buen Pastor\n\n${h.lyrics}${h.author?'\n\nAutor: '+h.author:''}${h.reference?'\nReferencia: '+h.reference:''}${publicURL(h)?'\n\n'+publicURL(h):''}`;
 const filename=h=>`${label(h)} - ${h.title}`.normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,150);
 function option(title,detail,action){const b=make('button','share-option');b.type='button';b.append(make('strong','',title),make('span','',detail));b.onclick=async()=>{status.textContent='';try{await action();}catch(e){if(e.name!=='AbortError')status.textContent='No se pudo completar. Puedes descargar el texto o imprimir la alabanza.';}};grid.append(b);return b;}
 function download(h){const url=URL.createObjectURL(new Blob([text(h)],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=filename(h)+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Archivo TXT descargado. Puedes adjuntarlo a un mensaje.';}
 window.EBPSharing={open(h){
  if(!h)return;opener=document.activeElement;subtitle.textContent=`${label(h)} · ${h.title}`;grid.replaceChildren();status.textContent='';const url=publicURL(h);
  option('WhatsApp','Enviar la letra y el enlace disponible',()=>window.open('https://wa.me/?text='+encodeURIComponent(text(h)),'_blank','noopener,noreferrer'));
  const facebook=option('Facebook','Compartir el enlace de esta alabanza',()=>window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank','noopener,noreferrer'));facebook.disabled=!url;
  option('Imprimir / PDF','Título, número y letra listos para imprimir',()=>window.EBPPDF.open(h));
  option('Archivo TXT','Descargar la letra para adjuntar a un mensaje',()=>download(h));
  option('Copiar letra','Copiar el texto completo',async()=>{if(navigator.clipboard){await navigator.clipboard.writeText(text(h));status.textContent='Letra copiada.';}else{const t=make('textarea','share-copy');t.value=text(h);dialog.append(t);t.select();const ok=document.execCommand('copy');t.remove();status.textContent=ok?'Letra copiada.':'Usa Descargar TXT para guardar la letra.';}});
  if(navigator.share)option('Más opciones','Mensajes y aplicaciones de tu dispositivo',async()=>{const file=new File([text(h)],filename(h)+'.txt',{type:'text/plain'});if(navigator.canShare?.({files:[file]}))await navigator.share({title:h.title,files:[file]});else await navigator.share({title:h.title,text:text(h)});});
  note.textContent=url?'Puedes compartir el enlace, enviar la letra o guardar una copia.':'Estás en una vista local. WhatsApp y TXT comparten la letra; Facebook estará disponible al abrir el sitio desde su dirección pública.';
  if(!dialog.open)dialog.showModal();
 }};
 // Native tooltips also work for keyboard focus and buttons added by the player.
 function hints(root){const nodes=[...(root.matches?.('button')?[root]:[]),...root.querySelectorAll('button')];nodes.forEach(b=>{const label=b.getAttribute('aria-label')||b.textContent.trim();if(label&&(!b.title||b.dataset.autoHint)){b.title=label;b.dataset.autoHint='true';}});}
 hints(document);new MutationObserver(records=>records.forEach(r=>{if(r.type==='attributes')hints(r.target);else r.addedNodes.forEach(n=>{if(n.nodeType===1)hints(n);});})).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-label']});
})();
