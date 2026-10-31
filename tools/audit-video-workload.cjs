// Structural video workload audit. No decoding, GPU, battery or thermal claims.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const assets=['feed-return.js','app-prompt-engine.js','site-engine.js','reference-engines.js','audio-mode.js','facebook.js'];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function run(name,flags,stimulus,filterOwned=false){
 const w=new JSDOM('<!doctype html><head></head><body><article><video id="player"></video><span id="siteClock">0:00</span></article><main role="feed">'+Array.from({length:120},(_,i)=>`<article><p style="color:rgb(8,102,255)">Post ${i}</p><button>Like</button></article>`).join('')+'</main></body>',{url:'https://m.facebook.com/watch/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 const cfg={siteEngine:'upstream',enhance:true,appBanner:true,textSelection:true,selectionScope:'posts',referenceEngine:true,color:'طبيعي',downloads:true,rainbow:true,...flags};
 let stats;const reset=()=>stats={queries:0,returned:0,styles:0,rects:0,observerCallbacks:0,observerRecords:0,observers:{}};reset();
 const Native=w.MutationObserver;
 w.MutationObserver=class extends Native{constructor(fn){const id=(new Error().stack).split('\n').slice(2,4).map(s=>s.trim()).join(' | ');super((records,ob)=>{stats.observerCallbacks++;stats.observerRecords+=records.length;stats.observers[id]??={callbacks:0,records:0};stats.observers[id].callbacks++;stats.observers[id].records+=records.length;fn(records,ob);});}};
 for(const p of [w.Document.prototype,w.Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){const r=q.call(this,s);stats.queries++;stats.returned+=r.length;return r;};}
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>{stats.styles++;return pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);};
 const rect=w.Element.prototype.getBoundingClientRect;w.Element.prototype.getBoundingClientRect=function(){stats.rects++;return this.id==='player'?{left:0,right:360,top:0,bottom:240,width:360,height:240}:rect.call(this);};
 const v=w.document.getElementById('player');
 for(const [k,val] of Object.entries({duration:120,currentTime:0,paused:false,ended:false,readyState:4,videoWidth:640,videoHeight:360}))Object.defineProperty(v,k,{configurable:true,writable:true,value:val});
 try{
  for(const file of assets){
   let source=fs.readFileSync('app/src/main/assets/'+file,'utf8');
   if(filterOwned&&file==='site-engine.js'){
    const before='new MutationObserver(() => {\n    processMaterialYouStyles();\n  })';
    assert(source.includes(before),'Audit-only candidate must patch exactly the material color observer');
    source=source.replace(before,`new MutationObserver(records => {
     if(records.every(r => {const el=r.target.nodeType===1?r.target:r.target.parentElement;return el&&el.closest('.fpro-video-tools');}))return;
     processMaterialYouStyles();
    })`);
   }
   w.eval(source.replace('__CONFIG__',JSON.stringify(cfg))+'\n//# sourceURL='+file);
  }
  await wait(1800);reset();
  const scans=w.__fpro.promptState().scans;
  for(let n=1;n<=12;n++){
   if(stimulus.includes('progress')){v.currentTime=n/4;v.dispatchEvent(new w.Event('timeupdate'));}
   if(stimulus.includes('site'))w.document.getElementById('siteClock').textContent='0:'+String(n).padStart(2,'0');
   await wait(250);
  }
  await wait(350);
  return JSON.parse(JSON.stringify({name,stimulus,auditOnlyIgnoreOwnedColorChanges:filterOwned,updates:12,nominalCadenceHz:4,config:cfg,...stats,fullScans:w.__fpro.promptState().scans-scans,siteEngine:w.FproSiteEngine.report()}));
 }finally{w.__fpro?.update({...cfg,enhance:false,textSelection:false});w.FproPrompt?.update({...cfg,enhance:false});w.close();}
}
(async()=>{const rows=[];const cases=process.argv.includes('--candidate')?[
 ['progress-gold-owned-skip',{color:'ذهبي'},'progress',true],
 ['site-clock-gold-owned-skip',{color:'ذهبي'},'site',true]
]:[
 ['idle-tools',{},'idle'],['progress-tools',{},'progress'],['site-clock-tools',{},'site'],['progress-tools-off',{downloads:false,rainbow:false},'progress'],
 ['progress-gold',{color:'ذهبي'},'progress'],['site-clock-gold',{color:'ذهبي'},'site'],['progress-adblock',{ads:true},'progress'],['progress-master-off',{enhance:false},'progress']
];for(const [name,flags,stimulus,filterOwned] of cases){rows.push(await run(name,flags,stimulus,filterOwned));console.error(name+' complete');}
console.log(JSON.stringify({productionCommit:'fd98e31',scope:'Synthetic DOM operation counts with simulated timeupdate at four Hz; NOT real media decode, CPU utilization, GPU, battery, thermal or owner-account measurement.',rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
