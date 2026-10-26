// Reproductions of code-level defects, not an authenticated account trace.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/facebook.js','utf8');
const reference=fs.readFileSync('app/src/main/assets/reference-engines.js','utf8');
const windows=[];
function fixture(html,cfg={}){const d=new JSDOM('<!doctype html><body>'+html+'</body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});const w=d.window;windows.push(w);const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);w.eval(reference);w.eval(source.replace('__CONFIG__',JSON.stringify({enhance:true,referenceEngine:true,color:'أخضر',appBanner:true,textSelection:true,...cfg})));return {w,doc:w.document};}
function event(w,el,type){const e=new w.MouseEvent(type,{bubbles:true,cancelable:true});el.dispatchEvent(e);return e;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 const variants=[
  '<div role="button" aria-label="Like this post, 12 reactions"><span>إعجاب · 12</span></div>',
  '<div role="button" aria-label="إلغاء تسجيل الإعجاب بالمنشور"><span>أعجبنى</span></div>',
  '<a href="/a/like.php?id=7"><span>👍 12</span></a>',
  '<div role="button" aria-pressed="false"><span>👍</span></div>',
  '<div role="toolbar"><div tabindex="0"><span>تفاعل جديد</span></div></div>',
  '<div role="button"><span>Unfamiliar localized action</span></div>'
 ];
 for(const html of variants){const {w,doc}=fixture('<article role="button"><p id="reading">Like minded people can copy this actual paragraph.</p>'+html+'</article>',{enhance:false});let delegated=0;for(const name of ['pointerdown','touchstart','contextmenu'])doc.addEventListener(name,()=>delegated++,true);const target=doc.querySelector('article > :last-child span');for(const name of ['pointerdown','touchstart','contextmenu'])event(w,target,name);assert.equal(delegated,3,'Every long-press event must reach the site: '+html);assert(!target.hasAttribute('data-fpro-selectable-text'));event(w,target,'pointerup');event(w,target,'touchend');const text=doc.querySelector('#reading');const before=delegated;event(w,text,'pointerdown');assert.equal(delegated,before,'Actual reading remains protected, even when its text starts Like');assert.equal(text.style.getPropertyValue('user-select'),'text');w.close();}
 {
  const {w,doc}=fixture('<article role="button"><p><span id="text">Like minded prose inside an interactive post wrapper remains selectable.</span></p></article>',{enhance:false});let reached=0;doc.addEventListener('pointerdown',()=>reached++,true);event(w,doc.querySelector('#text'),'pointerdown');assert.equal(reached,0);w.close();
 }
 {
  const {w,doc}=fixture('<main id="feed"></main><div role="button" aria-label="Like this post"><span id="like">إعجاب · 12</span></div>');
  const like=doc.querySelector('#like');const initial=w.__fpro.colorReport().work.scans;event(w,like,'pointerdown');
  for(let i=0;i<40;i++){const n=doc.createElement('span');n.textContent='#late'+i;n.style.color='rgb(24,119,242)';doc.querySelector('#feed').appendChild(n);}
  const cta=doc.createElement('button');cta.textContent='فتح التطبيق';doc.body.appendChild(cta);
  await sleep(1800);assert.equal(w.__fpro.colorReport().work.scans,initial,'No full scan during a held pointer');assert(w.__fpro.colorReport().work.deferred>0);assert.equal(cta.style.display,'none','CTA fast path stays immediate during interaction');assert(w.__fpro.colorReport().work.queuedColorRoots<=32);
  event(w,like,'pointerup');await sleep(1900);assert(w.__fpro.colorReport().work.scans>initial,'Queued work resumes after release');assert.equal(w.__fpro.colorReport().work.queuedColorRoots,0);assert.equal(doc.querySelector('#feed span').style.color,'rgb(23, 131, 62)','Deferred color is actually replayed, not just dequeued');
  event(w,like,'touchstart');const touchScans=w.__fpro.colorReport().work.scans;doc.querySelector('#feed').appendChild(doc.createElement('span'));await sleep(1800);assert.equal(w.__fpro.colorReport().work.scans,touchScans,'Touch-only engines also defer while held');event(w,like,'touchend');await sleep(1900);assert(w.__fpro.colorReport().work.scans>touchScans);
  const p=doc.createElement('p');p.textContent='PRIVATE_SELECTION_TEXT';doc.body.appendChild(p);const range=doc.createRange();range.selectNodeContents(p);w.getSelection().removeAllRanges();w.getSelection().addRange(range);const scans=w.__fpro.colorReport().work.scans;doc.querySelector('#feed').appendChild(doc.createElement('div'));await sleep(1800);assert.equal(w.__fpro.colorReport().work.scans,scans,'No whole-feed style reset while native selection is active');w.getSelection().removeAllRanges();doc.dispatchEvent(new w.Event('selectionchange'));await sleep(1900);assert(w.__fpro.colorReport().work.scans>scans);assert(!JSON.stringify(w.__fpro.colorReport().work).includes('PRIVATE_SELECTION_TEXT'));w.close();
 }
 {
  const {w,doc}=fixture('<main id="feed"></main>',{enhance:false});w.FproColor.set({recolor:true,uiAccent:'#17833e'});w.FproNoapp.set({noOpenApp:true});
  // 2,560 painted nodes discarded/reinserted across a browsing-style lifecycle.
  for(let batch=0;batch<40;batch++){
   const root=doc.createElement('section');root.innerHTML=Array.from({length:64},()=>'<span style="color:rgb(24,119,242)">private</span>').join('')+'<button>فتح التطبيق</button>';doc.body.appendChild(root);w.FproColor.pass([root],false);w.FproNoapp.scan([root],true);assert(w.FproColor.retained()<=64);assert(w.FproNoapp.retained()<=1);root.remove();w.FproColor.prune();w.FproNoapp.prune();assert.equal(w.FproColor.retained(),0,'Detached painted nodes must not be retained');assert.equal(w.FproNoapp.retained(),0,'Detached CTA wrappers must not be retained');assert.equal(root.querySelector('span').style.color,'rgb(24, 119, 242)','Restore before forgetting a detached node');assert.equal(root.querySelector('button').style.display,'');
  }
  const recycled=doc.createElement('span');recycled.style.color='rgb(24,119,242)';doc.body.appendChild(recycled);w.FproColor.pass([recycled],false);recycled.style.padding='9px';recycled.remove();w.FproColor.prune();assert.equal(recycled.style.padding,'9px','Pruning preserves independent site changes');assert.equal(recycled.style.color,'rgb(24, 119, 242)');doc.body.appendChild(recycled);w.FproColor.pass([recycled],false);assert.equal(recycled.style.color,'rgb(23, 131, 62)','Reinserted nodes are recolored after cache cleanup');recycled.remove();w.FproColor.prune();
  const fragment=doc.createElement('div');fragment.innerHTML='<span></span>'.repeat(3000)+'<span id="beyond" style="color:rgb(24,119,242)">far</span>';doc.body.appendChild(fragment);let selectors=0;const original=fragment.querySelectorAll.bind(fragment);fragment.querySelectorAll=(...args)=>{selectors++;return original(...args);};w.FproColor.pass([fragment],true);assert.equal(selectors,0,'Fast path must not materialize a whole-fragment NodeList');assert.equal(doc.querySelector('#beyond').style.color,'rgb(24, 119, 242)','Fast work honors its visit budget');w.close();
 }
 console.log('Interaction41 tests passed: enriched Arabic/English actions, real event propagation vs reading, input/selection scan deferral and resumption, CTA priority, bounded roots/traversal and 2560-node reversible retention cleanup.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
