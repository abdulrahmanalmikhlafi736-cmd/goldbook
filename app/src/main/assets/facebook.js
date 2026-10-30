(() => {
 'use strict';
 const initial = __CONFIG__;
 if (!document.body) return;
 if (window.__fpro) { window.__fpro.update(initial); return; }
 let cfg = initial, pending = null, hidingPass = null, observingDocument = false;
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
  if(!el||selectionActionTarget(el)||el.closest('button,input,textarea,select,[contenteditable]:not([contenteditable="false"]),.fpro-video-tools,header,nav,[role="banner"],[role="navigation"],svg,img,video,canvas'))return null;
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
 // Material You is serialized by native code; no new account-access bridge.
 function pageAccent(c=cfg){return c.color==='تلقائي'&&c.dynamic&&/^#[0-9a-f]{6}$/i.test(c.systemAccent||'')?c.systemAccent:colors[c.color];}
 const LIGHT_MODE_FG = {'ذهبي':'#8a6500','فضي':'#56616b','أبيض':'#333','برتقالي':'#a64600'};
 const norm = s => (s || '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u2066-\u2069]/g,'').replace(/\s+/g,' ').toLowerCase().trim().replace(/[·•\s:.!؟]+$/g,'');
 const selectionControlLabels=new Set(['like','love','reply','replies','share','follow','comment','comments','send','save','copy','cancel','more','see more','see less','play','pause','إعجاب','أعجبني','رد','ردود','مشاركة','متابعة','تعليق','تعليقات','التعليقات','إرسال','حفظ','نسخ','إلغاء','المزيد','عرض المزيد','عرض أقل','تشغيل','إيقاف'].map(norm));
 // Build43: only positive action evidence excludes reading. Generic role,
 // pressed/popup metadata and prose-prefixed aria labels are not action proof.
 function selectionActionTarget(el){
  const ui=el.closest('[role="toolbar"],[role="menu"],[role="menubar"],[role="listbox"],[role="menuitem"],[role="menuitemradio"]');
  const article=el.closest('article,[role="article"],[role="comment"],[data-commentid]');
  if(ui&&(!article||article.contains(ui)))return true;
  let node=el;
  for(let depth=0;node&&depth<7;depth++,node=node.parentElement){
   if(node.matches('article,[role="article"],[role="comment"],[data-commentid],body,html'))break;
   if(node.matches('[role="button"],[role="link"],a,[onclick],[tabindex],[aria-pressed],[aria-haspopup]')){
    const href=node.getAttribute('href')||'',sigil=node.getAttribute('data-sigil')||'',test=node.getAttribute('data-testid')||'';
    if(/\/(?:a\/)?(?:like|reaction|reactions|ufi)(?:\.php|\/|\?|$)/i.test(href)||/(?:^|\s)(?:like|reaction)(?:-|\s|$)/i.test(sigil)||/reaction|ufi.*like/i.test(test))return true;
    const visible=node.textContent||'';
    if(visible.length<=90){const text=norm(visible),counter=/^(?:like|liked|unlike|react|reactions?|love|reply|share|comment|(?:ال)?اعجاب|اعجبني|اعجبنى|تفاعل|تفاعلات|رد|مشاركة|تعليق)[\s\d٠-٩۰-۹.,،:·•()👍❤️❤😆😮😢😡🥰]*$/i;if(selectionControlLabels.has(text)||counter.test(text))return true;}
    // Icon-only controls need explicit action evidence. Never infer an action
    // from an unknown role-button containing a real post/comment sentence.
    if(/^[\s\d٠-٩۰-۹.,،:·•()👍❤️❤😆😮😢😡🥰]*$/.test(visible)){
     if(node.hasAttribute('aria-pressed')||node.hasAttribute('aria-haspopup'))return true;
     for(const name of ['aria-label','title'])if(/^(?:like|unlike|react|reaction|اعجاب|تفاعل)(?:$|\s)/i.test(norm(node.getAttribute(name))))return true;
    }
   }
  }
  return false;
 }
 const workStats={scans:0,deferred:0,lastScanMs:0,maxScanMs:0,queuedColorRoots:0};
 let lastScanFinished=-Infinity,activePointers=new Set(),touchHeld=false,quietUntil=0;
 const deferredColors=new Set();
 function interactionBusy(){
  if(activePointers.size||touchHeld||performance.now()<quietUntil)return true;
  const selection=window.getSelection&&window.getSelection();
  return !!(selection&&!selection.isCollapsed&&selection.rangeCount);
 }
 function beginInteraction(e){if(e.type==='pointerdown')activePointers.add(e.pointerId==null?'primary':e.pointerId);else touchHeld=true;}
 function endInteraction(e){if(e.type.indexOf('pointer')===0)activePointers.delete(e.pointerId==null?'primary':e.pointerId);else touchHeld=!!(e.touches&&e.touches.length);quietUntil=performance.now()+250;requestScan(300);}
 window.addEventListener('pointerdown',beginInteraction,true);
 window.addEventListener('touchstart',beginInteraction,{capture:true,passive:true});
 for(const name of ['pointerup','pointercancel','touchend','touchcancel'])window.addEventListener(name,endInteraction,{capture:true,passive:true});
 window.addEventListener('blur',()=>{activePointers.clear();touchHeld=false;quietUntil=0;});
 document.addEventListener('selectionchange',()=>{if(!interactionBusy())requestScan(300);});
 function boundedElements(root,selector,limit=384,budget=null){
  const result=[],walk=document.createTreeWalker(root,1);let node,visited=0;
  while(visited++<limit&&(!budget||budget.remaining>0)&&(node=walk.nextNode())){if(budget)budget.remaining--;if(node.matches(selector))result.push(node);}
  return result;
 }
 function deferColorRecords(records){
  for(const record of records){
   const elements=record.type==='childList'?Array.from(record.addedNodes).slice(0,32):[record.target.nodeType===1?record.target:record.target.parentElement];
   for(const el of elements)if(el&&el.nodeType===1&&deferredColors.size<32)deferredColors.add(el);
  }
  workStats.queuedColorRoots=deferredColors.size;
 }
 function requestScan(delay=500,settle=false){
  if(cfg.enhance===false||document.hidden)return;
  if(pending!==null){if(!settle)return;clearTimeout(pending);}
  const wait=Math.max(delay,1500-(performance.now()-lastScanFinished));
  pending=setTimeout(()=>{pending=null;scan();},wait);
 }
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
 const pendingAppPrompts=new Set(),appPromptOwned=new Set();let appPromptFrame=null,promptCheckpointQueued=false,promptCheckpointUsed=false;
 let promptUrgentUsed=false;const promptUrgentSeen=new WeakSet(),promptUrgentTiming={checks:0,hidden:0,maxMs:0},promptCheckpointTiming={batches:0,checks:0,hidden:0,maxMs:0};
 const hidden = new Map(), painted = new Set(), videos = new Map(), identityBaseline = new WeakMap();
 function hide(el) {
  if (!el || /^(BODY|HTML|MAIN)$/.test(el.tagName) || ['main','feed','navigation'].includes(el.getAttribute('role'))) return;
  if(hidingPass)hidingPass.add(el);
  if (!hidden.has(el)) hidden.set(el, {value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
  if(el.getAttribute('data-fpro-hidden')!=='1')el.setAttribute('data-fpro-hidden','1');
  if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
 }
 function restoreHidden() {
  if(appPromptFrame!==null)cancelAnimationFrame(appPromptFrame);appPromptFrame=null;promptUrgentUsed=false;promptCheckpointUsed=false;pendingAppPrompts.clear();appPromptOwned.clear();
  hidden.forEach((old,el) => { if(old.value) el.style.setProperty('display',old.value,old.priority); else el.style.removeProperty('display'); el.removeAttribute('data-fpro-hidden');el.removeAttribute('data-fpro-app-prompt'); }); hidden.clear();
 }
 // Selectors informed by Materialbook/Nobook; see docs/UPSTREAM-ADAPTATIONS.md.
 // Use our reversible ownership and ONE existing observer, not upstream's many
 // observers, global body rewrites or unguarded remove()/sibling deletion.
 const adaptedSticky=new Set();
 const adaptedStats={visits:0,bannerProbes:0,bannerHits:0};
 function clearAdaptedMarkers(){for(const el of adaptedSticky)el.removeAttribute('data-fpro-adapt-sticky');adaptedSticky.clear();}
 function adaptedSitePass(roots,fast){
  if(cfg.enhance===false||document.hidden)return;
  const scopes=roots.filter(el=>el&&el.isConnected).slice(0,fast?4:1);
  // First-result probe for upstream's actual footer shape, NOT a blanket hide.
  if(cfg.appBanner)for(const root of scopes){
   adaptedStats.bannerProbes++;
   const selector='.bottom.fixed-container[data-actual-height]:not([data-shift-on-keyboard-shown])';
   const bar=root.matches(selector)?root:root.querySelector(selector);
   if(!bar)continue;
   const raw=bar.getAttribute('data-actual-height');
   if(!/^\d+(?:\.\d+)?$/.test(raw)||+raw<=0||+raw>=80)continue;
   adaptedStats.bannerHits++;
   // Full CTA/ancestor policy still decides. Metadata alone grants NO hiding.
   if(cfg.referenceEngine&&window.FproNoapp)window.FproNoapp.scan([bar],true,false);
   else for(const control of [bar,...boundedElements(bar,'a,button,[role="button"],[role="link"]',48)])queueAppBanner(control);
  }
  if(!cfg.ads&&!cfg.stories&&!cfg.homeStories&&!cfg.reels&&!cfg.people&&!cfg.groups&&!cfg.suggested&&!cfg.amoled&&!cfg.sticky)return;
  const selector='.sponsored_ad,article[data-ft*="sponsored_ad"],[data-tracking-duration-id],[data-mcomponent="MContainer"],.fl.ac .native-text,[role="tablist"]';
  const budget={remaining:fast?384:2400};
  if(!fast)clearAdaptedMarkers();
  const candidates=[];
  for(const root of scopes){if(budget.remaining<=0)break;candidates.push(root,...boundedElements(root,selector,fast?384:2400,budget));}
  let header=null;const tabs=[];
  for(const el of candidates){
   adaptedStats.visits++;
   if(el.closest('form,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"],.fpro-video-tools'))continue;
   const protectedHost=el.matches('body,html,main,header,nav,[role="main"],[role="feed"],[role="navigation"],[role="banner"]');
   if(cfg.ads&&!protectedHost&&el.matches('.sponsored_ad,article[data-ft*="sponsored_ad"]'))hide(el);
   if(!protectedHost&&el.matches('[data-tracking-duration-id]')&&!el.querySelector('form,input,textarea,select,header,nav,[role="navigation"]')){
    const headings=boundedElements(el,'h2,h3,[role="heading"],[data-mcomponent="TextArea"] .native-text',96).slice(0,24);
    for(const heading of headings){const text=appPromptText(heading);if(text===null)continue;
     for(const key of ['suggested','people','groups'])if(cfg[key]&&words[key].some(label=>norm(label)===text))hide(el);
    }
   }
   if((cfg.stories||cfg.homeStories)&&homeView()&&el.matches('[data-mcomponent="MContainer"][data-srat="43"]')&&!protectedHost&&!el.querySelector('article,[role="article"],form,input,textarea')&&el.querySelector('a[href*="/stories/"]'))hideStoryBlock(el);
   if(cfg.reels&&el.matches('.fl.ac .native-text')&&el.textContent.trim()==='󰣝'){
    const card=el.closest('[data-tracking-duration-id]');
    if(card&&!card.matches('main,header,nav,[role="main"],[role="feed"]')&&!card.querySelector('form,input,textarea')&&card.querySelector('a[href*="/reel/"] ,a[href*="/reels/"]'))hide(card);
   }
   // AMOLED only known opaque FB dark surface colors on structural containers.
   // Never alter photos, gradients, transparency, form controls or media pixels.
   if(cfg.amoled&&el.matches('[data-mcomponent="MContainer"],[data-tracking-duration-id]')&&!el.matches('[role="img"]')&&!el.style.backgroundImage){
    const color=rgbColor(el.style.backgroundColor);
    if(color&&color[3]===1&&['24,25,26','28,28,29','36,37,38','37,39,40','38,38,38'].includes(color.slice(0,3).join(',')))tintVar(el,'background-color','#000','important');
   }
   if(!fast&&cfg.sticky){
    if(el.matches('[data-mcomponent="MContainer"][data-focusable="true"][data-type="container"][data-tti-phase="-1"]')&&el.querySelector('[aria-label*="Facebook"]')&&el.querySelector('[aria-label="Search"],[aria-label="بحث"]')&&!el.querySelector('video,form,input,textarea'))header=el;
    if(el.matches('[role="tablist"][data-mcomponent="MContainer"]')&&el.querySelector('[aria-label*="feed"],[aria-label="Home"],[aria-label="الصفحة الرئيسية"]')&&!el.querySelector('video,form,input,textarea'))tabs.push(el);
   }
  }
  if(header){header.setAttribute('data-fpro-adapt-sticky','header');adaptedSticky.add(header);const h=header.getBoundingClientRect().height;
   for(const tab of tabs.slice(0,2)){tab.setAttribute('data-fpro-adapt-sticky','tabs');adaptedSticky.add(tab);tintVar(tab,'--fpro-nav-offset',Math.max(0,Math.min(h,160))+'px');}
  }
 }
 function section(label, key) {
  const post = postFor(label); if (post) return post;
  const tracked=label.closest('[data-tracking-duration-id]');
  if(tracked&&['ads','suggested','reels','stories','people','groups'].includes(key)&&!tracked.matches('header,nav,[role="navigation"],[role="main"],[role="feed"]')&&!tracked.querySelector('form,input,textarea,select,dialog,[role="dialog"],[aria-modal="true"]')&&!label.closest('header,nav,[role="toolbar"]'))return tracked;
  const region = label.closest('section,[role="list"],[role="region"],[data-pagelet*="Stories"],[data-pagelet*="Reels"],[data-sigil~="m-story-tray"]');
  if (region && !region.querySelector('[role="article"],article,[data-pagelet^="FeedUnit"]')) return region;
  // Never hide a whole feed because a navigation link contains "Stories".
  if (key === 'stories' || key === 'reels') {
   const link = label.closest('a[href]');
   if (link && /\/(stories|reel|reels)\//.test(link.getAttribute('href') || '')) return link;
  }
  return null;
 }
 const appPromptLabels=new Set(['فتح التطبيق','افتح التطبيق','فتح تطبيق فيسبوك','فتح التطبيق الآن','استخدم التطبيق','استخدم تطبيق فيسبوك','فتح في التطبيق','استخدام التطبيق','تثبيت التطبيق','الحصول على التطبيق','حمل تطبيق فيسبوك','open app','open the app','open in app','open in the app','use app','use the app','get the app','get facebook for android','get facebook for android and browse faster','open facebook app','open the facebook app','use facebook app','use the facebook app'].map(norm));
 const compactAppPromptLabels=new Set(Array.from(appPromptLabels,function(label){return label.replace(/\s+/g,'');}));
 function isAppPrompt(text){
  text=norm(text).replace(/[\u061C\u202A-\u202E\u2060]/g,'');
  // Only a known brand at an edge may decorate an otherwise EXACT CTA.
  var plain=text.replace(/^(?:facebook|فيسبوك|f)(?:\s+|(?=[\u0600-\u06ff]))/,'').replace(/\s*(?:facebook|فيسبوك|f)$/,'');
  return text.length<=90&&(appPromptLabels.has(text)||appPromptLabels.has(plain)||compactAppPromptLabels.has(text.replace(/\s+/g,''))||compactAppPromptLabels.has(plain.replace(/\s+/g,'')));
 }
 // One native selector lookup returns only the first exact accessible cue.
 // Unlike querySelectorAll, no full result NodeList is materialized. Native
 // traversal time is NOT capped: keep one lookup per existing fast root.
 const priorityPromptSelector=Array.from(appPromptLabels,function(label){return '[aria-label='+JSON.stringify(label)+' i]:not([data-fpro-app-prompt]):not([data-fpro-reference-noapp])';}).join(',');
 const priorityPromptTiming={queries:0,hits:0,maxMs:0};
 function priorityPrompt(root){
  if(!root||root.nodeType!==1)return null;
  var started=performance.now(),candidate=null;priorityPromptTiming.queries++;
  try{candidate=root.matches(priorityPromptSelector)?root:root.querySelector(priorityPromptSelector);}catch(_){}
  if(candidate)priorityPromptTiming.hits++;
  priorityPromptTiming.maxMs=Math.max(priorityPromptTiming.maxMs,Math.round((performance.now()-started)*10)/10);
  return candidate;
 }
 // Read bounded control text, not SVG accessibility titles or decorative
 // hidden icon captions. Never use rendered innerText (it can force layout).
 function appPromptText(control){
  var walk=document.createTreeWalker(control,4),part,count=0,chunks=[];
  while((part=walk.nextNode())){
   if(++count>64)return null;
   if(part.parentElement&&part.parentElement.closest('svg title,svg desc,[aria-hidden="true"],script,style'))continue;
   chunks.push(part.nodeValue||'');
   if(chunks.join('').length>180)return null;
  }
  return norm(chunks.join(' '));
 }
 // Structural evidence of real site navigation, never a standalone install sheet.
 function appNavigationSurface(node){
  if(node.querySelector('video,audio,iframe,canvas,form,article,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"],[role="article"],[role="feed"],input,textarea,select'))return false;
  var controls=Array.from(node.querySelectorAll('a,button,[role="button"],[role="link"]'));
  if(controls.length<2||controls.length>24)return false;
  var search=false,accountOrBack=false;
  for(var action of controls){
   var label=norm(action.getAttribute('aria-label')||action.textContent);
   if(/^(search(?: facebook)?|بحث(?: في فيسبوك)?|البحث(?: في فيسبوك)?)$/.test(label))search=true;
   if(/^(account|profile|your profile|view your profile|back|go back|حساب|الحساب|حسابك|الملف الشخصي|ملفك الشخصي|رجوع|الرجوع|عودة|العودة)$/.test(label))accountOrBack=true;
  }
  return search&&(accountOrBack||node.matches('header,nav,[role="banner"],[role="navigation"],[role="toolbar"]'));
 }
 // An exact accessible action plus a standalone caption can identify a
 // compact navigation CTA even when its logo contributes extra DOM text.
 // Never let aria override a prose-only control or a general feed tile.
 function navigationCaption(control,text,label){
  if(text===null||!isAppPrompt(label))return false;
  var pieces=[],walk=document.createTreeWalker(control,4),part,count=0,caption=false;
  while((part=walk.nextNode())){
   if(++count>64)return false;
   if(part.parentElement.closest('svg,[aria-hidden="true"],script,style'))continue;
   var piece=norm(part.nodeValue);if(!piece)continue;pieces.push(piece);
   for(var n=1;n<=Math.min(4,pieces.length);n++)if(isAppPrompt(pieces.slice(-n).join(' ')))caption=true;
  }
  if(!caption)return false;
  for(var parent=control.parentElement,depth=0;parent&&parent!==document.body&&depth<8;parent=parent.parentElement,depth++)if(appNavigationSurface(parent))return true;
  return false;
 }
 // Remember only verified compact banner geometry while display:none removes
 // its box. Weak keys do not retain detached page nodes.
 const appBannerBoxes=new WeakMap();
 // A parent is eligible only as a dedicated compact fixed app-prompt surface.
 // Never infer a banner from its background, position or a URL alone.
 function safeAppPromptTarget(el,structuralOnly=false){
  var semantic='a,button,[role="button"],[role="link"]';
  var ownedSurface=el&&!el.matches(semantic)&&(el.hasAttribute('data-fpro-app-prompt')||el.hasAttribute('data-fpro-reference-noapp'));
  var control=ownedSurface?el.querySelector(semantic):el&&el.closest(semantic);
  if(!control||control.matches('body,html,main,form,article,header,nav,[role="article"],[role="main"],[role="feed"],[role="navigation"],[role="banner"]'))return null;
  if(control.closest('form,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"]'))return null;
  if(control.querySelector('a,button,[role="button"],[role="link"],video,audio,iframe,canvas,input,textarea,select,[contenteditable="true"],article,[role="article"],[role="main"],[role="feed"]'))return null;
  // A matching child span/aria-label must not authorize hiding unrelated prose.
  var text=appPromptText(control),label=norm(control.getAttribute('aria-label'));
  var ariaNavigation=text!==null&&!isAppPrompt(text||label)&&navigationCaption(control,text,label);
  if(text===null||!isAppPrompt(text||label)&&!ariaNavigation)return null;
  if(structuralOnly)return ownedSurface?el:control;
  var box=control.getBoundingClientRect();
  if(box.height>96||ariaNavigation&&box.width>160)return null;
  var node=control,depth=0,surface=null,realNavigation=false;
  for(;node&&node!==document.body&&depth<32;node=node.parentElement,depth++){
   var css=getComputedStyle(node);
   if(css.position!=='fixed'&&css.position!=='absolute')continue;
   var r=node.getBoundingClientRect(),saved=appBannerBoxes.get(node);
   if(saved&&r.width===0&&r.height===0&&(node.hasAttribute('data-fpro-app-prompt')||node.hasAttribute('data-fpro-reference-noapp')))r=saved;
   // A small bottom install bar can retain its dark min-height/background
   // after its child button is hidden. Hide the verified whole bar, not just
   // that child. Unknown content or actions make it ineligible.
   var h=Math.max(r.height,parseFloat(css.height)||0,parseFloat(css.minHeight)||0);
   // A Reels header containing real Search/profile/back controls is not an
   // install-only bar. Keep the entire header; only its exact CTA may hide.
   if(h>0&&h<=160&&appNavigationSurface(node)){realNavigation=true;continue;}
   // A real compact Reels navigation header can be inside the absolute video
   // viewport, not a semantic <main>. Never hide that host or treat it as an
   // install backdrop. This exception requires ALL evidence, not the URL alone.
   if(realNavigation&&node.tagName==='DIV'&&css.position==='absolute'&&r.width>=innerWidth*.9&&r.width<=innerWidth*1.1&&r.height>=innerHeight*.9&&r.height<=innerHeight*1.1&&Math.abs(r.top)<=1&&Math.abs(r.left)<=1&&node.querySelector('video')&&!node.querySelector('form,input:not([type="range"]),textarea,select,audio,iframe,canvas,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"],[contenteditable="true"]'))continue;
   // Scroll locking can fix the page landmark itself during a click.
   // Count SELF as page content, not only a landmark below it. Never hide it.
   var pageContent=node.matches('main,article,[role="article"],[role="main"],[role="feed"]')||node.querySelector('main,article,[role="article"],[role="main"],[role="feed"]');
   var compact=r.width>=innerWidth*.65&&h>0&&h<=Math.min(160,innerHeight*.25);
   var protectedContent=node.matches('header,nav,main,article,form,[role="banner"],[role="navigation"],[role="main"],[role="feed"],[role="article"]')||node.querySelector('header,nav,main,article,form,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"],video,audio,iframe,canvas,img,input,textarea,select,[contenteditable="true"],[role="main"],[role="feed"],[role="article"]');
   if(node===control&&!protectedContent)continue;
   var rest=appPromptText(node),controls=Array.from(node.querySelectorAll(semantic)),dedicated=rest!==null&&compact&&!protectedContent&&controls.length>0&&controls.length<=3;
   for(var action of controls){
    var actionText=appPromptText(action),actionLabel=norm(action.getAttribute('aria-label'));
    if(actionText===null){dedicated=false;break;}
    if(!isAppPrompt(actionText||actionLabel)&&!['close','dismiss','not now','اغلاق','إغلاق','ليس الآن','×','✕'].map(norm).includes(actionText||actionLabel)){dedicated=false;break;}
    if(actionText&&rest!==null)rest=rest.replace(actionText,'').trim();
   }
   if(rest&&!isAppPrompt(rest))dedicated=false;
   var narrow=!protectedContent&&r.width>0&&r.width<innerWidth*.65&&h>0&&h<=96;
   if(dedicated){surface=node;appBannerBoxes.set(node,{width:r.width,height:h});}
   else if(!narrow&&(compact||!pageContent))return null;
   var inset=/^0(?:px)?(?:\s+0(?:px)?){0,3}$/.test(css.inset||'')||/^0(?:px)?$/.test(css.top)&&/^0(?:px)?$/.test(css.bottom)&&/^0(?:px)?$/.test(css.left)&&/^0(?:px)?$/.test(css.right);
   var large=r.width>=innerWidth*.65&&r.height>=innerHeight*.35;
   // Keep blocking install sheets usable: hiding only their CTA leaves a black
   // backdrop/scroll lock. Do not click Close, remove a scrim or unlock the body.
   if(!dedicated&&(inset||large)&&!pageContent)return null;
  }
  if(node&&node!==document.body&&depth>=32)return null;
  return ariaNavigation&&!realNavigation?null:surface||control;
 }
 function restoreAppPrompt(control){
  const old=hidden.get(control);
  if(old){if(control.style.getPropertyValue('display')==='none'&&control.style.getPropertyPriority('display')==='important'){if(old.value)control.style.setProperty('display',old.value,old.priority);else control.style.removeProperty('display');}hidden.delete(control);}
  appPromptOwned.delete(control);control.removeAttribute('data-fpro-hidden');control.removeAttribute('data-fpro-app-prompt');
 }
 function applyPromptTarget(target){
  for(const previous of Array.from(appPromptOwned))if(previous!==target&&(previous.contains(target)||target.contains(previous)))restoreAppPrompt(previous);
  appPromptOwned.add(target);target.setAttribute('data-fpro-app-prompt','');hide(target);
 }
 function flushPromptCheckpoint(){
  const batch=Array.from(pendingAppPrompts);pendingAppPrompts.clear();
  if(cfg.enhance===false||!cfg.appBanner||cfg.referenceEngine&&window.FproNoapp||document.hidden)return;
  const started=performance.now();promptCheckpointTiming.batches++;
  // Read every candidate before writing any hide: no read/write layout loop.
  const plans=[];
  for(const control of batch){
   if(!control.isConnected)continue;
   promptCheckpointTiming.checks++;
   const target=window.FproNoapp&&window.FproNoapp.target?window.FproNoapp.target(control):safeAppPromptTarget(control);
   plans.push([control,target]);
  }
  for(const [control,target] of plans){if(target){applyPromptTarget(target);promptCheckpointTiming.hidden++;}else if(appPromptOwned.has(control))restoreAppPrompt(control);}
  promptCheckpointTiming.maxMs=Math.max(promptCheckpointTiming.maxMs,Math.round((performance.now()-started)*10)/10);
 }
 function appBanner(link) {
  const control=appPromptOwned.has(link)?link:link&&link.closest('a,button,[role="button"],[role="link"]');
  const target=window.FproNoapp&&window.FproNoapp.target?window.FproNoapp.target(link):safeAppPromptTarget(link);
  if(target){
   applyPromptTarget(target);return true;
  }else if(control&&control.hasAttribute('data-fpro-app-prompt'))restoreAppPrompt(control);
  return false;
 }
 // One urgent check, then one coalesced read/write checkpoint before paint.
 function queueAppBanner(el){
  if(!el||!el.isConnected)return false;
  const target=window.FproNoapp&&window.FproNoapp.target?window.FproNoapp.target(el,true):safeAppPromptTarget(el,true);
  if(!target){if(appPromptOwned.has(el))appBanner(el);return false;}
  if(pendingAppPrompts.size<48)pendingAppPrompts.add(target);
  if(appPromptFrame===null)appPromptFrame=requestAnimationFrame(()=>{
   appPromptFrame=null;promptUrgentUsed=false;promptCheckpointUsed=false;flushPromptCheckpoint();
  });
  if(!promptCheckpointQueued&&!promptCheckpointUsed){
   promptCheckpointQueued=true;Promise.resolve().then(()=>{promptCheckpointQueued=false;if(promptCheckpointUsed||!pendingAppPrompts.size)return;promptCheckpointUsed=true;flushPromptCheckpoint();});
  }
  const known=appPromptOwned.has(target),rewrite=known&&target.style.getPropertyPriority('display')==='important'&&target.style.getPropertyValue('display')!=='none';
  if(!promptUrgentUsed&&(rewrite||!known&&!promptUrgentSeen.has(target)&&!target.closest('[data-fpro-app-prompt],[data-fpro-reference-noapp]'))){
   promptUrgentUsed=true;promptUrgentSeen.add(target);const started=performance.now();promptUrgentTiming.checks++;
   if(appBanner(target))promptUrgentTiming.hidden++;
   promptUrgentTiming.maxMs=Math.max(promptUrgentTiming.maxMs,Math.round((performance.now()-started)*10)/10);
  }
  return true;
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
  let changed=false;const target=rgbColor(pageAccent());if(!target)return {changed:false,value};
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
 function avatarCanvasPairs(pictures=avatarPictures()){
  const pairs=[],seen=new Set();
  for(const photo of pictures.slice(0,12)){
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
  const color=pageAccent(), rgb=[0,2,4].map(i=>parseInt(color.slice(1+i,3+i),16)/255), base=24/255;
  const check=cfg.color==='أبيض'?0:1;
  const values=rgb.flatMap(c=>{const a=(check-c)/(1-base);return [a,0,0,0,c-a*base];}).concat([0,0,0,1,0]).join(' ');
  const flood=iconDefs.querySelector('feFlood');if(flood.getAttribute('flood-color')!==color)flood.setAttribute('flood-color',color);
  const matrix=iconDefs.querySelector('feColorMatrix');if(matrix.getAttribute('values')!==values)matrix.setAttribute('values',values);
  if(!iconDefs.isConnected)document.body.appendChild(iconDefs);
 }
 function tint() {
  if (document.hidden || cfg.color==='طبيعي' || !pageAccent()) return;
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
  const avatars=avatarPictures();
  for(const photo of avatars){
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
  const foreground=cfg.dark?pageAccent():(LIGHT_MODE_FG[cfg.color]||pageAccent());
  const properties={fg:['color',foreground],border:['border-color',foreground],outline:['outline-color',pageAccent()],fill:['fill',foreground],stroke:['stroke',foreground]};
  for(const el of next)for(const [attr,[key,value]] of Object.entries(properties)){
   if(!el.hasAttribute('data-fpro-accent-'+attr))continue;
   if(el.style.getPropertyPriority(key)==='important')tintVar(el,key,value,'important');
   if(attr==='border')for(const side of ['top','right','bottom','left']){const prop='border-'+side+'-color';if(el.style.getPropertyPriority(prop)==='important'&&blue(el.style.getPropertyValue(prop)))tintVar(el,prop,value,'important');}
  }
  // A separate canvas with an empty center can draw a story ring while all
  // computed border/background/SVG fields are empty. Never filter a canvas
  // that contains portrait/media pixels or cannot be read safely.
  if(cfg.experimentalColorVars)for(const {canvas,photo} of avatarCanvasPairs(avatars)){
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
 function scan(force=false) {
  if(cfg.enhance===false||document.hidden)return;
  if(!force&&interactionBusy()){workStats.deferred++;requestScan(300);return;}
  const started=performance.now();
  if(deferredColors.size){const roots=Array.from(deferredColors).filter(el=>el.isConnected);deferredColors.clear();workStats.queuedColorRoots=0;const records=roots.map(el=>({type:'childList',target:el,addedNodes:[el]}));fastHashtags(records);fastReferenceColors(records);}
  if(Array.from(selectionOverrides.keys()).some(el=>!el.isConnected))restoreSelectionOverrides();
  if(window.FproColor&&window.FproColor.prune)window.FproColor.prune();
  if(window.FproNoapp&&window.FproNoapp.prune)window.FproNoapp.prune();
  hidingPass=new Set();
  const referencePrompts=!!(cfg.referenceEngine&&window.FproNoapp);
  const filtering=(cfg.appBanner&&!referencePrompts)||Object.keys(words).some(key=>cfg[key]);
  const labels = filtering?document.querySelectorAll('a,span,abbr,strong,b,button,[role="button"],[role="link"],div[dir="auto"],[role="heading"],[aria-label]'):[];
  for (let i=0;i<Math.min(labels.length,2400);i++) {
   const label=labels[i]; if(label.closest('.fpro-video-tools')) continue;
   const text=norm(label.getAttribute('aria-label') || label.textContent);
   const appText=text.replace(/^(facebook|فيسبوك|f)\s*/,'').replace(/\s*(facebook|فيسبوك|f)$/,'');
   if(cfg.appBanner && !referencePrompts && (isAppPrompt(text)||isAppPrompt(appText))) appBanner(label,true);
   if(!text || text.length>100) continue;
   for(const key of Object.keys(words)) if((cfg[key]) && words[key].some(w=>text===norm(w))) hide(section(label,key));
  }
  if(cfg.ads) document.querySelectorAll('a[href*="/ads/about/"],[data-ad-rendering-role="sponsored_label"],[data-sponsored="true"]').forEach(el=>hide(postFor(el)));
  if(cfg.stories) document.querySelectorAll('[data-pagelet*="Stories"],[data-sigil~="m-story-tray"],[aria-label="Stories"],[aria-label="القصص"]').forEach(el=>hide(section(el,'stories') || el));
  if(cfg.appBanner&&!referencePrompts) Array.from(document.querySelectorAll('a[href],button,[role="button"],[role="link"]')).slice(0,800).forEach(link=>appBanner(link));
  if(cfg.stories) document.querySelectorAll('a[href*="/stories/"]').forEach(link=>hide(section(link,'stories') || link));
  if((cfg.homeStories||cfg.stories)&&homeView())hideHomeStories();
  // Discovery limits must not revoke a previously verified CTA merely because
  // feed growth moved it beyond the general candidate window.
  if(cfg.appBanner&&!referencePrompts)for(const owned of Array.from(appPromptOwned)){
   if(!owned.isConnected)restoreAppPrompt(owned);
   else if(!hidingPass.has(owned))appBanner(owned);
  }
  adaptedSitePass([document.body],false);
  hidden.forEach((old,el)=>{if(!hidingPass.has(el)){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');el.removeAttribute('data-fpro-hidden');el.removeAttribute('data-fpro-app-prompt');appPromptOwned.delete(el);hidden.delete(el);}});
  hidingPass=null;
  tint();
  if(cfg.referenceEngine&&window.FproColor){
   window.FproColor.set({recolor:!!pageAccent()&&cfg.color!=='طبيعي',uiAccent:pageAccent()||'#D4AF37'});window.FproColor.pass();
  }
  if(window.FproNoapp){if(referencePrompts){window.FproNoapp.set({noOpenApp:!!cfg.appBanner});window.FproNoapp.hunt();}else window.FproNoapp.restore();}
  videos.forEach((entry,video)=>{if(!video.isConnected || (!cfg.downloads && !cfg.rainbow)) {entry.dispose(); videos.delete(video);}});
  if(cfg.downloads || cfg.rainbow) document.querySelectorAll('video').forEach(attachVideo);
  layoutVideos();
  syncStoryImages();
  lastScanFinished=performance.now();workStats.scans++;workStats.lastScanMs=Math.round(lastScanFinished-started);workStats.maxScanMs=Math.max(workStats.maxScanMs,workStats.lastScanMs);
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
 function playerViewportBottom(){
  const size=window.__fproViewport;
  const vv=window.visualViewport;
  const cssWidth=vv&&vv.scale>1?vv.width:innerWidth;
  const measured=size&&size.width>0&&size.height>0?size.height*cssWidth/size.width:innerHeight;
  const bottom=Number.isFinite(measured)&&measured>0?measured:innerHeight;
  const keyboard=vv&&vv.height<innerHeight*.75&&document.activeElement&&document.activeElement.matches('input,textarea,[contenteditable="true"]');
  return keyboard?Math.min(bottom,vv.offsetTop+vv.height):bottom;
 }
 function immersivePlayer(video,rect){
  if(rect.width<Math.min(280,innerWidth*.6)||rect.height<=60)return false;
  if(/^\/(?:reels?|watch|videos?)(?:\/|\.php|$)/.test(location.pathname)||document.fullscreenElement)return true;
  // Real account evidence: the same viewport-sized Reel also appears on a
  // non-Reels URL. Identify its isolated player frame, not the pathname alone.
  if(rect.width<innerWidth*.9)return false;
  const bottom=playerViewportBottom();
  let root=video.parentElement;
  for(let depth=0;root&&depth<8;depth++,root=root.parentElement){
   if(root.matches('body,html,[role="feed"]'))break;
   const r=root.getBoundingClientRect();
   if(r.width<innerWidth*.9||Math.abs(r.left)>12||r.top>16||r.top< -64||r.height<bottom*.85||r.height>bottom+64||r.bottom<bottom-40)continue;
   const live=Array.from(root.querySelectorAll('video')).filter(v=>{const b=v.getBoundingClientRect();return rendered(v)&&b.width>0&&b.height>0&&b.bottom>0&&b.top<bottom;});
   if(live.length===1&&live[0]===video)return true;
   if(live.length>1)return false;
  }
  return false;
 }
 function seekVisualSurface(el,rect){
  const parent=el.parentElement;
  if(!parent||!parent.matches('div,span')||parent.closest('.fpro-video-tools')||parent.textContent.trim())return el;
  if(parent.querySelector('button,a,[role="button"],video,textarea,select,[contenteditable],input:not([type="range"])'))return el;
  const controls=parent.querySelectorAll('input[type="range"],[role="slider"],[role="progressbar"]');
  if(controls.length!==1||controls[0]!==el)return el;
  const r=parent.getBoundingClientRect();
  // The diagnostic's gray paint surface is a DIV matching the transparent input.
  // Hide this tightly bounded surface, never a caption/player/actions container.
  return r.height>0&&r.height<=40&&['left','top','width','height'].every(k=>Math.abs(r[k]-rect[k])<=3)?parent:el;
 }
 function nativeSeekControl(video,rect,viewportBottom){
  const immersive=immersivePlayer(video,rect),candidates=new Map();
  let root=video.parentElement;
  for(let depth=0;root&&depth<8;depth++,root=root.parentElement){
   if(root.matches('body,html,[role="feed"]'))break;
   const pageRoot=root.matches('main,[role="main"]');
   if(pageRoot&&!immersive)break;
   // A sibling footer is eligible only in this player's single-visible-video scope.
   const live=Array.from(root.querySelectorAll('video')).filter(v=>{const r=v.getBoundingClientRect();return rendered(v)&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;});
   if(live.some(v=>v!==video))break;
   for(const el of Array.from(root.querySelectorAll('input[type="range"],[role="slider"],[role="progressbar"],[aria-valuemin][aria-valuemax]')).slice(0,24)){
    if(el.closest('.fpro-video-tools')||candidates.has(el))continue;
    const label=[el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('aria-valuetext')].filter(Boolean).join(' ');
    if(/volume|sound|brightness|صوت|سطوع/i.test(label))continue;
    const r=el.getBoundingClientRect(),c=getComputedStyle(el);
    if(c.display==='none'||(c.visibility==='hidden'&&!el.hasAttribute('data-fpro-native-seek')))continue;
    // A transparent semantic range is the site's live hit area, not an absent slider.
    if(c.opacity==='0'&&!el.matches('input[type="range"],[role="slider"]'))continue;
    const named=/seek|progress|playback|timeline|تقدم|تقدّم|تقديم|موضع|وقت|مدة/i.test(label)||/\d{1,2}:\d{2}/.test(label);
    const bottomSlot=immersive&&r.top>=viewportBottom-90&&r.width>=rect.width*.65;
    // A full-width semantic range in an isolated player footer is eligible even
    // with an unfamiliar localized label. Diagnostic booleans do not reveal
    // whether an unrecognized label exists. Volume exclusions still apply.
    if(!named&&!(bottomSlot&&el.matches('input[type="range"],[role="slider"],[role="progressbar"]')))continue;
    const nearVideo=r.top>=rect.bottom-100&&r.top<=rect.bottom+100;
    if(r.width>=Math.min(100,rect.width*.4)&&r.height>0&&r.height<=40&&(immersive?bottomSlot:nearVideo)&&r.bottom>0&&r.bottom<=viewportBottom&&r.left>=rect.left-4&&r.right<=rect.right+4)candidates.set(el,{el,rect:r,surface:seekVisualSurface(el,r)});
   }
   if(pageRoot||(!immersive&&root.matches('article,[role="article"],[role="dialog"]')))break;
  }
  const list=Array.from(candidates.values());
  // Prefer the isolated footer; refuse ambiguous controls rather than hide both.
  const footer=list.filter(c=>immersive&&c.rect.top>=viewportBottom-90);
  return footer.length===1?footer[0]:list.length===1?list[0]:null;
 }
 function attachVideo(video) {
  if(videos.has(video)) return;
  const store=video.closest('[data-store]');identityBaseline.set(video,{source:signature(video),link:rawPermalink(video),store:store?store.getAttribute('data-store'):null});
  const overlay=document.createElement('div'); overlay.className='fpro-video-tools';
  const button=document.createElement('button'); button.className='fpro-download';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" focusable="false"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';button.setAttribute('aria-label','تنزيل الفيديو');
  const track=document.createElement('div');track.className='fpro-track';
  const fill=document.createElement('div');fill.className='fpro-fill';
  const ball=document.createElement('span');ball.className='fpro-ball';ball.setAttribute('aria-hidden','true');ball.textContent='⚽️';fill.appendChild(ball);track.appendChild(fill);
  const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.className='fpro-seek';seek.setAttribute('aria-label','تقدم الفيديو');track.appendChild(seek);
  const transport=document.createElement('div');transport.className='fpro-transport';transport.hidden=true;
  const toggle=document.createElement('button');toggle.type='button';toggle.setAttribute('aria-label','تشغيل الفيديو');
  const soundButton=document.createElement('button');soundButton.type='button';soundButton.setAttribute('aria-label','كتم الصوت');
  const clock=document.createElement('span');clock.className='fpro-clock';clock.dir='ltr';
  const fullButton=document.createElement('button');fullButton.type='button';fullButton.textContent='⛶';fullButton.setAttribute('aria-label','ملء الشاشة');
  transport.append(toggle,soundButton,clock,fullButton);
  toggle.onclick=e=>{e.stopPropagation();if(video.paused){const request=video.play();if(request&&request.catch)request.catch(()=>progress());}else video.pause();};
  soundButton.onclick=e=>{e.stopPropagation();video.muted=!video.muted;if(!video.muted&&video.volume===0)video.volume=1;progress();};
  fullButton.onclick=e=>{e.stopPropagation();enterFullscreen(video);};
  let ownsControls=false;
  const controlsObserver=new MutationObserver(()=>{if(ownsControls&&video.controls)video.controls=false;});
  function releaseControls(){controlsObserver.disconnect();if(ownsControls){ownsControls=false;video.controls=true;}transport.hidden=true;}
  function replaceControls(active){
   if(!active){releaseControls();return;}
   // This branch runs only when HTMLVideoElement itself owns native controls.
   // CSS cannot reliably select WebView's closed media-control shadow tree.
   if(!ownsControls&&video.controls){ownsControls=true;controlsObserver.observe(video,{attributes:true,attributeFilter:['controls']});video.controls=false;}
   transport.hidden=!ownsControls;
  }
  overlay.appendChild(button);overlay.appendChild(track);overlay.appendChild(transport);document.documentElement.appendChild(overlay);
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
  function progress(){const valid=Number.isFinite(video.duration)&&video.duration>0;const fraction=valid?Math.max(0,Math.min(1,video.currentTime/video.duration)):0;fill.style.transition=video.paused||video.seeking?'none':'width 240ms linear';fill.style.width=(fraction*100)+'%';seek.value=String(Math.round(fraction*1000));seek.disabled=!valid;
   const time=value=>{const n=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
   clock.textContent=time(video.currentTime)+' / '+(valid?time(video.duration):'—');toggle.textContent=video.paused?'▶':'❚❚';toggle.setAttribute('aria-label',video.paused?'تشغيل الفيديو':'إيقاف مؤقت');soundButton.textContent=video.muted||video.volume===0?'🔇':'🔊';soundButton.setAttribute('aria-label',video.muted?'إلغاء كتم الصوت':'كتم الصوت');
   ball.style.animationPlayState=valid&&!video.paused&&!video.ended?'running':'paused';seek.setAttribute('aria-valuetext',valid?Math.floor(video.currentTime)+' / '+Math.floor(video.duration)+' ثانية':'بث مباشر أو مدة غير متاحة');}
  seek.oninput=e=>{e.stopPropagation();if(Number.isFinite(video.duration)&&video.duration>0){try{video.currentTime=Number(seek.value)/1000*video.duration;}catch(_){}progress();}};
  seek.onclick=e=>e.stopPropagation();
  const events=['timeupdate','durationchange','loadedmetadata','seeking','ended','emptied','play','pause','volumechange'];events.forEach(name=>video.addEventListener(name,progress));
  video.addEventListener('play',scheduleLayout);video.addEventListener('pause',scheduleLayout);
  if(resize)resize.observe(video);
  let nativeTrack=null,nativeSurface=null,nextSeekProbe=0,seekRoute='';
  function releaseNativeTrack(){if(nativeTrack)nativeTrack.removeAttribute('data-fpro-native-seek');if(nativeSurface)nativeSurface.removeAttribute('data-fpro-native-seek');nativeTrack=null;nativeSurface=null;}
  videos.set(video,{layout(allowed=true,dialog=visibleDialog()){
   if(!allowed){overlay.hidden=true;releaseControls();releaseNativeTrack();video.removeAttribute('data-fpro-rainbow');return;}
   const r=video.getBoundingClientRect();overlay.hidden=!(r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth) || !!(dialog&&!dialog.contains(video));
   if(cfg.rainbow&&!overlay.hidden){if(!video.hasAttribute('data-fpro-rainbow'))video.setAttribute('data-fpro-rainbow','');}else video.removeAttribute('data-fpro-rainbow');
   overlay.style.left=r.left+'px';overlay.style.top=r.top+'px';overlay.style.width=r.width+'px';
   const viewportBottom=playerViewportBottom();
   const immersive=immersivePlayer(video,r);
   replaceControls(immersive&&cfg.rainbow&&!overlay.hidden);
   let bottom=immersive?viewportBottom:r.bottom;
   let native=null;
   if(seekRoute!==location.pathname){seekRoute=location.pathname;nextSeekProbe=0;}
   if(!cfg.rainbow)nextSeekProbe=0;
   if(!overlay.hidden&&cfg.rainbow){
    // Cache discovery, not coordinates: scrolling still reads fresh slot geometry.
    // Whole-player queries on every animation frame caused avoidable rendering work.
    if(nativeTrack&&nativeTrack.isConnected){const nr=nativeTrack.getBoundingClientRect();const label=[nativeTrack.getAttribute('aria-label'),nativeTrack.getAttribute('title')].filter(Boolean).join(' ');if(!/volume|sound|brightness|صوت|سطوع/i.test(label)&&nr.width>0&&nr.height>0&&nr.bottom<=viewportBottom&&(!immersive||nr.top>=viewportBottom-90))native={el:nativeTrack,rect:nr,surface:seekVisualSurface(nativeTrack,nr)};}
    if(performance.now()>=nextSeekProbe){native=nativeSeekControl(video,r,viewportBottom);nextSeekProbe=performance.now()+1000;}
   }
   if(nativeTrack!==(native&&native.el)||nativeSurface!==(native&&native.surface)){releaseNativeTrack();if(native){nativeTrack=native.el;nativeSurface=native.surface;nativeTrack.setAttribute('data-fpro-native-seek','');nativeSurface.setAttribute('data-fpro-native-seek','');}}
   // Replace only a confidently identified time slider, never volume/play/account controls.
   // Keep its layout slot so the site does not jump; restore it when our tools leave.
   if(native)bottom=Math.min(viewportBottom,native.rect.top+native.rect.height/2+13.5);
   overlay.style.height=Math.max(0,bottom-r.top)+'px';
   // Anchor the seek surface in viewport coordinates, independent of video height
   // and any site's inherited bottom/position rules on player descendants.
   track.style.setProperty('position','fixed','important');track.style.setProperty('top',(bottom-32)+'px','important');track.style.setProperty('left',(r.left+16)+'px','important');track.style.setProperty('width',Math.max(0,r.width-32)+'px','important');track.style.setProperty('right','auto','important');track.style.setProperty('bottom','auto','important');
   transport.style.setProperty('position','fixed','important');transport.style.setProperty('top',(bottom-66)+'px','important');transport.style.setProperty('left',(r.left+16)+'px','important');transport.style.setProperty('width',Math.max(0,r.width-32)+'px','important');
   button.hidden=!cfg.downloads;track.hidden=!cfg.rainbow||overlay.hidden;placeButton();progress();
  },dispose(){releaseControls();releaseNativeTrack();video.removeAttribute('data-fpro-rainbow');video.removeEventListener('play',scheduleLayout);video.removeEventListener('pause',scheduleLayout);if(resize)resize.unobserve(video);clearTimeout(timer);events.forEach(name=>video.removeEventListener(name,progress));overlay.remove();}});

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
 // null means a completed search found no dialog; do not search again per video.
 function visibleDialog(){return Array.from(document.querySelectorAll('[role="dialog"]')).find(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';}) || null;}
 function layoutVideos(){
  if(!videos.size)return;
  const dialog=visibleDialog();
  const candidates=Array.from(videos.keys()).map((video,index)=>{const r=video.getBoundingClientRect();const w=Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left)),h=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top));
   if(w*h<=0)return {video,r,index,visible:false,score:0};
   const stack=document.elementsFromPoint?document.elementsFromPoint(Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.top+r.height/2))):[];
   const hit=stack.indexOf(video);return {video,r,index,visible:w*h>0&&rendered(video),score:(hit>=0?100000-hit*100:0)+(!video.paused?1000:0)+w*h/10000+index/1000};
  }).filter(c=>c.visible).sort((a,b)=>b.score-a.score);
  const chosen=[];
  for(const c of candidates){const overlaps=chosen.some(b=>{const area=Math.max(0,Math.min(c.r.right,b.r.right)-Math.max(c.r.left,b.r.left))*Math.max(0,Math.min(c.r.bottom,b.r.bottom)-Math.max(c.r.top,b.r.top));return area>Math.min(c.r.width*c.r.height,b.r.width*b.r.height)*.55;});if(!overlaps)chosen.push(c);}
  videos.forEach((entry,video)=>entry.layout(chosen.some(c=>c.video===video),dialog));
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
  requestScan(350,true);
  if(frame===null)frame=requestAnimationFrame(()=>{frame=null;layoutVideos();syncStoryImages();});
 }
 window.addEventListener('scroll',scheduleLayout,true);window.addEventListener('resize',scheduleLayout);window.addEventListener('fproviewportchange',scheduleLayout);window.addEventListener('popstate',scheduleLayout);window.addEventListener('hashchange',scheduleLayout);
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(scheduleLayout):null;
 function update(c){
  if(JSON.stringify(cfg)===JSON.stringify(c)&&(window.__fpro&&window.__fpro.ready)){updateSelection();scan();return;}
  window.__fpro.ready=true;
  if(window.FproColor)window.FproColor.off();
  // Preserve reference ownership across ON->ON updates. scan(true) below
  // performs the immediate hunt AFTER the new configuration/CSS is installed.
  if(window.FproNoapp){if(c.enhance!==false&&c.referenceEngine&&c.appBanner)window.FproNoapp.set({noOpenApp:true});else window.FproNoapp.restore();}
  deferredColors.clear();workStats.queuedColorRoots=0;
  clearAdaptedMarkers();cfg=c;updateSelection();iconDefs.remove();restoreTintVars();style.textContent='';restoreHidden();painted.forEach(el=>accentAttrs.forEach(k=>el.removeAttribute('data-fpro-accent-'+k)));painted.forEach(el=>el.removeAttribute('data-fpro-surface'));painted.clear();
  if(c.enhance===false){observer.disconnect();observingDocument=false;if(resize)resize.disconnect();videos.forEach(entry=>entry.dispose());videos.clear();storyImages.forEach(tools=>tools.remove());storyImages.clear();style.remove();lastTap=null;touch=null;return;}
  if(resize)resize.observe(document.body);
  if(!style.isConnected)document.head.appendChild(style);
  // The body/head can be replaced during site navigation. Observe the stable
  // Document with the SAME observer, rather than retaining a detached body.
  observer.observe(document,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-modal','open','role','tabindex','href','src','data-story-id','data-store','data-video-id','class','style','stroke','fill']});
  observingDocument=true;
  const accent=c.color==='طبيعي'?null:pageAccent(c);
  const foreground=c.dark?accent:(LIGHT_MODE_FG[c.color] || accent);
  const contrast=['ذهبي','فضي','أبيض','برتقالي'].includes(c.color)?'#111':'#fff';
  // Compute blue accents before applying our overrides. Never recolor photographs.
  tint();
  // Optional RC experiment: reversible token overrides, never rewrite Meta's
  // stylesheets/inline declarations or its primary-icon/surface tokens.
  const rcTokens=c.experimentalColorVars && accent && c.color!=='طبيعي'
   ? `:root,body,.__fb-light-mode,.__fb-dark-mode{${['--accent','--primary-blue','--blue-link','--primary-button-background','--primary-deemphasized-button-text'].map(key=>key+':'+accent+'!important').join(';')};--primary-button-text:${contrast}!important}` : '';
  style.textContent=`
   ${rcTokens}
   body{-webkit-user-select:text!important}
   /* Only policy-verified owned targets. A normal site style rewrite cannot
      expose them between observer delivery and the guarded frame scan. */
   [data-fpro-app-prompt],[data-fpro-reference-noapp]{display:none!important}
   ${accent?`[data-fpro-accent-bg]{background-color:${accent}!important;color:${contrast}!important}[data-fpro-accent-bg] *{color:${contrast}!important}[data-fpro-accent-fg]{color:${foreground}!important}[data-fpro-accent-icon]{filter:url("#fpro-icon-palette")!important}[data-fpro-accent-ring]{background-color:${accent}!important}[data-fpro-accent-outline]{outline-color:${accent}!important}[data-fpro-accent-shadow]{box-shadow:var(--fpro-ring-shadow)!important}[data-fpro-accent-gradient]{background-image:var(--fpro-ring-gradient)!important}[data-fpro-accent-canvas-ring]{filter:url("#fpro-canvas-palette")!important}[data-fpro-accent-svg-bg]{background-image:var(--fpro-ring-svg)!important}[data-fpro-accent-before-svg-bg]::before{background-image:var(--fpro-before-svg)!important}[data-fpro-accent-after-svg-bg]::after{background-image:var(--fpro-after-svg)!important}[data-fpro-accent-stop]{stop-color:${accent}!important}[data-fpro-accent-border]{border-color:${foreground}!important}[data-fpro-accent-fill]{fill:${foreground}!important}[data-fpro-accent-stroke]{stroke:${foreground}!important}`:''}
   ${accent?['before','after'].map(p=>`[data-fpro-accent-${p}-border]::${p}{border-color:${accent}!important}[data-fpro-accent-${p}-outline]::${p}{outline-color:${accent}!important}[data-fpro-accent-${p}-shadow]::${p}{box-shadow:var(--fpro-${p}-shadow)!important}[data-fpro-accent-${p}-bg]::${p}{background-color:${accent}!important}[data-fpro-accent-${p}-gradient]::${p}{background-image:var(--fpro-${p}-gradient)!important}`).join(''):''}
   ${c.dark||c.amoled?`:root,html,body,.__fb-light-mode,.__fb-dark-mode{--web-wash:${c.amoled?'#000':'#18191a'}!important;--surface-background:${c.amoled?'#000':'#242526'}!important;--card-background:${c.amoled?'#000':'#242526'}!important;--comment-background:${c.amoled?'#000':'#3a3b3c'}!important;--nav-bar-background:${c.amoled?'#000':'#242526'}!important;--primary-text:#eee!important;--secondary-text:#bbb!important;color-scheme:dark}html,body,[role="main"],[role="feed"],header,nav,[role="banner"],[role="navigation"],article,[role="article"]{background-color:${c.amoled?'#000':'#18191a'}!important;color:#eee!important}`:''}
   ${c.sticky?'[role="banner"],[data-fpro-adapt-sticky="header"]{position:sticky!important;top:0!important;z-index:1000!important}[data-fpro-adapt-sticky="tabs"]{position:sticky!important;top:var(--fpro-nav-offset,0px)!important;z-index:999!important}':''}
   ${c.reverse?'body{direction:ltr!important}':''}
   .fpro-video-tools{direction:ltr;position:fixed;z-index:10000;pointer-events:none;overflow:hidden}
   .fpro-video-tools[hidden],.fpro-video-tools [hidden]{display:none!important}
   .fpro-download{position:absolute;pointer-events:auto;box-sizing:border-box;display:grid;place-items:center;width:44px!important;height:44px!important;min-width:44px;min-height:44px;padding:0!important;border:1px solid #ffffff80!important;border-radius:50%!important;background:rgba(255,255,255,.12)!important;box-shadow:none!important;color:#fff!important;backdrop-filter:blur(2px);touch-action:none;-webkit-user-select:none;line-height:1}.fpro-download svg{pointer-events:none;color:inherit!important;background:none!important}
   .fpro-transport{direction:ltr!important;display:flex;align-items:center;gap:10px;height:30px;pointer-events:auto;color:white!important;background:transparent!important;font:13px sans-serif;z-index:10001}
   .fpro-transport button{display:grid!important;place-items:center;width:30px!important;height:30px!important;padding:0!important;border:0!important;background:transparent!important;color:white!important;font:18px sans-serif!important;cursor:pointer}
   .fpro-clock{margin-left:auto!important;color:white!important;font:13px sans-serif!important;text-shadow:0 1px 2px #000;white-space:nowrap}
   .fpro-track{position:absolute;bottom:0;left:16px;right:16px;height:32px;overflow:visible!important;pointer-events:auto;background:transparent!important;box-shadow:none!important;border:0!important}
   .fpro-fill{position:absolute;overflow:visible!important;bottom:12px;left:0;height:3px;border-radius:4px;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet);width:0}
   .fpro-ball{position:absolute;right:-10px;top:-8.5px;width:20px!important;height:20px!important;display:block!important;font-family:"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif!important;font-size:16px!important;line-height:20px!important;text-align:center!important;overflow:visible!important;animation:fpro-ball-roll 3s linear infinite;animation-play-state:paused;transform-origin:50% 50%;will-change:transform;backface-visibility:hidden;pointer-events:none}
   @keyframes fpro-ball-roll{from{transform:translateZ(0) rotate(0deg)}to{transform:translateZ(0) rotate(360deg)}}
   [data-fpro-native-seek],[data-fpro-native-seek] *{visibility:hidden!important;pointer-events:none!important}
   video[data-fpro-rainbow]::-webkit-media-controls-timeline{display:none!important}
   .fpro-seek{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:auto;touch-action:pan-y}
  `;
  scan(true);
 }
 // Mutation callbacks run before the next paint. Give only newly changed
 // hashtag nodes a tiny fast path; keep the expensive feed scan debounced.
 const fastHashes=new WeakSet();
 function fastHashtags(records){
  if(!document||document.hidden||cfg.enhance===false||cfg.color==='طبيعي'||!pageAccent())return;
  const roots=new Set(),addedRoots=new Set();
  for(const record of records){
   if(record.type==='childList'){for(const n of record.addedNodes)if(n.nodeType===1){roots.add(n);addedRoots.add(n);}else if(n.nodeType===3&&n.parentElement)roots.add(n.parentElement);if(record.target.nodeType===1)roots.add(record.target);}
   else roots.add(record.target.nodeType===1?record.target:record.target.parentElement);
  }
  const budget={remaining:384};
  for(const root of roots){
   if(budget.remaining--<=0)break;
   if(!root||root.closest('#fpro-style,#fpro-selection-style,#fpro-icon-filter,.fpro-video-tools'))continue;
   const nodes=[root];
   // Descend only added fragments; a character/style mutation is local.
   if(addedRoots.has(root))for(const n of boundedElements(root,'span,a,[role="link"]',384,budget))nodes.push(n);
   for(const el of nodes){
    if(!el.matches('span,a,[role="link"]'))continue;
    const text=norm(el.textContent),href=el.getAttribute('href')||'';
    const hashtag=/(?:\/hashtag\/|[?&]hashtag=)/i.test(href)||/^#[^\s#]+$/.test(text);
    if(hashtag){
     el.setAttribute('data-fpro-accent-fg','');painted.add(el);fastHashes.add(el);
     if(el.style.getPropertyPriority('color')==='important'){
      const fg=cfg.dark?pageAccent():(LIGHT_MODE_FG[cfg.color]||pageAccent());
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
 function fastReferenceColors(records,skipColor=false){
  if(document.hidden)return;
  const roots=new Set(),local=new Set(),wrappers=new Set();
  const add=(set,el)=>{if(el&&el.nodeType===1&&!/^fpro/i.test(el.id)&&!el.closest('#fpro-reference-svg,.fpro-video-tools'))set.add(el);};
  for(const record of records){
   if(record.type==='attributes'){add(local,record.target);if(['class','style','aria-modal','open','role'].includes(record.attributeName)&&!record.target.matches('html,head,body,a,button,[role="button"],[role="link"]'))add(wrappers,record.target);}
   else if(record.type==='characterData'){const el=record.target.parentElement;add(local,el&&(el.closest('a,button,[role="button"],[role="link"]')||el));}
   else if(record.type==='childList'){if(record.target.nodeType===1){if(record.target.matches('style'))add(local,record.target);else add(local,record.target.closest('a,button,[role="button"],[role="link"]'));}for(const node of record.addedNodes){if(node.nodeType===3)add(local,record.target);else add(roots,node);}}
  }
  const apply=(list,selfOnly,promptsOnly=false,usePriority=false)=>{
   if(!list.length)return;
   if(cfg.appBanner){
    if(cfg.referenceEngine&&window.FproNoapp)window.FproNoapp.scan(list,true,selfOnly,usePriority);
    else {for(const control of appPromptOwned)if(list.some(root=>root.contains(control)||control.contains(root)))queueAppBanner(control);let budget=48;for(const root of list){const nodes=selfOnly?[root]:[usePriority?priorityPrompt(root):null,root,...boundedElements(root,'a,button,[role="button"],[role="link"]')];for(const el of nodes){if(budget<=0)break;if(queueAppBanner(el))budget--;}}}
   }
   if(!promptsOnly&&!skipColor&&cfg.referenceEngine&&window.FproColor)window.FproColor.pass(list,true,selfOnly);
  };
  // Newly inserted direct controls must not sit behind a batch of feed text
  // roots: install CTAs remain cheap/urgent even while selection is held.
  const directControls=Array.from(roots).filter(el=>el.matches('a,button,[role="button"],[role="link"]'));
  // Progressive network hydration can add Search/profile AFTER the CTA. Its
  // own text need not mutate again; inspect the newly verified sibling scope.
  const navigationRoots=new Set();
  if(cfg.appBanner)for(const control of [...directControls,...local].slice(0,24)){
   if(!control.isConnected||!control.matches('a,button,[role="button"],[role="link"]'))continue;
   for(let parent=control.parentElement,depth=0;parent&&parent!==document.body&&depth<3;parent=parent.parentElement,depth++)if(appNavigationSurface(parent)){if(navigationRoots.size<4)navigationRoots.add(parent);break;}
  }
  if(cfg.appBanner)apply(Array.from(navigationRoots),false,true);
  apply([...directControls,...local].slice(0,24),true);apply(Array.from(roots).slice(0,4),false,false,true);
  // A wrapper can become eligible without changing the nested button at all.
  // Reuse the bounded prompt path, not a subtree recoloring pass.
  if(cfg.appBanner)apply(Array.from(wrappers).slice(0,4),false,true);
 }
 const observer=new MutationObserver(records=>{
  if(!document||cfg.enhance===false)return;
  const relevant=records.filter(r=>{if(r.type==='childList'){const changes=[...r.addedNodes,...r.removedNodes];if(changes.length&&changes.every(n=>n.nodeType===1&&/^fpro/i.test(n.id)))return false;}const el=r.target.nodeType===1?r.target:r.target.parentElement;if(!el||el.closest('#fpro-style,#fpro-selection-style,#fpro-icon-filter,.fpro-video-tools'))return false;if(!el.hasAttribute('data-fpro-hidden')&&!el.hasAttribute('data-fpro-reference-noapp')&&window.FproColor&&window.FproColor.ownsStyle(el)&&(el.matches('style')||r.type==='attributes'&&r.attributeName==='style'))return false;if(r.type==='attributes'&&r.attributeName==='style'){const hiddenByUs=el.hasAttribute('data-fpro-hidden')||el.hasAttribute('data-fpro-reference-noapp');if(hiddenByUs)return !(el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important');if(ownedStyles.get(el)===el.getAttribute('style'))return false;}return true;});
  if(!relevant.length)return;
  if(interactionBusy()){deferColorRecords(relevant);fastReferenceColors(relevant,true);}
  else {fastHashtags(relevant);fastReferenceColors(relevant);}
  // CSS text/node changes use the SAME observer. External LINK completion is
  // handled by the reference engine's capture listener, without a time cutoff.
  if(cfg.appBanner&&cfg.referenceEngine&&window.FproNoapp&&window.FproNoapp.stylesChanged&&relevant.some(r=>{
   const el=r.target.nodeType===1?r.target:r.target.parentElement;
   return el&&el.matches('style')||r.type==='childList'&&Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.matches('style,link[rel~="stylesheet"]')&&!/^fpro/i.test(n.id));
  }))window.FproNoapp.stylesChanged();
  adaptedSitePass(relevant.filter(r=>r.type==='childList').flatMap(r=>Array.from(r.addedNodes)).filter(n=>n.nodeType===1),true);
  requestScan();
 });
 function colorReport(){
  const report={version:43,work:{...workStats,interactionBusy:interactionBusy(),adapted:{...adaptedStats}},media:window.__fproAudio?window.__fproAudio.report():null,documentStart:window.__fproEarly===true,enhance:cfg.enhance!==false,color:cfg.color,referenceEngine:!!cfg.referenceEngine,experimentalColorVars:cfg.experimentalColorVars===true,experimentalColorVarsActive:cfg.enhance!==false&&cfg.experimentalColorVars===true&&!!pageAccent()&&cfg.color!=='طبيعي',selection:{enabled:cfg.textSelection!==false,cssInstalled:selectionStyle.isConnected,preparedNodes:selectionOverrides.size,lastTarget:{...selectionTargetInfo}},matched:{},avatarSources:{img:0,svg:0,background:0},avatarFrames:[],canvasLayers:[],smallImages:[],remainingBlue:[]};
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
 window.__fpro={update,colorReport,promptState:()=>({enabled:cfg.enhance!==false&&!!cfg.appBanner,enhance:cfg.enhance!==false,filterEnabled:!!cfg.appBanner,reference:!!cfg.referenceEngine,observingDocument,documentHidden:document.hidden,styleConnected:style.isConnected,scans:workStats.scans}),promptTiming:()=>({...promptUrgentTiming,prepaint:{...promptCheckpointTiming},priority:{...priorityPromptTiming}})};update(initial);
})();
