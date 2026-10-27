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
  const {w}=fixture(mode),old=w.document.body,body=w.document.createElement('body');
  const feed=w.document.createElement('div');feed.style.cssText='position:relative;height:1752px';
  for(let i=0;i<23;i++){const control=w.document.createElement('button');control.textContent='Normal';feed.append(control);}
  const el=bar(w);el.style.height='65px';el.getBoundingClientRect=()=>({width:411,height:65});feed.append(el);body.append(feed);
  // Removed subtrees can still have queued records at this checkpoint.
  const stale=w.document.createElement('button');stale.textContent='Open app';old.append(stale);
  old.replaceWith(body);await micro();
  assert.equal(el.style.display,'none',mode+': body replacement must not orphan the filter observer');
  assert.notEqual(el.querySelector('[role="button"]').style.display,'none');
  assert.equal(feed.style.display,'','Never hide the page container');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w}=fixture(mode),el=bar(w);el.setAttribute('aria-modal','true');w.document.body.append(el);await micro();
  assert.notEqual(el.style.display,'none','Blocking modal must remain usable');
  el.removeAttribute('aria-modal');await micro();
  assert.equal(el.style.display,'none',mode+': newly eligible ancestor must revalidate its nested CTA before RAF');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,cfg,run}=fixture(mode),read=()=>JSON.parse(w.eval(fs.readFileSync('app/src/main/assets/app-prompt-report.js','utf8')));
  assert.equal(read().schema,3);assert.equal(read().state.enabled,true);assert.equal(read().state.observingDocument,true);
  run({...cfg,appBanner:false});assert.equal(read().state.enabled,false);assert.equal(read().state.filterEnabled,false);
  run({...cfg,enhance:false});assert.equal(read().state.observingDocument,false);
  const next=w.document.createElement('body'),el=bar(w);next.append(el);w.document.body.replaceWith(next);await micro();
  assert.notEqual(el.style.display,'none','Master OFF must disconnect even after root replacement');
  run();assert.equal(el.style.display,'none','Re-enable must attach and classify the current body');
 }
 console.log('Prompts50 PASS: body replacement retains prompt observation in all three modes; whole65px fixed bar hidden before RAF; page retained; modal-to-bar wrapper transition.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
