// Real geometry/playback is also verified by PromptViewerAuditTest on Android.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('app/src/main/assets/app-prompt-engine.js','utf8');
const cfg={siteEngine:'upstream',enhance:true,appBanner:true};
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
(async()=>{
 const w=new JSDOM('<!doctype html><head></head><body></body>',{url:'https://m.facebook.com/reel/test/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 try {
  const d=w.document;
  for(const kind of ['large','shadow','closed-shadow','background','custom-host','light-video']) {
   const el=d.createElement('div');el.id=kind;el.setAttribute('role','button');el.setAttribute('aria-label','Open app');
   el.style.height=kind==='large'?'700px':'48px';
   if(kind.includes('shadow')){const h=d.createElement('div');el.append(h);h.attachShadow({mode:kind==='closed-shadow'?'closed':'open'}).innerHTML='<video></video>';if(kind==='closed-shadow')el.style.height='700px';}
   if(kind==='background')el.style.backgroundImage='url(https://fixture.invalid/frame.jpg)';
   if(kind==='custom-host')el.append(d.createElement('media-player'));
   if(kind==='light-video')el.innerHTML='<video></video>';
   d.body.append(el);
  }
  const cta=d.createElement('button');cta.id='cta';cta.textContent='Open app';d.body.append(cta);
  w.eval(source);w.FproPrompt.update(cfg);await tick();
  for(const id of ['large','shadow','closed-shadow','background','custom-host','light-video'])assert.notEqual(w.getComputedStyle(d.getElementById(id)).display,'none',id+' owner preserved');
  assert.equal(w.getComputedStyle(cta).display,'none');
  const reused=d.createElement('button');reused.textContent='Open app';reused.style.height='48px';d.body.append(reused);await tick();assert.equal(reused.style.display,'none');
  reused.style.height='700px';await tick();assert.notEqual(w.getComputedStyle(reused).display,'none','Release a hidden control repurposed as a large owner');
  // New/aria-only prompts still hide at the mutation checkpoint, not after a timer.
  const late=d.createElement('button');late.setAttribute('aria-label','فتح التطبيق');d.body.append(late);await tick();assert.equal(late.style.display,'none');
  w.FproPrompt.update({...cfg,appBanner:false});assert.notEqual(w.getComputedStyle(cta).display,'none');assert.equal(w.FproPrompt.report().retained,0);
  console.log('Prompt media-owner PASS: large, open/closed shadow, background, custom host, light media, resized reuse, actual/late CTA, OFF restoration.');
 } finally {w.FproPrompt?.update({...cfg,appBanner:false});w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
