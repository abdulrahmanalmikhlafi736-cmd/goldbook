const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const main=fs.readFileSync(assets+'/facebook.js','utf8'),reference=fs.readFileSync(assets+'/reference-engines.js','utf8');
const report=fs.readFileSync('app/src/main/assets/app-prompt-report.js','utf8');
const windows=[];
function fixture(mode,html){
 const w=new JSDOM('<!doctype html><html><body>'+html+'</body></html>',{url:'https://m.facebook.com/reel/private-path-secret',runScripts:'outside-only',pretendToBeVisual:true}).window;windows.push(w);
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 Object.defineProperty(w,'innerWidth',{value:411});Object.defineProperty(w,'innerHeight',{value:808});
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};
 const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));run();return {w,cfg,run};
}
function scene(w,label){
 const host=w.document.createElement('div');host.style.cssText='position:absolute;top:0;left:0;width:411px;height:809px';host.getBoundingClientRect=()=>({x:0,y:0,top:0,left:0,width:411,height:809});
 host.innerHTML='<video id="movie51"></video><div id="nav51" style="position:fixed;top:0;left:12px;width:399px;height:60px"><div style="position:relative"><div role="button" id="cta51" aria-label="'+label+'">'+label+'</div><div role="button" aria-label="Your profile" id="profile51"></div><div role="button" aria-label="Search" id="search51"></div><div role="button" aria-label="Back" id="back51"></div></div></div>';
 const nav=host.querySelector('#nav51');nav.getBoundingClientRect=()=>({x:12,y:0,top:0,left:12,width:399,height:60});host.querySelector('#cta51').getBoundingClientRect=()=>({x:12,y:16,top:16,left:12,width:124,height:40});return host;
}
const micro=async()=>{await Promise.resolve();await Promise.resolve();};
(async()=>{try{
 for(const mode of ['standalone','fallback','reference'])for(const label of ['فتح التطبيق','f فتح التطبيق','Facebook فتح التطبيق','فيسبوك فتح التطبيق','فتح التطبيق f','\u061cفتح التطبيق\u2060']){
  const {w,cfg,run}=fixture(mode,''),host=scene(w,label);w.document.body.append(host);await micro();
  assert.equal(w.document.getElementById('cta51').style.display,'none',mode+': exact branded CTA inside absolute Reels media host: '+label);
  for(const el of [host,...['nav51','movie51','profile51','search51','back51'].map(id=>w.document.getElementById(id))])assert.notEqual(el.style.display,'none','Never hide navigation, media or fullscreen host');
  host.setAttribute('aria-modal','true');run();assert.notEqual(w.document.getElementById('cta51').style.display,'none','Modal protection still wins');
  host.removeAttribute('aria-modal');run();assert.equal(w.document.getElementById('cta51').style.display,'none');
  run({...cfg,appBanner:false});assert.notEqual(w.document.getElementById('cta51').style.display,'none');
 }
 for(const mode of ['standalone','fallback','reference'])for(const label of ['Facebook account details فتح التطبيق','f Search','Open app to read private content']){
  const {w}=fixture(mode,''),host=scene(w,label);w.document.body.append(host);await micro();assert.notEqual(host.querySelector('#cta51').style.display,'none','Branding/aria cannot authorize unrelated prose');
 }
 for(const mode of ['standalone','fallback','reference'])for(const blocked of ['unknown-header','non-reels','fixed-sheet','form-host']){
  const {w}=fixture(mode,''),host=scene(w,'f فتح التطبيق');
  if(blocked==='unknown-header')host.querySelector('#search51').setAttribute('aria-label','Share');
  if(blocked==='non-reels')w.history.replaceState(null,'','/profile');
  if(blocked==='fixed-sheet')host.style.position='fixed';
  if(blocked==='form-host')host.append(w.document.createElement('input'));
  w.document.body.append(host);await micro();assert.notEqual(host.querySelector('#cta51').style.display,'none','Media-host exception must not escape its evidence: '+blocked);
 }
 const {w}=fixture('reference','');w.document.body.append(scene(w,'f فتح التطبيق'));await micro();
 const detail=JSON.parse(w.eval(report));assert.equal(detail.schema,4);assert.equal(detail.candidates[0].evidence.reason,'eligible');assert.equal(detail.candidates[0].evidence.textExact,true);assert(detail.candidates[0].ancestors.some(a=>a.navigation===true));
 assert(!JSON.stringify(detail).includes('private-path-secret'),'Report must remain URL-free');
 console.log('Prompts51 PASS: exact branded and plain CTA in absolute Reels media host; navigation/video retained; modal and unrelated-prose protections in three modes.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
