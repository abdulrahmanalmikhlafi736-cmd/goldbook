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
 for(const mode of ['standalone','fallback','reference']){
  const {w,cfg,run}=fixture(mode,''),root=w.document.createElement('section');
  root.innerHTML=Array.from({length:1500},()=>'<div><span>ordinary text</span></div>').join('');
  const host=scene(w,'فتح التطبيق');root.append(host);w.document.body.append(root);await micro();await micro();
  assert.equal(host.querySelector('#cta51').style.display,'none',mode+': exact aria CTA beyond384 wrapper visits must be found before next frame');
  const metrics=mode==='reference'?w.FproNoapp.timing().priority:w.__fpro.promptTiming().priority;assert(metrics.queries>0&&metrics.queries<=4);assert(metrics.hits>0);assert(Number.isFinite(metrics.maxMs));
  for(const el of [root,host,...host.querySelectorAll('video,#nav51,#search51,#profile51,#back51')])assert.notEqual(el.style.display,'none','Do not hide page/navigation/media');
  run({...cfg,appBanner:false});assert.notEqual(host.querySelector('#cta51').style.display,'none');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w}=fixture(mode,''),host=scene(w,'فتح التطبيق'),cta=host.querySelector('#cta51');
  cta.innerHTML='<svg><text>Logo decoration</text></svg><span>فتح</span><span>التطبيق</span>';
  cta.style.width='399px';cta.getBoundingClientRect=()=>({width:parseFloat(cta.style.width),height:40});w.document.body.append(host);
  await micro();await new Promise(r=>w.requestAnimationFrame(r));assert.notEqual(cta.style.display,'none','Unverified oversized caption control must remain protected');
  cta.style.width='124px';await micro();await micro();assert.equal(cta.style.display,'none','Late observable styling makes caption control eligible without full scan');
 }
 console.log('Prompts54 PASS: exact accessible CTA after3000 generic wrapper elements discovered at pre-paint checkpoint; page/media/navigation and OFF preserved in three modes.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
