/* Private position checkpoint; no post text, cookies, form values or media URLs. */
(function(){
 'use strict';
 if(window.__fproPosition)return;
 const token=Date.now().toString(36)+Math.random().toString(36).slice(2),limit=2000000;
 let cancelRestore=null;
 const clamp=n=>Math.max(0,Math.min(limit,Number(n)||0));
 function path(el){const parts=[];for(let i=0;el&&el!==document.body&&i<8;i++,el=el.parentElement){if(!el.parentElement)return null;parts.unshift(el.tagName.toLowerCase()+':nth-child('+(Array.prototype.indexOf.call(el.parentElement.children,el)+1)+')');}return el===document.body?'body > '+parts.join(' > '):null;}
 function scrollers(){return Array.from(document.querySelectorAll('main,section,div,[role="feed"]')).slice(0,800).filter(el=>el.clientHeight>100&&el.scrollHeight>el.clientHeight+100&&/auto|scroll/.test(getComputedStyle(el).overflowY));}
 function permalink(article){for(const a of Array.from(article.querySelectorAll('a[href]')).slice(0,60)){try{const u=new URL(a.href,location.href);if(/(^|\.)facebook\.com$/.test(u.hostname)&&/\/(?:posts|permalink|reel|videos)\/|\/(?:story|permalink)\.php/.test(u.pathname))return u.pathname+u.search;}catch(_){}}return null;}
 function anchor(){for(const el of Array.from(document.querySelectorAll('article,[role="article"]')).slice(0,100)){const r=el.getBoundingClientRect();if(r.bottom>60&&r.top<innerHeight*.7){const key=permalink(el);if(key)return {key,top:Math.round(r.top)};}}return null;}
 function capture(){if(document.querySelector('input[type="password"]'))return JSON.stringify({v:1,login:true});return JSON.stringify({v:1,url:location.href,token,x:clamp(scrollX),y:clamp(scrollY),containers:scrollers().filter(el=>el.scrollTop>0||el.scrollLeft>0).slice(0,4).map(el=>({path:path(el),x:clamp(el.scrollLeft),y:clamp(el.scrollTop)})).filter(c=>c.path),anchor:anchor()});}
 function restore(raw){
  if(cancelRestore)cancelRestore();
  let s;try{s=typeof raw==='string'?JSON.parse(raw):raw;}catch(_){return false;}
  if(!s||s.v!==1||s.url!==location.href)return false;
  // A warm return must not disturb a live document that kept its exact position.
  if(s.token===token&&Math.abs(scrollY-s.y)<3&&(s.containers||[]).every(c=>{try{const el=document.querySelector(c.path);return el&&Math.abs(el.scrollTop-c.y)<3;}catch(_){return false;}}))return true;
  let stopped=false,timer=null,observer=null,settled=0,last=null;
  function stop(){if(stopped)return;stopped=true;clearTimeout(timer);if(observer)observer.disconnect();['touchstart','pointerdown','wheel','keydown'].forEach(e=>window.removeEventListener(e,stop,true));if(cancelRestore===stop)cancelRestore=null;}
  ['touchstart','pointerdown','wheel','keydown'].forEach(e=>window.addEventListener(e,stop,{capture:true,passive:true}));cancelRestore=stop;
  const start=Date.now();let queued=false;
  function tick(){queued=false;if(stopped)return;if(location.href!==s.url||Date.now()-start>20000){stop();return;}
   const targets=(s.containers||[]).slice(0,4);let ok=true;
   for(const c of targets){try{const el=document.querySelector(c.path);if(el){el.scrollLeft=clamp(c.x);el.scrollTop=clamp(c.y);if(Math.abs(el.scrollTop-clamp(c.y))>3)ok=false;}else ok=false;}catch(_){ok=false;}}
   let matched=null;if(s.anchor&&typeof s.anchor.key==='string')for(const el of Array.from(document.querySelectorAll('article,[role="article"]')).slice(0,100)){if(permalink(el)===s.anchor.key){matched=el;break;}}
   if(matched){const delta=matched.getBoundingClientRect().top-Number(s.anchor.top||0);const scrollParent=scrollers().find(el=>el.contains(matched));if(scrollParent)scrollParent.scrollTop+=delta;else scrollTo(scrollX,scrollY+delta);}
   else {if(s.anchor)ok=false;scrollTo(clamp(s.x),clamp(s.y));if(Math.abs(scrollY-clamp(s.y))>3)ok=false;}
   // Allow delayed images and feed layout to settle, but never fight a real touch.
   const signature=[scrollY,...targets.map(c=>{try{return document.querySelector(c.path)?.scrollTop;}catch(_){return null;}}),matched?matched.getBoundingClientRect().top:null].join(',');
   settled=ok&&signature===last?settled+1:0;last=signature;
   if(settled>=5){stop();return;}timer=setTimeout(tick,250);
  }
  observer=new MutationObserver(()=>{if(!queued&&!stopped){queued=true;clearTimeout(timer);timer=setTimeout(tick,100);}});observer.observe(document.documentElement,{childList:true,subtree:true});tick();return true;
 }
 window.__fproPosition={capture,restore,cancel:()=>{if(cancelRestore)cancelRestore();}};
})();
