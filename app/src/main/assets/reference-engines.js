/* Adapted from the FproColor / FproNoapp engines supplied by the owner.
 * Corrections: reversible ownership, palette/recycle updates, alpha=0,
 * shorthand preservation, bounded work, and page/media/navigation boundaries.
 * Driven by facebook.js's observer/scheduler; CTA geometry uses one bounded animation-frame batch, no extra observer/polling.
 */
(function () {
 'use strict';
 if(window.FproColor && window.FproNoapp)return;
 var cfg={recolor:false,uiAccent:'#D4AF37'}, noapp={noOpenApp:false};
 var pendingPrompts=new Set(),promptFrame=null;
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
 function isAppPrompt(text){text=norm(text);return text.length<=90&&(appPromptLabels.has(text)||appPromptLabels.has(text.replace(/\s*(facebook|فيسبوك|f)$/,'')));}
 // Conservative by design: never hide a parent, modal, player or page shell.
 function safeAppPromptTarget(el,structuralOnly=false){
  var control=el&&el.closest('a,button,[role="button"],[role="link"]');
  if(!control||control.matches('body,html,main,form,article,header,nav,[role="article"],[role="main"],[role="feed"],[role="navigation"],[role="banner"]'))return null;
  if(control.closest('form,dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"]'))return null;
  if(control.querySelector('a,button,[role="button"],[role="link"],video,audio,iframe,canvas,input,textarea,select,[contenteditable="true"],article,[role="article"],[role="main"],[role="feed"]'))return null;
  // A matching child span/aria-label must not authorize hiding unrelated prose.
  var text=norm(control.textContent),label=norm(control.getAttribute('aria-label'));
  if(!isAppPrompt(text||label))return null;
  if(structuralOnly)return control;
  var box=control.getBoundingClientRect();
  if(box.height>96)return null;
  var node=control,depth=0;
  for(;node&&node!==document.body&&depth<32;node=node.parentElement,depth++){
   var css=getComputedStyle(node);
   if(css.position!=='fixed'&&css.position!=='absolute')continue;
   var r=node.getBoundingClientRect();
   var inset=/^0(?:px)?(?:\s+0(?:px)?){0,3}$/.test(css.inset||'')||/^0(?:px)?$/.test(css.top)&&/^0(?:px)?$/.test(css.bottom)&&/^0(?:px)?$/.test(css.left)&&/^0(?:px)?$/.test(css.right);
   var large=r.width>=innerWidth*.65&&r.height>=innerHeight*.35;
   // Keep blocking install sheets usable: hiding only their CTA leaves a black
   // backdrop/scroll lock. Do not click Close, remove a scrim or unlock the body.
   if((inset||large)&&!node.querySelector('main,article,[role="article"],[role="main"],[role="feed"]'))return null;
  }
  if(node&&node!==document.body&&depth>=32)return null;
  return control;
 }
 function restoreOne(el){var old=hidden.get(el);if(!old)return;if(el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important'){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');}el.removeAttribute('data-fpro-reference-noapp');hidden.delete(el);}
 function restore(){if(promptFrame!==null)cancelAnimationFrame(promptFrame);promptFrame=null;pendingPrompts.clear();Array.from(hidden.keys()).forEach(restoreOne);}
 function hide(el){
  if(!hidden.has(el))hidden.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
  if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
  if(!el.hasAttribute('data-fpro-reference-noapp'))el.setAttribute('data-fpro-reference-noapp','');
 }
 function queuePrompt(el){
  if(pendingPrompts.size<48)pendingPrompts.add(el);
  if(promptFrame===null)promptFrame=requestAnimationFrame(function(){
   promptFrame=null;var batch=Array.from(pendingPrompts);pendingPrompts.clear();
   if(!noapp.noOpenApp||document.hidden)return;
   batch.forEach(function(el){if(!el.isConnected)return;var target=safeAppPromptTarget(el);if(target)hide(target);else restoreOne(el);});
  });
 }
 function noappScan(root,fast,selfOnly){
  if(!noapp.noOpenApp||document.hidden)return;
  // Revalidate owned controls when a surrounding surface becomes a dialog or
  // the site recycles the control. No ancestor gets ownership of display:none.
  var scopes=Array.isArray(root)?root:root?[root]:[];
  Array.from(hidden.keys()).forEach(function(el){if(!el.isConnected){restoreOne(el);return;}if(fast&&!scopes.some(function(scope){return scope.contains(el)||el.contains(scope);}))return;if(safeAppPromptTarget(el,!!fast)!==el)restoreOne(el);else if(fast)queuePrompt(el);});
  var selector='a,button,[role="button"],[role="link"],[data-fpro-reference-noapp]';
  var candidates=nodes(Array.isArray(root)?root:root?[root]:null,selector,selfOnly,fast?384:0),budget=0;
  for(var el of candidates){if(budget++>=(fast?48:800))break;if(own(el))continue;
   var target=safeAppPromptTarget(el,!!fast);
   if(target){if(fast)queuePrompt(target);else hide(target);}else restoreOne(el);
  }
 }
 window.FproNoapp={target:safeAppPromptTarget,set:function(next){if(typeof next==='string')next=JSON.parse(next);if(!next.noOpenApp)restore();noapp={noOpenApp:!!next.noOpenApp};},boot:function(){noappScan();},hunt:function(){noappScan();},scan:noappScan,prune:function(){pendingPrompts.forEach(function(el){if(!el.isConnected)pendingPrompts.delete(el);});Array.from(hidden.keys()).forEach(function(el){if(!el.isConnected)restoreOne(el);});},retained:function(){return hidden.size;},restore:function(){noapp.noOpenApp=false;restore();}};
})();
