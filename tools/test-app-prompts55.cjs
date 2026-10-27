const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const ref=fs.readFileSync(assets+'/reference-engines.js','utf8'),main=fs.readFileSync(assets+'/facebook.js','utf8');
const windows=[],micro=async()=>{await Promise.resolve();await Promise.resolve();},frame=w=>new Promise(r=>w.requestAnimationFrame(r));
function fixture(withMain=false){
 const w=new JSDOM('<!doctype html><html><head></head><body><main>Page remains usable</main></body></html>',{url:'https://m.facebook.com/watch/',runScripts:'outside-only',pretendToBeVisual:true}).window;windows.push(w);
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(e,p)=>p?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(e);
 Object.defineProperty(w,'innerWidth',{value:411});Object.defineProperty(w,'innerHeight',{value:808});w.eval(ref);
 const cfg={enhance:true,referenceEngine:true,appBanner:true,color:'طبيعي',textSelection:false};
 const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));
 if(withMain)run();else w.FproNoapp.set({noOpenApp:true});return {w,cfg,run};
}
function bar(w){
 const root=w.document.createElement('div');root.className='late55';root.innerHTML='<button>فتح التطبيق</button>';w.document.body.append(root);
 root.getBoundingClientRect=()=>({width:411,height:65,top:720,left:0});root.firstChild.getBoundingClientRect=()=>({width:124,height:40});return root;
}
(async()=>{try{
 // Stable ON must not restore previously verified ownership, including when
 // scan cannot run (background document); OFF/master/engine changes still do.
 {
  const {w,cfg,run}=fixture(true),root=bar(w);await micro();await micro();
  const cue=root.firstChild;assert.equal(cue.style.display,'none');let restores=0;
  const restore=w.FproNoapp.restore;w.FproNoapp.restore=()=>{restores++;restore();};
  Object.defineProperty(w.document,'hidden',{value:true,configurable:true});
  run({...cfg,dark:true});assert.equal(restores,0,'ON->ON never calls restore');assert(cue.hasAttribute('data-fpro-reference-noapp'));
  run({...cfg,enhance:false});assert(restores>0);assert(!cue.hasAttribute('data-fpro-reference-noapp'));
  Object.defineProperty(w.document,'hidden',{value:false,configurable:true});run();assert.equal(cue.style.display,'none','Immediate forced scan on re-enable');
  run({...cfg,referenceEngine:false,appBanner:false});assert(!cue.hasAttribute('data-fpro-reference-noapp'));
 }
 // CSSOM changes do not emit mutation records. Finite retry promotes the
 // hidden child to the newly fixed bar WITHOUT a full-document hunt/observer.
 {
  const {w}=fixture(),root=bar(w);w.FproNoapp.scan([root],true,false,true);await micro();
  assert.equal(root.firstChild.style.display,'none');assert.notEqual(root.style.display,'none');
  const style=w.document.createElement('style');w.document.head.append(style);style.sheet.insertRule('.late55{position:fixed;height:65px;bottom:0}');
  await frame(w);await micro();assert.equal(root.style.display,'none','Late CSS promotes whole dedicated bar');assert.notEqual(root.firstChild.style.display,'none','Atomic promotion restores child');
  root.style.setProperty('display','block','important');assert.equal(w.document.getElementById('fpro-noapp-guard').textContent,'[data-fpro-reference-noapp]{display:none!important}','Owned-marker guard present; real cascade is checked natively, not jsdom');
  w.FproNoapp.restore();assert(!root.hasAttribute('data-fpro-reference-noapp'));assert.equal(root.style.display,'block','OFF respects site rewritten display');assert.equal(w.FproNoapp.timing().retry.retained,0);
 }
 // Exhaustion must stop polling; a stylesheet event AFTER10s must still retry.
 {
  const {w}=fixture(),root=bar(w),cue=root.firstChild;let tall=true,reads=0;
  cue.getBoundingClientRect=()=>{reads++;return {width:124,height:tall?120:40};};
  w.FproNoapp.scan([root],true,false,true);await micro();
  for(let i=0;i<48;i++)await frame(w);
  const atEnd=reads;for(let i=0;i<3;i++)await frame(w);assert.equal(reads,atEnd,'No geometry reads after retry budget exhaustion');assert.equal(w.FproNoapp.timing().retry.active,0);assert(w.FproNoapp.timing().retry.checks<=45);
  tall=false;Object.defineProperty(w.performance,'now',{value:()=>20000});
  const link=w.document.createElement('link');link.rel='stylesheet';w.document.head.append(link);link.dispatchEvent(new w.Event('load'));await micro();await frame(w);assert.equal(cue.style.display,'none','Late stylesheet event has no10-second cutoff');
  cue.textContent='Search';w.FproNoapp.scan([cue],true,true);await micro();await frame(w);assert.notEqual(cue.style.display,'none','Safety revalidation restores recycled Search');
  root.remove();w.FproNoapp.prune();assert.equal(w.FproNoapp.timing().retry.retained,0);
 }
 // Retention/candidate cap and detach cancellation.
 {
  const {w}=fixture();for(let i=0;i<30;i++){const root=bar(w);w.FproNoapp.scan([root],true,false,true);}
  await micro();assert(w.FproNoapp.timing().retry.retained<=8);
  const latest=bar(w);w.FproNoapp.scan([latest],true,false,true);await micro();
  const style=w.document.createElement('style');w.document.head.append(style);style.sheet.insertRule('.late55{position:fixed;height:65px;bottom:0}');
  await frame(w);await micro();assert.equal(latest.style.display,'none','Recent navigation cue is not starved behind older watched CTAs');
  w.FproNoapp.restore();const n=w.FproNoapp.timing().retry.checks;await frame(w);assert.equal(w.FproNoapp.timing().retry.checks,n);
 }
 console.log('Prompts55 PASS: ON ownership, immediate enable, master/OFF restore, engine CSS cascade, finite late-CSS promotion,45-check/8-cue limits, late stylesheet event, recycle/detach cancellation.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
