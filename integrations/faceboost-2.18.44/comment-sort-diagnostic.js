/* GPL-3.0-or-later. Read-only numeric comment-sort structure. Never exports text/IDs/URLs. */
(function(w){
 'use strict';if(w!==w.top||w.location.protocol!=='https:'||!/(^|\.)facebook\.com$/i.test(w.location.hostname)||w.FproCommentSortDiagnostic)return;
 const seenEvents=new WeakSet();
 let events=0,traces=0,unmatched=0,bypassed=0,genericStarts=0,lastGood=null;
 const d=w.document,norm=s=>String(s||'').replace(/[\u064B-\u065F\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 function text(n){const walker=d.createTreeWalker(n,w.NodeFilter.SHOW_TEXT);let t='',x;for(let i=0;(x=walker.nextNode())&&i<32;i++){t+=String(x.nodeValue||'').slice(0,301-t.length);if(t.length>300)return '';}return x?'':t;}
 function name(n){let value=n.getAttribute('aria-label');if(value)return {value:norm(value.slice(0,301)),via:1};const ids=(n.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean);if(ids.length&&ids.length<=4){const t=ids.map(id=>{const x=d.getElementById(id);return x?text(x):'';}).join(' ');if(t)return {value:norm(t.slice(0,301)),via:2};}if(n.localName==='input'&&n.labels?.length)return {value:norm(text(n.labels[0])),via:3};return {value:norm(text(n)),via:4};}
 function kind(s){if(s.length>300)return 0;if(/^(?:الأكثر ملاءمة|الاكثر ملاءمة|most relevant)(?:$|\s|[،,.])/.test(s))return 1;if(/^(?:كل التعليقات|جميع التعليقات|all comments)(?:$|\s|[،,.])/.test(s))return 2;if(/^(?:الأحدث|الاحدث|newest|most recent)(?:$|\s|[،,.])/.test(s))return 3;if(/^(?:فرز التعليقات|ترتيب التعليقات|sort comments|comment sorting)$/.test(s))return 4;if(/^(?:موافق|تطبيق|تم|ok|apply|done)$/.test(s))return 5;return 0;}
 function visible(n){if(!n?.isConnected||n.closest('[hidden],[aria-hidden="true"]'))return false;const r=n.getBoundingClientRect();if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=w.innerHeight||r.right<=0||r.left>=w.innerWidth)return false;for(let p=n,i=0;p&&i<20;p=p.parentElement,i++){const s=w.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}return true;}
 function capture(){const out={schema:1,route:/^\/(?:story\.php|permalink\.php|[^/]+\/posts\/[^/]+\/?)$/.test(w.location.pathname)?1:/^\/(?:watch|reels?)(?:\/|$)/.test(w.location.pathname)?2:3,composers:Math.min(32,Array.from(d.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"]')).slice(0,32).filter(n=>visible(n)&&/^(?:write a comment|اكتب تعليق|أضف تعليق|اضف تعليق)/.test(norm(n.getAttribute('aria-label')||n.getAttribute('placeholder')||n.getAttribute('data-placeholder')||''))).length),enabled:w.FproCommentSort?.report().enabled?1:0,visited:0,points:0,limited:0,scopes:0,rows:[]},seen=new Set(),rows=new Map();
  const role=n=>({button:1,radio:2,menuitemradio:3,menuitem:4,dialog:5,presentation:6,menu:7,heading:8,region:9})[n.getAttribute('role')]||0;
  function add(n){if(!n||seen.has(n)||out.visited>=1200)return;seen.add(n);out.visited++;if(!visible(n))return;const named=name(n),label=kind(named.value);if(!label)return;
   const r=n.getBoundingClientRect();let owner=n,depth=0;for(let p=n,i=0;p&&i<6;p=p.parentElement,i++)if(p.matches('button,[role="button"],[role="radio"],[role="menuitemradio"],input[type="radio"],[data-action-id]')){owner=p;depth=i+1;break;}
   const key=owner;if(rows.has(key)&&rows.get(key).label!==4)return;if(rows.size>=16&&!rows.has(key)){out.limited|=4;return;}
   const checked=owner.localName==='input'&&owner.type==='radio'?(owner.checked?1:2):owner.getAttribute('aria-checked')==='true'?1:owner.getAttribute('aria-checked')==='false'?2:0;
   rows.set(key,{label,via:named.via,tag:({div:1,span:2,button:3,input:4,label:5,h1:6,h2:6,h3:6})[owner.localName]||0,role:role(owner),action:owner.hasAttribute('data-action-id')?1:0,component:owner.hasAttribute('data-mcomponent')?1:0,checked,depth,scope:owner.closest('[role="dialog"],[role="presentation"],[role="menu"],.dialog-screen,[aria-modal="true"]')?1:0,x:Math.round(r.left/Math.max(1,w.innerWidth)*1000),y:Math.round(r.top/Math.max(1,w.innerHeight)*1000),width:Math.round(r.width/Math.max(1,w.innerWidth)*1000),height:Math.round(r.height/Math.max(1,w.innerHeight)*1000)});
  }
  // Local visible modal roots first, then bounded hit-testing for inline/MComponent layouts.
  const roots=Array.from(d.querySelectorAll('[role="dialog"],[role="presentation"],[role="menu"],.dialog-screen,[aria-modal="true"]')).filter(visible);out.scopes=Math.min(32,roots.length);if(roots.length>32)out.limited|=1;
  for(const root of roots.slice(0,32)){const walker=d.createTreeWalker(root,w.NodeFilter.SHOW_ELEMENT);let n=root;for(let i=0;n&&i<400&&out.visited<1200;i++,n=walker.nextNode())add(n);if(n)out.limited|=2;}
  if(typeof d.elementsFromPoint==='function')for(const x of [.15,.5,.85])for(let i=0;i<16;i++){out.points++;for(const hit of d.elementsFromPoint(w.innerWidth*x,w.innerHeight*(.03+i*.94/15)).slice(0,3)){for(let p=hit,j=0;p&&j<5;p=p.parentElement,j++)add(p);}}
  if(out.visited>=1200)out.limited|=2;out.rows=Array.from(rows.values());const attempt=w.FproCommentSort?.report();for(const key of ['stage','reason','passes','menus','choices','relevant','openers','confirms','scanned','fallbacks','buttonLimited','nativeSeen','nativeStarts','nativePhase'])out[key]=Number.isInteger(attempt?.[key])?attempt[key]:0;Object.assign(out,{events,traces,unmatched,bypassed,pending:watch?1:0});return out;
 }
 let trace=null,watch=null,traceTimer=0,started=0,traceUrl='',lastTarget=null,touchOrigin=null;
 const roleCode=n=>({button:1,radio:2,menuitemradio:3,menuitem:4,dialog:5,presentation:6,menu:7,heading:8,region:9})[n.getAttribute('role')]||0;
 const route=()=>/^\/(?:story\.php|permalink\.php|[^/]+\/posts\/[^/]+\/?)$/.test(w.location.pathname)?1:/^\/(?:watch|reels?)(?:\/|$)/.test(w.location.pathname)?2:3;
 function opener(){const kept=trace?.result===1?trace:lastGood||trace;return kept?JSON.parse(JSON.stringify(kept)):null;}
 function publish(){if(!trace)return;try{w.FproCommentSortReport?.postMessage(JSON.stringify({schema:1,current:capture(),opener:opener()}));}catch(_){}}
 function stopTrace(result){if(!watch)return;trace.result=result;if(result===1)lastGood=trace;trace.endRoute=route();trace.age=Math.min(8,Math.floor((w.performance.now()-started)/1000));watch.disconnect();watch=null;w.clearTimeout(traceTimer);traceTimer=0;publish();}
 function officialMenu(){
  const roots=Array.from(d.querySelectorAll('[role="dialog"],[role="presentation"],[role="menu"],.dialog-screen,[aria-modal="true"]')).filter(visible);if(roots.length>32)return false;let budget=1200;
  for(const root of roots){const walker=d.createTreeWalker(root,w.NodeFilter.SHOW_ELEMENT);let title=false,all=0,most=0,ok=0,n=root,i=0;
   for(;n&&i<400&&budget>0;i++,budget--,n=walker.nextNode()){
    if(!visible(n))continue;const k=kind(name(n).value);
    if(k===4&&(n===root||n.matches('h1,h2,h3,h4,h5,h6,[role="heading"]')))title=true;
    if(n.matches('[role="radio"],[role="menuitemradio"],input[type="radio"]')){if(k===1)most++;if(k===2)all++;}
    if(k===5&&n.matches('button,[role="button"]'))ok++;
   }
   if(!n&&title&&all===1&&most===1&&ok===1)return true;
  }return false;
 }
 function checkTrace(){if(!watch)return;if(w.location.href!==traceUrl){stopTrace(3);return;}if(++trace.checks>16){stopTrace(5);return;}if(officialMenu())stopTrace(1);}
 function finishActivation(e){if(!trace||trace.event!==1||!touchOrigin)return;
  if(e.type==='touchcancel'||e.touches?.length||e.changedTouches?.length!==1)trace.tap=3;
  else{const p=e.changedTouches[0];trace.tap=Math.hypot(p.clientX-touchOrigin.x,p.clientY-touchOrigin.y)<=12?1:2;}
  touchOrigin=null;if(watch&&trace.generic&&trace.tap!==1)stopTrace(6);else publish();
 }
 function recordActivation(e){
  if(!w.FproCommentSort?.report().enabled||!d.body||d.hidden||!['touchstart','click'].includes(e.type))return;
  if(seenEvents.has(e))return;seenEvents.add(e);events=Math.min(64,events+1);if(e.type==='touchstart'&&e.touches?.length!==1)return;
  let target=e.target?.nodeType===1?e.target:e.target?.parentElement;if(!target||target.closest('[data-fpro-owned],.fpro-video-tools'))return;
  if(trace&&lastTarget===target&&w.performance.now()-started<700)return;
  const chain=[];let matched=false;
  for(let n=target,i=0;n&&i<16;n=n.parentElement,i++){
   const named=name(n),label=kind(named.value),r=n.getBoundingClientRect();if((label===1||label===2)&&!n.matches('[role="radio"],[role="menuitemradio"],input[type="radio"]'))matched=true;
   chain.push({textMost:w.FproCommentSort?.visibleMost?.(n)?1:0,label,via:named.via,tag:({div:1,span:2,button:3,input:4,label:5,h1:6,h2:6,h3:6})[n.localName]||0,role:roleCode(n),action:n.hasAttribute('data-action-id')?1:0,component:n.hasAttribute('data-mcomponent')?1:0,checked:n.getAttribute('aria-checked')==='true'?1:n.getAttribute('aria-checked')==='false'?2:0,depth:i+1,scope:n.closest('[role="dialog"],[role="presentation"],[role="menu"],.dialog-screen,[aria-modal="true"]')?1:0,exact:/^(?:الأكثر ملاءمة|الاكثر ملاءمة|most relevant|كل التعليقات|جميع التعليقات|all comments)$/.test(named.value)?1:0,disabled:n.disabled||n.getAttribute('aria-disabled')==='true'?1:0,visible:visible(n)?1:0,x:Math.round(r.left/Math.max(1,w.innerWidth)*1000),y:Math.round(r.top/Math.max(1,w.innerHeight)*1000),width:Math.round(r.width/Math.max(1,w.innerWidth)*1000),height:Math.round(r.height/Math.max(1,w.innerHeight)*1000)});
  }
  if(officialMenu())return;
  if(!matched){unmatched=Math.min(32,unmatched+1);if(route()!==1||genericStarts>=8){bypassed=Math.min(32,bypassed+1);stopTrace(5);return;}genericStarts++;}
  traces=Math.min(32,traces+1);
  stopTrace(5);started=w.performance.now();traceUrl=w.location.href;lastTarget=target;touchOrigin=e.type==='touchstart'?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;
  const walker=d.createTreeWalker(d.body,w.NodeFilter.SHOW_ELEMENT);let node=d.body,count=0;while(node&&count<800){count++;node=walker.nextNode();}
  const pre=capture(),exact=chain.filter(n=>n.label===1&&n.exact),button=exact.filter(n=>n.tag===3||n.role===1);
  const blockers=(node?1:0)|(!button.length?2:0)|(pre.composers===0&&!button.some(n=>n.role===1&&n.action&&n.component)?4:0)|(!exact.length?8:0)|(!exact.some(n=>n.visible)?16:0)|(exact.some(n=>n.disabled)?32:0)|(route()!==1?64:0);
  trace={...pre,generic:matched?0:1,endRoute:route(),blockers,event:e.type==='touchstart'?1:2,trusted:e.isTrusted?1:0,tap:e.type==='click'?1:0,result:0,checks:0,age:0,bodyLimited:node?1:0,rows:chain};
  watch=new w.MutationObserver(checkTrace);watch.observe(d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden','role','aria-label','aria-checked']});traceTimer=w.setTimeout(()=>stopTrace(w.location.href===traceUrl?2:3),8000);publish();
 }
 // Earliest read-only window capture also sees trusted input consumed before document listeners.
 ['touchstart','click'].forEach(type=>w.addEventListener(type,e=>{if(e.isTrusted)recordActivation(e);},{capture:true,passive:true}));
 ['touchend','touchcancel'].forEach(type=>w.addEventListener(type,e=>{if(e.isTrusted)finishActivation(e);},{capture:true,passive:true}));
 w.addEventListener('pagehide',()=>stopTrace(3));
 d.addEventListener('visibilitychange',()=>{if(d.hidden)stopTrace(3);});
 w.FproCommentSortDiagnostic={capture,recordActivation,finishActivation,opener,stopTrace};

})(window);
