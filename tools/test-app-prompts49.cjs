// Based on the owner's schema1 report: a fixed owned DIV, two relative DIVs,
// one nested role=button, 411px viewport and a long feed. No account HTML.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const main=fs.readFileSync(assets+'/facebook.js','utf8'),reference=fs.readFileSync(assets+'/reference-engines.js','utf8');
const windows=[];
function fixture(mode){
 const w=new JSDOM('<!doctype html><html><body><div id="feed" style="position:relative;height:19800px"><article>Content</article></div></body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}).window;windows.push(w);
 Object.defineProperty(w,'innerWidth',{value:411});Object.defineProperty(w,'innerHeight',{value:808});
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));run();
 return {w,cfg,run,timing:()=>mode==='reference'?w.FproNoapp.timing():w.__fpro.promptTiming()};
}
const micro=async()=>{await Promise.resolve();await Promise.resolve();};
const frame=w=>new Promise(r=>w.requestAnimationFrame(r));
function bar(w){const el=w.document.createElement('div');el.style.cssText='position:fixed;bottom:0;left:0;width:100%;height:56px;background:black;display:flex';el.innerHTML='<div style="position:relative"><div style="position:relative"><div role="button" style="position:relative">فتح التطبيق</div></div></div>';el.getBoundingClientRect=()=>({width:el.style.display==='none'?0:411,height:el.style.display==='none'?0:56});return el;}
(async()=>{try{
 for(const mode of ['standalone','fallback','reference']){
  const {w,cfg,run,timing}=fixture(mode);let el=bar(w);w.document.getElementById('feed').append(el);await micro();
  assert.equal(el.style.display,'none','The report-shaped entire bar must hide BEFORE RAF, not only its child');
  assert.notEqual(el.querySelector('[role="button"]').style.display,'none');assert.equal(timing().checks,1);assert.equal(timing().hidden,1);
  await frame(w);el.style.setProperty('display','flex','important');await micro();assert.equal(el.style.display,'none','A known strong rewrite is checked before paint when quota is free');
  await frame(w);el.remove();el=bar(w);w.document.getElementById('feed').append(el);await micro();assert.equal(el.style.display,'none','A fresh replacement node is not left visible until the next frame');
  await frame(w);el.querySelector('[role="button"]').textContent='Search';await micro();assert.notEqual(el.style.display,'none','A recycled Search surface must be restored, not eagerly hidden');
  run({...cfg,appBanner:false});await frame(w);assert(!w.document.querySelector('[data-fpro-app-prompt],[data-fpro-reference-noapp]'));
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,timing}=fixture(mode),noise=w.document.createElement('section');
  noise.innerHTML=Array.from({length:2500},()=>'<button>Normal</button>').join('');
  w.document.body.append(noise);const el=bar(w);w.document.body.append(el);await micro();
  assert.equal(el.style.display,'none',mode+': a large concurrent root must not exhaust discovery before the separate fresh bar');
  assert.equal(timing().checks,1,'Concurrent ordinary roots do not spend the urgent layout quota');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,timing}=fixture(mode),fragment=w.document.createElement('section');let reads=0;
  for(let n=0;n<10;n++){const button=w.document.createElement('button');button.textContent='Open app';button.getBoundingClientRect=()=>{reads++;return {width:100,height:32};};fragment.append(button);}
  w.document.body.append(fragment);await micro();assert.equal(reads,1,'At most ONE urgent candidate per rendering batch, not ten forced layouts');assert.equal(timing().checks,1);assert.equal(fragment.querySelectorAll('[data-fpro-app-prompt],[data-fpro-reference-noapp]').length,1);
  await frame(w);assert(Array.from(fragment.children).every(el=>el.style.display==='none'),'Remainder stays on the ordinary guarded RAF queue');
  const before=reads;const normal=w.document.createElement('button');normal.textContent='Search';normal.getBoundingClientRect=()=>{reads++;return {width:100,height:32};};w.document.body.append(normal);await micro();assert.equal(reads,before,'Unrelated Search never requests geometry');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,timing}=fixture(mode),el=bar(w);el.style.height='700px';el.getBoundingClientRect=()=>({width:411,height:700});w.document.body.append(el);await micro();assert.notEqual(el.style.display,'none','Fullscreen sheets are NOT hidden by the urgent lane');
  await frame(w);const before=timing().checks;el.style.color='red';await micro();assert.equal(timing().checks,before,'Previously rejected targets cannot loop synchronous layout on unrelated style changes');
 }
 console.log('Prompts49 PASS: report-shaped bar/replacement hidden before RAF; one urgent candidate per batch; strong rewrite; Search restore; modal/large protections; rejected-node negative cache; ordinary controls zero geometry.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
