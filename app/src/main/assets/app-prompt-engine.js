/* FPRO GPL-3.0 — explicit app-prompt discovery, independent of upstream layout quirks. */
(() => {
 'use strict';if(window.FproPrompt)return;
 const norm=s=>(s||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u061C\u202A-\u202E\u2060\u2066-\u2069]/g,'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase().replace(/[.!؟:·•\s]+$/g,'');
 const labels=['فتح التطبيق','افتح التطبيق','فتح في التطبيق','فتح فيسبوك','فتح تطبيق فيسبوك','فتح في تطبيق فيسبوك','فتح في Facebook','فتح التطبيق الآن','استخدم التطبيق','استخدام التطبيق','استخدم تطبيق فيسبوك','تابع في التطبيق','متابعة في التطبيق','المتابعة في التطبيق','تثبيت التطبيق','تنزيل التطبيق','تحميل التطبيق','الحصول على التطبيق','حمل تطبيق فيسبوك','open app','open the app','open in app','open in the app','open facebook','open facebook app','open the facebook app','open in facebook app','use app','use the app','use facebook app','continue in app','continue in the app','get the app','get facebook for android','get facebook for android and browse faster','install app','install the app',"ouvrir l'application",'ouvrir dans l’application','abrir app','abrir en la app','abrir aplicativo','abrir no aplicativo','in app öffnen','app öffnen','apri app','buka aplikasi','uygulamada aç'];
 const exact=new Set(labels.map(norm));const compact=new Set(Array.from(exact,s=>s.replace(/\s/g,'')));
 const semantic='a,button,[role="button"],[role="link"],[data-focusable="true"],[tabindex="0"],[data-action-id]';
 const excluded='input,textarea,select,[contenteditable]:not([contenteditable="false"]),video,audio,canvas,iframe,article,[role="article"],[role="main"],[role="feed"]';
 const tools='.fpro-video-tools,[id^="fpro"]';
 const footer='.bottom.fixed-container,[data-testid*="open_app" i],[data-testid*="open-app" i],[data-sigil~="m-app-banner"],[data-sigil~="app-prompt"]';
 const discovery=semantic+',.native-text,[data-mcomponent="TextArea"],'+footer;
 const ariaSelector=labels.map(label=>':is('+semantic+')[aria-label='+JSON.stringify(label)+' i]').join(',');
 const owned=new Map(),rejected=new Set(),boxes=new WeakMap();let enabled=false,css=null,rootOld=null;
 const stats={passes:0,checked:0,hidden:0,restored:0,maxMs:0};
 function text(el){let value='',count=0,node;const walk=document.createTreeWalker(el,4);while((node=walk.nextNode())){if(++count>64||node.nodeValue.length+value.length>200)return null;if(node.parentElement.closest('svg,script,style,[aria-hidden="true"]'))continue;value+=' '+node.nodeValue;}return norm(value);}
 function known(value){if(value===null)return false;value=norm(value).replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}]/gu,'').trim();const plain=value.replace(/^(?:facebook|فيسبوك)\s+/,'').replace(/\s+(?:facebook|فيسبوك)$/,'');return exact.has(value)||exact.has(plain)||compact.has(value.replace(/\s/g,''));}
 function appUrl(el){const href=el.getAttribute('href')||'';return /^fb(?:lite)?:\/\//i.test(href)||/^intent:\/\//i.test(href)&&/package=com\.facebook\.(?:katana|lite)(?:;|$)/i.test(href)||/^https:\/\/(?:play\.google\.com\/store\/apps\/details\?[^#]*\bid=com\.facebook\.(?:katana|lite)|(?:www\.)?facebook\.com\/(?:appcenter|mobile)\/)/i.test(href);}
 function blocked(el){if(!el||!el.isConnected||el.matches('html,body,main,form,input,textarea,select,video,audio,iframe,canvas,article,[role="article"],header,nav,[role="main"],[role="feed"],[role="navigation"],[role="banner"]')||el.closest(tools+',form,[contenteditable="true"]'))return true;const dialog=el.closest('dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"]');return !!(dialog&&(!dialog.querySelector('video,[data-pagelet="Story"],.story_viewer')||dialog.querySelector('form,input,textarea,select')));}
 function candidate(el){
  if(blocked(el)||el.querySelector(excluded))return false;
  if(!el.matches(semantic)&&(!el.matches('.native-text,[data-mcomponent="TextArea"]')||el.querySelector(semantic)))return false;
  const value=text(el),aria=norm(el.getAttribute('aria-label'));
  if(value===null)return false;
  if(!el.matches(semantic)&&el.closest('article,[role="article"],[role="comment"],[data-commentid],[data-ad-preview="message"],[data-ad-comet-preview="message"]'))return false;
  const glyph=value.includes('󱥬');
  return known(value)||known(aria)&&(value.length<120&&(value===''||known(value)||glyph))||glyph&&el.matches(semantic)&&value.length<100||appUrl(el)&&(known(aria)||known(value)||/^(?:open|فتح|facebook|فيسبوك|google play)$/.test(value));
 }
 function surface(control){
  let target=control;
  for(let parent=control.parentElement,d=0;parent&&d<5;parent=parent.parentElement,d++){
   if(blocked(parent)||parent.matches('dialog,[role="dialog"],[aria-modal="true"]')||parent.querySelector(excluded+',header,nav,[role="navigation"],[role="banner"]'))break;
   if(parent.hasAttribute('data-shift-on-keyboard-shown'))break;
   const hint=parent.matches(footer),position=hint?'fixed':getComputedStyle(parent).position;
   if(!hint&&!/fixed|sticky/.test(position))continue;
   const height=parent.getBoundingClientRect().height||boxes.get(parent)||Number(parent.getAttribute('data-actual-height'));
   if(!(height>0&&height<=160))continue;
   const controls=parent.querySelectorAll(semantic);if(controls.length>4)break;
   if(Array.from(controls).some(el=>!candidate(el)&&!/^(close|dismiss|not now|إغلاق|اغلاق|ليس الان|ليس الآن)$/.test(text(el)||'')))break;
   const caption=text(parent);if(caption===null||caption.length>200)break;
   boxes.set(parent,height);target=parent;
  }
  return target;
 }
 function restore(el){const old=owned.get(el);if(!old)return;if(el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important'){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');}if(old.attr===null)el.removeAttribute('data-fpro-prompt59-target');else el.setAttribute('data-fpro-prompt59-target',old.attr);owned.delete(el);stats.restored++;}
 function hide(el,control){
  if(!owned.has(el)){if(owned.size>=2560)return;owned.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display'),attr:el.getAttribute('data-fpro-prompt59-target'),control});stats.hidden++;}
  if(el.getAttribute('data-fpro-prompt59-target')!=='1')el.setAttribute('data-fpro-prompt59-target','1');
  if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
 }
 function inspect(el){if(!el||el.nodeType!==1)return;stats.checked++;const control=el.matches(semantic)?el:el.closest(semantic)||el;
  if(candidate(control)){if(rejected.has(control)){control.removeAttribute('data-fpro-prompt59-reject');rejected.delete(control);}hide(surface(control),control);}
  else if(known(control.getAttribute('aria-label'))&&!rejected.has(control)&&rejected.size<2560){control.setAttribute('data-fpro-prompt59-reject','');rejected.add(control);}
 }
 function pass(roots){
  if(!enabled)return;const start=performance.now();stats.passes++;
  for(const node of rejected)if(!node.isConnected){node.removeAttribute('data-fpro-prompt59-reject');rejected.delete(node);}
  const valid=roots.filter(r=>r&&r.nodeType===1);
  const priority=valid.filter(r=>r.matches(semantic+','+footer));
  const ordered=[...priority,...valid.filter(r=>!priority.includes(r))];
  const scopes=[];for(const root of ordered){if(!root||root.nodeType!==1||!root.isConnected||root.closest(tools))continue;if(scopes.some(s=>s.contains(root)))continue;for(let i=scopes.length-1;i>=0;i--)if(root.contains(scopes[i]))scopes.splice(i,1);scopes.push(root);if(scopes.length>=8)break;}
  for(const [el,old]of owned){if(!el.isConnected){restore(el);continue;}if(scopes.some(root=>root.contains(el)||el.contains(root))){if(!candidate(old.control)||blocked(el)||el!==old.control&&el.querySelector(excluded))restore(el);else hide(el,old.control);}}
  for(const root of scopes){inspect(root);let n=0;for(const node of root.querySelectorAll(ariaSelector+',a[href^="intent://"],a[href^="fb://"],'+footer)){if(n++>=96)break;inspect(node);if(node.matches(footer))for(const c of Array.from(node.querySelectorAll(discovery)).slice(0,48))inspect(c);}
   n=0;for(const node of root.querySelectorAll(discovery)){if(n++>=800)break;inspect(node);}
  }
  stats.maxMs=Math.max(stats.maxMs,Math.round((performance.now()-start)*10)/10);
 }
 const observer=new MutationObserver(records=>{
  const roots=[];for(const r of records){const el=r.target.nodeType===1?r.target:r.target.parentElement;if(!el||el.closest(tools))continue;
   if(r.type==='attributes'&&r.attributeName==='style'&&owned.has(el)&&el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important')continue;
   if(r.type==='childList'){for(const node of r.addedNodes)roots.push(node.nodeType===1?node:node.parentElement);roots.push(el.closest('[data-fpro-prompt59-target]'));}
   else roots.push(el);
  }pass(roots);
 });
 function install(){
  if(!css){css=document.createElement('style');css.id='fpro-prompt59-style';const nonce=document.querySelector('style[nonce],script[nonce]');if(nonce)css.nonce=nonce.nonce;
   // Accessible exact cues are declarative; all text-only candidates require JS.
   const early=labels.map(label=>'html[data-fpro-prompt59="on"] :is('+semantic+')[aria-label='+JSON.stringify(label)+' i]:not([data-fpro-prompt59-reject]):not(html,body,main,form,input,textarea,select,video,audio,iframe,canvas,article,header,nav,[role="article"],[role="main"],[role="feed"],[role="navigation"],[role="banner"],[id^="fpro"]):not(form *,dialog *,[role="dialog"] *,[aria-modal="true"] *,.fpro-video-tools *):not(:has('+excluded+','+semantic+'))').join(',');
   css.textContent='html[data-fpro-prompt59="on"] [data-fpro-prompt59-target]{display:none!important}'+early+'{display:none!important}';
  }
  if(!css.isConnected)(document.head||document.documentElement).append(css);
 }
 function update(config){
  const next=config.siteEngine==='upstream'&&config.enhance!==false&&!!config.appBanner;
  if(!next){if(!enabled)return;enabled=false;observer.disconnect();if(css)css.remove();for(const el of Array.from(owned.keys()))restore(el);for(const el of rejected)el.removeAttribute('data-fpro-prompt59-reject');rejected.clear();if(rootOld===null)document.documentElement.removeAttribute('data-fpro-prompt59');else document.documentElement.setAttribute('data-fpro-prompt59',rootOld);return;}
  if(!enabled){enabled=true;rootOld=document.documentElement.getAttribute('data-fpro-prompt59');document.documentElement.setAttribute('data-fpro-prompt59','on');install();observer.observe(document,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style','class','role','aria-label','aria-modal','open','href','data-actual-height','data-shift-on-keyboard-shown']});}
  else install();
  pass([document.body||document.documentElement]);
 }
 window.FproPrompt={update,report:()=>({version:59,enabled,retained:owned.size,...stats})};
})();
