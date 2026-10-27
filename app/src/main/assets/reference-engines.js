/* Adapted from the FproColor / FproNoapp engines supplied by the owner.
 * Corrections: reversible ownership, palette/recycle updates, alpha=0,
 * shorthand preservation, bounded work, and page/media/navigation boundaries.
 * Driven by facebook.js's observer/scheduler; CTA geometry uses one bounded animation-frame batch, no extra observer/polling.
 */
(function () {
 'use strict';
 if(window.FproColor && window.FproNoapp)return;
 var cfg={recolor:false,uiAccent:'#D4AF37'}, noapp={noOpenApp:false};
 var pendingPrompts=new Set(),promptFrame=null,checkpointQueued=false,checkpointUsed=false;
 var urgentUsed=false,urgentSeen=new WeakSet(),urgentTiming={checks:0,hidden:0,maxMs:0},checkpointTiming={batches:0,checks:0,hidden:0,maxMs:0};
 var paints=new Map(), hidden=new Map(), checkedSheets=new WeakMap(), checkedAttrs=new WeakMap();
 function rgb(hex){var m=/^#([0-9a-f]{6})$/i.exec(hex||'');return m?[0,2,4].map(function(i){return parseInt(m[1].slice(i,i+2),16);}):null;}
 function blue(r,g,b){return b>r+40&&b>g+20&&Math.max(r,g,b)-Math.min(r,g,b)>60&&b>100;}
 function nodes(roots,selector,selfOnly,limit){
  if(selfOnly)return (roots||[]).filter(function(root){return root&&root.nodeType===1&&root.matches(selector);}).slice(0,limit||100000);
  if(limit){
   var out=new Set(),visited=0;
   for(var root of (roots&&roots.length?roots:[document.documentElement])){
    if(!root||root.nodeType!==1)continue;
    if(root.matches(selector))out.add(root);
    var walk=document.createTreeWalker(root,1),el;
    while(visited++<limit&&(el=walk.nextNode()))if(el.matches(selector))out.add(el);
    if(visited>=limit)break;
   }
   return Array.from(out);
  }
  if(!roots||!roots.length)return document.querySelectorAll(selector);
  var all=new Set();roots.forEach(function(root){if(!root||root.nodeType!==1)return;if(root.matches(selector))all.add(root);root.querySelectorAll(selector).forEach(function(el){all.add(el);});});return Array.from(all);
 }
 function own(el){return el.closest('#fpro-style,#fpro-selection-style,#fpro-icon-filter,#fpro-reference-css,#fpro-reference-svg,.fpro-video-tools');}
 function mergedOriginal(record,current){
  var now=document.createElement('span'),before=document.createElement('span'),after=document.createElement('span');
  now.setAttribute('style',current||'');before.setAttribute('style',record.original||'');after.setAttribute('style',record.applied||'');
  var keys=new Set(Array.from(before.style).concat(Array.from(after.style)));
  keys.forEach(function(key){var changed=before.style.getPropertyValue(key)!==after.style.getPropertyValue(key)||before.style.getPropertyPriority(key)!==after.style.getPropertyPriority(key);
   if(changed&&now.style.getPropertyValue(key)===after.style.getPropertyValue(key)&&now.style.getPropertyPriority(key)===after.style.getPropertyPriority(key)){
    if(before.style.getPropertyValue(key))now.style.setProperty(key,before.style.getPropertyValue(key),before.style.getPropertyPriority(key));else now.style.removeProperty(key);
   }
  });return now.getAttribute('style');
 }
 function write(el,kind,value){
  var read=function(){return kind==='sheet'?el.textContent:el.getAttribute('style');}, current=read(), record=paints.get(el);
  if(record&&current!==record.applied){record.original=kind==='attr'?mergedOriginal(record,current):current;record.kind=kind;}
  if(current===value)return;
  if(!record){record={kind:kind,original:current};paints.set(el,record);}
  if(kind==='sheet')el.textContent=value;else if(value===null)el.removeAttribute('style');else el.setAttribute('style',value);
  record.applied=read();
 }
 function restorePaint(){paints.forEach(function(record,el){var current=record.kind==='sheet'?el.textContent:el.getAttribute('style');if(current!==record.applied){if(record.kind==='attr'){var original=mergedOriginal(record,current);if(original===null)el.removeAttribute('style');else el.setAttribute('style',original);}return;}if(record.kind==='sheet')el.textContent=record.original;else if(record.original===null)el.removeAttribute('style');else el.setAttribute('style',record.original);});paints.clear();checkedSheets=new WeakMap();checkedAttrs=new WeakMap();}
 function prunePaint(){
  paints.forEach(function(record,el){
   if(el.isConnected)return;
   var current=record.kind==='sheet'?el.textContent:el.getAttribute('style');
   if(record.kind==='sheet'){if(current===record.applied)el.textContent=record.original;}
   else {var original=current===record.applied?record.original:mergedOriginal(record,current);if(original===null)el.removeAttribute('style');else el.setAttribute('style',original);}
   paints.delete(el);checkedSheets.delete(el);checkedAttrs.delete(el);
  });
 }
 function replaceColor(value){
  var target=rgb(cfg.uiAccent);if(!target)return value;
  return value.replace(/#[0-9a-f]{6}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/gi,function(color){
   var c=color[0]==='#'?rgb(color):color.match(/[\d.]+/g).map(Number);
   if(!c||!blue(c[0],c[1],c[2]))return color;
   return c.length===4?'rgba('+target.join(',')+','+c[3]+')':cfg.uiAccent;
  });
 }
 function parsedDeclarations(text){
  // Detached style parsing works on older WebViews without constructable sheets.
  var tag=document.createElement('style');tag.id='fpro-reference-parser';tag.media='not all';var nonce=document.querySelector('style[nonce],script[nonce]');if(nonce)tag.nonce=nonce.nonce;tag.textContent=text;document.head.appendChild(tag);
  var changed=false;
  function visit(rules){Array.from(rules||[]).forEach(function(rule){if(rule.style)['background-color','color','border','border-color','border-top','border-right','border-bottom','border-left','border-top-color','border-right-color','border-bottom-color','border-left-color'].forEach(function(key){var before=rule.style.getPropertyValue(key),after=replaceColor(before);if(before!==after){changed=true;rule.style.setProperty(key,after,rule.style.getPropertyPriority(key));}});if(rule.cssRules)visit(rule.cssRules);});}
  try{visit(tag.sheet.cssRules);return changed?Array.from(tag.sheet.cssRules).map(function(rule){return rule.cssText;}).join('\n'):text;}catch(_){return text;}finally{tag.remove();}
 }
 function pass(roots,fast,selfOnly){
  if(!cfg.recolor||document.hidden)return;
  nodes(roots,'style',selfOnly,fast?384:0).forEach(function(st,index){if(index>=(fast?4:120)||fast&&st.textContent.length>32000||own(st)||/^fpro/i.test(st.id))return;var before=st.textContent;if(checkedSheets.get(st)===before)return;var after=parsedDeclarations(before);if(after!==before)write(st,'sheet',after);checkedSheets.set(st,st.textContent);});
  var count=0;for(var el of nodes(roots,'[style]',selfOnly,fast?384:0)){
   if(count>=(fast?24:400))break;if(own(el)||el.matches('img,video,canvas,svg,image'))continue;var before=el.getAttribute('style');if(!/(color|border)/i.test(before)||checkedAttrs.get(el)===before)continue;count++;
   var probe=document.createElement('span');probe.setAttribute('style',before);
   ['background-color','color','border','border-color','border-top','border-right','border-bottom','border-left','border-top-color','border-right-color','border-bottom-color','border-left-color'].forEach(function(key){var old=probe.style.getPropertyValue(key),next=replaceColor(old);if(next!==old)probe.style.setProperty(key,next,probe.style.getPropertyPriority(key));});
   if(probe.style.cssText!==el.style.cssText)write(el,'attr',probe.getAttribute('style'));checkedAttrs.set(el,el.getAttribute('style'));
  }
  if(fast)return; // Never force geometry/layout in a mutation microtask.
  // Owner's labelled-badge matrix: blue -> accent, white check -> white.
  var countBadge=0;for(var badge of nodes(roots,'img[aria-label],img[alt],svg[aria-label],i[aria-label],[data-testid]')){
   if(countBadge++>=150)break;if(own(badge))continue;
   var label=['aria-label','alt','data-testid'].map(function(k){return badge.getAttribute(k)||'';}).join(' ');
   if(label.length>90||!/موثق|تم التحقق|علامة التوثيق|verified|verification badge/i.test(label)||badge.style.filter&&badge.style.filter!=='none')continue;
   var r=badge.getBoundingClientRect();
   if(label.length>90||!/موثق|تم التحقق|علامة التوثيق|verified|verification badge/i.test(label)||r.width>48||r.height>48||badge.querySelector('video,img'))continue;
   if(badge.style.filter&&badge.style.filter!=='none')continue;
   var copy=document.createElement('span');copy.setAttribute('style',badge.getAttribute('style')||'');copy.style.setProperty('filter','url("#fpro-reference-badge")','important');write(badge,'attr',copy.getAttribute('style'));
  }
 }
 function setup(){
  var old=document.getElementById('fpro-reference-css');if(old)old.remove();var svg=document.getElementById('fpro-reference-svg');if(svg)svg.remove();
  if(!cfg.recolor)return;
  var c=rgb(cfg.uiAccent);if(!c)return;
  var css=document.createElement('style');css.id='fpro-reference-css';var nonce=document.querySelector('style[nonce],script[nonce]');if(nonce)css.nonce=nonce.nonce;
  css.textContent=':root{'+['--primary-button-background','--accent','--primary-blue','--primary-icon','--primary-deemphasized-button-text'].map(function(k){return k+':'+cfg.uiAccent+'!important';}).join(';')+'}';document.head.appendChild(css);
  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='fpro-reference-svg';svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  var base=24/255,values=c.map(function(channel){var value=channel/255,a=(1-value)/(1-base);return a+' 0 0 0 '+(value-a*base);}).join(' ')+' 0 0 0 1 0';
  svg.innerHTML='<defs><filter id="fpro-reference-badge" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="'+values+'"/></filter></defs>';document.body.appendChild(svg);
 }
 function colorOff(){restorePaint();['fpro-reference-css','fpro-reference-svg'].forEach(function(id){var el=document.getElementById(id);if(el)el.remove();});cfg.recolor=false;}
 window.FproColor={set:function(next){if(typeof next==='string')next=JSON.parse(next);var valid=!!next.recolor&&!!rgb(next.uiAccent);if(cfg.recolor!==valid||cfg.uiAccent!==next.uiAccent){colorOff();cfg={recolor:valid,uiAccent:next.uiAccent};setup();}},boot:function(){setup();pass();},ownsStyle:function(el){var record=paints.get(el);return !!record&&(record.kind==='sheet'?el.textContent:el.getAttribute('style'))===record.applied;},prune:prunePaint,retained:function(){return paints.size;},pass:pass,hunt:function(){pass();},off:colorOff};
 function norm(text){return (text||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u2066-\u2069]/g,'').replace(/\s+/g,' ').toLowerCase().trim().replace(/[·•\s:.!؟]+$/g,'');}
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
 // Manual diagnostics only: bounded reason codes, never actual text/attributes.
 function appPromptEvidence(control){
  if(!control)return {reason:'missing-control'};
  var forbidden=control.matches('body,html,main,form,article,header,nav,[role="article"],[role="main"],[role="feed"],[role="navigation"],[role="banner"]');
  var ancestor=!!control.closest('form,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"]');
  var descendant=!!control.querySelector('a,button,[role="button"],[role="link"],video,audio,iframe,canvas,input,textarea,select,[contenteditable="true"],article,[role="article"],[role="main"],[role="feed"]');
  var text=appPromptText(control),label=norm(control.getAttribute('aria-label'));
  return {reason:forbidden?'forbidden-control':ancestor?'blocking-ancestor':descendant?'protected-descendant':text===null?'text-budget':!isAppPrompt(text||label)?navigationCaption(control,text,label)?'navigation-caption':'label-mismatch':'eligible',textPresent:!!text,textExact:text!==null&&isAppPrompt(text),ariaExact:isAppPrompt(label)};
 }
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
   else if(!narrow&&(compact||!node.querySelector('main,article,[role="article"],[role="main"],[role="feed"]')))return null;
   var inset=/^0(?:px)?(?:\s+0(?:px)?){0,3}$/.test(css.inset||'')||/^0(?:px)?$/.test(css.top)&&/^0(?:px)?$/.test(css.bottom)&&/^0(?:px)?$/.test(css.left)&&/^0(?:px)?$/.test(css.right);
   var large=r.width>=innerWidth*.65&&r.height>=innerHeight*.35;
   // Keep blocking install sheets usable: hiding only their CTA leaves a black
   // backdrop/scroll lock. Do not click Close, remove a scrim or unlock the body.
   if(!dedicated&&(inset||large)&&!node.querySelector('main,article,[role="article"],[role="main"],[role="feed"]'))return null;
  }
  if(node&&node!==document.body&&depth>=32)return null;
  return ariaNavigation&&!realNavigation?null:surface||control;
 }
 function restoreOne(el){var old=hidden.get(el);if(!old)return;if(el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important'){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');}el.removeAttribute('data-fpro-reference-noapp');hidden.delete(el);}
 function restore(){if(promptFrame!==null)cancelAnimationFrame(promptFrame);promptFrame=null;urgentUsed=false;checkpointUsed=false;pendingPrompts.clear();Array.from(hidden.keys()).forEach(restoreOne);}
 function hide(el){
  // Move display ownership atomically when a recycled inline CTA becomes a
  // dedicated bar (or the bar becomes inline); never leave its child hidden.
  Array.from(hidden.keys()).forEach(function(previous){if(previous!==el&&(previous.contains(el)||el.contains(previous)))restoreOne(previous);});
  if(!hidden.has(el))hidden.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
  if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
  if(!el.hasAttribute('data-fpro-reference-noapp'))el.setAttribute('data-fpro-reference-noapp','');
 }
 function flushPromptCheckpoint(){
  var batch=Array.from(pendingPrompts);pendingPrompts.clear();
  if(!noapp.noOpenApp||document.hidden)return;
  var started=performance.now();checkpointTiming.batches++;var plans=[];
  batch.forEach(function(el){
   if(!el.isConnected)return;
   checkpointTiming.checks++;plans.push([el,safeAppPromptTarget(el)]);
  });
  plans.forEach(function(plan){if(plan[1]){hide(plan[1]);checkpointTiming.hidden++;}else if(hidden.has(plan[0]))restoreOne(plan[0]);});
  checkpointTiming.maxMs=Math.max(checkpointTiming.maxMs,Math.round((performance.now()-started)*10)/10);
 }
 function queuePrompt(el){
  if(!el||!el.isConnected)return;
  if(pendingPrompts.size<48)pendingPrompts.add(el);
  if(promptFrame===null)promptFrame=requestAnimationFrame(function(){
   promptFrame=null;urgentUsed=false;checkpointUsed=false;flushPromptCheckpoint();
  });
  if(!checkpointQueued&&!checkpointUsed){
   checkpointQueued=true;Promise.resolve().then(function(){checkpointQueued=false;if(checkpointUsed||!pendingPrompts.size)return;checkpointUsed=true;flushPromptCheckpoint();});
  }
  // One guarded discovery/reassertion before paint per rendering batch. Known
  // rejected nodes stay on the normal RAF path, not repeated sync layout.
  var known=hidden.has(el),rewrite=known&&el.style.getPropertyPriority('display')==='important'&&el.style.getPropertyValue('display')!=='none';
  if(!urgentUsed&&(rewrite||!known&&!urgentSeen.has(el)&&!el.closest('[data-fpro-reference-noapp],[data-fpro-app-prompt]'))){
   urgentUsed=true;urgentSeen.add(el);var started=performance.now();urgentTiming.checks++;
   var immediate=safeAppPromptTarget(el);
   if(immediate){hide(immediate);urgentTiming.hidden++;}else if(known)restoreOne(el);
   urgentTiming.maxMs=Math.max(urgentTiming.maxMs,Math.round((performance.now()-started)*10)/10);
  }
 }
 function noappScan(root,fast,selfOnly,usePriority=false){
  if(!noapp.noOpenApp||document.hidden)return;
  // Revalidate owned controls when a surrounding surface becomes a dialog or
  // the site recycles the control. No ancestor gets ownership of display:none.
  var scopes=Array.isArray(root)?root:root?[root]:[];
  Array.from(hidden.keys()).forEach(function(el){if(!el.isConnected){restoreOne(el);return;}if(fast&&!scopes.some(function(scope){return scope.contains(el)||el.contains(scope);}))return;if(safeAppPromptTarget(el,!!fast)!==el)restoreOne(el);else if(fast)queuePrompt(el);else hide(el);});
  var selector='a,button,[role="button"],[role="link"],[data-fpro-reference-noapp]';
  // Share the SAME fast traversal allowance between concurrent roots. A large
  // feed fragment must not consume it before a separate newly inserted bar.
  var candidates=[],budget=0;
  if(fast&&!selfOnly&&scopes.length>1){
   var batch=scopes.slice(0,4),share=Math.floor(384/batch.length);
   batch.forEach(function(scope){candidates.push.apply(candidates,nodes([scope],selector,false,share));});
  }else candidates=nodes(scopes.length?scopes:null,selector,selfOnly,fast?384:0);
  if(fast&&!selfOnly&&usePriority)candidates=Array.from(new Set(scopes.slice(0,4).map(priorityPrompt).filter(Boolean).concat(candidates)));
  for(var el of candidates){if(budget>=(fast?48:800))break;if(!fast)budget++;if(!el.isConnected||own(el))continue;
   var target=safeAppPromptTarget(el,!!fast);
   if(target){if(fast){budget++;queuePrompt(target);}else hide(target);}else restoreOne(el);
  }
 }
 window.FproNoapp={evidence:appPromptEvidence,navigation:appNavigationSurface,timing:function(){return Object.assign({},urgentTiming,{prepaint:Object.assign({},checkpointTiming),priority:Object.assign({},priorityPromptTiming)});},target:safeAppPromptTarget,set:function(next){if(typeof next==='string')next=JSON.parse(next);if(!next.noOpenApp)restore();noapp={noOpenApp:!!next.noOpenApp};},boot:function(){noappScan();},hunt:function(){noappScan();},scan:noappScan,prune:function(){pendingPrompts.forEach(function(el){if(!el.isConnected)pendingPrompts.delete(el);});Array.from(hidden.keys()).forEach(function(el){if(!el.isConnected)restoreOne(el);});},retained:function(){return hidden.size;},restore:function(){noapp.noOpenApp=false;restore();}};
})();
