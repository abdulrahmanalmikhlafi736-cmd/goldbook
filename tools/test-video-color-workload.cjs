const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
(async()=>{
 const w=new JSDOM('<!doctype html><head></head><body><main>'+Array.from({length:120},()=>'<p style="color:rgb(8,102,255);">Post</p>').join('')+'</main><span id="clock">0</span><div class="fpro-video-tools"><span id="ownedClock">0</span></div></body>',{url:'https://m.facebook.com/watch/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 const cfg={siteEngine:'upstream',enhance:true,color:'ذهبي',referenceEngine:true,appBanner:true};
 try{
  w.eval(fs.readFileSync('app/src/main/assets/app-prompt-engine.js','utf8'));
  w.eval(fs.readFileSync('app/src/main/assets/site-engine.js','utf8'));
  w.FproSiteEngine.update(cfg);await settle();
  const d=w.document,initial=d.querySelector('p').style.color;assert.notEqual(initial,'rgb(8, 102, 255)');
  let queries=0,returned=0;for(const p of [w.Document.prototype,w.Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){const list=q.call(this,s);queries++;returned+=list.length;return list;};}
  for(let i=0;i<12;i++){
   d.getElementById('ownedClock').textContent=String(i);
   d.querySelector('.fpro-video-tools').style.width=i+'px';
   d.getElementById('clock').textContent=String(i);
   await settle();
  }
  assert.equal(queries,0,'Video progress and site clock text must not query unrelated colors');
  assert.equal(returned,0);
  const existing=d.querySelector('p');existing.style.color='rgb(8,102,255)';await settle();assert.equal(existing.style.color,initial,'Existing site inline changes still recolor');
  assert.equal(queries,0,'Single style change checks the target, not descendants or document');
  const section=d.createElement('section');section.innerHTML='<p style="color:rgb(8,102,255);">New</p><div><p style="color:rgb(8,102,255);">Nested</p></div>';d.body.append(section);await settle();
  assert.equal(section.firstChild.style.color,initial);assert.equal(section.lastChild.firstChild.style.color,initial);
  const style=d.createElement('style');style.textContent='.dynamic{background-color:rgb(8,102,255);}';d.head.append(style);await settle();assert(!style.textContent.includes('rgb(8,102,255)'),'New stylesheet recolors');
  style.textContent='.updated{background-color:rgb(8,102,255);}';await settle();assert(!style.textContent.includes('rgb(8,102,255)'),'Reused stylesheet text recolors, not permanently cached');
  style.firstChild.data='.character{background-color:rgb(8,102,255);}';await settle();assert(!style.textContent.includes('rgb(8,102,255)'),'Character-data stylesheet update recolors');
  const batch=d.createDocumentFragment();for(let i=0;i<48;i++){const el=d.createElement('p');el.style.color='rgb(8,102,255)';batch.append(el);}d.body.append(batch);await settle();
  assert.equal(d.body.lastChild.style.color,initial,'No lost mutation roots beyond a small batch cap');
  assert.equal(w.FproSiteEngine.report().errors.length,0);
  w.FproSiteEngine.update({...cfg,enhance:false});await settle();
  assert.equal(existing.style.color,'rgb(8, 102, 255)','OFF restores original inline style');
  assert.equal(section.firstChild.style.color,'rgb(8, 102, 255)');
  console.log('Video color PASS: zero unrelated progress/clock queries, target-only inline updates, nested additions, reused/character-data CSS, 48 roots, OFF restoration.');
 }finally{w.FproSiteEngine?.update({...cfg,enhance:false});w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
