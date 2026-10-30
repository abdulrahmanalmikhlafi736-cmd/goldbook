// Development-only structural profiler. jsdom timings are NOT Android frame times.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{JSDOM}=require('jsdom');
const assets=['app-prompt-engine.js','site-engine.js','reference-engines.js','audio-mode.js','facebook.js'].map(f=>fs.readFileSync('app/src/main/assets/'+f,'utf8'));
async function run(name,options,size=120,mutation="class",held=false){
 const card=i=>`<article><p>Post content ${i}</p><div><a href="/profile.php?id=4">Author</a><span dir="auto">Comment content</span><a href="/story.php?comment_id=${i+1}">2h</a><button>Reply</button></div></article>`;
 const dom=new JSDOM(`<html><head></head><body><header><button id="search">Search</button></header><main role="feed">${Array.from({length:size},(_,i)=>card(i)).join('')}</main><button id="action">Like</button><div id="changing"></div></body></html>`,{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,stats={queries:0,matched:0,styles:0,rects:0,callbacks:0,callbackMs:0,maxCallbackMs:0,byObserver:{},selectors:{}};
 const nativeMO=w.MutationObserver;
 w.MutationObserver=class extends nativeMO{constructor(fn){const frame=(new Error().stack||'').split('\n').slice(2,5).map(x=>x.trim()).join(' | ');super((records,ob)=>{const start=performance.now();stats.callbacks++;const s=stats.byObserver[frame]??={calls:0,records:0,ms:0};s.calls++;s.records+=records.length;try{fn(records,ob);}finally{const ms=performance.now()-start;stats.callbackMs+=ms;stats.maxCallbackMs=Math.max(stats.maxCallbackMs,ms);s.ms+=ms;}});}};
 for(const proto of [w.Document.prototype,w.Element.prototype]){const q=proto.querySelectorAll;proto.querySelectorAll=function(sel){const nodes=q.call(this,sel);stats.queries++;stats.matched+=nodes.length;const s=stats.selectors[sel]??={calls:0,matched:0};s.calls++;s.matched+=nodes.length;return nodes;};}
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,p)=>{stats.styles++;return p?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);};
 const rect=w.Element.prototype.getBoundingClientRect;w.Element.prototype.getBoundingClientRect=function(){stats.rects++;return rect.call(this);};
 const cfg={siteEngine:'upstream',enhance:true,appBanner:true,textSelection:true,selectionScope:'posts',color:'طبيعي',referenceEngine:true,...options};
 const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
 const snapshot=()=>JSON.parse(JSON.stringify(stats));
 let init,mutations,dispatch;
 try{
  for(const source of assets)w.eval(source.replace('__CONFIG__',JSON.stringify(cfg)));
  await settle();init=snapshot();
  for(const key of Object.keys(stats)){if(typeof stats[key]==='number')stats[key]=0;else stats[key]={};}
  // Separate batches so coalescing cannot hide steady unrelated class churn.
  if(held)w.document.getElementById('action').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
  for(let i=0;i<6;i++){const el=w.document.getElementById('changing');if(mutation==='style')el.style.opacity=String((i+1)/10);else if(mutation==='child')el.appendChild(w.document.createElement('span'));else if(mutation==='text')el.textContent='tick'+i;else el.className='tick'+i;await settle();}
  if(held)w.dispatchEvent(new w.Event('pointercancel')); 
  mutations=snapshot();
  dispatch={};for(const [label,el]of [['button',w.document.getElementById('action')],['post',w.document.querySelector('article p')],['comment',w.document.querySelector('article [dir="auto"]')]]){
   const counts={pointerdown:0,touchstart:0,click:0};const listeners={};for(const event of Object.keys(counts)){listeners[event]=()=>counts[event]++;w.document.addEventListener(event,listeners[event],true);}
   for(const event of Object.keys(counts))el.dispatchEvent(new w.Event(event,{bubbles:true,cancelable:true}));
   w.dispatchEvent(new w.Event('pointercancel'));w.dispatchEvent(new w.Event('touchcancel'));w.dispatchEvent(new w.Event('blur'));
   for(const event of Object.keys(counts))w.document.removeEventListener(event,listeners[event],true);dispatch[label]=counts;
  }
  return {name,size,mutation,held,config:cfg,init,unrelatedSixClassChanges:mutations,websiteEvents:dispatch};
 }finally{w.__fpro?.update({...cfg,enhance:false,textSelection:false});w.FproPrompt?.update({...cfg,enhance:false});dom.window.close();}
}
(async()=>{const rows=[];for(const [name,cfg,size,mutation,held] of [
 ['base-small',{},40],['base-large',{},240],['selection-off',{textSelection:false},240],['master-off',{enhance:false},240],['both-off',{enhance:false,textSelection:false},240],['gold',{color:'ذهبي'},120],['amoled',{amoled:true,dark:true},120],['gold-style',{color:'ذهبي'},120,'style'],['amoled-style',{amoled:true,dark:true},120,'style'],['base-child',{},120,'child'],['base-held-class',{},240,'class',true],['gold-held-style',{color:'ذهبي'},120,'style',true],['all-imported-filters',{ads:true,suggested:true,people:true,groups:true,reels:true,stories:true,sticky:true},120]
]){rows.push(await run(name,cfg,size,mutation,held));console.error(name,'complete');}console.log(JSON.stringify({note:'Synthetic jsdom workload; operation counts are evidence, milliseconds are not device input latency. No signed-in account, pixel or network coverage.',rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
