'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{$('feedback').textContent='Tus cambios se conservarán durante esta sesión.';}};
 const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!=null)e.textContent=text;return e;};
 const appURL='https://apps.apple.com/app/id6794435414',qrCard=make('aside','qr-card'),qrClose=make('button','qr-close','×'),qrReopen=make('button','qr-reopen','App para iPhone'),mobileApp=make('a','mobile-app-link','App para iPhone ↗');
 qrCard.id='app-qr-card';qrCard.setAttribute('aria-label','Descargar Himnario El Buen Pastor para iPhone');qrClose.type='button';qrClose.setAttribute('aria-label','Cerrar código QR');
 const qrLink=make('a','qr-image-link'),qrImage=make('img','qr-image'),qrTitle=make('p','qr-title','Lleva tu himnario contigo'),qrCaption=make('p','qr-caption','Escanea con tu iPhone'),qrOpen=make('a','qr-app-link','Abrir en App Store ↗'),qrDownload=make('a','qr-download','Descargar QR');
 qrLink.href=appURL;qrLink.target='_blank';qrLink.rel='noopener noreferrer';qrLink.setAttribute('aria-label','Abrir Himnario El Buen Pastor en App Store');qrImage.src='downloads/ebp-app-store-qr-branded.png';qrImage.width=192;qrImage.height=192;qrImage.alt='Código QR de la app con el logo de El Buen Pastor';qrLink.append(qrImage);
 qrOpen.href=appURL;qrOpen.target='_blank';qrOpen.rel='noopener noreferrer';qrDownload.href='downloads/ebp-app-store-qr-branded.png';qrDownload.download='Himnario-El-Buen-Pastor-QR.png';mobileApp.href=appURL;mobileApp.target='_blank';mobileApp.rel='noopener noreferrer';
 qrReopen.type='button';qrReopen.setAttribute('aria-controls',qrCard.id);qrCard.append(qrClose,qrTitle,qrLink,qrCaption,qrOpen,qrDownload);document.body.append(qrCard,qrReopen,mobileApp);
 function qrVisible(visible){qrCard.hidden=!visible;qrReopen.hidden=visible;qrReopen.setAttribute('aria-expanded',String(visible));document.body.classList.toggle('qr-open',visible);try{sessionStorage.setItem('ebp-qr-dismissed',String(!visible));}catch{}}
 let qrDismissed=false;try{qrDismissed=sessionStorage.getItem('ebp-qr-dismissed')==='true';}catch{}qrVisible(!qrDismissed);
 qrClose.onclick=()=>{qrVisible(false);qrReopen.focus();};qrReopen.onclick=()=>{qrVisible(true);qrClose.focus();};
 function bookmark(button,saved){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('bookmark-icon');path.setAttribute('d','M6 3.5h12v17l-6-4-6 4Z');path.setAttribute('fill',saved?'currentColor':'none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linejoin','round');svg.append(path);button.replaceChildren(svg);}
 function endVerse(){
  const block=make('aside','end-verse'),ns='http://www.w3.org/2000/svg',sparkle=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
  sparkle.setAttribute('viewBox','0 0 48 48');sparkle.setAttribute('aria-hidden','true');path.setAttribute('d','m18 9 4 10 10 4-10 4-4 10-4-10-10-4 10-4ZM36 3l2.5 6.5L45 12l-6.5 2.5L36 21l-2.5-6.5L27 12l6.5-2.5ZM36 29l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','2');sparkle.append(path);
  const quote=make('blockquote','',''),reference=make('p','verse-reference','');
  const favoritesVerse=route==='favoritos';quote.textContent=favoritesVerse?'“Alabad á Jehová, porque es bueno; Porque para siempre es su misericordia.”':'“Cantad alegres a Dios, habitantes de toda la tierra.”';reference.textContent=favoritesVerse?'SALMOS 136:1':'SALMO 100:1';
  block.setAttribute('aria-label','Versículo al final del himnario');block.append(sparkle,quote,reference);return block;
 }
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const data=window.HYMNS_DB?.hymns;
 if(!Array.isArray(data)||!data.length){$('home-view').hidden=true;$('library').hidden=false;$('results').textContent='No se pudo cargar la biblioteca. Recarga la página para volver a intentar.';return;}
 const byId=new Map(data.map(h=>[h.id,h])),searchHymns=window.EBPSearch.create(data);
 const searchOptions=make('div','search-options'),fieldLabel=make('label','','Buscar en'),fieldSelect=make('select','');fieldSelect.id='search-field';fieldLabel.htmlFor=fieldSelect.id;[['all','Toda la colección'],['title','Solo títulos'],['lyrics','Solo letras'],['number','Solo números']].forEach(([v,t])=>fieldSelect.add(new Option(t,v)));searchOptions.append(fieldLabel,fieldSelect);$('advanced-filters').prepend(searchOptions);
 const searchHint=make('p','search-hint','');searchHint.id='search-hint';searchHint.hidden=true;$('advanced-filters').after(searchHint);$('search').setAttribute('aria-describedby','search-hint');$('search').spellcheck=false;
 function highlighted(node,text,query){node.replaceChildren();let at=0;for(const [start,end] of window.EBPSearch.ranges(text,query)){node.append(document.createTextNode(text.slice(at,start)),make('mark','',text.slice(start,end)));at=end;}node.append(document.createTextNode(text.slice(at)));}
 let favorites=read('ebp-favorites',[]);if(!Array.isArray(favorites))favorites=[];favorites=favorites.filter(id=>byId.has(id));
 let route='inicio',collection='hymns',favoritesView='favorites',letter='',page=0,filtered=[],active=null,sequence=[],opener=null,desktopPlayer=null,pageFlip=null;
 const masthead=make('div','catalog-masthead'),catalogHeading=document.querySelector('.catalog-heading');catalogHeading.before(masthead);masthead.append(catalogHeading,document.querySelector('.catalog-tabs'));
 const favoriteTabs=make('div','favorites-tabs'),listsPane=make('section','favorites-lists-pane'),listsContent=make('div','favorites-lists-content');favoriteTabs.setAttribute('role','group');favoriteTabs.setAttribute('aria-label','Tu colección personal');favoriteTabs.hidden=true;listsPane.hidden=true;listsPane.id='favorites-lists-pane';listsPane.setAttribute('aria-label','Listas de reproducción');listsPane.append(listsContent);
 [['favorites','Mis favoritos'],['lists','Listas de reproducción']].forEach(([value,label])=>{const b=make('button','',label);b.dataset.favoritesView=value;b.onclick=()=>{favoritesView=value;render();};favoriteTabs.append(b);});
 masthead.after(favoriteTabs);$('library').append(listsPane);
 function inCollection(h){return route==='favoritos'||(collection==='choruses'?h.id.startsWith('E'):!h.id.startsWith('E'));}
 const shell=make('div','list-shell'),viewport=make('div','list-viewport');
 viewport.id='list-viewport';viewport.setAttribute('aria-label','Lista de alabanzas');
 $('results').before(shell);shell.append(viewport);viewport.append($('results'));
 shell.append($('alphabet'));
 const scrubber=make('aside','position-scroller'),firstLabel=make('span','range-start'),lastLabel=make('span','range-end'),position=make('output','scroll-position'),range=make('input','position-range');
 range.type='range';range.min='0';range.max='0';range.value='0';range.step='1';range.setAttribute('aria-label','Desplazarse por los himnos');
 position.setAttribute('aria-hidden','true');scrubber.append(firstLabel,range,lastLabel,position);shell.append(scrubber);
 document.querySelector('.pages').hidden=true;
 const header=document.querySelector('.website-header');
 const headerHeight=()=>header.getBoundingClientRect().height;
 const jumpTo=node=>window.scrollTo({top:Math.max(0,node.getBoundingClientRect().top+window.scrollY-headerHeight()-18),behavior:'instant'});
 const updateHeader=()=>{document.documentElement.style.setProperty('--header-height',`${headerHeight()}px`);syncScroll();};
 new ResizeObserver(updateHeader).observe(header);
 function initial(h){const first=norm(h.title).replace(/^[^a-z0-9]+/,'').charAt(0).toUpperCase();return /^[A-Z]$/.test(first)?first:'#';}
 const letterBubble=make('div','index-letter-bubble');letterBubble.setAttribute('aria-hidden','true');document.body.append(letterBubble);let letterBubbleTimer=0;
 function showLetterBubble(value){if(route!=='indice'||!$('reader').hidden)return;letterBubble.textContent=value;letterBubble.classList.add('visible');clearTimeout(letterBubbleTimer);letterBubbleTimer=setTimeout(()=>letterBubble.classList.remove('visible'),750);}
 function syncScroll(showBubble=false){
  if(route==='inicio'||!$('reader').hidden||favoritesView==='lists'&&route==='favoritos')return;
  if(route==='indice'&&!$('alphabet').hidden){const top=Math.max(headerHeight()+15,$('alphabet').getBoundingClientRect().top),bottom=document.body.classList.contains('has-audio-player')?135:20;$('alphabet').style.setProperty('--alphabet-height',`${Math.min(640,Math.max(180,window.innerHeight-top-bottom))}px`);}
  const rows=[...$('results').querySelectorAll('.row')];if(!rows.length){position.textContent='0 / 0';range.disabled=true;return;}
  range.disabled=rows.length<2;const top=headerHeight()+18-$('results').getBoundingClientRect().top;
  let i=rows.findIndex(row=>row.offsetTop+row.offsetHeight>top+2);if(i<0)i=rows.length-1;
  if(window.scrollY>0&&window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2)i=rows.length-1;
  if(!filtered[i])return;range.value=String(i);position.textContent=`${filtered[i].id} / ${filtered.length}`;
  range.setAttribute('aria-valuetext',`${i+1} de ${filtered.length}: ${filtered[i].title}`);
  const firstLetter=$('results').querySelector('.letter-heading'),atIndexTop=route==='indice'&&firstLetter&&firstLetter.getBoundingClientRect().top>headerHeight()+20;
  const l=atIndexTop?'#':initial(filtered[i]);$('alphabet').querySelectorAll('button').forEach(b=>{const on=b.textContent===l;b.setAttribute('aria-pressed',String(on));});
  if(showBubble&&route==='indice')showLetterBubble(l);
 }
 range.addEventListener('input',()=>{const row=$('results').querySelectorAll('.row')[Number(range.value)];if(row){jumpTo(row);syncScroll();}});
 let scrollFrame=0;window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;syncScroll(true);});},{passive:true});
 window.addEventListener('resize',updateHeader);
 let draggingLetters=false;
 function scrubLetters(e){const rail=$('alphabet').getBoundingClientRect();const y=Math.max(rail.top,Math.min(rail.bottom-1,e.clientY));const buttons=[...$('alphabet').querySelectorAll('button:not(:disabled)')];const target=buttons.reduce((best,b)=>Math.abs(b.getBoundingClientRect().top+b.offsetHeight/2-y)<Math.abs(best.getBoundingClientRect().top+best.offsetHeight/2-y)?b:best,buttons[0]);if(target)target.click();}
 $('alphabet').addEventListener('pointerdown',e=>{if(e.button!==0)return;draggingLetters=true;$('alphabet').setPointerCapture(e.pointerId);scrubLetters(e);});
 $('alphabet').addEventListener('pointermove',e=>{if(draggingLetters)scrubLetters(e);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(event=>$('alphabet').addEventListener(event,()=>{draggingLetters=false;}));
 $('alphabet').addEventListener('click',e=>{const button=e.target.closest('button:not(:disabled)');if(button)showLetterBubble(button.textContent);});
 const minFontSize=12,maxFontSize=64,defaultFontSize=26;
 let size=Number(read('ebp-font',defaultFontSize));size=Number.isFinite(size)?Math.max(minFontSize,Math.min(maxFontSize,Math.round(size))):defaultFontSize;
 const systemTheme=window.matchMedia('(prefers-color-scheme: dark)');
 function applyTheme(dark){document.body.classList.toggle('dark',dark);document.querySelectorAll('.church-logo').forEach(img=>{img.src=dark?'images/branding/dark_theme_webpage_ebp.svg':'images/branding/og_ebp.svg';});document.querySelector('.book-cover img').src='images/branding/dark_theme_webpage_ebp.svg';$('theme').setAttribute('aria-pressed',String(dark));$('theme').setAttribute('aria-label',dark?'Activar modo claro':'Activar modo oscuro');$('theme').textContent=dark?'☀':'◐';document.documentElement.style.colorScheme=dark?'dark':'light';}
 applyTheme(read('ebp-dark',systemTheme.matches)===true);
 systemTheme.addEventListener('change',e=>{if(read('ebp-dark',null)===null)applyTheme(e.matches);});
 $('theme').onclick=()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);save('ebp-dark',dark);};
 const chipBar=make('div','chips-toolbar'),chipPrev=make('button','chips-arrow','‹'),chipNext=make('button','chips-arrow','›');
 chipPrev.setAttribute('aria-label','Ver categorías anteriores');chipNext.setAttribute('aria-label','Ver más categorías');
 $('category-chips').before(chipBar);chipBar.append(chipPrev,$('category-chips'),chipNext);
 chipPrev.onclick=()=>$('category-chips').scrollBy({left:-300,behavior:'smooth'});chipNext.onclick=()=>$('category-chips').scrollBy({left:300,behavior:'smooth'});
 const categoryStrip=$('category-chips');categoryStrip.tabIndex=0;categoryStrip.setAttribute('aria-label','Categorías: arrastra o usa las flechas para desplazarte');
 function updateChipArrows(){chipPrev.disabled=categoryStrip.scrollLeft<=1;chipNext.disabled=categoryStrip.scrollLeft+categoryStrip.clientWidth>=categoryStrip.scrollWidth-1;}
 categoryStrip.addEventListener('scroll',updateChipArrows,{passive:true});new ResizeObserver(updateChipArrows).observe(categoryStrip);
 let chipDrag=null,suppressChipClick=false;
 categoryStrip.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;chipDrag={id:e.pointerId,start:e.clientX,scroll:categoryStrip.scrollLeft,moved:false};suppressChipClick=false;});
 categoryStrip.addEventListener('pointermove',e=>{if(!chipDrag||e.pointerId!==chipDrag.id)return;const delta=e.clientX-chipDrag.start;if(!chipDrag.moved&&Math.abs(delta)>6){chipDrag.moved=true;categoryStrip.setPointerCapture(e.pointerId);categoryStrip.classList.add('is-dragging');}if(chipDrag.moved){e.preventDefault();categoryStrip.scrollLeft=chipDrag.scroll-delta;}});
 function finishChipDrag(){if(!chipDrag)return;suppressChipClick=chipDrag.moved;chipDrag=null;categoryStrip.classList.remove('is-dragging');}
 categoryStrip.addEventListener('pointerup',finishChipDrag);categoryStrip.addEventListener('pointercancel',finishChipDrag);categoryStrip.addEventListener('lostpointercapture',finishChipDrag);categoryStrip.addEventListener('pointerleave',()=>{if(chipDrag&&!chipDrag.moved)chipDrag=null;});
 categoryStrip.addEventListener('click',e=>{if(suppressChipClick){e.preventDefault();e.stopImmediatePropagation();suppressChipClick=false;}},true);
 categoryStrip.addEventListener('keydown',e=>{if(e.target!==categoryStrip)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home'||e.key==='End')categoryStrip.scrollTo({left:e.key==='Home'?0:categoryStrip.scrollWidth,behavior:'smooth'});else categoryStrip.scrollBy({left:e.key==='ArrowLeft'?-250:250,behavior:'smooth'});}});
 function updateFavorite(){const on=favorites.includes(active);bookmark($('favorite'),on);$('favorite').setAttribute('aria-pressed',String(on));$('favorite').setAttribute('aria-label',on?'Quitar marcador':'Guardar marcador');$('favorite-count').textContent=favorites.length?String(favorites.length):'';}
 function toggle(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save('ebp-favorites',favorites);render(true);updateFavorite();}
 function chips(){
  const source=data.filter(h=>(route!=='favoritos'||favorites.includes(h.id))&&inCollection(h));
  const available=[...new Set(source.flatMap(h=>h.categories))].sort((a,b)=>a.localeCompare(b,'es'));
  const previous=$('category').value;if(previous&&!available.includes(previous))$('category').value='';
  const selected=$('category').value,scroll=$('category-chips').scrollLeft;
  $('category').replaceChildren(new Option('Todas las categorías',''));available.forEach(c=>$('category').add(new Option(c,c)));$('category').value=selected;
  $('category-chips').replaceChildren();['',...available].forEach(c=>{const b=make('button','',c||'Todos');b.setAttribute('aria-pressed',String(selected===c));b.onclick=()=>{$('category').value=c;page=0;chips();render();};$('category-chips').append(b);});
  $('category-chips').scrollLeft=scroll;requestAnimationFrame(updateChipArrows);
 }
 function render(preserve=false){
  const previousScroll=window.scrollY;
  const isFavorites=route==='favoritos',isLists=isFavorites&&favoritesView==='lists';$('library').classList.toggle('favorites-view',isFavorites);$('library').classList.toggle('lists-view',isLists);$('library').classList.toggle('index-view',route==='indice');favoriteTabs.hidden=!isFavorites;listsPane.hidden=!isLists;document.querySelector('.catalog-tabs').hidden=isFavorites;chipBar.hidden=isFavorites||route==='indice';
  favoriteTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.favoritesView===favoritesView)));
  if(isFavorites){$('catalog-title').textContent=isLists?'Listas de reproducción':'Mis favoritos';$('catalog-description').textContent=isLists?'Tus listas para cada momento de alabanza.':`${favorites.length} ${favorites.length===1?'alabanza guardada':'alabanzas guardadas'}`;if($('reader').hidden)document.title=`${$('catalog-title').textContent} — El Buen Pastor`;}
  if(isLists){desktopPlayer?.mountLists(listsContent);if(!listsPane.querySelector('.end-verse'))listsPane.append(endVerse());updateFavorite();return;}
  let source=data.filter(h=>(!isFavorites||favorites.includes(h.id))&&inCollection(h));
  const rawQuery=$('search').value.trim(),q=window.EBPSearch.normalize(rawQuery),matches=searchHymns(rawQuery,{field:fieldSelect.value}),allowed=new Set(source.filter(h=>(!$('category').value||h.categories.includes($('category').value))&&(!$('audio-only').checked||h.hasAudio)).map(h=>h.id)),details=new Map(matches.map(m=>[m.hymn.id,m]));filtered=matches.filter(m=>allowed.has(m.hymn.id)).map(m=>m.hymn);
  if(!q&&route==='indice')filtered.sort((a,b)=>norm(a.title).replace(/^[^a-z0-9]+/,'').localeCompare(norm(b.title).replace(/^[^a-z0-9]+/,''),'es'));
  else if(!q)filtered.sort((a,b)=>Number(a.id.startsWith('E'))-Number(b.id.startsWith('E'))||a.number-b.number);
  $('alphabet').hidden=route!=='indice'||!!q;$('alphabet').replaceChildren();
  if(route==='indice'&&!q){
   const available=new Set(filtered.map(initial));
   ['#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].forEach(l=>{const b=make('button','',l);b.disabled=l!=='#'&&!available.has(l);b.setAttribute('aria-label',l==='#'?'Volver al título del índice':`Ir a la letra ${l}`);if(l==='#'){b.setAttribute('aria-controls','index-section-title');b.title=collection==='choruses'?'Volver al título de estribillos y coritos':'Volver al título de himnos';}b.onclick=()=>{const heading=l==='#'?$('results').querySelector('.index-section-title'):[...$('results').querySelectorAll('.letter-heading')].find(e=>e.textContent===l);if(heading){jumpTo(heading);if(l==='#')heading.focus({preventScroll:true});syncScroll();}};$('alphabet').append(b);});
  }
  page=Math.max(0,Math.min(page,Math.ceil(filtered.length/35)-1));
  $('count').textContent=`${filtered.length} ${filtered.length===1?'alabanza':'alabanzas'}`;
  searchHint.textContent=q?(filtered.length?'Resultados ordenados por relevancia: número y título primero, después la letra.':'No hay coincidencias con los filtros actuales. Prueba menos palabras o busca en todo el himnario.'):'Escribe un número, un título o una frase. No necesitas poner acentos.';
  searchHint.hidden=!q;
  document.querySelectorAll('[data-collection]').forEach(b=>b.setAttribute('aria-pressed',String(collection===b.dataset.collection)));
  $('results').replaceChildren();
  if(route==='indice'){const indexTitle=make('h2','index-section-title',collection==='choruses'?'Índice alfabético de estribillos y coritos':'Índice alfabético de himnos');indexTitle.id='index-section-title';indexTitle.tabIndex=-1;$('results').append(indexTitle);$('alphabet').setAttribute('aria-label',collection==='choruses'?'Letras del índice de estribillos y coritos':'Letras del índice de himnos');}
  if(!filtered.length)$('results').append(make('p','empty',route==='favoritos'&&!favorites.length?'Tu colección empieza con una alabanza. Guarda tus himnos con el marcador y encuéntralos aquí.':'No encontramos alabanzas con estos filtros. Prueba otro título, número o frase.'));
  shell.classList.toggle('index-layout',route==='indice'&&!q);scrubber.hidden=(route==='indice'&&!q)||filtered.length<2;
  let lastLetter='';filtered.forEach(h=>{
   const first=initial(h);if(route==='indice'&&!q&&first!==lastLetter){$('results').append(make('h2','letter-heading',first));lastLetter=first;}
   const row=make('div','row'),open=make('a','open-hymn');open.href=`#himno=${encodeURIComponent(h.id)}`;open.dataset.id=h.id;open.setAttribute('aria-label',`Leer ${h.id}: ${h.title}`);open.append(make('span','num',route==='indice'?String(h.number):h.id));
   const info=make('span','info');info.append(make('span','title',h.title),make('span','preview',h.categories.join(' · ')||(h.id.startsWith('E')?'Estribillo':'Himno')));open.append(info);
   if(q){const detail=details.get(h.id);highlighted(info.querySelector('.title'),h.title,rawQuery);info.append(make('span','match-kind',detail.kind));if(detail.snippet){const excerpt=make('span','match-snippet');highlighted(excerpt,detail.snippet,rawQuery);info.append(excerpt);}}
   if(h.hasAudio){const badge=make('span','has-audio','♪');badge.setAttribute('aria-label','Audio disponible');open.append(badge);}
   open.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();sequence=filtered.map(x=>x.id);show(h.id,open);};const fav=make('button','fav');bookmark(fav,favorites.includes(h.id));fav.setAttribute('aria-label',`Marcador: ${h.title}`);fav.setAttribute('aria-pressed',String(favorites.includes(h.id)));fav.onclick=()=>{toggle(h.id);desktopPlayer?.sync();};
   if(h.hasAudio){const coverButton=make('button','track-cover'),coverImage=make('img','');coverButton.dataset.trackId=h.id;coverButton.setAttribute('aria-label',`Reproducir ${h.id}: ${h.title}`);coverImage.src='images/hymn-cover.png';coverImage.alt='';coverImage.width=64;coverImage.height=64;coverImage.loading='lazy';coverButton.append(coverImage,make('span','track-play-symbol','▶'));coverButton.onclick=()=>desktopPlayer?.playFromList(h.id,filtered.map(x=>x.id));row.append(coverButton);}else row.append(make('span','track-cover-placeholder'));
   row.append(open,fav);$('results').append(row);
  });
  $('results').append(endVerse());
  range.max=String(Math.max(0,filtered.length-1));firstLabel.textContent=filtered[0]?.id||'';lastLabel.textContent=filtered.at(-1)?.id||'';
  if(preserve)window.scrollTo({top:previousScroll,behavior:'instant'});else if(previousScroll>$('library').offsetTop)jumpTo($('library'));
  updateFavorite();syncScroll();desktopPlayer?.sync();
 }
 function navigate(next,reset=true){
  route=['inicio','himnos','indice','favoritos'].includes(next)?next:'inicio';
  if(reset){page=0;letter='';collection='hymns';favoritesView='favorites';fieldSelect.value='all';$('search').value='';$('quick-search').value='';$('category').value='';$('audio-only').checked=false;$('advanced-filters').hidden=true;$('filter-toggle').setAttribute('aria-expanded','false');}
  $('home-view').hidden=route!=='inicio';$('library').hidden=route==='inicio';
  const titles={himnos:['EL HIMNARIO','Himnos y alabanzas','Un canto para cada momento de nuestra fe.'],indice:['DE LA A A LA Z','Índice alfabético','Encuentra por su título las alabanzas de siempre.'],favoritos:['TU COLECCIÓN','Alabanzas del corazón','Tus himnos favoritos, siempre a mano en este navegador.']};
  const t=titles[route]||titles.himnos;$('section-label').textContent=t[0];$('catalog-title').textContent=t[1];$('catalog-description').textContent=t[2];
  const tabs=document.querySelector('.catalog-tabs'),hymnsTab=tabs.querySelector('[data-collection="hymns"]'),chorusesTab=tabs.querySelector('[data-collection="choruses"]');chorusesTab.textContent=route==='indice'?'Estribillos y coritos':'Estribillos';tabs.append(hymnsTab,chorusesTab);
  document.querySelectorAll('[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===route);if(a.dataset.page===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.title=`${route==='inicio'?'Himnario digital':t[1]} — El Buen Pastor`;chips();render();
 }
 let readerReturn=null;
 if('scrollRestoration'in history)history.scrollRestoration='manual';
 function fillLyrics(target,h){target.replaceChildren();let verse=0;const coro=/^((?:\d+\s*(?:er|do|ro|to|ndo|er\.|do\.|ro\.|to\.)?\s*)?coro)[:\s]*/i;h.lyrics.split(/\n\s*\n/).filter(Boolean).forEach(s=>{const match=s.trim().match(coro),block=make('section',match?'stanza chorus':'stanza');block.append(make('h3','stanza-label',match?match[1].toUpperCase():String(++verse)),make('p','stanza-lines',match?s.trim().replace(coro,''):s));target.append(block);});target.append(endVerse());target.style.setProperty('--size',`${size}px`);}
 function readingPreview(id=active){const h=byId.get(id),copy=document.querySelector('#reader .reading').cloneNode(true);copy.classList.add('flip-reading');copy.querySelector('.reading-nav')?.remove();copy.querySelector('#feedback')?.remove();copy.querySelector('#report')?.remove();if(id!==active){copy.querySelector('#number').textContent=`${id.startsWith('E')?'Estribillo':'Himno'} ${h.number}`;copy.querySelector('#title').textContent=h.title;copy.querySelector('#meta').textContent=[h.author,h.reference,...h.categories].filter(Boolean).join(' · ');fillLyrics(copy.querySelector('#lyrics'),h);}for(const name of ['number','title','meta','lyrics'])copy.querySelector(`#${name}`).classList.add(`flip-${name}`);copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));copy.removeAttribute('id');return copy;}
 function show(id,trigger,fromHistory=false){
  const h=byId.get(id);if(!h)return;pageFlip?.cancel();const wasReading=!$('reader').hidden;active=id;if(trigger)opener=trigger;
  if(!wasReading){if(fromHistory&&route==='inicio')collection=id.startsWith('E')?'choruses':'hymns';readerReturn={route:fromHistory&&route==='inicio'?'himnos':route,scroll:window.scrollY};}
  $('number').textContent=`${id.startsWith('E')?'Estribillo':'Himno'} ${h.number}`;$('title').textContent=h.title;$('meta').textContent=[h.author,h.reference,...h.categories].filter(Boolean).join(' · ');
  fillLyrics($('lyrics'),h);$('feedback').textContent='';$('audio-error').hidden=true;
  $('audio-status').textContent=h.hasAudio?'♪ Grabación disponible':'Audio por agregar';$('report').href=`feedback.html?hymn=${encodeURIComponent(id)}&title=${encodeURIComponent(h.title)}`;
  if(!sequence.includes(id))sequence=data.filter(h=>h.id.startsWith('E')===id.startsWith('E')).map(h=>h.id);const pos=sequence.indexOf(id);$('prev').disabled=pos<=0;$('next').disabled=pos>=sequence.length-1;
  $('prev').textContent=pos>0?`← ${sequence[pos-1]}`:'← Anterior';$('next').textContent=pos<sequence.length-1?`${sequence[pos+1]} →`:'Siguiente →';$('prev').setAttribute('aria-label',pos>0?`Leer alabanza anterior: ${byId.get(sequence[pos-1]).title}`:'No hay alabanza anterior');$('next').setAttribute('aria-label',pos<sequence.length-1?`Leer alabanza siguiente: ${byId.get(sequence[pos+1]).title}`:'No hay alabanza siguiente');
  desktopPlayer?.setReader(id,sequence);document.title=`${h.id} · ${h.title} — El Buen Pastor`;
  updateFavorite();$('reader').hidden=false;document.body.classList.add('reading-page');$('reader-text-settings').hidden=true;document.getElementById('reader-text').setAttribute('aria-expanded','false');
  if(!fromHistory&&location.hash!==`#himno=${encodeURIComponent(id)}`)history[wasReading?'replaceState':'pushState']({hymn:true},'',`#himno=${encodeURIComponent(id)}`);
  window.scrollTo({top:0,behavior:'instant'});$('title').focus({preventScroll:true});
 }
 $('favorite').onclick=()=>{toggle(active);desktopPlayer?.sync();};$('close').onclick=()=>{pageFlip?.cancel();closeTextSettings();history.replaceState(null,'',`#${readerReturn?.route||'himnos'}`);hash();};$('close').setAttribute('aria-label','Salir de la letra y volver al catálogo');$('close').title='Salir de la letra y volver al catálogo';$('audio').onerror=()=>{$('audio-error').hidden=false;};
 $('prev').onclick=()=>pageFlip?.turn(-1);$('next').onclick=()=>pageFlip?.turn(1);$('prev').title='Alabanza anterior · Flecha izquierda';$('next').title='Alabanza siguiente · Flecha derecha';
 function setFontSize(value){if(!Number.isFinite(value))return;size=Math.max(minFontSize,Math.min(maxFontSize,Math.round(value)));$('lyrics').style.setProperty('--size',`${size}px`);$('reader-font-size').value=$('reader-font-pixels').value=String(size);$('reader-font-size').setAttribute('aria-valuetext',`${size} píxeles`);$('reader-font-size').style.setProperty('--font-progress',`${(size-minFontSize)/(maxFontSize-minFontSize)*100}%`);$('reader-font-preview').style.fontSize=`${size}px`;$('smaller').disabled=size===minFontSize;$('larger').disabled=size===maxFontSize;save('ebp-font',size);}
 function closeTextSettings(restoreFocus=false){$('reader-text-settings').hidden=true;$('reader-text').setAttribute('aria-expanded','false');if(restoreFocus)$('reader-text').focus({preventScroll:true});}
 $('smaller').onclick=()=>setFontSize(size-1);$('larger').onclick=()=>setFontSize(size+1);$('reader-font-reset').onclick=()=>setFontSize(defaultFontSize);$('reader-text-close').onclick=()=>closeTextSettings(true);
 $('reader-text').onclick=()=>{if(!$('reader-text-settings').hidden){closeTextSettings();return;}$('reader-text-settings').hidden=false;$('reader-text').setAttribute('aria-expanded','true');setFontSize(size);$('reader-font-size').focus({preventScroll:true});};$('reader-font-size').oninput=e=>setFontSize(Number(e.target.value));
 const pixels=$('reader-font-pixels');pixels.oninput=()=>{const value=pixels.valueAsNumber;if(value>=minFontSize&&value<=maxFontSize)setFontSize(value);};const commitPixels=()=>setFontSize(pixels.value.trim()?pixels.valueAsNumber:size);pixels.onchange=commitPixels;pixels.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commitPixels();}};
 document.addEventListener('pointerdown',e=>{if(!$('reader-text-settings').hidden&&!$('reader-text-settings').contains(e.target)&&!$('reader-text').contains(e.target))closeTextSettings();if(!$('advanced-filters').hidden&&!$('advanced-filters').contains(e.target)&&!$('filter-toggle').contains(e.target)){$('advanced-filters').hidden=true;$('filter-toggle').setAttribute('aria-expanded','false');}});
 $('reader-theme').onclick=()=>{$('theme').click();$('reader-theme').textContent=document.body.classList.contains('dark')?'☀ Claro':'☾ Oscuro';};
 $('reader-add-list').onclick=()=>desktopPlayer?.openLists(active);
 $('share').onclick=async()=>{const url=location.href;try{if(navigator.share)await navigator.share({title:byId.get(active).title,url});else{await navigator.clipboard.writeText(url);$('feedback').textContent='Enlace copiado.';}}catch(e){if(e.name!=='AbortError')$('feedback').textContent=`Comparte este enlace: ${url}`;}};
 document.querySelectorAll('[data-collection]').forEach(b=>b.onclick=()=>{collection=b.dataset.collection;letter='';page=0;$('category').value='';$('category-chips').scrollLeft=0;chips();render();});
 ['search','category','audio-only'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;letter='';chips();render();}));
 fieldSelect.onchange=()=>render();$('search').addEventListener('keydown',e=>{if(e.key==='Enter'&&filtered.length){e.preventDefault();sequence=filtered.map(h=>h.id);show(filtered[0].id,$('search'));}else if(e.key==='Escape'&&$('search').value){$('search').value='';render();}});
 $('filter-toggle').onclick=()=>{$('advanced-filters').hidden=!$('advanced-filters').hidden;$('filter-toggle').setAttribute('aria-expanded',String(!$('advanced-filters').hidden));};
 $('prev-page').onclick=()=>{page--;render();$('library').scrollIntoView();};$('next-page').onclick=()=>{page++;render();$('library').scrollIntoView();};
 $('header-search').onsubmit=e=>{e.preventDefault();const q=$('quick-search').value;history.pushState(null,'','#himnos');navigate('himnos');$('search').value=q;$('quick-search').value=q;render();$('search').focus();};
 function hash(){const value=location.hash.slice(1);if(value==='content'){$('content').setAttribute('tabindex','-1');$('content').focus();return;}if(value.startsWith('himno=')){try{const id=decodeURIComponent(value.slice(6));if(byId.has(id)){show(id,null,true);return;}}catch{}location.hash='himnos';return;}const returning=!$('reader').hidden,target=value==='library'?'himnos':value;$('reader').hidden=true;document.body.classList.remove('reading-page');navigate(target,!(returning&&readerReturn?.route===target));window.scrollTo({top:returning&&readerReturn?.route===target?readerReturn.scroll:0,behavior:'instant'});if(returning){const button=[...$('results').querySelectorAll('.open-hymn')].find(b=>b.dataset.id===active);button?.focus({preventScroll:true});}}
 window.addEventListener('hashchange',hash);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('reader-text-settings').hidden&&!document.querySelector('dialog[open]')){e.preventDefault();closeTextSettings(true);}else if(e.key==='Escape'&&$('reader').hidden&&!$('advanced-filters').hidden){e.preventDefault();$('advanced-filters').hidden=true;$('filter-toggle').setAttribute('aria-expanded','false');$('filter-toggle').focus({preventScroll:true});}if(e.key==='/'&&$('reader').hidden&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();history.pushState(null,'','#himnos');navigate('himnos');$('search').focus();}});window.addEventListener('DOMContentLoaded',()=>{desktopPlayer=window.EBPAudio.create({data,onRead:id=>show(id),onFavorite:toggle,isFavorite:id=>favorites.includes(id)});pageFlip=window.EBPPageFlip.create({root:$('reader'),neighbor:direction=>sequence[sequence.indexOf(active)+direction],preview:readingPreview,onNavigate:id=>show(id)});hash();});
})();
