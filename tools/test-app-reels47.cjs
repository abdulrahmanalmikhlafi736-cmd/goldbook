const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const main=fs.readFileSync(assets+'/facebook.js','utf8'),reference=fs.readFileSync(assets+'/reference-engines.js','utf8');
const windows=[];
function fixture(mode){
 const w=new JSDOM('<!doctype html><html><body><main id="feed"><video></video></main></body></html>',{url:'https://m.facebook.com/reel/123',runScripts:'outside-only',pretendToBeVisual:true}).window;windows.push(w);
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};
 const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));run();return {w,cfg,run};
}
function navigation(w,tag='div'){
 const nav=w.document.createElement(tag);nav.style.cssText='position:fixed;top:0;left:0;width:100%;height:72px;background:black';
 nav.getBoundingClientRect=()=>({width:w.innerWidth,height:72});
 nav.innerHTML='<button id="app47">فتح التطبيق <svg><title>Facebook</title></svg></button><button id="search47" aria-label="Search"></button><a id="account47" href="/me" aria-label="Your profile"></a><span>ريلز</span>';
 return nav;
}
async function paint(w){await Promise.resolve();await new Promise(r=>w.requestAnimationFrame(r));await new Promise(r=>w.requestAnimationFrame(r));}
(async()=>{try{
 for(const mode of ['standalone','fallback','reference'])for(const tag of ['div','header','nav']){
  const {w,cfg,run}=fixture(mode),nav=navigation(w,tag);w.document.body.append(nav);await paint(w);
  assert.equal(w.document.getElementById('app47').style.display,'none','Reels CTA must hide in '+tag+' '+mode);
  for(const el of [nav,w.document.getElementById('search47'),w.document.getElementById('account47'),w.document.getElementById('feed')])assert.notEqual(el.style.display,'none','Keep real navigation/media shell');
  nav.setAttribute('role','dialog');await paint(w);assert.notEqual(w.document.getElementById('app47').style.display,'none','Modal protections take precedence over navigation');
  nav.removeAttribute('role');run();assert.equal(w.document.getElementById('app47').style.display,'none');
  run({...cfg,appBanner:false});assert.notEqual(w.document.getElementById('app47').style.display,'none');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w}=fixture(mode),fragment=w.document.createElement('section');
  for(let n=0;n<100;n++){const b=w.document.createElement('button');b.textContent='Normal '+n;fragment.append(b);}
  const app=w.document.createElement('button');app.id='app47';app.textContent='فتح التطبيق';fragment.append(app);let geometry=0;app.getBoundingClientRect=()=>{geometry++;return {width:110,height:36};};
  w.document.body.append(fragment);await Promise.resolve();await Promise.resolve();assert.equal(geometry,1,'Build49 gives this exact CTA one bounded pre-paint validation');
  await paint(w);assert.equal(app.style.display,'none','Normal controls must not exhaust the urgent CTA budget and defer it to a full scan');
 }
 const policy=s=>s.match(/ function appNavigationSurface\([\s\S]*?\n }\n/)[0];assert.equal(policy(main),policy(reference));
 console.log('Reels47 PASS: exact CTA hidden; fixed real header/search/account/media preserved; modal/disable restoration; first frame batch after100 unrelated controls; bounded pre-paint validation in three engine modes.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
