/* Adapted from the FproColor / FproNoapp engines supplied by the owner.
 * Corrections: reversible ownership, palette/recycle updates, alpha=0,
 * shorthand preservation, bounded work, and page/media/navigation boundaries.
 * Driven by facebook.js's existing observer/scheduler; no extra observer/timer.
 */
(function () {
 'use strict';
 if(window.FproColor && window.FproNoapp)return;
 var cfg={recolor:false,uiAccent:'#D4AF37'}, noapp={noOpenApp:false};
 var paints=new Map(), hidden=new Map();
 function rgb(hex){var m=/^#([0-9a-f]{6})$/i.exec(hex||'');return m?[0,2,4].map(function(i){return parseInt(m[1].slice(i,i+2),16);}):null;}
 function blue(r,g,b){return b>r+40&&b>g+20&&Math.max(r,g,b)-Math.min(r,g,b)>60&&b>100;}
 function nodes(roots,selector){
  if(!roots||!roots.length)return document.querySelectorAll(selector);
  var out=new Set();roots.forEach(function(root){if(!root||root.nodeType!==1)return;if(root.matches(selector))out.add(root);root.querySelectorAll(selector).forEach(function(el){out.add(el);});});return Array.from(out);
 }
 function own(el){return el.closest('#fpro-style,#fpro-selection-style,#fpro-icon-filter,#fpro-reference-css,#fpro-reference-svg,.fpro-video-tools');}
 function write(el,kind,value){
  var read=function(){return kind==='sheet'?el.textContent:el.getAttribute('style');}, current=read(), record=paints.get(el);
  if(record&&current!==record.applied){record.original=current;record.kind=kind;}
  if(current===value)return;
  if(!record){record={kind:kind,original:current};paints.set(el,record);}
  if(kind==='sheet')el.textContent=value;else if(value===null)el.removeAttribute('style');else el.setAttribute('style',value);
  record.applied=read();
 }
 function restorePaint(){paints.forEach(function(record,el){var current=record.kind==='sheet'?el.textContent:el.getAttribute('style');if(current!==record.applied)return;if(record.kind==='sheet')el.textContent=record.original;else if(record.original===null)el.removeAttribute('style');else el.setAttribute('style',record.original);});paints.clear();}
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
 function pass(roots){
  if(!cfg.recolor||document.hidden)return;
  nodes(roots,'style').forEach(function(st,index){if(index>=120||own(st)||/^fpro/i.test(st.id))return;var before=st.textContent,after=parsedDeclarations(before);if(after!==before)write(st,'sheet',after);});
  var count=0;for(var el of nodes(roots,'[style]')){
   if(count>=400)break;if(own(el)||el.matches('img,video,canvas,svg,image'))continue;count++;
   var before=el.getAttribute('style'),probe=document.createElement('span');probe.setAttribute('style',before);
   ['background-color','color','border','border-color','border-top','border-right','border-bottom','border-left','border-top-color','border-right-color','border-bottom-color','border-left-color'].forEach(function(key){var old=probe.style.getPropertyValue(key),next=replaceColor(old);if(next!==old)probe.style.setProperty(key,next,probe.style.getPropertyPriority(key));});
   if(probe.style.cssText!==el.style.cssText)write(el,'attr',probe.getAttribute('style'));
  }
  // Owner's labelled-badge matrix: blue -> accent, white check -> white.
  var countBadge=0;for(var badge of nodes(roots,'img[aria-label],img[alt],svg[aria-label],i[aria-label],[data-testid]')){
   if(countBadge++>=150)break;if(own(badge))continue;
   var label=['aria-label','alt','data-testid'].map(function(k){return badge.getAttribute(k)||'';}).join(' '),r=badge.getBoundingClientRect();
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
 window.FproColor={set:function(next){if(typeof next==='string')next=JSON.parse(next);var valid=!!next.recolor&&!!rgb(next.uiAccent);if(cfg.recolor!==valid||cfg.uiAccent!==next.uiAccent){colorOff();cfg={recolor:valid,uiAccent:next.uiAccent};setup();}},boot:function(){setup();pass();},pass:pass,hunt:function(){pass();},off:colorOff};
 var phrases=/^(فتح التطبيق|افتح التطبيق|فتح تطبيق فيسبوك|فتح فيسبوك|فتح التطبيق الان|استخدم التطبيق|فيسبوك الاصلي|الفيسبوك الاصلي|تطبيق فيسبوك الاصلي|استخدم تطبيق فيسبوك|open (the )?app|open in (the )?app|use (the )?app|original facebook|open facebook( app)?|open the facebook app|use (the )?facebook app)$/i;
 var cta=/^(فتح\s+التطبيق|افتح\s+التطبيق|فتح\s+تطبيق\s+فيسبوك|استخدم\s+التطبيق|استخدم\s+تطبيق\s+فيسبوك|جرب\s+التطبيق|حمل\s+التطبيق|تحميل\s+التطبيق|ثبت\s+التطبيق|شاهد\s+في\s+التطبيق|open\s+(the\s+)?app|open\s+(it\s+)?in\s+(the\s+)?app|open\s+facebook|use\s+(the\s+)?(facebook\s+)?app|try\s+the\s+app|get\s+the\s+app|install\s+(the\s+)?app|download\s+(the\s+)?app|watch\s+on\s+the\s+app)/i;
 function norm(text){return (text||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/\s+/g,' ').trim();}
 function head(el){var text=el.getAttribute('aria-label')||'',walk=[el],i=0;while(i<walk.length&&i<80&&text.length<90){var node=walk[i++];for(var child=node.firstChild;child&&text.length<90;child=child.nextSibling){if(child.nodeType===3)text+=child.nodeValue+' ';else if(child.nodeType===1&&walk.length<80)walk.push(child);}}return norm(text).slice(0,100);}
 function hide(el){if(!el||el.matches('body,html,main,form,article,[role="article"],[role="main"],[role="feed"],nav,[role="navigation"]')||el.querySelector('video,input,textarea,article,[role="article"]'))return;
  if(!hidden.has(el))hidden.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});el.style.setProperty('display','none','important');el.setAttribute('data-fpro-reference-noapp','');
 }
 function restore(){hidden.forEach(function(old,el){if(el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important'){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');}el.removeAttribute('data-fpro-reference-noapp');});hidden.clear();}
 function noappScan(root){
  if(!noapp.noOpenApp||document.hidden)return;
  var selector='a,button,[role="button"],[role="link"],[aria-label],[tabindex],[onclick]';
  var candidates=nodes(root?[root]:null,selector),budget=0;
  for(var el of candidates){if(budget++>=800)break;if(own(el)||hidden.has(el))continue;
   var text=head(el),href=el.getAttribute('href')||'';if(!text||/^(رجوع|الرجوع|عوده|العوده|اغلاق|اخفاء|back|go\s+back|close|dismiss)/i.test(text))continue;
   var exact=phrases.test(text),deep=/^(fb:|fb-messenger:|market:|intent:|android-app:)/i.test(href)||/play\.google\.com\/store\/apps|apps\.apple\.com|onelink\.to\/facebook|marketplace\/app_redirect|\/r\.php\?.*app_id|\/openinapp|\/native_app|\/intent\//i.test(href);
   var r=el.getBoundingClientRect(),near=r.top>=0&&r.top<innerHeight*.3,pill=null;
   if(!exact&&!cta.test(text)&&near&&/فيسبوك|التطبيق|facebook|open\s+app/i.test(text)){
    var node=el;for(var d=0;node&&d<7;d++,node=node.parentElement){if(node.matches('body,html,header,nav,article,[role="article"],[role="banner"],[role="navigation"]'))break;var b=node.getBoundingClientRect(),paint=getComputedStyle(node).backgroundColor.match(/[\d.]+/g);if(paint&&blue(+paint[0],+paint[1],+paint[2])&&b.width>30&&b.width<=innerWidth*.72&&b.height>=22&&b.height<=120){pill=node;break;}}
   }
   if(!exact&&!cta.test(text)&&!deep&&!pill)continue;
   if(el.closest('article,[role="article"],[data-pagelet^="FeedUnit"]')){if((exact||cta.test(text))&&el.matches('a,button,[role="button"]'))hide(el);continue;}
   var best=pill||el,node=best,limit=near?110:Math.max(160,innerHeight*.32);
   for(var d=0;d<8&&node.parentElement;d++){var parent=node.parentElement;if(parent.matches('body,html,main,form,header,nav,article,[role="article"],[role="main"],[role="feed"],[role="banner"],[role="navigation"]')||parent.querySelector('video,input,textarea,article,[role="article"]'))break;var b=parent.getBoundingClientRect();if(b.height<=0||b.height>limit||near&&b.width>innerWidth*.65)break;if(Array.from(parent.childNodes).some(function(c){return c.nodeType===3&&c.textContent.trim();}))break;best=parent;node=parent;}
   hide(best);
  }
 }
 window.FproNoapp={set:function(next){if(typeof next==='string')next=JSON.parse(next);if(!next.noOpenApp)restore();noapp={noOpenApp:!!next.noOpenApp};},boot:function(){noappScan();},hunt:function(){noappScan();},scan:noappScan,restore:function(){noapp.noOpenApp=false;restore();}};
})();
