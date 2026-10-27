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
  const {w,cfg,run}=fixture(mode,'');w.history.replaceState(null,'','/video-viewer');const host=scene(w,'فتح التطبيق'),cta=host.querySelector('#cta51');
  cta.innerHTML='<svg><text>unrecognized logo text</text></svg><span>فتح</span><span>التطبيق</span>';
  host.insertAdjacentHTML('beforeend','<input type="range" aria-label="Seek" min="0" max="100">');w.document.body.append(host);await micro();
  assert.equal(cta.style.display,'none',mode+': exact aria + standalone caption in navigation, unknown route, video and seek input');
  for(const el of [host,...host.querySelectorAll('video,input,#nav51,#profile51,#search51,#back51')])assert.notEqual(el.style.display,'none','Viewer/navigation/seek remain');
  run({...cfg,appBanner:false});assert.notEqual(cta.style.display,'none');run();assert.equal(cta.style.display,'none');
  host.insertAdjacentHTML('beforeend','<input type="password">');run();assert.notEqual(cta.style.display,'none','Login input still blocks media-host exception');
 }
 for(const mode of ['standalone','fallback','reference'])for(const text of ['Account details','فتح التطبيق لمعرفة تفاصيل الحساب', 'Open app to read private content']){
  const {w}=fixture(mode,''),host=scene(w,text),cta=host.querySelector('#cta51');cta.setAttribute('aria-label','فتح التطبيق');w.document.body.append(host);await micro();assert.notEqual(cta.style.display,'none','Exact aria cannot override prose without standalone caption');
 }
 console.log('Prompts52 PASS: actual diagnostic combination aria-exact/text-mismatch + verified navigation + unknown route + video range; seek and navigation preserved; password/prose blocked.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
