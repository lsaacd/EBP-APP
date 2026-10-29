'use strict';
(() => {
 const language=document.getElementById('legal-language'),theme=document.getElementById('theme');let dark=false;
 try{const stored=JSON.parse(localStorage.getItem('ebp-dark'));dark=stored===null?matchMedia('(prefers-color-scheme: dark)').matches:stored===true;}catch{}
 function applyTheme(){document.body.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';document.querySelectorAll('.church-logo').forEach(img=>img.src=dark?'images/branding/dark_theme_webpage_ebp.svg':'images/branding/og_ebp.svg');const label=language.value==='en'?(dark?'Switch to light mode':'Switch to dark mode'):(dark?'Activar modo claro':'Activar modo oscuro');theme.setAttribute('aria-label',label);theme.title=label;theme.setAttribute('aria-pressed',String(dark));}
 theme.onclick=()=>{dark=!dark;applyTheme();try{localStorage.setItem('ebp-dark',JSON.stringify(dark));}catch{}};
 let selected=null,settleTimer;
 const offset=()=>document.querySelector('.legal-header').getBoundingClientRect().height+24;
 function layout(){
  const article=document.querySelector('.legal-language:not([hidden]) .legal-article'),last=article.querySelector('h2[id]:last-of-type');
  article.style.paddingBottom='0px';
  // Leave enough room to bring even the last heading below the sticky header.
  if(last)article.style.paddingBottom=Math.max(0,innerHeight-offset()-(article.getBoundingClientRect().bottom-last.getBoundingClientRect().top)-24)+'px';
  document.documentElement.style.setProperty('--legal-anchor-offset',offset()+'px');highlight();
 }
 function navigateTo(heading,push=true){
  selected=heading;clearTimeout(settleTimer);
  if(push&&location.hash!=='#'+heading.id)history.pushState(null,'','#'+heading.id);
  window.scrollTo({top:Math.max(0,scrollY+heading.getBoundingClientRect().top-offset()),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});highlight();
  settleTimer=setTimeout(()=>{selected=null;highlight();},1000);
 }
 document.querySelectorAll('.legal-language').forEach(section=>{const toc=section.querySelector('[data-toc]');section.querySelectorAll('.legal-article h2[id]').forEach(heading=>{const a=document.createElement('a');a.href='#'+heading.id;a.textContent=heading.textContent.trim();a.onclick=e=>{e.preventDefault();navigateTo(heading);};toc.append(a);});});
 function highlight(){const section=document.getElementById('lang-'+language.value),headings=[...section.querySelectorAll('h2[id]')];let current=headings[0];for(const h of headings){if(h.getBoundingClientRect().top<=offset()+5)current=h;}if(selected&&section.contains(selected))current=selected;section.querySelectorAll('[data-toc] a').forEach(a=>{if(a.hash==='#'+current?.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 function changeLanguage(){selected=null;document.documentElement.lang=language.value;document.querySelectorAll('.legal-language').forEach(s=>s.hidden=s.id!=='lang-'+language.value);document.title=document.querySelector('.legal-language:not([hidden]) h1').textContent+' — Himnario El Buen Pastor';applyTheme();layout();}
 language.onchange=changeLanguage;window.addEventListener('scroll',highlight,{passive:true});window.addEventListener('storage',e=>{if(e.key==='ebp-dark'){dark=e.newValue==='true';applyTheme();}});changeLanguage();
 function followHash(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(!target?.matches('.legal-article h2[id]'))return;if(target.closest('#lang-en'))language.value='en';else language.value='es';changeLanguage();requestAnimationFrame(()=>navigateTo(target,false));}
 window.addEventListener('hashchange',followHash);window.addEventListener('resize',layout);document.fonts?.ready.then(layout);new ResizeObserver(layout).observe(document.querySelector('.legal-header'));
 ['wheel','touchstart','pointerdown','keydown'].forEach(type=>window.addEventListener(type,()=>{selected=null;},{passive:true}));
 followHash();
})();
