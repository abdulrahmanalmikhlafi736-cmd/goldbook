/* GPL-3.0-or-later. Optional official All-comments UI preference.
 * No network/cookies/clipboard/gesture interception. Event-bound, finite sessions.
 */
(function(w){
 'use strict';const d=w.document;
 if(w!==w.top||w.location.protocol!=='https:'||!/(^|\.)facebook\.com$/i.test(w.location.hostname))return;
 if(w.FproCommentSort){w.FproCommentSort.setEnabled(w.__fproAllComments===true);return;}
 let enabled=false,session=null,internal=false,ready=null,activation=0,lastDiagnostic=null;
 const norm=s=>String(s||'').replace(/[\u064B-\u065F\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 function name(n){let text=n.getAttribute('aria-label');if(!text){const ids=(n.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean);if(ids.length>4)return '';if(ids.length)text=ids.map(id=>d.getElementById(id)?.textContent||'').join(' ');}if(!text&&n.localName==='input')text=n.labels?.[0]?.textContent;return norm(String(text||n.textContent||'').slice(0,301));}
 const most=s=>/^(?:most relevant|الأكثر ملاءمة|الاكثر ملاءمة)$/.test(s);
 const all=s=>/^(?:all comments|كل التعليقات|جميع التعليقات)(?:$|\s|[،,.])/.test(s)&&s.length<=300;
 const sortTitle=s=>/^(?:sort comments|comment sorting|فرز التعليقات|ترتيب التعليقات)$/.test(s);
 const commentsTitle=s=>/^(?:comments|التعليقات)$/.test(s);
 const controls='button,[role="button"],[role="menuitem"],[role="menuitemradio"],[role="radio"],input[type="radio"]';
 function visible(n){if(!n?.isConnected||n.closest('[hidden],[aria-hidden="true"]')||n.disabled||n.getAttribute('aria-disabled')==='true')return false;const r=n.getBoundingClientRect();if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=w.innerHeight||r.right<=0||r.left>=w.innerWidth)return false;for(let p=n,i=0;p&&i<24;p=p.parentElement,i++){const s=w.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}return true;}
 function nodes(root){const out=[],walker=d.createTreeWalker(root,w.NodeFilter.SHOW_ELEMENT);let n=root;for(let i=0;n&&i<800;i++,n=walker.nextNode())out.push(n);return n?null:out;}
 function scopes(){const roots=Array.from(d.querySelectorAll('[role="dialog"],[role="menu"],[role="presentation"],.dialog-screen,[aria-modal="true"],[role="region"][aria-label]'));if(roots.length>32)return [];return roots.filter(visible).map(root=>({root,nodes:nodes(root)})).filter(s=>s.nodes);}
 function titled(s,test){return test(name(s.root))||s.nodes.some(n=>n.matches('h1,h2,h3,h4,h5,h6,[role="heading"]')&&visible(n)&&test(name(n)));}
 function buttons(s,test){return s.nodes.filter(n=>n.matches(controls)&&visible(n)&&!n.closest('[data-fpro-owned],.fpro-video-tools')&&test(name(n)));}
 function checked(n){return n.localName==='input'?n.checked:n.getAttribute('aria-checked')==='true';}
 function click(n){internal=true;try{n.click();}finally{internal=false;}}
 function stop(){if(!session)return;try{lastDiagnostic=w.FproCommentSortDiagnostic?.capture()||lastDiagnostic;if(lastDiagnostic)w.FproCommentSortReport?.postMessage(JSON.stringify({schema:1,current:lastDiagnostic}));}catch(_){}session.observer.disconnect();w.clearTimeout(session.timer);if(session.frame)w.cancelAnimationFrame(session.frame);session=null;}
 function pass(){const s=session;if(!s||!enabled)return;if(s.url!==w.location.href||++s.passes>24){stop();return;}
  if(s.menu){
   if(!visible(s.menu)){stop();return;}
   if(!visible(s.choice)||!checked(s.choice))return;
   const ns=nodes(s.menu);if(!ns){stop();return;}
   const confirm=buttons({root:s.menu,nodes:ns},t=>/^(?:ok|apply|done|موافق|تطبيق|تم)$/.test(t));
   if(confirm.length===1){click(confirm[0]);stop();}else if(confirm.length>1)stop();
   return;
  }
  const roots=scopes(),menus=roots.filter(r=>titled(r,sortTitle)).filter(r=>!roots.some(other=>other!==r&&r.root.contains(other.root)&&titled(other,sortTitle)));
  if(menus.length>1){stop();return;}
  if(menus.length===1){
   const menu=menus[0],choices=buttons(menu,all).filter(n=>n.matches('[role="radio"],[role="menuitemradio"],input[type="radio"]'));
   const relevant=buttons(menu,t=>most(t)||/^(?:most relevant|الأكثر ملاءمة|الاكثر ملاءمة)(?:\s|[،,.])/.test(t));
   if(choices.length!==1||relevant.length!==1){stop();return;}
   if(checked(choices[0])){stop();return;}
   s.menu=menu.root;s.choice=choices[0];click(s.choice);schedule();return;
  }
  if(s.opened)return;
  const panels=roots.filter(r=>titled(r,commentsTitle));
  let candidates=Array.from(new Set(panels.flatMap(r=>buttons(r,most))));
  // Dedicated post-page inline comments have no Comments dialog (owner36 screenshot).
  // Require an actual comment composer and one exact actionable sort control; never text/position guessing.
  if(!candidates.length&&/^\/(?:story\.php|permalink\.php|[^/]+\/posts\/[^/]+\/?)$/.test(w.location.pathname)){
   const composers=Array.from(d.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"]')).slice(0,32).filter(n=>visible(n)&&/^(?:write a comment|اكتب تعليق|أضف تعليق|اضف تعليق)/.test(norm(n.getAttribute('aria-label')||n.getAttribute('placeholder')||n.getAttribute('data-placeholder')||'')));
   if(composers.length===1){const ns=nodes(d.body);if(ns)candidates=buttons({root:d.body,nodes:ns},most);}
  }
  if(candidates.length>1){stop();return;}
  if(candidates.length===1){s.opened=true;click(candidates[0]);schedule();}
 }
 function schedule(){if(session&&!session.frame)session.frame=w.requestAnimationFrame(()=>{if(!session)return;session.frame=0;pass();});}
 function request(){if(!enabled||d.hidden||!d.body)return;stop();const observer=new w.MutationObserver(schedule);session={observer,timer:w.setTimeout(stop,8000),frame:0,passes:0,url:w.location.href,opened:false,menu:null,choice:null};observer.observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-checked','checked','aria-hidden','hidden','disabled']});schedule();}
 function onClick(e){if(internal)return;const target=e.target?.closest?.(controls);if(!target){cancel();return;}const text=name(target);if(most(text)||sortTitle(text)||(text.length<=100&&/(?:^|\s)(?:comments?|التعليقات|تعليقات|تعليق)(?:\s|$)/.test(text))){cancel();activation=w.requestAnimationFrame(()=>{activation=0;request();});}else cancel();}
 function cancel(){stop();if(activation){w.cancelAnimationFrame(activation);activation=0;}}
 function setEnabled(value){const next=value===true;if(next===enabled)return;enabled=next;cancel();if(ready){d.removeEventListener('DOMContentLoaded',ready);ready=null;}
  if(enabled){d.addEventListener('click',onClick,true);w.addEventListener('pagehide',cancel);w.addEventListener('popstate',cancel);d.addEventListener('visibilitychange',cancel);if(d.body)request();else{ready=()=>{ready=null;request();};d.addEventListener('DOMContentLoaded',ready,{once:true});}}
  else{d.removeEventListener('click',onClick,true);w.removeEventListener('pagehide',cancel);w.removeEventListener('popstate',cancel);d.removeEventListener('visibilitychange',cancel);}
 }
 w.FproCommentSort={setEnabled,request,report:()=>({enabled,active:!!session,passes:session?.passes||0}),diagnostic:()=>lastDiagnostic};
 setEnabled(w.__fproAllComments===true);
})(window);
