/* GPL-3.0-or-later. Optional official All-comments UI preference.
 * No network/cookies/clipboard/gesture interception. Event-bound, finite sessions.
 */
(function(w){
 'use strict';const d=w.document;
 if(w!==w.top||w.location.protocol!=='https:'||!/(^|\.)facebook\.com$/i.test(w.location.hostname))return;
 if(w.FproCommentSort){w.FproCommentSort.setEnabled(w.__fproAllComments===true);return;}
 let enabled=false,session=null,internal=false,ready=null,activation=0,touch=null,lastTouch=null,lastDiagnostic=null,lastAttempt={stage:0,reason:0,passes:0,menus:0,choices:0,relevant:0,openers:0,confirms:0};
 const norm=s=>String(s||'').replace(/[\u064B-\u065F\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 function name(n){let text=n.getAttribute('aria-label');if(!text){const ids=(n.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean);if(ids.length>4)return '';if(ids.length)text=ids.map(id=>d.getElementById(id)?.textContent||'').join(' ');}if(!text&&n.localName==='input')text=n.labels?.[0]?.textContent;return norm(String(text||n.textContent||'').slice(0,301));}
 const most=s=>/^(?:most relevant|الأكثر ملاءمة|الاكثر ملاءمة)$/.test(s);
 const mostPrefix=s=>/^(?:most relevant|الأكثر ملاءمة|الاكثر ملاءمة)(?:$|\s|[،,.])/.test(s);
 const radio=n=>n.matches('[role="radio"],[role="menuitemradio"],input[type="radio"]');
 const all=s=>/^(?:all comments|كل التعليقات|جميع التعليقات)(?:$|\s|[،,.])/.test(s)&&s.length<=300;
 const sortTitle=s=>/^(?:sort comments|comment sorting|فرز التعليقات|ترتيب التعليقات)$/.test(s);
 const commentsTitle=s=>/^(?:comments|التعليقات)$/.test(s);
 const controls='button,[role="button"],[role="menuitem"],[role="menuitemradio"],[role="radio"],input[type="radio"]';
 function visible(n){if(!n?.isConnected||n.closest('[hidden],[aria-hidden="true"]')||n.disabled||n.getAttribute('aria-disabled')==='true')return false;const r=n.getBoundingClientRect();if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=w.innerHeight||r.right<=0||r.left>=w.innerWidth)return false;for(let p=n,i=0;p&&i<24;p=p.parentElement,i++){const s=w.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}return true;}
 function nodes(root){const out=[],walker=d.createTreeWalker(root,w.NodeFilter.SHOW_ELEMENT);let n=root;for(let i=0;n&&i<800;i++,n=walker.nextNode())out.push(n);return n?null:out;}
 function scopes(){
  // Hidden retained sheets and unrelated named feed regions must not suppress an open modal.
  const modals=Array.from(d.querySelectorAll('[role="dialog"],[role="menu"],[role="presentation"],.dialog-screen,[aria-modal="true"]')).filter(visible);
  const regions=Array.from(d.querySelectorAll('[role="region"][aria-label]')).filter(n=>visible(n)&&(commentsTitle(name(n))||sortTitle(name(n))));
  const roots=Array.from(new Set([...modals,...regions]));if(roots.length>32)return [];
  return roots.map(root=>({root,nodes:nodes(root)})).filter(s=>s.nodes);
 }
 function titled(s,test){return test(name(s.root))||s.nodes.some(n=>n.matches('h1,h2,h3,h4,h5,h6,[role="heading"]')&&visible(n)&&test(name(n)));}
 function buttons(s,test){return s.nodes.filter(n=>n.matches(controls)&&visible(n)&&!n.closest('[data-fpro-owned],.fpro-video-tools')&&test(name(n)));}
 function checked(n){return n.localName==='input'?n.checked:n.getAttribute('aria-checked')==='true';}
 function click(n){internal=true;try{n.click();}finally{internal=false;}}
 function stop(reason=0){if(!session)return;session.stats.reason=reason;lastAttempt={...session.stats,passes:session.passes,reason};try{lastDiagnostic=w.FproCommentSortDiagnostic?.capture()||lastDiagnostic;if(lastDiagnostic)w.FproCommentSortReport?.postMessage(JSON.stringify({schema:1,current:lastDiagnostic}));}catch(_){}session.observer.disconnect();w.clearTimeout(session.timer);if(session.frame)w.cancelAnimationFrame(session.frame);session=null;}
 function postKey(href){try{const u=new URL(href,w.location.href);if(u.origin!==w.location.origin||!postPath(u.pathname))return null;
  if(/^\/(?:story|permalink)\.php$/.test(u.pathname)){const id=u.searchParams.get('story_fbid');if(!id)return null;return JSON.stringify([u.origin,u.pathname,id,u.searchParams.get('id')||'']);}
  return JSON.stringify([u.origin,u.pathname.replace(/\/$/,'')]);
 }catch(_){return null;}}
 function acceptLocation(s){if(s.url===w.location.href)return true;const next=postKey(w.location.href),old=postKey(s.url);
  if(next&&next===old){s.url=w.location.href;return true;}
  // Allow exactly one intended entry handoff, only before any site action.
  // Keep the existing deadline/pass budget; never carry a choice into another post.
  if(s.entryPending&&!s.opened&&!s.menu&&next&&(s.expected?next===s.expected:!old)){
   s.entryPending=false;s.url=w.location.href;return true;
  }
  return false;
 }
 function pass(){const s=session;if(!s||!enabled)return;if(!acceptLocation(s)){stop(2);return;}if(++s.passes>24){stop(3);return;}if(s.entryPending&&s.expected&&postKey(w.location.href)!==s.expected)return;
  if(s.menu){
   if(!visible(s.menu)){stop(0);return;}
   if(!visible(s.choice)||!checked(s.choice)){s.stats.reason=11;return;}
   const ns=nodes(s.menu);if(!ns){stop(7);return;}
   const confirm=buttons({root:s.menu,nodes:ns},t=>/^(?:ok|apply|done|موافق|تطبيق|تم)$/.test(t));
   s.stats.confirms=confirm.length;if(confirm.length===1){s.stats.stage=4;click(confirm[0]);s.stats.stage=5;stop(0);}else if(confirm.length>1)stop(8);else s.stats.reason=12;
   return;
  }
  const roots=scopes(),titledMenus=roots.filter(r=>titled(r,sortTitle)),groups=new Map();
  s.stats.menus=titledMenus.length;
  for(const menu of titledMenus){
   const choices=buttons(menu,all).filter(radio),relevant=buttons(menu,mostPrefix).filter(radio);
   s.stats.choices=Math.max(s.stats.choices,choices.length);s.stats.relevant=Math.max(s.stats.relevant,relevant.length);
   if(choices.length!==1||relevant.length!==1)continue;
   const key=choices[0],old=groups.get(key);
   if(!old||menu.nodes.length<old.menu.nodes.length)groups.set(key,{menu,choice:key});
  }
  if(groups.size>1){stop(4);return;}
  if(groups.size===1){
   const {menu,choice}=Array.from(groups.values())[0];s.stats.stage=2;
   if(checked(choice)){stop(6);return;}
   s.menu=menu.root;s.choice=choice;s.stats.stage=3;click(choice);schedule();return;
  }
  if(titledMenus.length){stop(5);return;}
  if(s.opened)return;
  const panels=roots.filter(r=>titled(r,commentsTitle));
  let candidates=Array.from(new Set(panels.flatMap(r=>buttons(r,most))));
  // Dedicated post-page inline comments have no Comments dialog (owner36 screenshot).
  // Composer may be inaccessible (owner37 report:0). Without one, require exact role-button/action/component evidence.
  if(!candidates.length&&/^\/(?:story\.php|permalink\.php|[^/]+\/posts\/[^/]+\/?)$/.test(w.location.pathname)){
   const composers=Array.from(d.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"]')).slice(0,32).filter(n=>visible(n)&&/^(?:write a comment|اكتب تعليق|أضف تعليق|اضف تعليق)/.test(norm(n.getAttribute('aria-label')||n.getAttribute('placeholder')||n.getAttribute('data-placeholder')||'')));
   const ns=nodes(d.body);
   if(ns){const exact=buttons({root:d.body,nodes:ns},most).filter(n=>n.matches('button,[role="button"]')&&!radio(n));
    if(composers.length===1)candidates=exact;
    else if(composers.length===0)candidates=exact.filter(n=>n.matches('[role="button"][data-action-id][data-mcomponent]'));
   }
  }
  s.stats.openers=candidates.length;if(candidates.length>1){stop(10);return;}
  if(candidates.length===1){s.opened=true;s.stats.stage=1;click(candidates[0]);schedule();}else s.stats.reason=10;
 }
 function schedule(){if(session&&!session.frame)session.frame=w.requestAnimationFrame(()=>{if(!session)return;session.frame=0;pass();});}
 function request(expected=null,entryPending=false){if(!enabled||d.hidden||!d.body)return;stop();const observer=new w.MutationObserver(schedule);session={observer,timer:w.setTimeout(()=>stop(session?.stats.reason||1),8000),frame:0,passes:0,url:w.location.href,expected,entryPending,opened:false,menu:null,choice:null,stats:{stage:0,reason:0,menus:0,choices:0,relevant:0,openers:0,confirms:0}};observer.observe(d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-checked','checked','aria-hidden','hidden','disabled','style','class','aria-label','aria-labelledby']});schedule();}
 function activationTarget(target){
  // Facebook can put an unlabeled action-bearing div inside the named control.
  // Inspect a bounded ancestor chain instead of stopping at that nearest div.
  for(let n=target?.nodeType===1?target:target?.parentElement,i=0;n&&i<6;n=n.parentElement,i++){
   if(!n.matches(controls+',[data-action-id][data-mcomponent]'))continue;
   const text=name(n);
   if(mostPrefix(text)||sortTitle(text)||(text.length<=100&&/(?:^|\s)(?:comments?|التعليقات|تعليقات|تعليق)(?:\s|$)/.test(text)))return n;
  }
  return null;
 }
 function postPath(path){return /^\/(?:story\.php|permalink\.php|[^/]+\/posts\/[^/]+\/?)$/.test(path);}
 function postLink(target){
  const link=target?.closest?.('a[href]');if(!link||link.hasAttribute('download')||link.target&&link.target!=='_self')return null;
  try{const url=new URL(link.href,w.location.href);return url.origin===w.location.origin&&postPath(url.pathname)?link:null;}catch(_){return null;}
 }
 function entryTarget(target){return activationTarget(target)||postLink(target);}
 function onRoute(){cancel();if(enabled&&postPath(w.location.pathname)&&!d.hidden)activate();}
 function onVisibility(){cancel();if(!d.hidden&&enabled&&postPath(w.location.pathname))activate();}
 function activate(owner=null){const link=owner&&postLink(owner),expected=link?postKey(link.href):null;cancel();activation=w.requestAnimationFrame(()=>{activation=0;request(expected,true);});}
 function onClick(e){if(internal)return;
  if(lastTouch&&w.performance.now()-lastTouch.at<700&&(e.target===lastTouch.target||lastTouch.owner.contains(e.target))){lastTouch=null;return;}
  lastTouch=null;const owner=entryTarget(e.target);if(!e.defaultPrevented&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&(!e.button||e.button===0)&&owner)activate(owner);else cancel();
 }
 function onTouchStart(e){touch=null;if(e.touches?.length!==1)return;const owner=entryTarget(e.target);if(owner){const p=e.touches[0];touch={owner,target:e.target,x:p.clientX,y:p.clientY};}}
 function onTouchEnd(e){const start=touch;touch=null;if(!start||e.touches?.length||e.changedTouches?.length!==1)return;const p=e.changedTouches[0];
  if(Math.hypot(p.clientX-start.x,p.clientY-start.y)>12)return;
  // Observe a real tap even when the site consumes touchend and never emits click.
  // No preventDefault/stopPropagation, guessed coordinates, or synthetic touch events.
  lastTouch={owner:start.owner,target:start.target,at:w.performance.now()};activate(start.owner);
 }
 function onTouchCancel(){touch=null;}
 function cancel(){stop(13);if(activation){w.cancelAnimationFrame(activation);activation=0;}}
 function setEnabled(value){const next=value===true;if(next===enabled)return;enabled=next;cancel();if(ready){d.removeEventListener('DOMContentLoaded',ready);ready=null;}
  if(enabled){d.addEventListener('click',onClick,true);d.addEventListener('touchstart',onTouchStart,{capture:true,passive:true});d.addEventListener('touchend',onTouchEnd,{capture:true,passive:true});d.addEventListener('touchcancel',onTouchCancel,{capture:true,passive:true});w.addEventListener('pagehide',cancel);w.addEventListener('popstate',onRoute);d.addEventListener('visibilitychange',onVisibility);if(d.body)request();else{ready=()=>{ready=null;request();};d.addEventListener('DOMContentLoaded',ready,{once:true});}}
  else{touch=null;lastTouch=null;d.removeEventListener('click',onClick,true);d.removeEventListener('touchstart',onTouchStart,true);d.removeEventListener('touchend',onTouchEnd,true);d.removeEventListener('touchcancel',onTouchCancel,true);w.removeEventListener('pagehide',cancel);w.removeEventListener('popstate',onRoute);d.removeEventListener('visibilitychange',onVisibility);}
 }
 w.FproCommentSort={setEnabled,request,report:()=>({enabled,active:!!session,...(session?{...session.stats,passes:session.passes}:lastAttempt)}),diagnostic:()=>lastDiagnostic};
 setEnabled(w.__fproAllComments===true);
})(window);
