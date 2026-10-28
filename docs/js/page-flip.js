/* Browser adaptation of the app's PageFlipTransition, BookSpine and PageShadow.
   Only viewport snapshots animate; the document keeps its normal scroll flow. */
window.EBPPageFlip={create({root,neighbor,preview,onNavigate}){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let layer=null,gesture=null,frame=0,version=0,settling=false;
 const edgeLeft=document.createElement('div'),edgeRight=document.createElement('div');
 for(const [edge,side] of [[edgeLeft,'left'],[edgeRight,'right']]){edge.className=`page-turn-edge page-turn-edge-${side}`;edge.setAttribute('aria-hidden','true');edge.title=side==='left'?'Arrastra hacia la derecha para volver':'Arrastra hacia la izquierda para avanzar';root.append(edge);}
 const help=document.createElement('p');help.id='page-flip-help';help.className='sr-only';help.textContent='Usa las flechas izquierda y derecha para cambiar de alabanza. En pantalla táctil, desliza horizontalmente; con ratón, arrastra desde los bordes de la página.';root.append(help);root.setAttribute('aria-describedby',help.id);
 function available(direction){return !root.hidden&&!document.querySelector('dialog[open]')&&neighbor(direction);}
 function paint(progress){if(!layer)return;layer.progress=Math.max(0,Math.min(1,progress));const p=layer.progress,d=layer.direction;
  layer.front.style.transform=`perspective(${Math.max(1000,layer.width*1.2)}px) translateX(${-d*p*layer.width*.58}px) rotateY(${-d*p*72}deg) scale(${1-p*.06})`;
  layer.front.style.opacity=String(1-p*.78);layer.front.style.setProperty('--fold-shadow',String(Math.sin(p*Math.PI)*(document.body.classList.contains('dark')?.62:.46)));
  layer.back.style.transform=`translateX(${d*(1-p)*32}px) scale(${.97+.03*p})`;layer.back.style.opacity=String(.25+.75*p);
 }
 function prepare(direction){const id=available(direction);if(!id)return false;
  const header=root.querySelector('.reader-header'),top=Math.max(0,header.getBoundingClientRect().bottom),article=root.querySelector('.reading'),offset=article.getBoundingClientRect().top-top;
  const overlay=document.createElement('div'),front=document.createElement('div'),back=document.createElement('div');overlay.className='page-flip-layer';overlay.setAttribute('aria-hidden','true');overlay.inert=true;overlay.style.top=`${top}px`;
  front.className='flip-sheet flip-front';back.className='flip-sheet flip-underlay';front.style.transformOrigin=direction>0?'left center':'right center';
  const current=preview(),destination=preview(id);current.style.position='relative';current.style.top=`${offset}px`;front.append(current);back.append(destination);overlay.append(back,front);root.append(overlay);
  layer={overlay,front,back,direction,id,width:root.clientWidth,progress:0};root.setAttribute('aria-busy','true');paint(0);return true;
 }
 function release(){const pointer=gesture?.id;gesture=null;if(pointer!=null&&root.hasPointerCapture(pointer))root.releasePointerCapture(pointer);}
 function cancel(){version++;cancelAnimationFrame(frame);settling=false;release();layer?.overlay.remove();layer=null;root.removeAttribute('aria-busy');}
 function settle(complete){if(!layer)return;settling=true;const token=++version,start=layer.progress,target=complete?1:0,id=layer.id;
  const duration=Math.max(777,777*Math.abs(target-start)),began=performance.now();
  function tick(now){if(token!==version||!layer)return;const t=Math.min(1,(now-began)/duration);paint(start+(target-start)*(1-Math.pow(1-t,3)));if(t<1){frame=requestAnimationFrame(tick);return;}cancel();if(complete)onNavigate(id);}
  frame=requestAnimationFrame(tick);
 }
 function turn(direction){if(layer||settling||!available(direction))return false;if(reduced.matches){onNavigate(neighbor(direction));return true;}if(prepare(direction))settle(true);return true;}
 root.addEventListener('pointerdown',e=>{
  if(root.hidden||layer||settling||e.isPrimary===false||e.button!==0||document.querySelector('dialog[open]')||!document.getElementById('reader-text-settings').hidden)return;
  if(e.target.closest('a,button,input,textarea,select,[contenteditable],.reader-header,.reader-controls,.reading-nav'))return;
  // Mouse drags start on the page edges, leaving lyrics free for text selection.
  if(e.pointerType==='mouse'&&!e.target.closest('.page-turn-edge'))return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,time:e.timeStamp,velocity:0,direction:0,scroll:window.scrollY};
 });
 root.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id||settling)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,dt=e.timeStamp-gesture.time;
  if(!gesture.direction){if(Math.abs(window.scrollY-gesture.scroll)>4||Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){release();return;}if(Math.abs(dx)<15||Math.abs(dx)<Math.abs(dy)*1.4)return;
   const direction=dx<0?1:-1;if(!available(direction)){release();return;}gesture.direction=direction;if(!reduced.matches&&!prepare(direction)){release();return;}root.setPointerCapture(e.pointerId);
  }
  if(dt>0)gesture.velocity=(e.clientX-gesture.lastX)/dt;gesture.lastX=e.clientX;gesture.time=e.timeStamp;e.preventDefault();if(layer)paint(-gesture.direction*dx/layer.width);
 },{passive:false});
 root.addEventListener('pointerup',e=>{if(!gesture||e.pointerId!==gesture.id)return;const g=gesture,dx=e.clientX-g.x,direction=g.direction,velocity=e.timeStamp-g.time<100?g.velocity:0;
  const complete=direction&&(-direction*dx>Math.min(180,root.clientWidth*.28)||-direction*dx>40&&-direction*velocity>.55);release();
  if(reduced.matches){if(complete&&available(direction))onNavigate(neighbor(direction));return;}if(layer)settle(!!complete);
 });
 root.addEventListener('pointercancel',()=>{if(gesture){release();if(layer)settle(false);}});
 root.addEventListener('lostpointercapture',()=>{if(gesture){release();if(layer&&!settling)settle(false);}});
 document.addEventListener('keydown',e=>{if(root.hidden||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||document.querySelector('dialog[open]')||!document.getElementById('reader-text-settings').hidden)return;
  if(e.target.closest('input,textarea,select,button,a,[contenteditable]')||!window.getSelection()?.isCollapsed)return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowRight'?1:-1);}
 });
 window.addEventListener('resize',cancel);window.addEventListener('hashchange',cancel);window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});reduced.addEventListener('change',cancel);
 return {turn,cancel};
}};
