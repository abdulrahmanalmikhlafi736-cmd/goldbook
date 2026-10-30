// Diagnostic-only ON/OFF comparison. No production changes; no device-latency claim.
const assert=require('node:assert/strict');
const fs=require('node:fs'),{JSDOM}=require('jsdom');
const files=['app-prompt-engine.js','site-engine.js','reference-engines.js','audio-mode.js','facebook.js'];
const sources=files.map(f=>fs.readFileSync('app/src/main/assets/'+f,'utf8'));
async function run({enabled,size,kind,full=false}){
 const html='<body><main id="feed" role="feed">'+Array.from({length:size},(_,i)=>`<article><div class="native-text">Reading ${i}</div><div role="button"><span>Like</span></div></article>`).join('')+'</main><div style="position:fixed" data-actual-height="48"><button id="cta">فتح التطبيق</button></div></body>';
 const d=new JSDOM(html,{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}),w=d.window;
 const cfg={siteEngine:'upstream',enhance:true,appBanner:enabled,textSelection:true,selectionScope:'posts',color:'ذهبي',referenceEngine:true,ads:true,suggested:true,people:true,groups:true,reels:true,stories:true,homeStories:true,sticky:true,amoled:true,dark:true};
 let queryCalls=0,returnedNodes=0,landmarkQueries=0;
 for(const p of [w.Document.prototype,w.Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){const r=q.call(this,s);queryCalls++;returnedNodes+=r.length;if(s==='main,[role="main"],[role="feed"]')landmarkQueries++;return r;};}
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,p)=>p?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
 try{
  if(full){for(const s of sources)w.eval(s.replace('__CONFIG__',JSON.stringify(cfg)));}else{w.eval(sources[0]);w.FproPrompt.update(cfg);}
  await flush();const initial=w.FproPrompt.report();queryCalls=returnedNodes=landmarkQueries=0;
  const feed=w.document.getElementById('feed'),leaf=feed.querySelector('[role="button"]'),cta=w.document.getElementById('cta');
  // Same six mutations in each ON/OFF arm. No touches or copy-setting changes.
  for(let i=0;i<6;i++){
   if(kind==='leaf')leaf.style.opacity=String((i+1)/10);
   else if(kind==='rewrite')cta.parentElement.style.setProperty('display','block','important');
   else if(kind==='burst'){for(let n=0;n<30;n++)feed.style.opacity=String((n+1)/40);}
   else feed.style.opacity=String((i+1)/10);
   await flush();
  }
  const end=w.FproPrompt.report();if(!enabled)assert.equal(end.passes-initial.passes,0,'OFF disconnects prompt work');const result={enabled,size,kind,full,queryCalls,returnedNodes,landmarkQueries,passes:end.passes-initial.passes,checked:end.checked-initial.checked,hidden:[cta,...(function*(){for(let n=cta.parentElement;n;n=n.parentElement)yield n;})()].some(n=>w.getComputedStyle(n).display==='none')};
  assert.equal(result.hidden,enabled,'Prompt hiding/restoration must remain correct in every arm');
  // An idle checkpoint distinguishes bounded own-write callbacks from a loop.
  await new Promise(r=>w.setTimeout(r,30));result.extraIdlePasses=w.FproPrompt.report().passes-end.passes;
  return result;
 }finally{w.__fpro?.update({...cfg,enhance:false,textSelection:false});w.FproSiteEngine?.update({...cfg,enhance:false});w.FproPrompt?.update({...cfg,enhance:false});w.close();}
}
(async()=>{const rows=[];for(const options of [{size:40,kind:'ancestor'},{size:240,kind:'ancestor'},{size:1000,kind:'ancestor'},{size:240,kind:'leaf'},{size:240,kind:'rewrite'},{size:240,kind:'burst'},{size:120,kind:'ancestor',full:true}])for(const enabled of [false,true])rows.push(await run({...options,enabled}));console.log(JSON.stringify({note:'Identical fixture/config/mutations; only appBanner toggled within each pair. Synthetic operation counts, not Android frame timing or the owner private DOM. Full arm loads all five assets with other filters enabled.',rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
