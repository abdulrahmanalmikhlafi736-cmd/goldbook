/* GPL-3.0-or-later. Explicit-click-only official Facebook share/copy transaction. */
(function(w){
 'use strict';if(w.FproOfficialDownload)return;
 const d=w.document,legacySelector='button,[role="button"],a[data-sigil~="share"]',selector=legacySelector+',[data-action-id][data-mcomponent]';let copyDepth=0,receipt=null,receiptTimer=null;let active=null,last={stage:0,reason:0,share:0,copy:0,invalid:0,copyMatches:0,copyNamed:0,copyGlyphs:0,copyNested:0};
 const normalize=s=>String(s||'').replace(/[\u064B-\u065F\u061C\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g,'').replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}]/gu,' ').replace(/\s+/g,' ').trim().toLowerCase();
 const label=b=>normalize(b.getAttribute('aria-label')||b.getAttribute('title')||(b.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>d.getElementById(id)?.textContent||'').join(' ')||b.textContent);
 const exactShare=b=>b.matches(legacySelector)&&(/^(?:share(?: (?:video|reel|post))?|مشاركة(?: (?:هذا )?(?:الفيديو|الريلز|المنشور))?|خيارات المشاركة|مشاركه|شارك(?: (?:الفيديو|الريلز|المنشور))?)(?:\s*[\d٠-٩.,٬]+)?$/.test(label(b))||String(b.getAttribute('data-sigil')||'').split(/\s+/).includes('share'));
 // Owner V2: unique owned role=button/action/component passes selector/bounds,
 // but its descriptive aria-label is rejected by the old exact-label regex.
 const mobileShare=b=>normalize(b.getAttribute('aria-label')||'').length<=100&&b.matches('[role="button"][data-action-id][data-mcomponent]')&&/^(?:(?:share|مشاركة|مشاركه|شارك)(?:\s|[،,:.])|send (?:this )?(?:video|reel|post)(?:\s|$)|إرسال (?:هذا |هذه )?(?:الفيديو|الريلز|الريل|المنشور)(?:\s|$))/i.test(normalize(b.getAttribute('aria-label')||''));
 // Owner 2.18.21 V2 + manually confirmed screenshot: Share U+F037A
 // (983930), distinct from Like U+F0378 and Comment U+F0379. Direct icon-font
 // text only; never infer Share from its position, counter, arbitrary text or pseudo CSS.
 function glyphShare(b){
  if(!/^\/(?:home\.php)?$/.test(w.location.pathname)||!b.matches('[role="button"][data-action-id][data-mcomponent]'))return false;
  const codes=new Set(),walker=d.createTreeWalker(b,w.NodeFilter.SHOW_ELEMENT);let node=b,visited=0;
  for(;node&&visited<32;node=walker.nextNode(),visited++){
   if(node.closest('[data-action-id][data-mcomponent]')!==b)continue;
   const style=w.getComputedStyle(node);if(!/icon|symbol/i.test(style.fontFamily||''))continue;
   let shown=true,p=node;
   for(let i=0;p&&i<16;i++,p=p.parentElement){const css=w.getComputedStyle(p);if(p.hidden||css.display==='none'||css.visibility==='hidden'||css.opacity==='0'){shown=false;break;}if(p===b)break;}
   if(!shown||p!==b)continue;
   for(const text of Array.from(node.childNodes).slice(0,32)){
    if(text.nodeType!==3)continue;
    for(const ch of String(text.nodeValue||'').slice(0,128)){const cp=ch.codePointAt(0);if((cp>=0xE000&&cp<=0xF8FF)||(cp>=0xF0000&&cp<=0xFFFFD)||(cp>=0x100000&&cp<=0x10FFFD))codes.add(cp);}
   }
  }
  // A truncated or mixed icon subtree is not positive evidence for one action.
  return !node&&codes.size===1&&codes.has(983930);
 }
 function glyphOwned(b,v){
  for(let p=b,i=0;p&&i<14;p=p.parentElement,i++){
   if(p.matches('body,html,main,[role="feed"],[role="main"]'))return false;
   const videos=p.querySelectorAll('video');if(videos.length)return videos.length===1&&videos[0]===v;
   if(p.matches('article,[role="article"]'))return false;
  }return false;
 }
 const isShare=b=>exactShare(b)||mobileShare(b)||glyphShare(b);
 const ownName=b=>['aria-label','title','aria-labelledby'].some(key=>String(b.getAttribute(key)||'').trim());
 const namedCopy=b=>(ownName(b)||!b.querySelector(selector))&&(/^(?:copy link|نسخ الرابط|نسخ رابط الفيديو|نسخ رابط المنشور)$/.test(label(b))||
  (b.matches('[data-action-id][data-mcomponent]')&&/^(?:copy link|نسخ (?:الرابط|رابط الفيديو|رابط المنشور))(?:\s|[،,:.])/i.test(normalize(b.getAttribute('aria-label')||''))));
 // A Copy glyph belongs to its nearest actionable control, not every sheet/backdrop
 // ancestor containing that control. Previously all those ancestors became "Copy" too.
 function copyGlyphOwner(n){
  const nearest=n.closest(selector),role=n.closest('button,[role="button"]');
  const menu=n.closest('[role="presentation"],[role="dialog"],[role="menu"],.dialog-screen');
  // The pinned app's existing Share-via row uses this nearest role-button target.
  // A metadata-bearing icon inside that row is not another independent Copy action.
  return role&&menu&&menu.contains(role)?role:nearest;
 }
 function ownsCopyGlyph(b){
  const walker=d.createTreeWalker(b,w.NodeFilter.SHOW_ELEMENT);let n=b;
  for(let i=0;n&&i<64;n=walker.nextNode(),i++){
   if(n.localName!=='span'||n.textContent!=='\u{F310F}'||copyGlyphOwner(n)!==b)continue;
   let p=n,shown=true;for(let depth=0;p&&depth<16;depth++,p=p.parentElement){const css=w.getComputedStyle(p);if(p.hidden||css.display==='none'||css.visibility==='hidden'||css.opacity==='0'){shown=false;break;}if(p===b)break;}
   if(shown&&p===b)return true;
  }return false;
 }
 const isCopy=b=>namedCopy(b)||ownsCopyGlyph(b);
 function canonical(b,predicate){const owner=b.closest('[data-action-id][data-mcomponent]');return owner&&predicate(owner)?owner:b;}
 const visible=n=>{if(!n||!n.isConnected||n.closest('[aria-hidden="true"],[hidden]')||n.disabled||n.getAttribute('aria-disabled')==='true')return false;const r=n.getBoundingClientRect(),s=w.getComputedStyle(n);return r.width>0&&r.height>0&&r.bottom>0&&r.top<w.innerHeight&&r.right>0&&r.left<w.innerWidth&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
 function buttons(root){return Array.from(root.querySelectorAll(selector)).filter(visible).slice(0,600);}
 function copies(){
  const styles=new WeakMap(),copyVisible=n=>{
   if(!visible(n))return false;let p=n.parentElement;
   for(let i=0;p&&i<32;i++,p=p.parentElement){
    if(!styles.has(p))styles.set(p,w.getComputedStyle(p));const css=styles.get(p);
    if(css.display==='none'||css.visibility==='hidden'||css.opacity==='0')return false;
    if(p.matches('body,html'))return true;
   }return !p;
  };
  return Array.from(new Set(buttons(d).filter(b=>!b.closest('#mb-share-via')&&isCopy(b)&&copyVisible(b)).map(b=>canonical(b,isCopy)))).filter(copyVisible);
 }
 function fingerprint(v){return [v.currentSrc||'',v.getAttribute('src')||'',...Array.from(v.querySelectorAll('source')).map(n=>n.getAttribute('src')||'')].join('|');}
 function identity(v){let out='';for(let n=v,i=0;n&&i<10;n=n.parentElement,i++){if(n.matches('body,html,main,[role="feed"]'))break;out+='|'+(n.getAttribute('data-video-id')||n.getAttribute('data-videoid')||'');}return out;}
 function findShare(v){
  const glyphCache=new WeakMap(),hasGlyph=b=>{if(!glyphCache.has(b))glyphCache.set(b,glyphShare(b));return glyphCache.get(b);};
  const r=v.getBoundingClientRect(),inside=b=>{const x=b.getBoundingClientRect();return x.left>=r.left-40&&x.right<=r.right+40&&x.top>=r.top-40&&x.bottom<=r.bottom+110;};
  for(let n=v.parentElement,i=0;n&&i<12;n=n.parentElement,i++){
   if(n.matches('body,html,main,[role="feed"]'))break;
   if(Array.from(n.querySelectorAll('video')).some(x=>x!==v&&visible(x)))break;
   const single=n.querySelectorAll('video').length===1;
   const found=Array.from(new Set(buttons(n).filter(b=>exactShare(b)||(single&&(mobileShare(b)||(inside(b)&&hasGlyph(b)&&glyphOwned(b,v))))).map(b=>canonical(b,isShare)))).filter(b=>n.contains(b)&&visible(b)&&inside(b)&&(!b.closest('[role="dialog"]')||b.closest('[role="dialog"]').contains(v))&&!b.closest('#mb-share-via,[data-fpro-owned]'));
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
 // Rendering-only veil: never change geometry, opacity, aria-hidden or programmatic clicks.
 // A short post-copy tail catches Facebook's asynchronous success status, not manual copies.
 let veil=null;
 function startVeil(video){
  if(veil)veil.close();
  const menus='[role="presentation"],[role="dialog"],[role="menu"],.dialog-screen';
  const statuses='[role="status"],[role="alert"],[aria-live="polite"],[aria-live="assertive"],.toast,[data-sigil~="toast"]';
  // Reject aggregate live regions without reading an entire feed's text on each mutation.
  const statusText=n=>{
   const walker=d.createTreeWalker(n,w.NodeFilter.SHOW_ELEMENT|w.NodeFilter.SHOW_TEXT);let text='',child,count=0;
   while((child=walker.nextNode())&&count++<32)if(child.nodeType===3){const part=child.nodeValue||'';if(text.length+part.length>160)return '';text+=part;}
   return child?'':normalize(text);
  };
  const source=fingerprint(video),owner=identity(video),page=w.location.href;
  const oldMenus=new WeakSet(d.querySelectorAll(menus)),oldStatus=new WeakMap(),saved=new Map();
  for(const n of d.querySelectorAll(statuses))oldStatus.set(n,statusText(n));
  let closed=false,timer=null;
  const hide=n=>{if(saved.has(n))return;saved.set(n,['filter','pointer-events'].map(key=>[key,n.style.getPropertyValue(key),n.style.getPropertyPriority(key)]));n.style.setProperty('filter','opacity(0)','important');n.style.setProperty('pointer-events','none','important');};
  const restore=n=>{
   const properties=saved.get(n);if(!properties)return;
   for(const [key,value,priority]of properties)if(n.style.getPropertyValue(key)===(key==='filter'?'opacity(0)':'none')&&n.style.getPropertyPriority(key)==='important'){if(value)n.style.setProperty(key,value,priority);else n.style.removeProperty(key);}
   saved.delete(n);
  };
  const refresh=()=>{
   if(closed)return;
   if(!video.isConnected||fingerprint(video)!==source||identity(video)!==owner||w.location.href!==page){close();return;}
   for(const n of saved.keys())if(n.contains(video))restore(n);
   for(const n of Array.from(d.querySelectorAll(menus)).slice(0,128))if(!oldMenus.has(n)&&!n.contains(video)&&!n.closest('[data-fpro-owned]'))hide(n);
   for(const n of Array.from(d.querySelectorAll(statuses)).slice(0,128)){
    const text=statusText(n);
    const success=/^(?:تم النسخ|تم نسخ الرابط(?: إلى الحافظة)?|نسخ الرابط بنجاح|link copied(?: to clipboard)?|copied(?: to clipboard)?)$/.test(text);
    if(!n.contains(video)&&oldStatus.get(n)!==text&&success)hide(n);
    else if(!n.matches(menus))restore(n);
   }
  };
  const observer=new MutationObserver(refresh);
  const close=()=>{
   if(closed)return;closed=true;observer.disconnect();if(timer!==null)w.clearTimeout(timer);
   for(const name of ['pointerdown','keydown','touchmove','wheel'])d.removeEventListener(name,cancel,true);
   d.removeEventListener('visibilitychange',visibility,true);
   w.removeEventListener('pagehide',close);w.removeEventListener('popstate',close);
   for(const n of saved.keys())restore(n);
   saved.clear();if(veil===handle)veil=null;
  };
  const visibility=()=>{if(d.hidden)close();};
  const cancel=e=>{if(e.isTrusted)close();};
  const handle={refresh,close,settle(){refresh();timer=w.setTimeout(close,2000);}};
  observer.observe(d.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['role','aria-live','class']});
  for(const name of ['pointerdown','keydown','touchmove','wheel'])d.addEventListener(name,cancel,true);
  d.addEventListener('visibilitychange',visibility,true);
  w.addEventListener('pagehide',close);w.addEventListener('popstate',close);
  veil=handle;return handle;
 }
 function stop(t,success=false){if(active!==t)return;active=null;if(t.veil){if(success)t.veil.settle();else t.veil.close();}t.observer.disconnect();w.clearTimeout(t.timer);if(t.frame)w.cancelAnimationFrame(t.frame);for(const [name,fn]of t.listeners)d.removeEventListener(name,fn,true);w.removeEventListener('pagehide',t.cancel);w.removeEventListener('popstate',t.cancel);for(const undo of t.undo)try{undo();}catch(_){};}
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
  last.stage=5;stop(t,true);w.location.href='fpro://download?media=&link='+encodeURIComponent(String(value).trim())+'&copy=0';return true;
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
  const measured=found.slice(0,32);
  last.copyMatches=Math.min(64,found.length);last.copyNamed=measured.filter(namedCopy).length;last.copyGlyphs=measured.filter(ownsCopyGlyph).length;
  last.copyNested=measured.filter(b=>measured.some(other=>other!==b&&other.contains(b))).length;
  if(found.length>1){fail(t,'ambiguous-copy');return;}
  if(found.length===1){
   t.veil?.refresh();
   last.copy=1;last.stage=Math.max(last.stage,3);t.phase='copying';copyDepth++;try{found[0].click();last.stage=Math.max(last.stage,4);}catch(_){fail(t,'copy-click-error');}finally{copyDepth--;}
  }
 }
 function begin(video,fallback){
  if(active){if(active.video===video&&valid(active))return true;stop(active);}
  if(!video||!visible(video)||!/(^|\.)facebook\.com$/.test(w.location.hostname)||d.hidden)return false;
  last={stage:0,reason:0,share:0,copy:0,invalid:0,copyMatches:0,copyNamed:0,copyGlyphs:0,copyNested:0};
  if(copies().length){notify('existing-sheet',video);return false;} // Never consume an already-open, potentially unrelated sheet.
  const share=findShare(video);
  const t={video,source:fingerprint(video),identity:identity(video),page:w.location.href,phase:'opening',scans:0,before:new Set(copies()),listeners:[],undo:[],frame:0};
  t.cancel=()=>stop(t);
  const queueScan=()=>{t.veil?.refresh();if(active===t&&!t.frame)t.frame=w.requestAnimationFrame(()=>{t.frame=0;scan(t);});};
  t.observer=new MutationObserver(queueScan);
  active=t;t.observer.observe(d.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-hidden','hidden','class','style','src']});
  const listen=(name,fn)=>{d.addEventListener(name,fn,true);t.listeners.push([name,fn]);};
  listen('transitionend',queueScan);listen('animationend',queueScan);
  listen('visibilitychange',()=>{if(d.hidden)t.cancel();});listen('wheel',t.cancel);listen('touchmove',t.cancel);
  listen('pointerdown',e=>{if(e.isTrusted)t.cancel();});
  listen('keydown',e=>{if(e.isTrusted)t.cancel();});
  w.addEventListener('pagehide',t.cancel);w.addEventListener('popstate',t.cancel);
  t.timer=w.setTimeout(()=>fail(t),8000);
  if(!share){stop(t);notify('share-not-found',video);return false;}
  t.veil=startVeil(video);last.share=1;last.stage=1;try{share.click();t.veil.refresh();last.stage=Math.max(last.stage,2);scan(t);}catch(_){fail(t,'share-click-error');}return true;
 }
 // Native Web Share, when actually available, is also an official source. Leave ordinary sharing intact.
 if(typeof w.navigator.share==='function'){
  const original=w.navigator.share.bind(w.navigator);
  try{w.navigator.share=function(data){const t=active;if(t&&valid(t)){
   const p=w.FproPublicVideoLink.parse(data&&data.url||'');if(p){t.phase='copying';if(copied(p.url))return Promise.resolve();}
  }return original(data);};}catch(_){}
 }
 w.FproOfficialDownload={begin,copied,interceptCopy,isInternalCopy,hasCopyReceipt:()=>!!(receipt&&receiptMatches(receipt.value)),shouldSuppressCopy,cancel:()=>{if(active)stop(active);if(veil)veil.close();clearReceipt();},report:()=>({active:!!active,veiled:!!veil,phase:active?active.phase:null,scans:active?active.scans:0,last:{...last}})};
})(window);
