/* GPL-3.0-or-later. Home-only left-swipe intent gate; no synthetic site events. */
(function(){
 'use strict';
 if(window.__fproHomeSwipeGuard)return;
 let touch=null,pointer=null,blocked=0;
 function selecting(){const s=window.getSelection&&window.getSelection();return s&&!s.isCollapsed;}
 function home(){
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
  if(!el||el.closest('a,button,[role="button"],[role="link"],input,textarea,select,[contenteditable="true"],[role="slider"],.fpro-video-tools,[data-pagelet*="Stories"],[data-sigil*="story"],[aria-label*="Stories"],[aria-label*="القصص"]'))return true;
  for(let n=el;n&&n!==document.body&&n!==document.documentElement;n=n.parentElement){
   const s=getComputedStyle(n);
   if(n.clientWidth>0&&n.scrollWidth>n.clientWidth+8&&/auto|scroll|hidden/.test(s.overflowX))return true;
   if((s.scrollSnapType||'').startsWith('x'))return true;
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
   if(dx>12)return null;
   if(dx<=-20&&Math.abs(dx)>Math.abs(dy)*1.6){state.mode='blocked';blocked++;}
  }
  if(state.mode==='blocked')consume(e);
  return state;
 }
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
 window.__fproHomeSwipeGuard={report:()=>({blocked,home:home()})};
})();
