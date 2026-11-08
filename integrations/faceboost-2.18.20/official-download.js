/* GPL-3.0-or-later. Explicit-click-only official Facebook share/copy transaction. */
(function(w){
 'use strict';if(w.FproOfficialDownload)return;
 const d=w.document,legacySelector='button,[role="button"],a[data-sigil~="share"]',selector=legacySelector+',[data-action-id][data-mcomponent]';let copyDepth=0,receipt=null,receiptTimer=null;let active=null,last={stage:0,reason:0,share:0,copy:0,invalid:0};
 const normalize=s=>String(s||'').replace(/[\u064B-\u065F\u200E\u200F\u202A-\u202E]/g,'').replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}]/gu,' ').replace(/\s+/g,' ').trim().toLowerCase();
 const label=b=>normalize(b.getAttribute('aria-label')||b.getAttribute('title')||(b.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>d.getElementById(id)?.textContent||'').join(' ')||b.textContent);
 const exactShare=b=>b.matches(legacySelector)&&(/^(?:share(?: (?:video|reel|post))?|مشاركة(?: (?:هذا )?(?:الفيديو|الريلز|المنشور))?|خيارات المشاركة|مشاركه|شارك(?: (?:الفيديو|الريلز|المنشور))?)(?:\s*[\d٠-٩.,٬]+)?$/.test(label(b))||String(b.getAttribute('data-sigil')||'').split(/\s+/).includes('share'));
 // Owner V2: unique owned role=button/action/component passes selector/bounds,
 // but its descriptive aria-label is rejected by the old exact-label regex.
 const mobileShare=b=>normalize(b.getAttribute('aria-label')||'').length<=100&&b.matches('[role="button"][data-action-id][data-mcomponent]')&&/^(?:(?:share|مشاركة|مشاركه|شارك)(?:\s|[،,:.])|send (?:this )?(?:video|reel|post)(?:\s|$)|إرسال (?:هذا |هذه )?(?:الفيديو|الريلز|الريل|المنشور)(?:\s|$))/i.test(normalize(b.getAttribute('aria-label')||''));
 const isShare=b=>exactShare(b)||mobileShare(b);
 const isCopy=b=>/^(?:copy link|نسخ الرابط|نسخ رابط الفيديو|نسخ رابط المنشور)$/.test(label(b))||
  (b.matches('[data-action-id][data-mcomponent]')&&/^(?:copy link|نسخ (?:الرابط|رابط الفيديو|رابط المنشور))(?:\s|[،,:.])/i.test(normalize(b.getAttribute('aria-label')||'')))||Array.from(b.querySelectorAll('span')).some(n=>n.textContent==='\u{F310F}');
 function canonical(b,predicate){const owner=b.closest('[data-action-id][data-mcomponent]');return owner&&predicate(owner)?owner:b;}
 const visible=n=>{if(!n||!n.isConnected||n.closest('[aria-hidden="true"],[hidden]')||n.disabled||n.getAttribute('aria-disabled')==='true')return false;const r=n.getBoundingClientRect(),s=w.getComputedStyle(n);return r.width>0&&r.height>0&&r.bottom>0&&r.top<w.innerHeight&&r.right>0&&r.left<w.innerWidth&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
 function buttons(root){return Array.from(root.querySelectorAll(selector)).filter(visible).slice(0,600);}
 function copies(){return Array.from(new Set(buttons(d).filter(b=>!b.closest('#mb-share-via')&&isCopy(b)).map(b=>canonical(b,isCopy)))).filter(visible);}
 function fingerprint(v){return [v.currentSrc||'',v.getAttribute('src')||'',...Array.from(v.querySelectorAll('source')).map(n=>n.getAttribute('src')||'')].join('|');}
 function identity(v){let out='';for(let n=v,i=0;n&&i<10;n=n.parentElement,i++){if(n.matches('body,html,main,[role="feed"]'))break;out+='|'+(n.getAttribute('data-video-id')||n.getAttribute('data-videoid')||'');}return out;}
 function findShare(v){
  const r=v.getBoundingClientRect(),inside=b=>{const x=b.getBoundingClientRect();return x.left>=r.left-40&&x.right<=r.right+40&&x.top>=r.top-40&&x.bottom<=r.bottom+110;};
  for(let n=v.parentElement,i=0;n&&i<12;n=n.parentElement,i++){
   if(n.matches('body,html,main,[role="feed"]'))break;
   if(Array.from(n.querySelectorAll('video')).some(x=>x!==v&&visible(x)))break;
   const found=Array.from(new Set(buttons(n).filter(b=>exactShare(b)||(mobileShare(b)&&n.querySelectorAll('video').length===1)).map(b=>canonical(b,isShare)))).filter(b=>n.contains(b)&&visible(b)&&inside(b)&&(!b.closest('[role="dialog"]')||b.closest('[role="dialog"]').contains(v))&&!b.closest('#mb-share-via,[data-fpro-owned]'));
   if(found.length)return found.length===1?found[0]:null;
   if(n.matches('article,[role="article"]'))break;
  }
  // A portal rail is only accepted in a dedicated Reel/video route with one visible player.
  if(/^\/(?:reels?|watch|videos)(?:\/|$)/.test(w.location.pathname)&&r.height>w.innerHeight*.5&&Array.from(d.querySelectorAll('video')).filter(visible).length===1){
   const found=buttons(d).filter(b=>exactShare(b)&&visible(b)&&inside(b)&&b.getBoundingClientRect().top>=Math.max(0,r.top)&&b.getBoundingClientRect().bottom<=Math.min(w.innerHeight,r.bottom)&&(!b.closest('[role="dialog"]')||b.closest('[role="dialog"]').contains(v))&&!b.closest('#mb-share-via'));
   if(found.length===1)return found[0];
  }
  return null;
 }
 function stop(t){if(active!==t)return;active=null;t.observer.disconnect();w.clearTimeout(t.timer);if(t.frame)w.cancelAnimationFrame(t.frame);for(const [name,fn]of t.listeners)d.removeEventListener(name,fn,true);w.removeEventListener('pagehide',t.cancel);w.removeEventListener('popstate',t.cancel);for(const undo of t.undo)try{undo();}catch(_){};}
 function valid(t){return active===t&&t.video.isConnected&&fingerprint(t.video)===t.source&&identity(t.video)===t.identity&&w.location.href===t.page&&!d.hidden;}
 function notify(reason='copy-timeout',video=null){
  last.reason=({'share-not-found':1,'existing-sheet':2,'copy-timeout':3,'ambiguous-copy':4,'share-click-error':5,'copy-click-error':6})[reason]||0;
  try{const report=video&&w.FproPlayerDiagnostic?.capture(video);if(report){report.attempt={...last};w.location.href='fpro://player-diagnostic?data='+encodeURIComponent(JSON.stringify(report));return;}}catch(_){}
  w.location.href='fpro://official-download-help?reason='+encodeURIComponent(reason);
 }
 function fail(t,reason='copy-timeout'){const ok=valid(t);stop(t);if(ok)notify(reason,t.video);}
 function copied(value){
  const t=active;if(!t||t.phase!=='copying')return false;
  if(!valid(t)){stop(t);return false;}
  // Only the fresh value emitted by the selected official Copy link action; never clipboard history.
  const p=w.FproPublicVideoLink.parse(String(value||'').trim());if(!p){last.invalid++;return false;}
  last.stage=5;stop(t);w.location.href='fpro://download?media=&link='+encodeURIComponent(String(value).trim())+'&copy=0';return true;
 }
 function clearReceipt(e){if(e&&!e.isTrusted)return;receipt=null;if(receiptTimer!==null)w.clearTimeout(receiptTimer);receiptTimer=null;d.removeEventListener('pointerdown',clearReceipt,true);d.removeEventListener('keydown',clearReceipt,true);}
 function rememberReceipt(value,video){clearReceipt();receipt={value,video,source:fingerprint(video),page:w.location.href,until:Date.now()+2000};d.addEventListener('pointerdown',clearReceipt,true);d.addEventListener('keydown',clearReceipt,true);receiptTimer=w.setTimeout(()=>clearReceipt(),2000);}
 function isInternalCopy(){return copyDepth>0||!!(active&&active.phase==='copying');}
 function receiptMatches(text){return !!(receipt&&Date.now()<receipt.until&&text===receipt.value&&receipt.video.isConnected&&fingerprint(receipt.video)===receipt.source&&w.location.href===receipt.page);}
 function shouldSuppressCopy(value){return isInternalCopy()||receiptMatches(String(value||'').trim());}
 function interceptCopy(value){
  const text=String(value||'').trim(),t=active;
  if(t&&t.phase==='copying'){
   if(!valid(t)){stop(t);return true;} // Discard stale automated output; never turn it into manual copying.
   if(w.FproPublicVideoLink.parse(text)){rememberReceipt(text,t.video);copied(text);}else last.invalid++;
   return true; // Never write invalid intermediate data from the automated action either.
  }
  if(copyDepth>0)return true;
  if(receiptMatches(text))return true;
  return false;
 }
 function scan(t){
  if(!valid(t)){stop(t);return;}
  if(t.phase==='copying')return;
  if(++t.scans>80){fail(t);return;}
  const found=copies().filter(b=>!t.before.has(b));
  if(found.length>1){fail(t,'ambiguous-copy');return;}
  if(found.length===1){
   const menu=found[0].closest('[role="presentation"],[role="dialog"],[role="menu"],.dialog-screen');
   if(menu&&!menu.contains(t.video)){
    const old=menu.style.getPropertyValue('opacity'),priority=menu.style.getPropertyPriority('opacity');
    menu.style.setProperty('opacity','0','important');t.undo.push(()=>{if(old)menu.style.setProperty('opacity',old,priority);else menu.style.removeProperty('opacity');});
   }
   last.copy=1;last.stage=Math.max(last.stage,3);t.phase='copying';copyDepth++;try{found[0].click();last.stage=Math.max(last.stage,4);}catch(_){fail(t,'copy-click-error');}finally{copyDepth--;}
  }
 }
 function begin(video,fallback){
  if(active){if(active.video===video&&valid(active))return true;stop(active);}
  if(!video||!visible(video)||!/(^|\.)facebook\.com$/.test(w.location.hostname)||d.hidden)return false;
  last={stage:0,reason:0,share:0,copy:0,invalid:0};
  if(copies().length){notify('existing-sheet',video);return false;} // Never consume an already-open, potentially unrelated sheet.
  const share=findShare(video);
  const t={video,source:fingerprint(video),identity:identity(video),page:w.location.href,phase:'opening',scans:0,before:new Set(copies()),listeners:[],undo:[],frame:0};
  t.cancel=()=>stop(t);
  t.observer=new MutationObserver(()=>{if(active===t&&!t.frame)t.frame=w.requestAnimationFrame(()=>{t.frame=0;scan(t);});});
  active=t;t.observer.observe(d.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-hidden','hidden','class','style','src']});
  const listen=(name,fn)=>{d.addEventListener(name,fn,true);t.listeners.push([name,fn]);};
  listen('visibilitychange',()=>{if(d.hidden)t.cancel();});listen('wheel',t.cancel);listen('touchmove',t.cancel);
  listen('pointerdown',e=>{if(e.isTrusted)t.cancel();});
  listen('keydown',e=>{if(e.isTrusted)t.cancel();});
  w.addEventListener('pagehide',t.cancel);w.addEventListener('popstate',t.cancel);
  t.timer=w.setTimeout(()=>fail(t),8000);
  if(!share){stop(t);notify('share-not-found',video);return false;}
  last.share=1;last.stage=1;try{share.click();last.stage=Math.max(last.stage,2);scan(t);}catch(_){fail(t,'share-click-error');}return true;
 }
 // Native Web Share, when actually available, is also an official source. Leave ordinary sharing intact.
 if(typeof w.navigator.share==='function'){
  const original=w.navigator.share.bind(w.navigator);
  try{w.navigator.share=function(data){const t=active;if(t&&valid(t)){
   const p=w.FproPublicVideoLink.parse(data&&data.url||'');if(p){t.phase='copying';if(copied(p.url))return Promise.resolve();}
  }return original(data);};}catch(_){}
 }
 w.FproOfficialDownload={begin,copied,interceptCopy,isInternalCopy,hasCopyReceipt:()=>!!(receipt&&receiptMatches(receipt.value)),shouldSuppressCopy,cancel:()=>{if(active)stop(active);clearReceipt();},report:()=>({active:!!active,phase:active?active.phase:null,scans:active?active.scans:0,last:{...last}})};
})(window);
