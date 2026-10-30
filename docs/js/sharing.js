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
 const publicURL=h=>`https://himnarioebp.com/hymn/${encodeURIComponent(h.id)}/`;
 const text=h=>`${label(h)} · ${h.title}\nHimnario El Buen Pastor\n\n${h.lyrics}${h.author?'\n\nAutor: '+h.author:''}${h.reference?'\nReferencia: '+h.reference:''}\n\n${publicURL(h)}`;
 const filename=h=>`${label(h)} - ${h.title}`.normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,150);
 const iconPaths={
  'Copiar enlace':'<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
  'Copiar letra':'<rect x="8" y="7" width="12" height="14" rx="2"/><path d="M16 7V3H4v14h4m4-6h4m-4 4h4"/>',
  'Archivo TXT':'<path d="M14 2H5v20h14V7Zm0 0v6h5M8 12h8m-8 4h8"/>',
  'Más opciones':'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
 };
 const brandIcons={'WhatsApp':'whatsapp.svg','Facebook':'facebook.svg','Imprimir / PDF':'pdf.svg'};
 function option(title,detail,action){
  const b=make('button','share-option'),icon=make('span','share-option-icon'),copy=make('span','share-option-copy');b.type='button';icon.setAttribute('aria-hidden','true');
  if(brandIcons[title]){const img=document.createElement('img');img.src='images/icons/'+brandIcons[title];img.alt='';img.width=28;img.height=28;icon.append(img);}
  else icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+(iconPaths[title]||'')+'</svg>';
  copy.append(make('strong','',title),make('span','share-option-detail',detail));b.append(icon,copy);b.onclick=async()=>{status.textContent='';try{await action();}catch(e){if(e.name!=='AbortError')status.textContent='No se pudo completar. Puedes descargar el texto o imprimir la alabanza.';}};grid.append(b);return b;
 }
 function download(h){const url=URL.createObjectURL(new Blob([text(h)],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=filename(h)+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Archivo TXT descargado. Puedes adjuntarlo a un mensaje.';}
 window.EBPSharing={open(h){
  if(!h)return;opener=document.activeElement;subtitle.textContent=`${label(h)} · ${h.title}`;grid.replaceChildren();status.textContent='';const url=publicURL(h);
  option('Copiar enlace','Enlace permanente con vista previa y reproductor',async()=>{if(navigator.clipboard){await navigator.clipboard.writeText(url);status.textContent='Enlace copiado. Al pegarlo mostrará la vista previa.';}else{const t=make('textarea','share-copy');t.value=url;dialog.append(t);t.select();const ok=document.execCommand('copy');t.remove();status.textContent=ok?'Enlace copiado.':'No se pudo copiar automáticamente.';}});
  option('WhatsApp','Enviar enlace con vista previa de audio y letra',()=>window.open('https://wa.me/?text='+encodeURIComponent(`${label(h)} · ${h.title}\nHimnario El Buen Pastor\n\n${url}`),'_blank','noopener,noreferrer'));
  const facebook=option('Facebook','Compartir el enlace de esta alabanza',()=>window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank','noopener,noreferrer'));facebook.disabled=!url;
  option('Copiar letra','Copiar el texto completo de las estrofas',async()=>{if(navigator.clipboard){await navigator.clipboard.writeText(text(h));status.textContent='Letra copiada.';}else{const t=make('textarea','share-copy');t.value=text(h);dialog.append(t);t.select();const ok=document.execCommand('copy');t.remove();status.textContent=ok?'Letra copiada.':'Usa Descargar TXT para guardar la letra.';}});
  option('Imprimir / PDF','Título, número y letra listos para imprimir',()=>window.EBPPDF.open(h));
  option('Archivo TXT','Descargar la letra para adjuntar a un mensaje',()=>download(h));
  if(navigator.share)option('Más opciones','Mensajes y aplicaciones de tu dispositivo',async()=>{try{await navigator.share({title:`${label(h)} · ${h.title}`,text:`${label(h)} · ${h.title} — Himnario El Buen Pastor`,url:url});}catch(e){if(e.name!=='AbortError')status.textContent='No se pudo abrir el menú del sistema.';}});
  note.textContent='El enlace muestra la vista previa con portada y permite abrir la app en iPhone o leer en la web.';
  if(!dialog.open)dialog.showModal();
 }};
 // Native tooltips also work for keyboard focus and buttons added by the player.
 function hints(root){const nodes=[...(root.matches?.('button')?[root]:[]),...root.querySelectorAll('button')];nodes.forEach(b=>{const label=b.getAttribute('aria-label')||b.textContent.trim();if(label&&(!b.title||b.dataset.autoHint)){b.title=label;b.dataset.autoHint='true';}});}
 hints(document);new MutationObserver(records=>records.forEach(r=>{if(r.type==='attributes')hints(r.target);else r.addedNodes.forEach(n=>{if(n.nodeType===1)hints(n);});})).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-label']});
})();
