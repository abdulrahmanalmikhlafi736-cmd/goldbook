// Dedicated fixed app banner regression; not a reproduction of a logged-in account.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const main=fs.readFileSync(assets+'/facebook.js','utf8'),reference=fs.readFileSync(assets+'/reference-engines.js','utf8');
const windows=[];
function fixture(mode){
 const w=new JSDOM('<!doctype html><html><body><main><article>Post</article><button id="search">Search</button></main><div id="bar" style="position:fixed;bottom:0;left:0;width:100%;min-height:90px;background:black;display:flex!important"><button id="cta">فتح التطبيق</button><button aria-label="Close">×</button></div></body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 windows.push(w);const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 const bar=w.document.getElementById('bar');bar.getBoundingClientRect=()=>bar.style.display==='none'?{width:0,height:0}:{width:w.innerWidth,height:90};
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};
 const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));run();return {w,bar,cfg,run};
}
const frame=w=>new Promise(r=>w.requestAnimationFrame(r));
async function settle(w){await Promise.resolve();await frame(w);await frame(w);}
(async()=>{try{
 for(const mode of ['standalone','fallback','reference']){
  const {w,bar,cfg,run}=fixture(mode),cta=w.document.getElementById('cta');
  assert.equal(bar.style.display,'none','Whole dedicated bar must disappear, not leave its fixed black min-height');
  assert.notEqual(cta.style.display,'none','The bar alone owns hiding, not its child');
  assert.notEqual(w.document.querySelector('main').style.display,'none');
  assert.equal(bar.hasAttribute('data-fpro-reference-noapp'),mode==='reference');
  for(let n=0;n<8;n++){run();await settle(w);assert.equal(bar.style.display,'none','Hidden geometry must not make the bar flash back');}
  run({...cfg,appBanner:false});await settle(w);assert.equal(bar.style.display,'flex');assert.equal(bar.style.getPropertyPriority('display'),'important');assert.equal(bar.style.minHeight,'90px');
  run();assert.equal(bar.style.display,'none');
  cta.textContent='Search';await settle(w);run();assert.equal(bar.style.display,'flex','A recycled bar must be restored');assert.notEqual(cta.style.display,'none');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,bar,cfg,run}=fixture(mode),cta=w.document.getElementById('cta');
  run({...cfg,appBanner:false});bar.style.position='static';run();assert.equal(cta.style.display,'none');
  bar.style.position='fixed';await settle(w);
  assert.equal(bar.style.display,'none');assert.notEqual(cta.style.display,'none','Ownership must move from child to bar before a later full scan');
  bar.setAttribute('role','dialog');await settle(w);assert.equal(bar.style.display,'flex');assert.notEqual(cta.style.display,'none','A restored dialog cannot inherit a hidden child');
 }
 for(const mode of ['standalone','fallback','reference'])for(const content of ['<video></video>','<img src="/photo">','<input>','<button>Search</button>','<p>A normal post that mentions an app</p>','<article>A post</article>']){
  const {w,bar,run}=fixture(mode);bar.insertAdjacentHTML('beforeend',content);await settle(w);run();assert.equal(bar.style.display,'flex','Unknown/media/account content must restore the fixed surface: '+content);assert.notEqual(w.document.getElementById('cta').style.display,'none','Do not leave a dead strip by hiding only its CTA');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,bar,run}=fixture(mode);bar.setAttribute('role','dialog');bar.setAttribute('aria-modal','true');await settle(w);run();assert.equal(bar.style.display,'flex','A compact modal stays usable');
  bar.removeAttribute('role');bar.removeAttribute('aria-modal');bar.style.minHeight='600px';await settle(w);run();assert.equal(bar.style.display,'flex','A fullscreen/oversized surface is never a compact app bar');
 }
 console.log('App banners46 PASS: dedicated fixed surface removed; no empty strip; stable ownership; exact restoration; recycled/media/form/modal/unknown content protected in all three modes.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
