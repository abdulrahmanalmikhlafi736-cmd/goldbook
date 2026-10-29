const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const main=fs.readFileSync(assets+'/facebook.js','utf8'),reference=fs.readFileSync(assets+'/reference-engines.js','utf8');
const report=fs.readFileSync('app/src/main/assets/app-prompt-report.js','utf8');
const windows=[];
function fixture(mode,html){
 const w=new JSDOM('<!doctype html><html><body>'+html+'</body></html>',{url:'https://m.facebook.com/reel/private-path-secret',runScripts:'outside-only',pretendToBeVisual:true}).window;windows.push(w);
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};
 const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));run();return {w,cfg,run};
}
(async()=>{try{
 for(const mode of ['standalone','fallback','reference']){
  const {w,cfg,run}=fixture(mode,'<main><article id="private-name-secret">Account content must remain</article></main><button id="decorated"><svg><title>Facebook logo hidden-caption-secret</title></svg><span>فتح</span><span>التطبيق</span></button><button id="joined">OpenApp</button><button id="normal" aria-label="Open app">Account details</button><button id="long" aria-label="Open app">'+('Unrelated content '.repeat(30))+'</button>');
  for(const id of ['decorated','joined'])assert.equal(w.document.getElementById(id).style.display,'none','Decorative/split control must match: '+id+' '+mode);
  for(const id of ['normal','long'])assert.notEqual(w.document.getElementById(id).style.display,'none','Never trust a lying aria-label over real prose');
  const style=w.document.getElementById('fpro-style').textContent;assert.match(style,/\[data-fpro-app-prompt\],\[data-fpro-reference-noapp\]\{display:none!important\}/,'A CSS guard must cover only already-verified owned targets');
  const media=fs.readFileSync('app/src/main/assets/media-layout-report.js','utf8');const combined=w.eval('(()=>{const report=JSON.parse('+media+');report.appPrompts=JSON.parse('+report+');return JSON.stringify(report);})()');assert(JSON.parse(combined).appPrompts.candidates.length>0);assert(!combined.includes('private-path-secret'));assert(!combined.includes('private-name-secret'));
  const encoded=w.eval(report),data=JSON.parse(encoded);assert(data.candidates.length>0);assert(!encoded.includes('private-name-secret'));assert(!encoded.includes('private-path-secret'));assert(!encoded.includes('hidden-caption-secret'));assert(!encoded.includes('Account content'));assert(!encoded.includes('Account details'));assert(!encoded.includes('facebook.com'));
  run({...cfg,appBanner:false});assert.notEqual(w.document.getElementById('decorated').style.display,'none');assert(!w.document.querySelector('[data-fpro-app-prompt],[data-fpro-reference-noapp]'));
 }
 for(const mode of ['standalone','fallback','reference']){
  const {w,run}=fixture(mode,'<button id="late">فتح التطبيق</button>'),late=w.document.getElementById('late');assert.equal(late.style.display,'none');
  const noise=w.document.createElement('section');noise.innerHTML=Array.from({length:2500},(_,n)=>'<button>Normal '+n+'</button>').join('');w.document.body.prepend(noise);
  late.style.setProperty('display','inline-flex','important'); // stronger site rewrite, beyond discovery budget
  w.document.dispatchEvent(new w.Event('visibilitychange')); // full scan, not configuration reset
  assert.equal(late.style.display,'none','Known owned controls must be revalidated/reasserted outside candidate budgets');
  run();assert.equal(late.style.display,'none','Identical configuration reinjection cannot expose a known CTA');
  assert(JSON.parse(w.eval(report)).candidates.length>0,'Owned targets beyond report discovery cap remain reportable');
 }
 const extract=s=>s.match(/ function appPromptText\([\s\S]*?\n }\n/)[0];assert.equal(extract(main),extract(reference));
 console.log('Prompts48 PASS: split/joined/decorated control labels; bounded text refusal; owned-target CSS guard; exact disable; privacy-minimal report in three engine modes. Native Chromium separately verifies guard cascade against inline rewrites.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
