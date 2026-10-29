/* Inline icons render consistently on mobile, without emoji fonts. */
window.EBPUI={label(target,text){
 const paths={'▶':'M8 5v14l11-7Z','↗':'M5 19 19 5M5 5h14v14','☀':'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2','☾':'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z'};
 target.replaceChildren();
 for(const part of String(text).split(/([▶↗☀☾])/u)){
  if(!paths[part]){target.append(document.createTextNode(part));continue;}
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
  svg.classList.add('ui-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill',part==='▶'?'currentColor':'none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');path.setAttribute('d',paths[part]);svg.append(path);target.append(svg);
 }
}};
