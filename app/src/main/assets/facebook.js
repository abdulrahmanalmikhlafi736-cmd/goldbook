(() => {
 'use strict';
 const initial = __CONFIG__;
 if (!document.body) return;
 if (window.__fpro) { window.__fpro.update(initial); return; }
 let cfg = initial, pending = null, hidingPass = null;
 const style = document.createElement('style'); style.id = 'fpro-style'; const nonce=document.querySelector('style[nonce],script[nonce]'); if(nonce)style.nonce=nonce.nonce;
 // Keep Android WebView's real selection handles/action mode: no synthetic
 // copy popup, clipboard bridge or touch/scroll interception.
 const selectionStyle=document.createElement('style');selectionStyle.id='fpro-selection-style';
 if(nonce)selectionStyle.nonce=nonce.nonce;
 // Prepare only the touched reading block, not the whole feed. Some Meta
 // layouts wrap comments/posts in role=button and set inline !important rules.
 const selectionOverrides=new Map();
 let selectionTargetInfo={prepared:false,buttonWrapper:false,inlineBlocked:false};
 function restoreSelectionOverrides(){
  selectionOverrides.forEach((entry,el)=>{
   for(const key of ['user-select','-webkit-user-select']){
    const old=entry[key];
    if(el.style.getPropertyValue(key)==='text'&&el.style.getPropertyPriority(key)==='important'){
     if(old.value)el.style.setProperty(key,old.value,old.priority);else el.style.removeProperty(key);
    }
   }
   if(!entry.marked)el.removeAttribute('data-fpro-selectable-text');
   ownedStyles.set(el,el.getAttribute('style'));
  });selectionOverrides.clear();
 }
 function readingTarget(target){
  const el=target&&target.nodeType===1?target:target&&target.parentElement;
  if(!el||el.closest('button,input,textarea,select,[contenteditable]:not([contenteditable="false"]),.fpro-video-tools,header,nav,[role="banner"],[role="navigation"],svg,img,video,canvas'))return null;
  const root=el.closest('p,[dir="auto"],[data-ad-preview="message"],[data-ad-comet-preview="message"],span,div');
  if(!root||!(root.textContent||'').trim())return null;
  const control=el.closest('[role="button"]');
  // An interactive post/comment wrapper is not the same as Like/Reply/etc.
  if(control){
   const aria=control.getAttribute('aria-label')||'',visible=control.textContent||'';
   const label=aria.length<=90?norm(aria):'',visibleLabel=visible.length<=90?norm(visible):'';
   if(selectionControlLabels.has(label)||selectionControlLabels.has(visibleLabel))return null;
   if(!el.closest('article,[role="article"],[data-commentid],[role="comment"]')&&!el.closest('[dir="auto"],p,[data-ad-preview],[data-ad-comet-preview]'))return null;
  }
  return {el,root,control};
 }
 function prepareSelection(e){
  if(cfg.textSelection===false||e.isPrimary===false||e.pointerType==='mouse'&&e.button!==0)return;
  const target=readingTarget(e.target);selectionTargetInfo={prepared:false,buttonWrapper:false,inlineBlocked:false,alreadyCancelled:!!e.defaultPrevented,eventType:e.type};if(!target)return;
  restoreSelectionOverrides();lastTap=null;touch=null;
  selectionTargetInfo={...selectionTargetInfo,prepared:true,buttonWrapper:!!target.control};
  let node=target.el;
  for(let depth=0;node&&node!==document.body&&depth<10;depth++,node=node.parentElement){
   const entry={marked:node.hasAttribute('data-fpro-selectable-text')};
   for(const key of ['user-select','-webkit-user-select']){
    entry[key]={value:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key)};
    if(entry[key].value==='none')selectionTargetInfo.inlineBlocked=true;
   }
   selectionOverrides.set(node,entry);
   for(const key of ['user-select','-webkit-user-select'])node.style.setProperty(key,'text','important');
   if(node===target.root)node.setAttribute('data-fpro-selectable-text','');
   ownedStyles.set(node,node.getAttribute('style'));
   if(node.matches('article,[role="article"],[role="comment"],[data-commentid]'))break;
  }
  // Preserve the browser default (selection/scrolling); avoid Meta's delegated
  // pointer/touch cancellation on reading text. Ordinary click still propagates.
  e.stopPropagation();
 }
 window.addEventListener('pointerdown',prepareSelection,true);
 window.addEventListener('touchstart',e=>{
  if(!e.touches||e.touches.length===1)prepareSelection(e);
 },{capture:true,passive:true});
 // Android treats a long-pressed anchor as a link, not selectable text.
 // Temporarily disarm only hashtag hrefs while the finger is down; Android
 // then performs its own word selection. Restore before an ordinary click.
 let selectionLink=null;
 function restoreSelectionLink(){
  const entry=selectionLink;if(!entry)return;selectionLink=null;clearTimeout(entry.timer);
  // A recycled Facebook node may already have acquired a NEW destination.
  if(!entry.link.hasAttribute('href'))entry.link.setAttribute('href',entry.href);
 }
 window.addEventListener('pointerdown',e=>{
  restoreSelectionLink();
  if(cfg.textSelection===false||e.isPrimary===false||e.pointerType==='mouse'&&e.button!==0)return;
  const el=e.target.nodeType===1?e.target:e.target.parentElement;
  if(!el||el.closest('button,input,textarea,select,[contenteditable]:not([contenteditable="false"]),.fpro-video-tools'))return;
  const link=el.closest('a[href]');if(!link)return;
  const href=link.getAttribute('href'),text=(link.textContent||'').trim();
  if(!/(?:\/hashtag\/|[?&]hashtag=)/i.test(href)||!/^#[^\s#]+$/.test(text))return;
  selectionLink={link,href,x:e.clientX,y:e.clientY,id:e.pointerId,timer:setTimeout(restoreSelectionLink,1500)};
  link.removeAttribute('href');
 },true);
 document.addEventListener('pointermove',e=>{if(selectionLink&&selectionLink.id===e.pointerId&&Math.hypot(e.clientX-selectionLink.x,e.clientY-selectionLink.y)>14)restoreSelectionLink();},true);
 document.addEventListener('pointerup',restoreSelectionLink,true);
 document.addEventListener('pointercancel',()=>{if(selectionLink)setTimeout(restoreSelectionLink,0);},true);
 document.addEventListener('click',restoreSelectionLink,true);
 window.addEventListener('blur',restoreSelectionLink);
 function updateSelection(){
  if(cfg.textSelection===false){restoreSelectionLink();restoreSelectionOverrides();selectionStyle.remove();return;}
  if(!selectionStyle.textContent)selectionStyle.textContent=`
   body p,body span,body [dir="auto"],body [role="article"],body [role="article"] *,body article,body article *,body a[href*="/hashtag/"],body a[href*="hashtag="],body [data-ad-preview="message"],body [data-ad-comet-preview="message"]{-webkit-user-select:text!important;user-select:text!important}
   body button,body button *,body [role="button"],body [role="button"] *,body select,body video,body canvas,.fpro-video-tools,.fpro-video-tools *{-webkit-user-select:none!important;user-select:none!important}
   body [data-fpro-selectable-text],body [data-fpro-selectable-text] *{-webkit-user-select:text!important;user-select:text!important}
   body [data-fpro-selectable-text] button,body [data-fpro-selectable-text] button *{-webkit-user-select:none!important;user-select:none!important}
   body input,body textarea,body [contenteditable]:not([contenteditable="false"]),body [contenteditable]:not([contenteditable="false"]) *{-webkit-user-select:auto!important;user-select:auto!important}
  `;
  if(!selectionStyle.isConnected)document.head.appendChild(selectionStyle);
 }
 window.addEventListener('contextmenu',e=>{
  if(cfg.textSelection!==false&&readingTarget(e.target))e.stopPropagation();
 },true);
 window.addEventListener('selectstart',e=>{
  if(cfg.textSelection!==false&&readingTarget(e.target))e.stopPropagation();
 },true);
 const colors = {'طبيعي':'#1877f2','ذهبي':'#d4af37','أحمر':'#c62828','أخضر':'#17833e','بنفسجي':'#8643c5','برتقالي':'#ed701b','فيروزي':'#008c95','وردي':'#d34489','بني':'#805539','فضي':'#9ba6b0','أبيض':'#ffffff'};
 const norm = s => (s || '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u2066-\u2069]/g,'').replace(/\s+/g,' ').toLowerCase().trim().replace(/[·•\s:.!؟]+$/g,'');
 const selectionControlLabels=new Set(['like','love','reply','replies','share','follow','comment','comments','send','save','copy','cancel','more','see more','see less','play','pause','إعجاب','أعجبني','رد','ردود','مشاركة','متابعة','تعليق','تعليقات','التعليقات','إرسال','حفظ','نسخ','إلغاء','المزيد','عرض المزيد','عرض أقل','تشغيل','إيقاف'].map(norm));
 const words = {
  ads:['sponsored','ممول','إعلان','اعلان','إعلان ممول','publicité','gesponsert','patrocinado','sponsorizzato'],
  suggested:['suggested for you','مقترح لك','مقترحة لك','مقترحات لك'],
  reels:['reels','ريلز','الريلز'], stories:['stories','القصص','قصص'],
  people:['people you may know','أشخاص قد تعرفهم','اشخاص قد تعرفهم'],
  groups:['suggested groups','مجموعات مقترحة','مجموعات مقترحة لك']
 };
 const postSelector = '[role="article"],article,[data-pagelet^="FeedUnit"],[data-ft]';
 function postFor(el){return el.closest('[role="article"],article,[data-pagelet^="FeedUnit"]') || el.closest('div[data-ft]');}
 const accentAttrs=['bg','fg','border','fill','stroke','icon','ring','outline','shadow','gradient','stop','svg-bg','before-svg-bg','after-svg-bg','canvas-ring',...['before','after'].flatMap(p=>['border','outline','shadow','bg','gradient'].map(k=>p+'-'+k))];
 const tintVars=new Map(),ownedStyles=new WeakMap();
 const iconDefs=document.createElementNS('http://www.w3.org/2000/svg','svg');iconDefs.id='fpro-icon-filter';iconDefs.setAttribute('aria-hidden','true');iconDefs.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
 iconDefs.innerHTML='<defs><filter id="fpro-icon-palette" color-interpolation-filters="sRGB"><feColorMatrix type="matrix"/></filter><filter id="fpro-canvas-palette" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1 0 1 0 0.38" result="redTest"/><feComponentTransfer in="redTest" result="redMask"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1 1 0 0.42" result="greenTest"/><feComponentTransfer in="greenTest" result="greenMask"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feComposite in="redMask" in2="greenMask" operator="in" result="blueMask"/><feComposite in="SourceAlpha" in2="blueMask" operator="in" result="blueAlpha"/><feFlood result="target"/><feComposite in="target" in2="blueAlpha" operator="in" result="tinted"/><feComposite in="SourceGraphic" in2="blueMask" operator="out" result="unchanged"/><feMerge><feMergeNode in="unchanged"/><feMergeNode in="tinted"/></feMerge></filter></defs>';
 const hidden = new Map(), painted = new Set(), videos = new Map(), identityBaseline = new WeakMap();
 function hide(el) {
  if (!el || /^(BODY|HTML|MAIN)$/.test(el.tagName) || ['main','feed','navigation'].includes(el.getAttribute('role'))) return;
  if(hidingPass)hidingPass.add(el);
  if (!hidden.has(el)) hidden.set(el, {value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
  if(el.getAttribute('data-fpro-hidden')!=='1')el.setAttribute('data-fpro-hidden','1');
  if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
 }
 function restoreHidden() {
  hidden.forEach((old,el) => { if(old.value) el.style.setProperty('display',old.value,old.priority); else el.style.removeProperty('display'); el.removeAttribute('data-fpro-hidden'); }); hidden.clear();
 }
 function section(label, key) {
  const post = postFor(label); if (post) return post;
  const region = label.closest('section,[role="list"],[role="region"],[data-pagelet*="Stories"],[data-pagelet*="Reels"],[data-sigil~="m-story-tray"]');
  if (region && !region.querySelector('[role="article"],article,[data-pagelet^="FeedUnit"]')) return region;
  // Never hide a whole feed because a navigation link contains "Stories".
  if (key === 'stories' || key === 'reels') {
   const link = label.closest('a[href]');
   if (link && /\/(stories|reel|reels)\//.test(link.getAttribute('href') || '')) return link;
  }
  return null;
 }
 const appPromptLabels=new Set(['فتح التطبيق','افتح التطبيق','فتح تطبيق فيسبوك','فتح التطبيق الآن','استخدم التطبيق','استخدم تطبيق فيسبوك','تطبيق فيسبوك الأصلي','فيسبوك الأصلي','الفيسبوك الأصلي','فتح في التطبيق','استخدام التطبيق','تثبيت التطبيق','الحصول على التطبيق','حمل تطبيق فيسبوك','open app','open the app','open in app','open in the app','use app','use the app','get the app','get facebook for android and browse faster','open facebook app','open the facebook app','use facebook app','use the facebook app','original facebook'].map(norm));
 function isAppPrompt(text){return text.length<=90&&appPromptLabels.has(norm(text));}
 function appBanner(link, explicitLabel = false) {
  const control=link.closest('a,button,[role="button"]');
  const inPost=link.closest('[role="article"],article,[data-pagelet^="FeedUnit"]');
  // Reels place the Open App control inside the player/article. Hide that
  // control only, never the reel or its search/profile/navigation siblings.
  if(inPost) { if(explicitLabel && control && !control.matches(postSelector) && !control.querySelector('video,article,[role="article"]')) hide(control); return; }
  const header=control && control.closest('header,nav,[role="banner"],[role="navigation"]');
  if(explicitLabel && header && header.querySelectorAll('a,button,[role="button"]').length>1) { hide(control); return; }
  if(explicitLabel && header && !header.querySelector('input,textarea,video,article,[role="article"]') && isAppPrompt(norm(header.textContent)) && Array.from(header.querySelectorAll('a,button,[role="button"],[role="link"],[aria-label],[tabindex],[onclick],svg,img')).every(node=>control.contains(node)||node.contains(control))) {hide(header);return;}
  const href = link.getAttribute('href') || '';
  if (!explicitLabel && !/^(intent:|fb:|fb-messenger:|android-app:)/i.test(href) && !/(play\.google\.com\/store\/apps|apps\.apple\.com\/|\/marketplace\/app_redirect|\/r\.php\?.*app_id|\/openinapp|\/native_app|\/intent\/)/i.test(href)) return;
  let block = link;
  // Only a compact install prompt, never an article, login form or entire page.
  for (let i=0; i<3 && block.parentElement; i++) {
   const p = block.parentElement;
   if (/^(BODY|HTML|MAIN|FORM)$/.test(p.tagName) || p.matches(postSelector) || p.getAttribute('role') === 'main' || p.matches('header,nav,[role="banner"],[role="navigation"]') || p.querySelector('input,textarea,video,[contenteditable],article,[role="article"]') || (p.textContent || '').length > 400) break;
   if(Array.from(p.querySelectorAll('a,button,[role="button"],[role="link"],[aria-label],[tabindex],[onclick],svg,img')).some(node=>!block.contains(node)&&!node.contains(block)))break;
   if (p.querySelectorAll('a,button,[role="button"],[role="link"],input,[tabindex],[onclick],[aria-label]').length > 1 || norm(p.textContent)!==norm(link.textContent)) break;
   block = p;
  }
  hide(block);
 }
 function homeView(){return window.__fproPageInfo ? window.__fproPageInfo().home : /^\/(?:home\.php|index\.php)?$/.test(location.pathname)&&!document.fullscreenElement;}
 function rgbColor(value){
  const text=(value||'').trim().toLowerCase();let m;
  if((m=text.match(/^#([0-9a-f]{3,8})$/))){let h=m[1];if(h.length===3||h.length===4)h=h.split('').map(c=>c+c).join('');if(h.length===6||h.length===8)return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(h.length===8?parseInt(h.slice(6),16)/255:1);}
  if((m=text.match(/^rgba?\(([^)]+)\)$/))){const n=m[1].split(/[, /]+/).filter(Boolean);if(n.length>=3)return n.slice(0,3).map(v=>v.endsWith('%')?parseFloat(v)*2.55:parseFloat(v)).concat(n[3]===undefined?1:n[3].endsWith('%')?parseFloat(n[3])/100:parseFloat(n[3]));}
  if((m=text.match(/^color\((?:srgb|display-p3)\s+([^)]*)\)$/))){const n=m[1].split(/[ /]+/).filter(Boolean);if(n.length>=3)return n.slice(0,3).map(v=>parseFloat(v)*255).concat(n[3]===undefined?1:parseFloat(n[3]));}
  return null;
 }
 const isBlue=value=>{const c=rgbColor(value);return c&&c[3]>.05&&c[2]>c[0]+30&&c[2]>c[1]+20;};
 function replaceBlue(value){
  let changed=false;const target=rgbColor(colors[cfg.color]);if(!target)return {changed:false,value};
  const result=(value||'').replace(/rgba?\([^)]+\)|color\([^)]+\)|#[0-9a-f]{3,8}\b/gi,part=>{if(!isBlue(part))return part;changed=true;const alpha=rgbColor(part)[3];return 'rgba('+target.slice(0,3).join(',')+','+alpha+')';});
  return {changed,value:result};
 }
 function tintVar(el,key,value,priority=''){
  let vars=tintVars.get(el);if(!vars){vars=new Map();tintVars.set(el,vars);}
  if(!vars.has(key))vars.set(key,{value:el.style.getPropertyValue(key),priority:el.style.getPropertyPriority(key)});
  else {const old=vars.get(key);if(old.applied!==undefined&&(el.style.getPropertyValue(key)!==old.applied||el.style.getPropertyPriority(key)!==old.appliedPriority)){old.value=el.style.getPropertyValue(key);old.priority=el.style.getPropertyPriority(key);}}
  if(el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!==priority)el.style.setProperty(key,value,priority);
  const entry=vars.get(key);entry.applied=el.style.getPropertyValue(key);entry.appliedPriority=el.style.getPropertyPriority(key);
  ownedStyles.set(el,el.getAttribute('style'));
 }
 function restoreTintVars(){
  tintVars.forEach((vars,el)=>{vars.forEach((old,key)=>{if(el.style.getPropertyValue(key)!==old.applied||el.style.getPropertyPriority(key)!==old.appliedPriority)return;if(old.value)el.style.setProperty(key,old.value,old.priority);else el.style.removeProperty(key);});ownedStyles.set(el,el.getAttribute('style'));});tintVars.clear();
 }
 function backgroundKind(value){
  if(!value||value==='none')return 'none';
  if(/data:image\/svg\+xml/i.test(value))return 'embedded-svg';
  if(/data:image\//i.test(value))return 'embedded-raster';
  if(/url\(/i.test(value))return 'remote-url';
  return /gradient/i.test(value)?'gradient':'other';
 }
 // Decode only embedded, vector-only SVG decorations. No fetch, canvas,
 // whole-photo filters, remote URL changes, scripts, text or embedded photos.
 function recolorSvgRing(background){
  if(backgroundKind(background)!=='embedded-svg')return null;
  const match=background.match(/^url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)$/i);if(!match)return null;
  const data=(match[1]||match[2]||match[3]||'').trim(),comma=data.indexOf(',');if(comma<0||data.length>24000)return null;
  let svg;try{const text=/;base64$/i.test(data.slice(0,comma))?atob(data.slice(comma+1)):decodeURIComponent(data.slice(comma+1));const doc=new DOMParser().parseFromString(text,'image/svg+xml');svg=doc.documentElement;if(svg.localName!=='svg'||doc.querySelector('parsererror'))return null;}catch(_){return null;}
  if(Array.from(svg.querySelectorAll('*')).some(el=>!['g','circle','ellipse','path'].includes(el.localName)))return null;
  for(const el of [svg,...svg.querySelectorAll('*')])for(const attr of el.attributes)if(/^on|href$/i.test(attr.localName)||/url\s*\(|javascript:/i.test(attr.value))return null;
  let changed=false;
  for(const shape of svg.querySelectorAll('circle,ellipse,path')){
   let stroke='';for(let el=shape;el&&!stroke;el=el.parentElement)stroke=(el.style&&el.style.stroke)||el.getAttribute('stroke')||'';
   if(!isBlue(stroke))continue;
   const replacement=replaceBlue(stroke);shape.setAttribute('stroke',replacement.value);shape.style.setProperty('stroke',replacement.value,'important');changed=true;
  }
  return changed?'url("data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(svg))+'")':null;
 }
 function privateGlyph(el){const text=(el.textContent||'').trim();const chars=Array.from(text);if(chars.length!==1)return false;const n=chars[0].codePointAt(0);return n>=0xe000&&n<=0xf8ff||n>=0xf0000&&n<=0xffffd||n>=0x100000&&n<=0x10fffd;}
 function pictureSource(el){
  if(el.matches('img,image'))return true;
  return /url\(/i.test(getComputedStyle(el).backgroundImage);
 }
 function avatarPictures(){
  return Array.from(document.querySelectorAll('img,svg image,[role="img"],[style*="background"],[data-mcomponent="Image"],[data-type="image"]')).filter(el=>{
   if(el.closest('.fpro-video-tools,#fpro-icon-filter')||/^(facebook|meta)$/i.test(el.getAttribute('alt')||'')||el.closest('a[aria-label="Facebook"],svg[aria-label="Facebook"]'))return false;
   const r=el.getBoundingClientRect();return r.width>=24&&r.width<=144&&r.height>=24&&r.height<=144&&Math.abs(r.width-r.height)<20&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth&&pictureSource(el);
  });
 }
 function avatarCanvasPairs(){
  const pairs=[],seen=new Set();
  for(const photo of avatarPictures().slice(0,12)){
   const p=photo.getBoundingClientRect();let root=photo.parentElement;
   for(let depth=0;root&&depth<4;depth++,root=root.parentElement){
    const r=root.getBoundingClientRect();if(root.matches('body,html,main,article,nav,header,[role="article"],[role="navigation"],[role="banner"]')||r.width>innerWidth*1.1||r.height>160)break;
    for(const canvas of root.querySelectorAll('canvas')){
     if(seen.has(canvas)||canvas.closest('.fpro-video-tools'))continue;const c=canvas.getBoundingClientRect();
     const compact=c.width<=160&&c.height<=160&&c.width>=p.width&&c.width<=p.width+24&&c.height>=p.height&&c.height<=p.height+24&&Math.abs(c.left+c.width/2-p.left-p.width/2)<=4&&Math.abs(c.top+c.height/2-p.top-p.height/2)<=4;
     const row=c.width<=innerWidth*1.1&&c.height<=160&&c.left<=p.left&&c.top<=p.top&&c.right>=p.right&&c.bottom>=p.bottom;
     if(compact||row){seen.add(canvas);pairs.push({canvas,photo});}
    }
   }
  }
  return pairs.slice(0,8);
 }
 function canvasRingEvidence(canvas,photo){
  const result={readable:false,blueRing:false,transparentCenter:false};
  const w=canvas.width,h=canvas.height,r=canvas.getBoundingClientRect(),p=photo&&photo.getBoundingClientRect();if(!p||w<24||h<24||w>1024||h>512||r.width<=0||r.height<=0)return result;
  const sx=w/r.width,sy=h/r.height;if(Math.abs(sx-sy)>Math.min(sx,sy)*.15)return result;
  const size=Math.min(r.height,p.width+24)*sx,cx=(p.left+p.width/2-r.left)*sx,cy=(p.top+p.height/2-r.top)*sy;
  // Copy into an unattached sampler. Do not acquire/change the source canvas
  // rendering context, alter its pixels, or bypass cross-origin restrictions.
  let data;try{const sample=document.createElement('canvas');sample.width=w;sample.height=h;const context=sample.getContext('2d',{willReadFrequently:true});if(!context)return result;context.drawImage(canvas,0,0);data=context.getImageData(0,0,w,h).data;result.readable=true;}catch(_){return result;}
  let visible=0,blue=0,interior=0,offRing=0;const bins=new Set();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;if(data[i+3]<16)continue;visible++;
   const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy)/size;if(r<.33)interior++;if(r<.33||r>.56)offRing++;
   if(data[i+2]>data[i]+30&&data[i+2]>data[i+1]+20){blue++;bins.add(Math.min(23,Math.floor((Math.atan2(dy,dx)+Math.PI)/(2*Math.PI)*24)));}
  }
  result.transparentCenter=interior===0;
  result.blueRing=visible>=size*size*.01&&visible<=size*size*.4&&interior===0&&offRing<=visible*.02&&blue>=visible*.9&&bins.size>=20;
  return result;
 }
 function verifiedLabel(el){
  const label=norm([el.getAttribute('aria-label'),el.getAttribute('alt'),el.getAttribute('title'),el.getAttribute('data-tooltip-content'),el.getAttribute('data-testid'),el.tagName.toLowerCase()==='title'?el.textContent:''].filter(Boolean).join(' '));
  return /\bverified\b|\bverification badge\b|موثق|تم التحقق|علامة التوثيق/.test(label);
 }
 function setIconPalette(){
  // A blue-to-theme matrix that leaves white check marks white and preserves
  // source alpha. Unlike a CSS mask, this does not erase the check from a PNG.
  const color=colors[cfg.color], rgb=[0,2,4].map(i=>parseInt(color.slice(1+i,3+i),16)/255), base=24/255;
  const check=cfg.color==='أبيض'?0:1;
  const values=rgb.flatMap(c=>{const a=(check-c)/(1-base);return [a,0,0,0,c-a*base];}).concat([0,0,0,1,0]).join(' ');
  const flood=iconDefs.querySelector('feFlood');if(flood.getAttribute('flood-color')!==color)flood.setAttribute('flood-color',color);
  const matrix=iconDefs.querySelector('feColorMatrix');if(matrix.getAttribute('values')!==values)matrix.setAttribute('values',values);
  if(!iconDefs.isConnected)document.body.appendChild(iconDefs);
 }
 function tint() {
  if (document.hidden || cfg.color==='طبيعي' || !colors[cfg.color]) return;
  // Read original site styles on every pass, so a ring that turns grey/read
  // does not stay force-colored. No CSS/body reset and no photo filtering.
  painted.forEach(el=>accentAttrs.forEach(k=>el.removeAttribute('data-fpro-accent-'+k)));restoreTintVars();
  const next=new Set();
  const blue=isBlue;
  function mark(el,attr){if(!el.hasAttribute('data-fpro-accent-'+attr))el.setAttribute('data-fpro-accent-'+attr,'');next.add(el);}
  const actions=new Set(['follow','follow back','following','add friend','confirm','request sent','متابعة','متابعه','رد المتابعة','إضافة صديق','اضافة صديق','إضافة إلى الأصدقاء','تأكيد','تاكيد','تم إرسال الطلب'].map(norm));
  for(const el of document.querySelectorAll('a[href],button,[role="button"],[role="link"],span')){
   if(el.closest('.fpro-video-tools'))continue;
   const text=norm(el.getAttribute('aria-label')||el.textContent),href=el.getAttribute('href')||'';
   if(/(?:\/hashtag\/|[?&]hashtag=)/i.test(href)||/^#[^\s#]+$/.test(text)){mark(el,'fg');continue;}
   if(!el.matches('a[href],button,[role="button"],[role="link"]')||!actions.has(text)||el.querySelector('video,img'))continue;
   const c=getComputedStyle(el);if(blue(c.backgroundColor))mark(el,'bg');else mark(el,'fg');
   for(const child of el.querySelectorAll('span,div,svg,path')){if(!child.querySelector('img,video')&&blue(getComputedStyle(child).backgroundColor))mark(child,'bg');if(blue(getComputedStyle(child).color))mark(child,'fg');if(child.matches('path')&&blue(getComputedStyle(child).fill))mark(child,'fill');}
  }
  // Facebook mobile uses SVGs, raster icons and background sprites, with
  // localized labels on the icon itself OR a small surrounding wrapper.
  const candidates=document.querySelectorAll('[aria-label],[alt],[title],[data-tooltip-content],[data-testid*="verified" i],svg title');
  let filtered=false;
  function icon(el){
   if(!el||el.closest('.fpro-video-tools,#fpro-icon-filter')||el.querySelector('video'))return;
   const r=el.getBoundingClientRect();if(r.width>48||r.height>48||el.matches('a,button,input'))return;
   if(el.matches('img')&&(r.width>32||r.height>32||el.getAttribute('alt')&&!verifiedLabel(el)))return;
   if(el.matches('img,i')||!el.children.length&&!el.textContent.trim()&&(el.matches('span,[role="img"]')||getComputedStyle(el).backgroundImage!=='none')){mark(el,'icon');filtered=true;return;}
   const svg=el.closest('svg')||el.querySelector('svg');
   if(svg){mark(svg,'fg');for(const path of svg.querySelectorAll('path,circle,polygon'))if(blue(getComputedStyle(path).fill)||path.hasAttribute('data-fpro-accent-fill'))mark(path,'fill');}
  }
  for(const el of candidates){
   if(!verifiedLabel(el))continue;
   if(el.matches('img,i,svg,title'))icon(el.tagName.toLowerCase()==='title'?el.closest('svg'):el);
   else {const children=Array.from(el.querySelectorAll('svg,img,i')),owned=children.filter(verifiedLabel);if(owned.length)owned.forEach(icon);else if(children.length===1&&!el.matches('article,header,a,button,[role="article"],[role="banner"]'))icon(children[0]);else if(!children.length)icon(el);}
  }
  // Unlabelled SVG badge next to an author, not global blue navigation icons.
  for(const svg of document.querySelectorAll('article header svg,[role="article"] header svg,article h3 svg,[role="article"] h3 svg')){
   const r=svg.getBoundingClientRect();if(r.width>0&&r.width<=32&&r.height<=32&&!svg.closest('button,[role="button"]')&&Array.from(svg.querySelectorAll('path')).some(path=>blue(getComputedStyle(path).fill)||path.hasAttribute('data-fpro-accent-fill')))icon(svg);
  }
  const ringNodes=new Set();
  function ring(el,avatar=false){
   if(ringNodes.has(el)||el.closest('.fpro-video-tools,#fpro-icon-filter')||el.matches('video,canvas'))return;
   const r=el.getBoundingClientRect();
   if(avatar&&(r.width<24||r.width>160||r.height<24||r.height>160||Math.abs(r.width-r.height)>24))return;
   const c=getComputedStyle(el),pseudoStyles={before:getComputedStyle(el,'::before'),after:getComputedStyle(el,'::after')},photo=pictureSource(el);
   const svgEligible=cfg.experimentalColorVars&&r.width>=24&&r.width<=160&&r.height>=24&&r.height<=160&&Math.abs(r.width-r.height)<=24&&!el.matches('img,image');
   const embedded=svgEligible?{own:el.querySelector('img,image,[role="img"]')?recolorSvgRing(c.backgroundImage):null,before:recolorSvgRing(pseudoStyles.before.backgroundImage),after:recolorSvgRing(pseudoStyles.after.backgroundImage)}:{};
   const rounded=[c,pseudoStyles.before,pseudoStyles.after].some(p=>p&&(parseFloat(p.borderRadius)>=r.width*.3||/circle|radial-gradient/.test(p.clipPath||p.maskImage||'')));
   if(avatar&&!rounded&&!Object.values(embedded).some(Boolean)&&!el.closest('svg')&&!el.querySelector('circle,ellipse'))return;
   ringNodes.add(el);
   if(embedded.own){tintVar(el,'--fpro-ring-svg',embedded.own);mark(el,'svg-bg');if(el.style.getPropertyPriority('background-image')==='important')tintVar(el,'background-image',embedded.own,'important');}
   for(const p of ['before','after'])if(embedded[p]){tintVar(el,'--fpro-'+p+'-svg',embedded[p]);mark(el,p+'-svg-bg');}
   // Border, outline and shadow are decorations even when on the image node.
   if(['Top','Right','Bottom','Left'].some(side=>parseFloat(c['border'+side+'Width'])>0&&blue(c['border'+side+'Color'])))mark(el,'border');
   if(parseFloat(c.outlineWidth)>0&&blue(c.outlineColor))mark(el,'outline');
   const shadow=replaceBlue(c.boxShadow);if(shadow.changed){tintVar(el,'--fpro-ring-shadow',shadow.value);mark(el,'shadow');}
   if(el.matches('svg,circle,ellipse,path')){
    if(blue(c.stroke))mark(el,'stroke');if(el.matches('circle,ellipse,path')&&blue(c.fill))mark(el,'fill');
    const ref=(c.stroke||'').match(/url\(["']?(?:[^#]*#)([^"')]+)["']?\)/);
    if(ref){const gradient=document.getElementById(ref[1]);if(gradient&&gradient.matches('linearGradient,radialGradient'))for(const stop of gradient.querySelectorAll('stop'))if(blue(getComputedStyle(stop).stopColor||stop.getAttribute('stop-color')))mark(stop,'stop');}
   }
   if(!photo){
    const gradient=replaceBlue(c.backgroundImage);if(gradient.changed&&/gradient/.test(c.backgroundImage)){tintVar(el,'--fpro-ring-gradient',gradient.value);mark(el,'gradient');}
    if(blue(c.backgroundColor)&&(avatar||el.querySelector('img,image,[role="img"]')))mark(el,'ring');
   }
   for(const pseudo of ['before','after']){
    const p=pseudoStyles[pseudo];if(!p||p.content==='none'||p.display==='none')continue;
    if(['Top','Right','Bottom','Left'].some(side=>parseFloat(p['border'+side+'Width'])>0&&blue(p['border'+side+'Color'])))mark(el,pseudo+'-border');
    if(parseFloat(p.outlineWidth)>0&&blue(p.outlineColor))mark(el,pseudo+'-outline');
    const shadow=replaceBlue(p.boxShadow);if(shadow.changed){tintVar(el,'--fpro-'+pseudo+'-shadow',shadow.value);mark(el,pseudo+'-shadow');}
    const gradient=replaceBlue(p.backgroundImage);if(gradient.changed&&/gradient/.test(p.backgroundImage)){tintVar(el,'--fpro-'+pseudo+'-gradient',gradient.value);mark(el,pseudo+'-gradient');}
    // Only decorative pseudo layers without a photo URL; preserve masks/content.
    if(!/url\(/i.test(p.backgroundImage)&&blue(p.backgroundColor))mark(el,pseudo+'-bg');
   }
  }
  for(const el of document.querySelectorAll('a[href*="/stories/"],a[href*="/stories/"] *,[data-sigil~="m-story-tray"] *,[data-pagelet*="Stories"] *'))ring(el);
  // Photo-based avatars can be IMG, SVG image or CSS background-image. Their
  // ring may be a sibling SVG or a pseudo layer on a square, non-rounded link.
  for(const photo of avatarPictures()){
   let root=photo;
   for(let depth=0;root&&depth<5;depth++,root=root.parentElement){
    if(root.matches('article,[role="article"],header,[role="banner"],body,main,nav,[role="navigation"]'))break;
    const r=root.getBoundingClientRect();if(r.width>160||r.height>160||Math.abs(r.width-r.height)>24)break;
    ring(root,true);
    for(const child of root.querySelectorAll('svg,circle,ellipse,path,span,div'))ring(child,true);
   }
  }
  // RC-inspired second pass: resolve CSS declarations through the browser,
  // rather than rewriting stylesheet text with regex. This sees class rules,
  // inline styles and recycled nodes without destroying shorthand geometry.
  if(cfg.experimentalColorVars){
   let examined=0;
   for(const el of document.querySelectorAll('a,[role="link"],span,div,i')){
    if(el.closest('.fpro-video-tools,#fpro-icon-filter,header,[role="banner"],nav,[role="navigation"]'))continue;
    const r=el.getBoundingClientRect();if(r.width<8||r.height<8||r.width>160||r.height>160||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)continue;
    if(++examined>400)break;
    const c=getComputedStyle(el),round=Math.abs(r.width-r.height)<=8&&(parseFloat(c.borderRadius)>=Math.min(r.width,r.height)*.3||/circle/.test(c.clipPath||''));
    // A visible, rounded blue border is sufficient evidence of an accent
    // decoration; an IMG descendant is not required (mobile sibling rings).
    if(round)ring(el);
    const link=el.closest('a[href],[role="link"]');
    if(link&&r.height<=48&&!el.querySelector('img,image,video,canvas')&&!pictureSource(el)&&blue(c.color))mark(el,'fg');
   }
  }
  // Mobile author badges may be font glyphs, not IMG/SVG nodes. Only a
  // private-use blue glyph next to author-like text, never arbitrary text.
  if(cfg.experimentalColorVars)for(const el of document.querySelectorAll('span')){
   const r=el.getBoundingClientRect();if(r.width<8||r.width>24||r.height<8||r.height>24||r.bottom<=0||r.top>=innerHeight||!privateGlyph(el)||el.closest('header,nav,[role="banner"],[role="navigation"],[role="tab"],button,[role="button"],.fpro-video-tools'))continue;
   const parent=el.parentElement;if(parent&&/[A-Za-z\u0600-\u06ff]/.test(parent.textContent||'')&&(verifiedLabel(el)||verifiedLabel(parent)||parent.matches('a,span,[role="link"]'))&&blue(getComputedStyle(el).color))mark(el,'fg');
  }
  // An inline !important declaration outranks our stylesheet. Override only
  // already-approved accent properties and restore source values each pass.
  const foreground=cfg.dark?colors[cfg.color]:({'ذهبي':'#8a6500','فضي':'#56616b','أبيض':'#333','برتقالي':'#a64600'}[cfg.color]||colors[cfg.color]);
  const properties={fg:['color',foreground],border:['border-color',foreground],outline:['outline-color',colors[cfg.color]],fill:['fill',foreground],stroke:['stroke',foreground]};
  for(const el of next)for(const [attr,[key,value]] of Object.entries(properties)){
   if(!el.hasAttribute('data-fpro-accent-'+attr))continue;
   if(el.style.getPropertyPriority(key)==='important')tintVar(el,key,value,'important');
   if(attr==='border')for(const side of ['top','right','bottom','left']){const prop='border-'+side+'-color';if(el.style.getPropertyPriority(prop)==='important'&&blue(el.style.getPropertyValue(prop)))tintVar(el,prop,value,'important');}
  }
  // A separate canvas with an empty center can draw a story ring while all
  // computed border/background/SVG fields are empty. Never filter a canvas
  // that contains portrait/media pixels or cannot be read safely.
  if(cfg.experimentalColorVars)for(const {canvas,photo} of avatarCanvasPairs()){
   const filter=getComputedStyle(canvas).filter;if(filter&&filter!=='none')continue;
   if(canvasRingEvidence(canvas,photo).blueRing){mark(canvas,'canvas-ring');tintVar(canvas,'filter','url("#fpro-canvas-palette")','important');filtered=true;}
  }
  if(filtered)setIconPalette();else iconDefs.remove();
  painted.forEach(el=>{if(!next.has(el))for(const attr of accentAttrs)el.removeAttribute('data-fpro-accent-'+attr);});
  painted.clear();next.forEach(el=>painted.add(el));
 }
 function hideStoryBlock(el){
  let block=el;
  const boundary='article,[role="article"],[role="main"],[role="feed"],main,body,html,header,nav,form,[role="banner"],[role="navigation"],[data-pagelet^="Feed"],#m_news_feed_stream';
  function decoration(node){
   if(node.matches('style,script,hr,[role="separator"],#fpro-icon-filter'))return true;
   if((node.textContent||'').trim()||node.matches('img,video,canvas,iframe,svg,[role="img"]')||node.querySelector('img,video,canvas,iframe,svg,input,a,button,[role="button"],[role="img"]'))return false;
   return getComputedStyle(node).backgroundImage==='none'||getComputedStyle(node).backgroundImage==='';
  }
  for(let d=0;block.parentElement&&d<8;d++){
   const parent=block.parentElement;
   if(parent.matches(boundary)||parent.querySelector('article,[role="article"],[data-pagelet^="FeedUnit"],input,textarea,video'))break;
   if(Array.from(parent.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))break;
   if(Array.from(parent.children).some(child=>child!==block&&!decoration(child)))break;
   block=parent;
  }
  hide(block);
 }
 function hideHomeStories(){
  const safe=el=>el&&!/^(BODY|HTML|MAIN|FORM|NAV|HEADER|FOOTER)$/.test(el.tagName)&&!['main','feed','navigation','banner'].includes(el.getAttribute('role'))&&!el.querySelector('article,[role="article"],[data-pagelet^="FeedUnit"],input,textarea');
  const explicit=document.querySelectorAll('[data-pagelet*="Stories"],[data-sigil~="m-story-tray"],[data-type*="story-tray" i],[aria-label="Stories"],[aria-label="القصص"]');
  explicit.forEach(el=>{if(safe(el)&&!el.closest('article,[role="article"]'))hideStoryBlock(el);});
  const seeds=Array.from(document.querySelectorAll('a[href*="/stories/"],a[href*="story.php?"],button,[role="button"],span,div[dir="auto"]')).filter(el=>/\/stories\/|story\.php\?/.test(el.getAttribute('href')||'')||['create story','create a story','add to story','إنشاء قصة','انشاء قصة','إنشاء قصه','إضافة إلى قصتك','اضافة الى قصتك'].includes(norm(el.getAttribute('aria-label')||el.textContent)));
  for(const seed of seeds){
   if(seed.closest('article,[role="article"],[data-pagelet^="FeedUnit"]'))continue;
   let best=seed,row=seed.parentElement;
   for(let depth=0;row&&depth<7;depth++,row=row.parentElement){
    if(!safe(row)||row.querySelector('video'))break;
    const r=row.getBoundingClientRect();if(r.height>440)break;
    const anchors=Array.from(row.querySelectorAll('a[href]'));
    const allStories=anchors.length>=2&&anchors.every(a=>/\/stories\/|story\.php\?|create.*story/.test(a.getAttribute('href')||''));
    const media=row.querySelectorAll('img,[style*="background-image"]').length;
    const c=getComputedStyle(row),horizontal=/auto|scroll/.test(c.overflowX)||row.scrollWidth>row.clientWidth+12||c.flexDirection==='row';
    if(allStories||(horizontal&&(media>=2||row.querySelectorAll('[role="button"]').length>=2)))best=row;
   }
   hideStoryBlock(best);
  }
 }
 function scan() {
  if(cfg.enhance===false)return;
  hidingPass=new Set();
  const filtering=cfg.appBanner||Object.keys(words).some(key=>cfg[key]);
  const labels = filtering?document.querySelectorAll('a,span,abbr,strong,b,button,[role="button"],div[dir="auto"],[role="heading"],[aria-label]'):[];
  for (let i=0;i<Math.min(labels.length,2400);i++) {
   const label=labels[i]; if(label.closest('.fpro-video-tools')) continue;
   const text=norm(label.getAttribute('aria-label') || label.textContent);
   const appText=text.replace(/^(facebook|فيسبوك|f)\s*/,'').replace(/\s*(facebook|فيسبوك|f)$/,'');
   if(cfg.appBanner && (isAppPrompt(text)||isAppPrompt(appText))) appBanner(label,true);
   if(!text || text.length>100) continue;
   for(const key of Object.keys(words)) if((cfg[key]) && words[key].some(w=>text===norm(w))) hide(section(label,key));
  }
  if(cfg.ads) document.querySelectorAll('a[href*="/ads/about/"],[data-ad-rendering-role="sponsored_label"],[data-sponsored="true"]').forEach(el=>hide(postFor(el)));
  if(cfg.stories) document.querySelectorAll('[data-pagelet*="Stories"],[data-sigil~="m-story-tray"],[aria-label="Stories"],[aria-label="القصص"]').forEach(el=>hide(section(el,'stories') || el));
  if(cfg.appBanner) document.querySelectorAll('a[href]').forEach(link=>appBanner(link));
  if(cfg.stories) document.querySelectorAll('a[href*="/stories/"]').forEach(link=>hide(section(link,'stories') || link));
  if((cfg.homeStories||cfg.stories)&&homeView())hideHomeStories();
  hidden.forEach((old,el)=>{if(!hidingPass.has(el)){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');el.removeAttribute('data-fpro-hidden');hidden.delete(el);}});
  hidingPass=null;
  tint();
  if(cfg.referenceEngine&&window.FproColor&&window.FproNoapp){
   window.FproColor.set({recolor:!!colors[cfg.color]&&!['طبيعي','تلقائي'].includes(cfg.color),uiAccent:colors[cfg.color]||'#D4AF37'});window.FproColor.pass();
   window.FproNoapp.set({noOpenApp:!!cfg.appBanner});window.FproNoapp.hunt();
  }
  videos.forEach((entry,video)=>{if(!video.isConnected || (!cfg.downloads && !cfg.rainbow)) {entry.dispose(); videos.delete(video);}});
  if(cfg.downloads || cfg.rainbow) document.querySelectorAll('video').forEach(attachVideo);
  layoutVideos();
  syncStoryImages();
 }
 function signature(video){return [video.src,video.currentSrc].join('|');}
 function videoIdentity(video){
  let owner=video;
  for(let d=0;owner&&d<4;d++,owner=owner.parentElement){for(const attr of ['data-video-id','data-videoid']){const value=owner.getAttribute(attr);if(value&&/^\d+$/.test(value))return value;}}
  return '';
 }
 function metadata(video){
  const store=video.closest('[data-store]');if(!store)return [];
  try{const raw=store.getAttribute('data-store');if(!raw||raw.length>100000)return [];const data=JSON.parse(raw),items=data.videoData||[data];const list=Array.isArray(items)?items:[items];const id=videoIdentity(video);
   // A multi-video store is not evidence that its first item is the current clip.
   return list.filter(item=>item&&(id?String(item.videoID||item.video_id||item.id||'')===id:list.length===1&&store.querySelectorAll('video').length===1));
  }catch(_){return [];}
 }
 function staleIdentity(video){const old=identityBaseline.get(video);return old&&old.source.replace(/\|/g,'')&&old.source!==signature(video);}
 function mediaSource(video) {
  const candidates=[video.readyState>=2?video.currentSrc:video.src,video.src,video.currentSrc,...Array.from(video.querySelectorAll('source[src]'),el=>el.src)];
  const store=video.closest('[data-store]');const old=identityBaseline.get(video);
  if(!staleIdentity(video)||!old||old.store!==(store?store.getAttribute('data-store'):null)){
   for(const item of metadata(video))for(const key of ['hd_src','sd_src','playable_url_quality_hd','playable_url','video_url'])candidates.push(item[key]);
  }
  return candidates.find(url=>typeof url==='string' && /^https:\/\//i.test(url)) || '';
 }
 function storyRoute(){return /^\/stories(?:\/|$)/.test(location.pathname)||/^\/story\.php$/.test(location.pathname);}
 function storyPermalink(el){
  if(!storyRoute())return '';
  const owner=el.closest('[data-story-id]');
  if(owner&&/^\d+$/.test(owner.getAttribute('data-story-id')||''))return 'https://www.facebook.com/stories/'+(location.pathname.split('/')[2]||'0')+'/'+owner.getAttribute('data-story-id')+'/';
  const u=new URL(location.href);
  if(/^\/stories\/[^/]+\/[^/]+/.test(u.pathname)||u.pathname==='/story.php'&&u.searchParams.has('story_fbid'))return u.href;
  return '';
 }
 function rawPermalink(video){
  if(storyRoute()){const link=storyPermalink(video);if(link)return link;}
  let id=videoIdentity(video);if(!id){const item=metadata(video)[0];if(item)id=String(item.videoID||item.video_id||item.id||'');}
  if(/^\d+$/.test(id))return 'https://www.facebook.com/watch/?v='+id;
  let scope=video.parentElement;
  for(let d=0;scope&&d<4;d++,scope=scope.parentElement){
   if(/^(BODY|HTML|MAIN)$/.test(scope.tagName)||['feed','main'].includes(scope.getAttribute('role')))break;
   if(scope.querySelectorAll('video').length!==1)break;
   const link=Array.from(scope.querySelectorAll('a[href]')).find(a=>{try{const u=new URL(a.href);return (u.hostname==='facebook.com'||u.hostname.endsWith('.facebook.com'))&&/\/reel\/|\/videos\/|\/watch\/?\?|\/video\.php\?|story_fbid=/.test(u.pathname+u.search);}catch(_){return false;}});
   if(link)return link.href;
  }
  return '';
 }
 function videoPermalink(video){
  const link=rawPermalink(video),old=identityBaseline.get(video);
  return staleIdentity(video)&&old&&link===old.link?'':link; // Never reuse the entry clip of a recycled player.
 }
 function attachVideo(video) {
  if(videos.has(video)) return;
  const store=video.closest('[data-store]');identityBaseline.set(video,{source:signature(video),link:rawPermalink(video),store:store?store.getAttribute('data-store'):null});
  const overlay=document.createElement('div'); overlay.className='fpro-video-tools';
  const button=document.createElement('button'); button.className='fpro-download';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" focusable="false"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';button.setAttribute('aria-label','تنزيل الفيديو');
  const track=document.createElement('div');track.className='fpro-track';
  const fill=document.createElement('div');fill.className='fpro-fill';
  const ball=document.createElement('span');ball.className='fpro-ball';ball.textContent='⚽';fill.appendChild(ball);track.appendChild(fill);
  const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.className='fpro-seek';seek.setAttribute('aria-label','تقدم الفيديو');track.appendChild(seek);
  overlay.appendChild(button);overlay.appendChild(track);document.body.appendChild(overlay);
  let pos={x:12,y:12};try{pos=JSON.parse(localStorage.getItem('fpro-button')) || pos;}catch(_){}
  let start=null,moving=false,held=false,timer=null;
  function placeButton(){const top=parseFloat(overlay.style.top)||0;const minY=Math.max(0,-top+4);const maxY=Math.min(overlay.clientHeight-44,innerHeight-top-44);button.style.left=Math.max(0,Math.min(Math.max(0,overlay.clientWidth-44),pos.x))+'px';button.style.top=Math.max(0,Math.min(Math.max(0,maxY),Math.max(minY,pos.y)))+'px';}
  button.onpointerdown=e=>{start={x:e.clientX,y:e.clientY,left:button.offsetLeft,top:button.offsetTop};moving=false;held=false;timer=setTimeout(()=>{held=true;try{button.setPointerCapture(e.pointerId);}catch(_){}},400);e.stopPropagation();};
  button.onpointermove=e=>{if(!held || !start)return;moving=true;pos={x:start.left+e.clientX-start.x,y:start.top+e.clientY-start.y};placeButton();};
  button.onpointerup=()=>{clearTimeout(timer);if(moving)try{localStorage.setItem('fpro-button',JSON.stringify(pos));}catch(_){}start=null;};
  button.onpointercancel=()=>{clearTimeout(timer);start=null;};
  button.onclick=e=>{e.preventDefault();e.stopPropagation();if(moving)return;
   if(video.readyState===0&&video.networkState===2){location.href='fpro://download?media=&link=';return;}
   location.href='fpro://download?media='+encodeURIComponent(mediaSource(video))+'&link='+encodeURIComponent(videoPermalink(video));
  };
  function progress(){const valid=Number.isFinite(video.duration)&&video.duration>0;const fraction=valid?Math.max(0,Math.min(1,video.currentTime/video.duration)):0;fill.style.width=(fraction*100)+'%';seek.value=String(Math.round(fraction*1000));seek.disabled=!valid;seek.setAttribute('aria-valuetext',valid?Math.floor(video.currentTime)+' / '+Math.floor(video.duration)+' ثانية':'بث مباشر أو مدة غير متاحة');}
  seek.oninput=e=>{e.stopPropagation();if(Number.isFinite(video.duration)&&video.duration>0){try{video.currentTime=Number(seek.value)/1000*video.duration;}catch(_){}progress();}};
  seek.onclick=e=>e.stopPropagation();
  const events=['timeupdate','durationchange','loadedmetadata','seeking','ended','emptied'];events.forEach(name=>video.addEventListener(name,progress));
  video.addEventListener('play',scheduleLayout);video.addEventListener('pause',scheduleLayout);
  if(resize)resize.observe(video);
  videos.set(video,{layout(allowed=true){if(!allowed){overlay.hidden=true;return;}const r=video.getBoundingClientRect();const dialog=Array.from(document.querySelectorAll('[role="dialog"]')).find(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';});overlay.hidden=!allowed||!(r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth) || !!(dialog&&!dialog.contains(video));overlay.style.left=r.left+'px';overlay.style.top=r.top+'px';overlay.style.width=r.width+'px';const reel=/^\/reels?(?:\/|$)/.test(location.pathname) && r.height>innerHeight*0.6;const viewportBottom=window.visualViewport?Math.min(innerHeight,window.visualViewport.offsetTop+window.visualViewport.height):innerHeight;overlay.style.height=(reel?Math.max(0,viewportBottom-r.top):r.height)+'px';button.hidden=!cfg.downloads;track.hidden=!cfg.rainbow;placeButton();progress();},dispose(){video.removeEventListener('play',scheduleLayout);video.removeEventListener('pause',scheduleLayout);if(resize)resize.unobserve(video);clearTimeout(timer);events.forEach(name=>video.removeEventListener(name,progress));overlay.remove();}});
 }
 // A document-level capture listener also sees touches on Facebook's player
 // cover layers. It is independent of download/progress overlay attachment.
 let touch=null,lastTap=null,lastFullscreen= -Infinity;
 function gestureVideo(e) {
  if(cfg.doubleTapFullscreen===false || e.isPrimary===false || (window.getSelection()&&window.getSelection().isCollapsed===false))return null;
  const target=e.target.nodeType===1?e.target:e.target.parentElement;
  if(!target || target.closest('.fpro-video-tools,input,textarea,select,[contenteditable="true"]'))return null;
  const candidates=Array.from(document.querySelectorAll('video')).filter(v=>{
   const r=v.getBoundingClientRect(), c=getComputedStyle(v);
   return r.width>0&&r.height>0&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom&&c.display!=='none'&&c.visibility!=='hidden';
  });
  const video=candidates.find(v=>v===target || v.contains(target)) || candidates.find(v=>(target.closest('[role="article"],article')&&target.closest('[role="article"],article').contains(v))) || candidates[0];
  if(!video)return null;
  const dialog=target.closest('[role="dialog"]');if(dialog&&!dialog.contains(video))return null;
  const control=target.closest('a,button,[role="button"]');
  if(control){const r=control.getBoundingClientRect(),v=video.getBoundingClientRect();const label=norm(control.getAttribute('aria-label') || control.textContent);
   if(r.width*r.height<v.width*v.height*.2 && label && !/play|pause|تشغيل|إيقاف/.test(label))return null;
  }
  return video;
 }
 function enterFullscreen(video) {
  // Entry-only, including WebView's native custom-video fullscreen path.
  if(document.fullscreenElement||document.webkitFullscreenElement||window.__fproNativeFullscreen||video.webkitDisplayingFullscreen)return;
  const now=performance.now();if(now-lastFullscreen<450)return;lastFullscreen=now;
  function failed(){location.href='fpro://fullscreen-error';}
  try {
   const enter=video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
   if(!enter){failed();return;}
   const result=enter.call(video);
   if(result&&typeof result.catch==='function')result.catch(failed);
  }catch(_){failed();}
 }
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse' && e.button!==0)return;
  const video=gestureVideo(e);touch=video?{video,id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),moved:false}:null;
 },true);
 document.addEventListener('pointermove',e=>{if(touch&&touch.id===e.pointerId && Math.hypot(e.clientX-touch.x,e.clientY-touch.y)>14){touch.moved=true;lastTap=null;}},true);
 document.addEventListener('pointercancel',()=>{touch=null;lastTap=null;},true);
 document.addEventListener('pointerup',e=>{
  const current=touch;touch=null;
  if(!current || current.id!==e.pointerId || current.moved || performance.now()-current.time>450 || Math.hypot(e.clientX-current.x,e.clientY-current.y)>14){lastTap=null;return;}
  const video=gestureVideo(e),now=performance.now();
  if(video!==current.video){lastTap=null;return;}
  if(lastTap && lastTap.video===video && now-lastTap.time<=320 && Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<=36){
   lastTap=null;e.preventDefault();e.stopImmediatePropagation();enterFullscreen(video);
  }else lastTap={video,time:now,x:e.clientX,y:e.clientY};
 },true);
 document.addEventListener('dblclick',e=>{const video=gestureVideo(e);if(video){e.preventDefault();e.stopImmediatePropagation();enterFullscreen(video);}},true);
 function rendered(video){for(let el=video;el;el=el.parentElement){const c=getComputedStyle(el);if(c.display==='none'||c.visibility==='hidden'||c.visibility==='collapse'||c.opacity==='0')return false;}return true;}
 function layoutVideos(){
  const candidates=Array.from(videos.keys()).map((video,index)=>{const r=video.getBoundingClientRect();const w=Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left)),h=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top));
   if(w*h<=0)return {video,r,index,visible:false,score:0};
   const stack=document.elementsFromPoint?document.elementsFromPoint(Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.top+r.height/2))):[];
   const hit=stack.indexOf(video);return {video,r,index,visible:w*h>0&&rendered(video),score:(hit>=0?100000-hit*100:0)+(!video.paused?1000:0)+w*h/10000+index/1000};
  }).filter(c=>c.visible).sort((a,b)=>b.score-a.score);
  const chosen=[];
  for(const c of candidates){const overlaps=chosen.some(b=>{const area=Math.max(0,Math.min(c.r.right,b.r.right)-Math.max(c.r.left,b.r.left))*Math.max(0,Math.min(c.r.bottom,b.r.bottom)-Math.max(c.r.top,b.r.top));return area>Math.min(c.r.width*c.r.height,b.r.width*b.r.height)*.55;});if(!overlaps)chosen.push(c);}
  videos.forEach((entry,video)=>entry.layout(chosen.some(c=>c.video===video)));
 }
 function storyImageSource(el){if(el.tagName==='IMG')return el.currentSrc||el.src||'';const m=getComputedStyle(el).backgroundImage.match(/url\(["']?(https:[^"')]+)["']?\)/);return m?m[1]:'';}
 const storyImages=new Map();
 function syncStoryImages(){
  const eligible=[];
  if(cfg.downloads&&storyRoute()){
   const videoPlaying=Array.from(document.querySelectorAll('video')).some(v=>{const r=v.getBoundingClientRect();return rendered(v)&&r.width>=120&&r.height>=180&&r.top<innerHeight&&r.bottom>0;});
   if(!videoPlaying)for(const img of document.querySelectorAll('img,[style*="background-image"]')){const r=img.getBoundingClientRect();if(storyImageSource(img)&&!img.closest('header,[role="banner"]')&&rendered(img)&&r.width>=120&&r.height>=180&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0)eligible.push({img,r});}
  }
  eligible.sort((a,b)=>b.r.width*b.r.height-a.r.width*a.r.height);
  const current=eligible[0]&&eligible[0].img;
  storyImages.forEach((tools,img)=>{if(img!==current){tools.remove();storyImages.delete(img);}});
  if(!current)return;
  let tools=storyImages.get(current);
  if(!tools){tools=document.createElement('div');tools.className='fpro-video-tools fpro-story-tools';const button=document.createElement('button');button.className='fpro-download';button.type='button';button.textContent='↓';button.setAttribute('aria-label','تنزيل صورة القصة');button.style.left='12px';button.style.top='12px';button.onclick=e=>{e.preventDefault();e.stopPropagation();const media=storyImageSource(current);location.href='fpro://download?media='+encodeURIComponent(/^https:\/\//i.test(media)?media:'')+'&link='+encodeURIComponent(storyPermalink(current));};tools.appendChild(button);document.body.appendChild(tools);storyImages.set(current,tools);}
  const r=current.getBoundingClientRect();tools.style.left=Math.max(0,r.left)+'px';tools.style.top=Math.max(0,r.top)+'px';tools.style.width=r.width+'px';tools.style.height=Math.min(r.height,innerHeight)+'px';
 }
 let frame=null;
 function scheduleLayout(){
  // Keep controls attached during a fling, but defer expensive whole-page work
  // until scrolling settles. Fast hashtag mutation handling remains independent.
  if(cfg.enhance!==false){if(pending!==null)clearTimeout(pending);pending=setTimeout(()=>{pending=null;scan();},350);}
  if(frame===null)frame=requestAnimationFrame(()=>{frame=null;layoutVideos();syncStoryImages();});
 }
 window.addEventListener('scroll',scheduleLayout,true);window.addEventListener('resize',scheduleLayout);window.addEventListener('popstate',scheduleLayout);window.addEventListener('hashchange',scheduleLayout);
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(scheduleLayout):null;
 function update(c){
  if(JSON.stringify(cfg)===JSON.stringify(c)&&(window.__fpro&&window.__fpro.ready)){updateSelection();scan();return;}
  window.__fpro.ready=true;
  if(window.FproColor)window.FproColor.off();if(window.FproNoapp)window.FproNoapp.restore();
  cfg=c;updateSelection();iconDefs.remove();restoreTintVars();style.textContent='';restoreHidden();painted.forEach(el=>accentAttrs.forEach(k=>el.removeAttribute('data-fpro-accent-'+k)));painted.forEach(el=>el.removeAttribute('data-fpro-surface'));painted.clear();
  if(c.enhance===false){observer.disconnect();if(resize)resize.disconnect();videos.forEach(entry=>entry.dispose());videos.clear();storyImages.forEach(tools=>tools.remove());storyImages.clear();style.remove();lastTap=null;touch=null;return;}
  if(resize)resize.observe(document.body);
  if(!style.isConnected)document.head.appendChild(style);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','href','src','data-story-id','data-store','data-video-id','class','style','stroke','fill']});
  observer.observe(document.head,{childList:true,subtree:true,characterData:true});
  const accent=c.color==='طبيعي'?null:colors[c.color];
  const foreground=c.dark?accent:({'ذهبي':'#8a6500','فضي':'#56616b','أبيض':'#333','برتقالي':'#a64600'}[c.color] || accent);
  const contrast=['ذهبي','فضي','أبيض','برتقالي'].includes(c.color)?'#111':'#fff';
  // Compute blue accents before applying our overrides. Never recolor photographs.
  tint();
  // Optional RC experiment: reversible token overrides, never rewrite Meta's
  // stylesheets/inline declarations or its primary-icon/surface tokens.
  const rcTokens=c.experimentalColorVars && accent && !['طبيعي','تلقائي'].includes(c.color)
   ? `:root,body,.__fb-light-mode,.__fb-dark-mode{${['--accent','--primary-blue','--blue-link','--primary-button-background','--primary-deemphasized-button-text'].map(key=>key+':'+accent+'!important').join(';')};--primary-button-text:${contrast}!important}` : '';
  style.textContent=`
   ${rcTokens}
   body{-webkit-user-select:text!important}
   ${accent?`[data-fpro-accent-bg]{background-color:${accent}!important;color:${contrast}!important}[data-fpro-accent-bg] *{color:${contrast}!important}[data-fpro-accent-fg]{color:${foreground}!important}[data-fpro-accent-icon]{filter:url("#fpro-icon-palette")!important}[data-fpro-accent-ring]{background-color:${accent}!important}[data-fpro-accent-outline]{outline-color:${accent}!important}[data-fpro-accent-shadow]{box-shadow:var(--fpro-ring-shadow)!important}[data-fpro-accent-gradient]{background-image:var(--fpro-ring-gradient)!important}[data-fpro-accent-canvas-ring]{filter:url("#fpro-canvas-palette")!important}[data-fpro-accent-svg-bg]{background-image:var(--fpro-ring-svg)!important}[data-fpro-accent-before-svg-bg]::before{background-image:var(--fpro-before-svg)!important}[data-fpro-accent-after-svg-bg]::after{background-image:var(--fpro-after-svg)!important}[data-fpro-accent-stop]{stop-color:${accent}!important}[data-fpro-accent-border]{border-color:${foreground}!important}[data-fpro-accent-fill]{fill:${foreground}!important}[data-fpro-accent-stroke]{stroke:${foreground}!important}`:''}
   ${accent?['before','after'].map(p=>`[data-fpro-accent-${p}-border]::${p}{border-color:${accent}!important}[data-fpro-accent-${p}-outline]::${p}{outline-color:${accent}!important}[data-fpro-accent-${p}-shadow]::${p}{box-shadow:var(--fpro-${p}-shadow)!important}[data-fpro-accent-${p}-bg]::${p}{background-color:${accent}!important}[data-fpro-accent-${p}-gradient]::${p}{background-image:var(--fpro-${p}-gradient)!important}`).join(''):''}
   ${c.dark||c.amoled?`:root,html,body,.__fb-light-mode,.__fb-dark-mode{--web-wash:${c.amoled?'#000':'#18191a'}!important;--surface-background:${c.amoled?'#000':'#242526'}!important;--card-background:${c.amoled?'#000':'#242526'}!important;--comment-background:${c.amoled?'#000':'#3a3b3c'}!important;--dialog-background:${c.amoled?'#000':'#242526'}!important;--nav-bar-background:${c.amoled?'#000':'#242526'}!important;--primary-text:#eee!important;--secondary-text:#bbb!important;color-scheme:dark}html,body,[role="main"],[role="feed"],header,nav,[role="banner"],[role="navigation"],article,[role="article"],[role="dialog"]{background-color:${c.amoled?'#000':'#18191a'}!important;color:#eee!important}`:''}
   ${c.sticky?'[role="banner"]{position:sticky!important;top:0!important;z-index:1000!important}':''}
   ${c.reverse?'body{direction:ltr!important}':''}
   .fpro-video-tools{direction:ltr;position:fixed;z-index:10000;pointer-events:none;overflow:hidden}
   .fpro-video-tools[hidden],.fpro-video-tools [hidden]{display:none!important}
   .fpro-download{position:absolute;pointer-events:auto;box-sizing:border-box;display:grid;place-items:center;width:44px!important;height:44px!important;min-width:44px;min-height:44px;padding:0!important;border:1px solid #ffffff80!important;border-radius:50%!important;background:rgba(255,255,255,.12)!important;box-shadow:none!important;color:#fff!important;backdrop-filter:blur(2px);touch-action:none;-webkit-user-select:none;line-height:1}.fpro-download svg{pointer-events:none;color:inherit!important;background:none!important}
   .fpro-track{position:absolute;bottom:0;left:8px;right:8px;height:24px;pointer-events:auto;background:transparent!important;box-shadow:none!important;border:0!important}
   .fpro-fill{position:absolute;bottom:0;left:0;height:3px;border-radius:4px;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet);width:0}
   .fpro-ball{position:absolute;right:-7px;top:-5px;font-size:13px;line-height:14px}
   .fpro-seek{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:auto;touch-action:pan-y}
  `;
  scan();
 }
 // Mutation callbacks run before the next paint. Give only newly changed
 // hashtag nodes a tiny fast path; keep the expensive feed scan debounced.
 const fastHashes=new WeakSet();
 function fastHashtags(records){
  if(!document||document.hidden||cfg.enhance===false||cfg.color==='طبيعي'||!colors[cfg.color])return;
  const roots=new Set(),addedRoots=new Set();
  for(const record of records){
   if(record.type==='childList'){for(const n of record.addedNodes)if(n.nodeType===1){roots.add(n);addedRoots.add(n);}else if(n.nodeType===3&&n.parentElement)roots.add(n.parentElement);if(record.target.nodeType===1)roots.add(record.target);}
   else roots.add(record.target.nodeType===1?record.target:record.target.parentElement);
  }
  for(const root of roots){
   if(!root||root.closest('#fpro-style,#fpro-selection-style,#fpro-icon-filter,.fpro-video-tools'))continue;
   const nodes=[root];
   // Descend only added fragments; a character/style mutation is local.
   if(addedRoots.has(root))for(const n of root.querySelectorAll('span,a,[role="link"]'))nodes.push(n);
   for(const el of nodes){
    if(!el.matches('span,a,[role="link"]'))continue;
    const text=norm(el.textContent),href=el.getAttribute('href')||'';
    const hashtag=/(?:\/hashtag\/|[?&]hashtag=)/i.test(href)||/^#[^\s#]+$/.test(text);
    if(hashtag){
     el.setAttribute('data-fpro-accent-fg','');painted.add(el);fastHashes.add(el);
     if(el.style.getPropertyPriority('color')==='important'){
      const fg=cfg.dark?colors[cfg.color]:({'ذهبي':'#8a6500','فضي':'#56616b','أبيض':'#333','برتقالي':'#a64600'}[cfg.color]||colors[cfg.color]);
      tintVar(el,'color',fg,'important');
     }
    }else if(fastHashes.has(el)){
     fastHashes.delete(el);el.removeAttribute('data-fpro-accent-fg');
     const vars=tintVars.get(el),old=vars&&vars.get('color');
     if(old){if(el.style.getPropertyValue('color')===old.applied&&el.style.getPropertyPriority('color')===old.appliedPriority){if(old.value)el.style.setProperty('color',old.value,old.priority);else el.style.removeProperty('color');}vars.delete('color');ownedStyles.set(el,el.getAttribute('style'));}
    }
   }
  }
 }
 // Paint only changed fragments in the mutation microtask, before the next
 // browser paint. Keep banners/layout/full feed work on the old scheduler.
 function fastReferenceColors(records){
  if(document.hidden)return;
  const roots=new Set(),local=new Set();
  const add=(set,el)=>{if(el&&el.nodeType===1&&!/^fpro/i.test(el.id)&&!el.closest('#fpro-reference-svg,.fpro-video-tools'))set.add(el);};
  for(const record of records){
   if(record.type==='attributes')add(local,record.target);
   else if(record.type==='characterData'){const el=record.target.parentElement;add(local,el&&(el.closest('a,button,[role="button"]')||el));}
   else if(record.type==='childList'){if(record.target.nodeType===1){if(record.target.matches('style'))add(local,record.target);else add(local,record.target.closest('a,button,[role="button"]'));}for(const node of record.addedNodes){if(node.nodeType===3)add(local,record.target);else add(roots,node);}}
  }
  const apply=(list,selfOnly)=>{
   if(!list.length)return;
   if(cfg.appBanner){
    if(cfg.referenceEngine&&window.FproNoapp)window.FproNoapp.scan(list,true,selfOnly);
    else {let budget=48;for(const root of list){const nodes=selfOnly?[root]:[root,...root.querySelectorAll('a,button,[role="button"]')];for(const el of nodes){if(budget--<=0)break;if(isAppPrompt(norm(el.getAttribute('aria-label')||el.textContent)))appBanner(el,true);}}}
   }
   if(cfg.referenceEngine&&window.FproColor)window.FproColor.pass(list,true,selfOnly);
  };
  apply(Array.from(local).slice(0,24),true);apply(Array.from(roots).slice(0,4),false);
 }
 const observer=new MutationObserver(records=>{
  if(!document||cfg.enhance===false)return;
  const relevant=records.filter(r=>{if(r.type==='childList'){const changes=[...r.addedNodes,...r.removedNodes];if(changes.length&&changes.every(n=>n.nodeType===1&&/^fpro/i.test(n.id)))return false;}const el=r.target.nodeType===1?r.target:r.target.parentElement;if(!el||el.closest('#fpro-style,#fpro-selection-style,#fpro-icon-filter,.fpro-video-tools'))return false;if(window.FproColor&&window.FproColor.ownsStyle(el)&&(el.matches('style')||r.type==='attributes'&&r.attributeName==='style'))return false;if(r.type==='attributes'&&r.attributeName==='style'&&(ownedStyles.get(el)===el.getAttribute('style')||el.hasAttribute('data-fpro-hidden')))return false;return true;});
  if(!relevant.length)return;
  fastHashtags(relevant);
  fastReferenceColors(relevant);
  if(pending!==null)return;pending=setTimeout(()=>{pending=null;scan();},500);
 });
 function colorReport(){
  const report={version:27,media:window.__fproAudio?window.__fproAudio.report():null,documentStart:window.__fproEarly===true,enhance:cfg.enhance!==false,color:cfg.color,referenceEngine:!!cfg.referenceEngine,experimentalColorVars:cfg.experimentalColorVars===true,experimentalColorVarsActive:cfg.enhance!==false&&cfg.experimentalColorVars===true&&!!colors[cfg.color]&&!['طبيعي','تلقائي'].includes(cfg.color),selection:{enabled:cfg.textSelection!==false,cssInstalled:selectionStyle.isConnected,preparedNodes:selectionOverrides.size,lastTarget:{...selectionTargetInfo}},matched:{},avatarSources:{img:0,svg:0,background:0},avatarFrames:[],canvasLayers:[],smallImages:[],remainingBlue:[]};
  for(const key of accentAttrs)report.matched[key]=document.querySelectorAll('[data-fpro-accent-'+key+']').length;
  for(const photo of avatarPictures()){const key=photo.matches('img')?'img':photo.matches('image')?'svg':'background';report.avatarSources[key]++;}
  function paint(c){return {color:!!isBlue(c.color),background:!!isBlue(c.backgroundColor),border:['Top','Right','Bottom','Left'].some(side=>parseFloat(c['border'+side+'Width'])>0&&!['none','hidden'].includes(c['border'+side+'Style'])&&isBlue(c['border'+side+'Color'])),outline:parseFloat(c.outlineWidth)>0&&!['none','hidden'].includes(c.outlineStyle)&&!!isBlue(c.outlineColor),shadow:replaceBlue(c.boxShadow).changed,gradient:replaceBlue(c.backgroundImage).changed,fill:isBlue(c.fill),stroke:!!isBlue(c.stroke)};}
  function pseudoPaint(el,pseudo){const c=getComputedStyle(el,pseudo);return c.content==='none'||c.content==='normal'||!c.content||c.display==='none'?null:paint(c);}
  // Manual, privacy-minimal geometry only. No names, URLs, text, selectors,
  // class/IDs, image bytes or cookies; small images are not assumed badges.
  function frame(el){const r=el.getBoundingClientRect(),c=getComputedStyle(el);return {tag:el.tagName.toLowerCase(),w:Math.round(r.width),h:Math.round(r.height),round:parseFloat(c.borderRadius)>=Math.min(r.width,r.height)*.3,mask:!!(c.maskImage&&c.maskImage!=='none'||c.webkitMaskImage&&c.webkitMaskImage!=='none'),clip:!!(c.clipPath&&c.clipPath!=='none'),borderImage:!!(c.borderImageSource&&c.borderImageSource!=='none'),backgroundKind:backgroundKind(c.backgroundImage),beforeBackgroundKind:backgroundKind(getComputedStyle(el,'::before').backgroundImage),afterBackgroundKind:backgroundKind(getComputedStyle(el,'::after').backgroundImage),svg:el.querySelectorAll('svg,circle,ellipse,path').length,canvas:el.querySelectorAll('canvas').length,own:paint(c),before:pseudoPaint(el,'::before'),after:pseudoPaint(el,'::after')};}
  for(const photo of avatarPictures().slice(0,8)){
   const levels=[];let el=photo;for(let depth=0;el&&depth<5;depth++,el=el.parentElement){if(el.matches('body,html,main,nav,[role="navigation"]'))break;levels.push(frame(el));}
   report.avatarFrames.push({kind:photo.matches('img')?'img':photo.matches('image')?'svg':'background',levels});
  }
  const pairs=avatarCanvasPairs(),nearAvatar=new Map(pairs.map(pair=>[pair.canvas,pair.photo]));
  for(const canvas of document.querySelectorAll('canvas')){
   if(report.canvasLayers.length>=8)break;const r=canvas.getBoundingClientRect();if(r.width<8||r.height<8||r.bottom<=0||r.top>=innerHeight||canvas.closest('.fpro-video-tools'))continue;
   const near=nearAvatar.has(canvas);report.canvasLayers.push({w:Math.round(r.width),h:Math.round(r.height),nearAvatar:near,...(near?canvasRingEvidence(canvas,nearAvatar.get(canvas)):{readable:false,blueRing:false,transparentCenter:false})});
  }
  for(const img of document.querySelectorAll('img')){
   if(report.smallImages.length>=12)break;const r=img.getBoundingClientRect();if(r.width<8||r.width>24||r.height<8||r.height>24||r.bottom<=0||r.top>=innerHeight)continue;
   const link=img.closest('a,[role="link"]');let staticAsset=false;try{const u=new URL(img.currentSrc||img.src,location.href);staticAsset=/(^|\.)facebook\.com$|(^|\.)fbcdn\.net$/.test(u.hostname)&&(/\/rsrc\.php\//.test(u.pathname)||/^static\./.test(u.hostname));}catch(_){}
   report.smallImages.push({w:Math.round(r.width),h:Math.round(r.height),naturalW:img.naturalWidth,naturalH:img.naturalHeight,verified:verifiedLabel(img)||!!(img.parentElement&&verifiedLabel(img.parentElement)),withinLink:!!link,linkHasText:!!(link&&link.textContent.trim()),staticAsset});
  }
  for(const el of document.querySelectorAll('img,svg,circle,path,i,span,div[role="img"],a')){
   if(report.remainingBlue.length>=40)break;if(el.closest('.fpro-video-tools,#fpro-icon-filter'))continue;const r=el.getBoundingClientRect();if(r.width<8||r.width>160||r.height<8||r.height>160||r.bottom<=0||r.top>=innerHeight)continue;
   const own=paint(getComputedStyle(el)),before=pseudoPaint(el,'::before'),after=pseudoPaint(el,'::after');
   const raster=el.matches('img,i')&&r.width<=32&&r.height<=32&&!el.hasAttribute('data-fpro-accent-icon');if(raster||[own,before,after].some(p=>p&&Object.values(p).some(Boolean)))report.remainingBlue.push({tag:el.tagName.toLowerCase(),w:Math.round(r.width),h:Math.round(r.height),photo:pictureSource(el),raster,glyph:privateGlyph(el),backgroundKind:backgroundKind(getComputedStyle(el).backgroundImage),verified:verifiedLabel(el),inPost:!!postFor(el),own,before,after});
  }
  return report;
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)restoreSelectionLink();else scan();});
 window.__fpro={update,colorReport};update(initial);
})();
