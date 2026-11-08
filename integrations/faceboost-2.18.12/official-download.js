/* GPL-3.0-or-later. Explicit-click-only official Facebook share/copy transaction. */
(function(w){
 'use strict';if(w.FproOfficialDownload)return;
 const d=w.document,selector='button,[role="button"],a[data-sigil~="share"]';let active=null;
 const normalize=s=>String(s||'').replace(/[\u064B-\u065F\u200E\u200F\u202A-\u202E]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 const label=b=>normalize(b.getAttribute('aria-label')||b.getAttribute('title')||b.textContent);
 const isShare=b=>/^(?:share(?: (?:video|reel|post))?|مشاركة(?: (?:الفيديو|الريلز|المنشور))?|مشاركه|شارك)(?:\s*[\d٠-٩.,٬]+)?$/.test(label(b))||String(b.getAttribute('data-sigil')||'').split(/\s+/).includes('share');
 const visible=n=>{if(!n||!n.isConnected||n.closest('[aria-hidden="true"],[hidden]')||n.disabled||n.getAttribute('aria-disabled')==='true')return false;const r=n.getBoundingClientRect(),s=w.getComputedStyle(n);return r.width>0&&r.height>0&&r.bottom>0&&r.top<w.innerHeight&&r.right>0&&r.left<w.innerWidth&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
 function buttons(root){return Array.from(root.querySelectorAll(selector)).slice(0,600);}
 function copies(){return buttons(d).filter(b=>!b.closest('#mb-share-via')&&(/^(?:copy link|نسخ الرابط|نسخ رابط الفيديو|نسخ رابط المنشور)$/.test(label(b))||Array.from(b.querySelectorAll('span')).some(n=>n.textContent==='\u{F310F}'))&&visible(b));}
 function fingerprint(v){return [v.currentSrc||'',v.getAttribute('src')||'',...Array.from(v.querySelectorAll('source')).map(n=>n.getAttribute('src')||'')].join('|');}
 function identity(v){let out='';for(let n=v,i=0;n&&i<10;n=n.parentElement,i++){if(n.matches('body,html,main,[role="feed"]'))break;out+='|'+(n.getAttribute('data-video-id')||n.getAttribute('data-videoid')||'');}return out;}
 function findShare(v){
  const r=v.getBoundingClientRect(),inside=b=>{const x=b.getBoundingClientRect();return x.left>=r.left-40&&x.right<=r.right+40&&x.top>=r.top-40&&x.bottom<=r.bottom+110;};
  for(let n=v.parentElement,i=0;n&&i<12;n=n.parentElement,i++){
   if(n.matches('body,html,main,[role="feed"]'))break;
   if(Array.from(n.querySelectorAll('video')).some(x=>x!==v&&visible(x)))break;
   const found=buttons(n).filter(b=>isShare(b)&&visible(b)&&inside(b)&&!b.closest('[role="dialog"],#mb-share-via,[data-fpro-owned]'));
   if(found.length)return found.length===1?found[0]:null;
   if(n.matches('article,[role="article"]'))break;
  }
  // A portal rail is only accepted in a dedicated Reel/video route with one visible player.
  if(/^\/(?:reels?|watch|videos)(?:\/|$)/.test(w.location.pathname)&&r.height>w.innerHeight*.5&&Array.from(d.querySelectorAll('video')).filter(visible).length===1){
   const found=buttons(d).filter(b=>isShare(b)&&visible(b)&&inside(b)&&!b.closest('[role="dialog"],#mb-share-via'));
   if(found.length===1)return found[0];
  }
  return null;
 }
 function stop(t){if(active!==t)return;active=null;t.observer.disconnect();w.clearTimeout(t.timer);if(t.frame)w.cancelAnimationFrame(t.frame);for(const [name,fn]of t.listeners)d.removeEventListener(name,fn,true);w.removeEventListener('pagehide',t.cancel);w.removeEventListener('popstate',t.cancel);}
 function valid(t){return active===t&&t.video.isConnected&&visible(t.video)&&fingerprint(t.video)===t.source&&identity(t.video)===t.identity&&w.location.href===t.page&&!d.hidden;}
 function notify(){w.location.href='fpro://official-download-help';}
 function fail(t){const ok=valid(t);stop(t);if(ok&&!(t.fallback&&t.fallback()))notify();}
 function copied(value){
  const t=active;if(!t||t.phase!=='copying')return false;
  if(!valid(t)){stop(t);return false;}
  // Only the fresh value emitted by the selected official Copy link action; never clipboard history.
  const p=w.FproPublicVideoLink.parse(String(value||'').trim());if(!p)return false;
  stop(t);w.location.href='fpro://download?media=&link='+encodeURIComponent(p.url)+'&copy=1';return true;
 }
 function scan(t){
  if(!valid(t)){stop(t);return;}
  if(t.phase==='copying')return;
  if(++t.scans>80){fail(t);return;}
  const found=copies().filter(b=>!t.before.has(b));
  if(found.length>1){fail(t);return;}
  if(found.length===1){t.phase='copying';try{found[0].click();}catch(_){fail(t);}}
 }
 function begin(video,fallback){
  if(active){if(active.video===video&&valid(active))return true;stop(active);}
  if(!video||!visible(video)||!/(^|\.)facebook\.com$/.test(w.location.hostname)||d.hidden)return false;
  if(copies().length){notify();return false;} // Never consume an already-open, potentially unrelated sheet.
  const share=findShare(video);
  const t={video,source:fingerprint(video),identity:identity(video),page:w.location.href,phase:'opening',scans:0,before:new Set(copies()),listeners:[],frame:0,fallback};
  t.cancel=()=>stop(t);
  t.observer=new MutationObserver(()=>{if(active===t&&!t.frame)t.frame=w.requestAnimationFrame(()=>{t.frame=0;scan(t);});});
  active=t;t.observer.observe(d.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-hidden','hidden']});
  const listen=(name,fn)=>{d.addEventListener(name,fn,true);t.listeners.push([name,fn]);};
  listen('visibilitychange',()=>{if(d.hidden)t.cancel();});listen('wheel',t.cancel);listen('touchmove',t.cancel);
  listen('pointerdown',e=>{
   if(!e.isTrusted)return;
   const el=e.target instanceof w.Element?e.target:null;
   if(el&&el.closest('[role="dialog"],[role="presentation"],.dialog-screen')&&copies().length)return;
   const article=video.closest('article,[role="article"]');
   if(!el||!(article?article.contains(el):video.parentElement&&video.parentElement.contains(el)))t.cancel();
  });
  w.addEventListener('pagehide',t.cancel);w.addEventListener('popstate',t.cancel);
  t.timer=w.setTimeout(()=>fail(t),8000);
  if(!share){
   // A verified existing source can still serve layouts without an identifiable share button.
   if(fallback&&fallback()){stop(t);return true;}
   notify();return true; // Briefly allow the user's own official Share tap for an unlabeled rail.
  }
  try{share.click();scan(t);}catch(_){fail(t);}return true;
 }
 // Native Web Share, when actually available, is also an official source. Leave ordinary sharing intact.
 if(typeof w.navigator.share==='function'){
  const original=w.navigator.share.bind(w.navigator);
  try{w.navigator.share=function(data){const t=active;if(t&&valid(t)){
   const p=w.FproPublicVideoLink.parse(data&&data.url||'');if(p){t.phase='copying';if(copied(p.url))return Promise.resolve();}
  }return original(data);};}catch(_){}
 }
 w.FproOfficialDownload={begin,copied,cancel:()=>{if(active)stop(active);},report:()=>({active:!!active,phase:active?active.phase:null,scans:active?active.scans:0})};
})(window);
