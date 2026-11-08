/* GPL-3.0-or-later. Home-only horizontal-swipe intent gate; no synthetic site events. */
(function(){
 'use strict';
 if(window.__fproHomeSwipeGuard)return;
 let touch=null,pointer=null,blocked=0,enabled=window.__fproHomeSwipeEnabled!==false;
 function selecting(){const s=window.getSelection&&window.getSelection();return s&&!s.isCollapsed;}
 function home(){
  if(!enabled)return false;
  if(document.fullscreenElement||document.webkitFullscreenElement||window.__fproNativeFullscreen)return false;
  if(!/(^|\.)facebook\.com$/i.test(location.hostname)||!['/','/home.php'].includes(location.pathname))return false;
  const query=new URL(location.href).searchParams;
  if(['v','story_fbid','fbid','story_id','reel_id'].some(k=>query.has(k)))return false;
  const sk=query.get('sk');
  if(sk&&!['h_chr','h_nor'].includes(sk))return false;
  return !Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"]')).some(el=>{
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   return el.getAttribute('aria-hidden')!=='true'&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
  });
 }
 function exempt(target){
  const el=target&&target.nodeType===1?target:target&&target.parentElement;
  if(!el||el.closest('input,textarea,select,[contenteditable="true"],[role="slider"],.fpro-video-tools,[data-pagelet*="Stories"],[data-sigil*="story"],[aria-label*="Stories"],[aria-label*="القصص"]'))return true;
  for(let n=el;n&&n!==document.body&&n!==document.documentElement;n=n.parentElement){
   const s=getComputedStyle(n);
   const r=n.getBoundingClientRect();
   // A viewport-sized paging shell is NOT an image carousel.
   const compact=r.height>0&&r.height<innerHeight*.75;
   if(compact&&n.clientWidth>0&&n.scrollWidth>n.clientWidth+8&&/auto|scroll|hidden/.test(s.overflowX))return true;
   if(compact&&(s.scrollSnapType||'').startsWith('x'))return true;
  }
  return false;
 }
 function begin(e,p,id){
  if(!home()||selecting()||exempt(e.target)||p.clientX<24||p.clientX>innerWidth-24)return null;
  return {x:p.clientX,y:p.clientY,id,mode:'pending',url:location.href};
 }
 function consume(e){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();}
 function move(e,p,state){
  if(!state||state.url!==location.href||!home()||selecting())return null;
  const dx=p.clientX-state.x,dy=p.clientY-state.y;
  if(state.mode==='pending'){
   if(Math.abs(dy)>12&&Math.abs(dy)>=Math.abs(dx))return null;
   if(Math.abs(dx)>=20&&Math.abs(dx)>Math.abs(dy)*1.6){state.mode='blocked';blocked++;}
  }
  if(state.mode==='blocked')consume(e);
  return state;
 }
 // Own controls must be routed BEFORE the broad input exemption. Website window
 // capture listeners must never see half a range-drag sequence. No synthetic events.
 let ownedPointer=null,ownedTouch=null,controlDrags=0;
 function ownControl(target){
  const el=target&&target.nodeType===1?target:target&&target.parentElement;
  const track=el&&el.closest('.fpro-track');
  const input=el&&(el.closest('input.fpro-seek')||(track&&track.querySelector('input.fpro-seek')));
  return input&&typeof input.__fproSeekGesture==='function'?input:null;
 }
 function drive(el,phase,x){if(el&&typeof el.__fproSeekGesture==='function')el.__fproSeekGesture(phase,x);}
 window.addEventListener('pointerdown',e=>{
  if(e.isPrimary!==false){if(ownedPointer)drive(ownedPointer.el,'cancel');if(ownedTouch)drive(ownedTouch.el,'cancel');ownedPointer=null;ownedTouch=null;}
  const el=ownControl(e.target);if(!el||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
  ownedPointer={el,id:e.pointerId};controlDrags++;drive(el,'start',e.clientX);
  try{el.setPointerCapture(e.pointerId);}catch(_){}
  consume(e);
 },{capture:true,passive:false});
 window.addEventListener('pointermove',e=>{
  if(!ownedPointer||ownedPointer.id!==e.pointerId)return;
  drive(ownedPointer.el,'move',e.clientX);consume(e);
 },{capture:true,passive:false});
 function pointerFinish(e){
  if(!ownedPointer||ownedPointer.id!==e.pointerId)return;
  drive(ownedPointer.el,e.type==='pointercancel'?'cancel':'end',e.clientX);
  try{ownedPointer.el.releasePointerCapture(e.pointerId);}catch(_){}
  ownedPointer=null;consume(e);
 }
 window.addEventListener('pointerup',pointerFinish,{capture:true,passive:false});
 window.addEventListener('pointercancel',pointerFinish,{capture:true,passive:false});
 window.addEventListener('touchstart',e=>{
  const el=ownControl(e.target);if(!el&&!ownedTouch)return;
  if(e.touches.length!==1){if(ownedTouch)drive(ownedTouch.el,'cancel');consume(e);return;}
  ownedTouch={el,shadow:!!ownedPointer};
  if(!ownedTouch.shadow){controlDrags++;drive(el,'start',e.touches[0].clientX);}
  consume(e);
 },{capture:true,passive:false});
 window.addEventListener('touchmove',e=>{
  if(!ownedTouch)return;
  if(!ownedTouch.shadow&&e.touches.length===1)drive(ownedTouch.el,'move',e.touches[0].clientX);
  consume(e);
 },{capture:true,passive:false});
 function touchFinish(e){
  if(!ownedTouch)return;
  if(!ownedTouch.shadow)drive(ownedTouch.el,e.type==='touchcancel'?'cancel':'end');
  ownedTouch=null;consume(e);
 }
 window.addEventListener('touchend',touchFinish,{capture:true,passive:false});
 window.addEventListener('touchcancel',touchFinish,{capture:true,passive:false});
 window.addEventListener('click',e=>{if(ownControl(e.target))consume(e);},{capture:true,passive:false});
 window.addEventListener('pagehide',()=>{if(ownedPointer)drive(ownedPointer.el,'cancel');if(ownedTouch)drive(ownedTouch.el,'cancel');ownedPointer=null;ownedTouch=null;});
 window.addEventListener('touchstart',e=>{touch=e.touches.length===1?begin(e,e.touches[0],e.touches[0].identifier):null;},{capture:true,passive:true});
 window.addEventListener('touchmove',e=>{
  if(e.touches.length!==1){touch=null;return;}
  const p=e.touches[0];if(touch&&touch.id===p.identifier)touch=move(e,p,touch);
 },{capture:true,passive:false});
 window.addEventListener('touchend',e=>{if(touch&&touch.mode==='blocked'&&touch.url===location.href&&home()&&!selecting())consume(e);touch=null;},{capture:true,passive:false});
 window.addEventListener('touchcancel',()=>{touch=null;},{capture:true,passive:true});
 window.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||e.isPrimary===false){pointer=null;return;}
  pointer=begin(e,e,e.pointerId);
 },{capture:true,passive:true});
 window.addEventListener('pointermove',e=>{if(pointer&&pointer.id===e.pointerId)pointer=move(e,e,pointer);},{capture:true,passive:false});
 window.addEventListener('pointerup',e=>{if(pointer&&pointer.id===e.pointerId){if(pointer.mode==='blocked'&&pointer.url===location.href&&home()&&!selecting())consume(e);pointer=null;}},{capture:true,passive:false});
 window.addEventListener('pointercancel',()=>{pointer=null;},{capture:true,passive:true});
 window.addEventListener('pagehide',()=>{touch=null;pointer=null;});
 window.__fproHomeSwipeGuard={setEnabled(value){enabled=value!==false;window.__fproHomeSwipeEnabled=enabled;touch=null;pointer=null;},report:()=>({enabled,blocked,controlDrags,home:home(),documentStart:!!window.__fproHomeSwipeAtStart})};
})();
