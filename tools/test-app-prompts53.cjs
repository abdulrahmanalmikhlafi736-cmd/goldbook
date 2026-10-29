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
const frame=w=>new Promise(r=>w.requestAnimationFrame(r));
(async()=>{try{
 for(const mode of ['standalone','fallback','reference']){
  const {w,cfg,run}=fixture(mode,'');
  for(let iteration=0;iteration<3;iteration++){
   if(iteration)await new Promise(r=>w.setTimeout(r,90));
   const root=w.document.createElement('section'),events=[],buttons=[];
   for(let i=0;i<10;i++){
    const b=w.document.createElement('button');b.textContent='Open app';
    b.getBoundingClientRect=()=>{events.push('r'+i);return {width:100,height:32};};
    const set=b.style.setProperty.bind(b.style);b.style.setProperty=(key,value,priority)=>{if(key==='display'&&value==='none')events.push('w'+i);return set(key,value,priority);};
    root.append(b);buttons.push(b);
   }
   // Insert during RAF: deferring new candidates to another RAF can expose
   // them at the paint immediately following this callback.
   await new Promise(resolve=>w.requestAnimationFrame(()=>{w.document.body.append(root);resolve();}));await micro();await micro();
   assert(buttons.every(b=>b.style.display==='none'),mode+': all verified candidates hide at this checkpoint, not NEXT frame');
   const firstRemainingWrite=events.findIndex(e=>/^w[1-9]$/.test(e));assert(firstRemainingWrite>0);assert(!events.slice(firstRemainingWrite).some(e=>e[0]==='r'),'Finish all remaining geometry reads before any remaining write');
   run({...cfg,appBanner:false});assert(buttons.every(b=>b.style.display!=='none'));root.remove();run();await micro();
  }
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w}=fixture(mode,''),host=scene(w,'فتح التطبيق'),cta=host.querySelector('#cta51');
  cta.innerHTML='<svg><text>Logo decoration</text></svg><span>فتح</span><span>التطبيق</span>';
  const search=host.querySelector('#search51'),account=host.querySelector('#profile51');search.removeAttribute('aria-label');account.removeAttribute('aria-label');
  w.document.body.append(host);await micro();await frame(w);
  assert.notEqual(cta.style.display,'none','Unknown navigation must remain protected before sufficient evidence exists');
  account.setAttribute('aria-label','Your profile');search.setAttribute('aria-label','Search');await micro();await micro();
  assert.equal(cta.style.display,'none',mode+': late sibling hydration must immediately revisit the existing CTA');
  assert.notEqual(host.style.display,'none');assert.notEqual(search.style.display,'none');
 }
 console.log('Prompts53 PASS: repeated delayed arrivals during RAF; ten verified targets before next paint checkpoint; read-before-write batching; OFF restoration; late navigation sibling evidence revisits existing CTA in three modes.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
