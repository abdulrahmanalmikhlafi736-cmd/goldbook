// Reproducible structural comparison, NOT a heap/FPS/account benchmark.
// node tools/measure-interaction.cjs [baseline git ref; default 2053506]
const {JSDOM}=require('jsdom'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const baseline=process.argv[2]||'2053506';
function asset(name,old){return old?execFileSync('git',['show',baseline+':app/src/main/assets/'+name],{encoding:'utf8'}):fs.readFileSync('app/src/main/assets/'+name,'utf8');}
function measure(old){
 const dom=new JSDOM('<!doctype html><body><article role="button"><div role="button" aria-label="Like this post, 12 reactions"><span>إعجاب · 12</span></div></article></body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,doc=w.document;
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 // Same test-only visibility into closure maps on both versions. No production instrumentation.
 w.eval(asset('reference-engines.js',old).replace('window.FproColor=', 'window.__mapCounts=function(){return {paint:paints.size,hidden:hidden.size};};window.FproColor='));
 w.eval(asset('facebook.js',old).replace('__CONFIG__',JSON.stringify({enhance:false,textSelection:true})));
 let reached=0;doc.addEventListener('pointerdown',()=>reached++,true);doc.querySelector('span').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));
 w.FproColor.set({recolor:true,uiAccent:'#17833e'});w.FproNoapp.set({noOpenApp:true});
 const root=doc.createElement('section');root.innerHTML='<div></div>'.repeat(3000);doc.body.appendChild(root);
 let materialized=0;const query=root.querySelectorAll.bind(root);root.querySelectorAll=(...args)=>{const result=query(...args);materialized+=result.length;return result;};
 root.innerHTML='<span style="color:rgb(24,119,242)"></span>'.repeat(3000);w.FproColor.pass([root],true);root.remove();
 // Clear the traversal experiment before separately measuring feed churn.
 w.FproColor.off();w.FproColor.set({recolor:true,uiAccent:'#17833e'});
 for(let batch=0;batch<40;batch++){
  const card=doc.createElement('section');card.innerHTML='<span style="color:rgb(24,119,242)"></span>'.repeat(64)+'<button>فتح التطبيق</button>';doc.body.appendChild(card);w.FproColor.pass([card],false);w.FproNoapp.scan([card],true);card.remove();
  if(w.FproColor.prune)w.FproColor.prune();if(w.FproNoapp.prune)w.FproNoapp.prune();
 }
 const maps=w.__mapCounts();w.close();return {delegatedReactionPointerdown:reached,fastPathMaterializedDescendantMatches:materialized,detachedPaintRecordsAfter2560Nodes:maps.paint,detachedCtaRecordsAfter40Cards:maps.hidden};
}
console.log(JSON.stringify({baseline,meaning:'Structural counts only. Fast budget is per query; map records are not measured heap bytes.',before:measure(true),after:measure(false)},null,2));
