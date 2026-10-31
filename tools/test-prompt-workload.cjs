// Scope: active FproPrompt only. No synthetic timings are called device latency.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('app/src/main/assets/app-prompt-engine.js','utf8');
const cfg={siteEngine:'upstream',enhance:true,appBanner:true};
const micro=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
(async()=>{
 const w=new JSDOM('<!doctype html><head></head><body><main id="feed" role="feed">'+Array.from({length:1200},(_,i)=>`<article><div class="native-text">Reading ${i}</div><div role="button"><span>Like</span></div></article>`).join('')+'</main><div id="bar" class="bottom fixed-container" data-actual-height="48" style="position:fixed;height:48px"><button>فتح التطبيق</button></div></body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 try{
  const d=w.document;let returned=0,calls=0;
  for(const p of [w.Document.prototype,w.Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){const r=q.call(this,s);returned+=r.length;calls++;return r;};}
  w.eval(source);w.FproPrompt.update(cfg);await micro();
  const bar=d.getElementById('bar'),feed=d.getElementById('feed');assert.equal(bar.style.display,'none');
  returned=0;calls=0;const before=w.FproPrompt.report();
  for(let n=0;n<6;n++){for(let k=0;k<30;k++)feed.style.opacity=String((n*30+k+1)/200);await micro();}
  const after=w.FproPrompt.report();
  assert(returned<30,`Ancestor style bursts must not enumerate descendant feed: returned=${returned}, queries=${calls}`);
  assert(after.checked-before.checked<60,'No card-by-card prompt checks on ancestor style changes');
  console.log('prompt ancestor churn:',JSON.stringify({returned,calls,checked:after.checked-before.checked}));
  // Repeated ON updates must not enumerate the whole document again.
  returned=0;for(let i=0;i<10;i++)w.FproPrompt.update({...cfg,dark:i%2===0});await micro();assert(returned<30,'Stable ON does not rescan feed');
  // No dropped roots, native-text prompts or owned-ancestor re-show regressions.
  const fragment=d.createDocumentFragment();for(let i=0;i<48;i++){const b=d.createElement('button');b.textContent=i===47?'Open app':'Like';fragment.append(b);}d.body.append(fragment);await micro();assert.equal(d.body.lastChild.style.display,'none');
  const wrap=d.createElement('div');wrap.innerHTML='<div>noise</div>'.repeat(3500)+'<div class="native-text" id="late">فتح التطبيق</div>';d.body.append(wrap);await micro();assert.equal(d.getElementById('late').style.display,'none','Text-only late CTA, not only declarative aria CSS');
  for(let i=0;i<5;i++){bar.style.setProperty('display','block','important');await micro();assert.equal(bar.style.display,'none');}
  // Site reuses the exact control/container for account/search; release ownership.
  const c=bar.querySelector('button');c.textContent='Account';await micro();assert.notEqual(bar.style.display,'none');
  c.textContent='Open app';await micro();assert.equal(bar.style.display,'none');
  const form=d.createElement('form');form.innerHTML='<input><button>Open app</button>';d.body.append(form);await micro();assert.notEqual(form.lastChild.style.display,'none');
  // Character-data, aria and role changes on existing nodes.
  const reuse=d.createElement('div');reuse.textContent='Account';d.body.append(reuse);await micro();reuse.setAttribute('role','button');reuse.firstChild.data='فتح التطبيق';await micro();assert.equal(reuse.style.display,'none');reuse.firstChild.data='Search';await micro();assert.notEqual(reuse.style.display,'none');
  // Reparenting into protected UI must restore the old ownership.
  const dialog=d.createElement('div');dialog.setAttribute('role','dialog');dialog.innerHTML='<input>';d.body.append(dialog);dialog.append(bar);await micro();assert.notEqual(bar.style.display,'none');
  // Pending work and detached ownership cannot survive OFF.
  d.body.append(bar);c.textContent='Open app';await micro();assert.equal(bar.style.display,'none');
  d.getElementById('late').remove();await micro();w.FproPrompt.update({...cfg,appBanner:false});const stopped=w.FproPrompt.report();
  feed.style.opacity='.9';await micro();await new Promise(r=>w.setTimeout(r,150));assert.equal(w.FproPrompt.report().checked,stopped.checked);assert.equal(w.FproPrompt.report().retained,0);assert(!d.querySelector('#fpro-prompt59-style'));assert.notEqual(bar.style.display,'none');
  w.FproPrompt.update(cfg);await micro();assert.equal(bar.style.display,'none');
  console.log('Prompt workload PASS: ancestor bursts, stable ON, >8 roots, late text CTA, re-show, recycled controls, protected UI/reparent, OFF/cancellation/re-enable.');
 }finally{w.FproPrompt?.update({...cfg,appBanner:false});w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
