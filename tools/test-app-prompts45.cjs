// Conservative Open App filtering. DOM reproductions, not an authenticated account proof.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const main=fs.readFileSync('app/src/main/assets/facebook.js','utf8');
const reference=fs.readFileSync('app/src/main/assets/reference-engines.js','utf8');
const policy=source=>source.match(/ function safeAppPromptTarget\([\s\S]*?\n }\n/)[0];
assert.equal(policy(main),policy(reference),'Standalone fallback must keep the same conservative target policy');
const windows=[];
function fixture(html,mode){
 const dom=new JSDOM('<!doctype html><html><head></head><body>'+html+'</body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;windows.push(w);
 const computed=w.getComputedStyle.bind(w);
 w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};
 const run=next=>w.eval(main.replace('__CONFIG__',JSON.stringify(next)));
 run(cfg);return {w,doc:w.document,cfg,run};
}
const frame=w=>new Promise(resolve=>w.requestAnimationFrame(resolve));
async function settle(w){await Promise.resolve();await frame(w);await frame(w);}
function unchanged(doc,...ids){for(const id of ids)assert.notEqual(doc.getElementById(id).style.display,'none','Must preserve '+id);}
(async()=>{try{
 for(const mode of ['standalone','fallback','reference']){
  const f=fixture('<main id="page"><section id="shell"><header id="header"><div id="slot"><button id="cta" style="display:inline-flex!important"><span>فتح التطبيق</span><svg><title>Facebook</title></svg></button></div><button id="search">Search</button><a id="account" href="/me">الحساب</a></header><article id="post"><video id="video"></video><button id="reelCTA">Open app</button></article></section></main>',mode);
  const {w,doc,cfg,run}=f,cta=doc.getElementById('cta');
  assert.equal(cta.style.display,'none');assert.equal(doc.getElementById('reelCTA').style.display,'none');
  unchanged(doc,'page','shell','header','slot','search','account','post','video');
  const own=cta.hasAttribute('data-fpro-hidden'),ref=cta.hasAttribute('data-fpro-reference-noapp');
  assert.notEqual(own,ref,'Exactly one engine owns hiding; '+mode);
  assert.equal(ref,mode==='reference');
  const writes=[];const observer=new w.MutationObserver(records=>writes.push(...records));observer.observe(cta,{attributes:true,attributeFilter:['style']});
  for(let n=0;n<8;n++)run(cfg);
  await Promise.resolve();assert.equal(writes.length,0,'Stable scans must not alternate hide/restore ownership');observer.disconnect();
  // Surrounding dialog semantics can appear after the CTA was already hidden.
  const shell=doc.getElementById('shell');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');
  await settle(w);assert.equal(cta.style.display,'inline-flex','A new modal must regain its CTA, not leave a dead backdrop');assert.equal(cta.style.getPropertyPriority('display'),'important');
  shell.removeAttribute('role');shell.removeAttribute('aria-modal');await settle(w);run(cfg);assert.equal(cta.style.display,'none');
  cta.textContent='Search';await settle(w);run(cfg);assert.equal(cta.style.display,'inline-flex','Recycled content restores the exact source display');
  run({...cfg,appBanner:false});assert(!doc.querySelector('[data-fpro-hidden],[data-fpro-reference-noapp],[data-fpro-app-prompt]'));
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,doc,cfg,run}=fixture('<div id="modal" role="dialog" aria-modal="true" style="position:fixed;inset:0;background:black"><button id="modalCTA">فتح التطبيق</button><button id="close">Close</button></div><form id="login"><input><button id="formCTA">Open app</button></form><div id="labelShell" aria-label="Open app">Normal page content</div><button id="prefix">Open the app to learn why this paragraph must remain visible</button><button id="ariaLie" aria-label="Open app">Account details</button><a id="storeLink" href="https://example.invalid/?next=play.google.com/store/apps">A normal post</a><button id="branding">Original Facebook</button><div id="giant" role="button">Open app</div>',mode);
  doc.body.style.overflow='hidden';let closes=0;doc.getElementById('close').onclick=()=>closes++;
  doc.getElementById('giant').getBoundingClientRect=()=>({left:0,top:0,width:1000,height:1200,right:1000,bottom:1200});run(cfg);
  unchanged(doc,'modal','modalCTA','close','login','formCTA','labelShell','prefix','ariaLie','storeLink','branding','giant');
  assert.equal(doc.body.style.overflow,'hidden','Never forcibly unlock the site');assert.equal(closes,0,'Never synthesize close/continue clicks');
  // CSS-only blocking sheets without ARIA must also remain usable.
  const sheet=doc.createElement('div');sheet.style.cssText='position:fixed;top:0;bottom:0;left:0;right:0;background:black';sheet.innerHTML='<button id="sheetCTA">Open app</button>';
  doc.body.appendChild(sheet);await settle(w);run(cfg);assert.equal(sheet.style.display,'');assert.equal(doc.getElementById('sheetCTA').style.display,'');
  // Moving an already hidden control into a fullscreen surface must restore it.
  const dynamic=doc.createElement('div');dynamic.innerHTML='<button id="movingCTA">Open app</button>';doc.body.appendChild(dynamic);await settle(w);run(cfg);assert.equal(doc.getElementById('movingCTA').style.display,'none');
  dynamic.style.cssText='position:fixed;inset:0';await settle(w);run(cfg);assert.equal(doc.getElementById('movingCTA').style.display,'');
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,doc,cfg,run}=fixture('<div id="root"></div>',mode);
  let geometry=0;const node=doc.createElement('button');node.textContent='Open app';node.getBoundingClientRect=()=>{geometry++;return {width:100,height:36};};doc.getElementById('root').appendChild(node);
  await Promise.resolve();await Promise.resolve();assert.equal(geometry,0,'No forced layout in mutation microtasks');
  run({...cfg,appBanner:false});await settle(w);assert.equal(node.style.display,'','Disable cancels pending hide callbacks');
  assert(!node.hasAttribute('data-fpro-reference-noapp'));assert(!node.hasAttribute('data-fpro-hidden'));
 }
 console.log('App prompts45 PASS: single ownership; control-only hiding; modal/fullscreen/login/media/navigation protection; exact labels; recycled style restoration; no microtask layout; cancelled pending frames.');
}finally{for(const w of windows)w.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
