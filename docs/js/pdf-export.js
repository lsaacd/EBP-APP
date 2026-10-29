'use strict';
(() => {
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const modal=el('dialog');modal.className='share-dialog pdf-dialog';modal.setAttribute('aria-labelledby','pdf-heading');
 const heading=el('div');heading.className='share-heading';const title=el('h2','Preparar PDF');title.id='pdf-heading';const close=el('button','×');close.className='share-close';close.type='button';close.setAttribute('aria-label','Cerrar vista previa del PDF');close.onclick=()=>modal.close();heading.append(title,close);
 const intro=el('p','Una página, con la letra completa. Ajusta el tamaño antes de descargar.');intro.className='share-subtitle';
 const controls=el('div');controls.className='pdf-controls';const minus=el('button','−'),plus=el('button','+'),auto=el('button','Ajustar a la página'),size=el('input'),columns=el('select'),output=el('output');
 size.type='number';size.min='4';size.max='28';size.step='.5';size.value='13';size.id='pdf-font';const label=el('label','Letra (pt)');label.htmlFor=size.id;minus.setAttribute('aria-label','Reducir letra del PDF');plus.setAttribute('aria-label','Aumentar letra del PDF');columns.setAttribute('aria-label','Columnas del PDF');for(const [v,t] of [['1','Una columna'],['2','Dos columnas']]){const o=el('option',t);o.value=v;columns.append(o);}controls.append(label,minus,size,plus,columns,auto);
 const canvas=el('canvas');canvas.width=2448;canvas.height=3168;canvas.setAttribute('aria-label','Vista previa de la alabanza completa en una página');canvas.setAttribute('role','img');const preview=el('div');preview.className='pdf-preview';preview.append(canvas);
 const actions=el('div');actions.className='pdf-actions';const download=el('button','Descargar PDF'),print=el('button','Abrir para imprimir');download.className='primary';actions.append(download,print);output.className='share-status';output.setAttribute('aria-live','polite');modal.append(heading,intro,controls,output,preview,actions);document.body.append(modal);
 let hymn,opener,actual=13;const ctx=canvas.getContext('2d');
 const kind=h=>`${String(h.id).startsWith('E')?'Estribillo':'Himno'} ${h.number}`;
 const font=(n,italic=false,bold=false)=>`${italic?'italic ':''}${bold?'bold ':''}${n}px Georgia, "Times New Roman", serif`;
 function wrap(s,width){const lines=[];let line='';for(const word of s.split(/\s+/)){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>width){lines.push(line);line=word;}else line=candidate;}lines.push(line);return lines;}
 function measure(f){
  const count=Number(columns.value),width=(540-(count-1)*24)/count,limit=752;ctx.font=font(21,false,true);const titles=wrap(hymn.title,530);const start=70+titles.length*25+(hymn.author?15:0)+(hymn.reference?15:0)+22;let col=0,y=start,verse=0;const rows=[];
  for(const raw of hymn.lyrics.split(/\n\s*\n/).filter(Boolean)){
   const match=raw.trim().match(/^((?:\d+\s*(?:er|do|ro|to|ndo)?\s*)?coro)[:\s]*/i),chorus=!!match;ctx.font=font(f,chorus);const lines=(match?raw.trim().slice(match[0].length):raw.trim()).split('\n').flatMap(l=>wrap(l,width-8));
   const blockHeight=f*.8+lines.length*f*1.28+f*.9;if(y>start&&y+blockHeight>limit&&blockHeight<=limit-start){col++;y=start;}
   rows.push({s:chorus?match[1].toUpperCase():String(++verse),x:36+col*(width+24)+width/2,y,size:Math.max(4,f*.68),bold:true,chorus});y+=f*.8;
   for(const s of lines){if(y+f*1.28>limit){col++;y=start;}rows.push({s,x:36+col*(width+24)+width/2,y,size:f,italic:chorus});y+=f*1.28;}y+=f*.9;
  }
  return {fits:col<count,rows,titles,start};
 }
 function render(request=Number(size.value)){
  if(!hymn)return;request=Number.isFinite(request)?Math.max(4,Math.min(28,request)):13;
  // Shrink only as far as necessary; all source lines are always retained.
  actual=request;let plan=measure(actual);while(!plan.fits&&actual>1){actual=Math.max(1,actual-.25);plan=measure(actual);}
  ctx.setTransform(4,0,0,4,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,612,792);ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#555';ctx.font='9px Arial, sans-serif';ctx.fillText('HIMNARIO EL BUEN PASTOR · '+kind(hymn),306,34);
  ctx.fillStyle='#20201d';ctx.font=font(21,false,true);let y=57;for(const line of plan.titles){ctx.fillText(line,306,y);y+=25;}ctx.font='9px Arial, sans-serif';ctx.fillStyle='#555';if(hymn.author){ctx.fillText(hymn.author,306,y);y+=15;}if(hymn.reference){ctx.fillText(hymn.reference,306,y);y+=15;}
  ctx.strokeStyle='#ddd';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(36,plan.start-14);ctx.lineTo(576,plan.start-14);ctx.stroke();
  for(const r of plan.rows){ctx.font=font(r.size,r.italic,r.bold);ctx.fillStyle=r.chorus?'#6e1619':'#20201d';ctx.fillText(r.s,r.x,r.y);}
  size.value=String(Math.round(actual*100)/100);output.textContent=`1 página · Letra de ${size.value} pt${actual<request?' · Tamaño ajustado para incluir toda la alabanza.':''}`;minus.disabled=actual<=4;plus.disabled=actual>=28;
 }
 // Single-page PDF with a 288-dpi image: no browser-added dates, URLs or page labels.
 function pdfBlob(){
  const bytes=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.97).split(',')[1]),c=>c.charCodeAt(0)),enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
  const add=b=>{b=typeof b==='string'?enc.encode(b):b;chunks.push(b);length+=b.length;};const obj=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n${body}\nendobj\n`);};
  add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const commands='q\n612 0 0 792 0 0 cm\n/Im0 Do\nQ\n';obj(5,`<< /Length ${enc.encode(commands).length} >>\nstream\n${commands}endstream`);const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'});
 }
 minus.onclick=()=>render(actual-.5);plus.onclick=()=>render(actual+.5);size.onchange=()=>render();columns.onchange=()=>render();auto.onclick=()=>render(20);
 download.onclick=()=>{const url=URL.createObjectURL(pdfBlob()),a=el('a');a.href=url;a.download=(kind(hymn)+' - '+hymn.title).replace(/[<>:"/\\|?*\x00-\x1f]/g,'')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);};
 print.onclick=()=>{const url=URL.createObjectURL(pdfBlob());window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),300000);};
 modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});modal.onclose=()=>opener?.focus({preventScroll:true});
 window.EBPPDF={open(h){hymn=h;opener=document.activeElement;columns.value=h.lyrics.split('\n').length>28?'2':'1';if(!modal.open)modal.showModal();render(13);}};
})();
