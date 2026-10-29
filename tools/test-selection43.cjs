// Native Copy account regression: restore build23 CSS, narrow action inference,
// and remove the rejected native refresh fallback. Not an account proof.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/facebook.js','utf8');
const golden=fs.readFileSync('tools/selection-build23.js.txt','utf8');
assert.equal(source.slice(source.indexOf(' // Keep Android WebView'),source.indexOf(' const colors =')).replace('selectionActionTarget(el)||',''),golden);
const native=fs.readFileSync('app/src/main/java/com/almekhlafi/FPRO/MainActivity.kt','utf8');
assert(!native.includes('NativePullRefresh'));assert(!fs.existsSync('app/src/main/assets/pull-refresh.js'));
const touch=native.slice(native.indexOf('setOnTouchListener'),native.indexOf('setOnScrollChangeListener'));
assert(!touch.includes('reload('));assert(touch.includes('false'));
function fixture(html,enabled=true){const dom=new JSDOM('<!doctype html><body>'+html+'</body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.eval(source.replace('__CONFIG__',JSON.stringify({enhance:false,textSelection:enabled})));return w;}
for(const attributes of ['', 'aria-pressed="false"','aria-haspopup="dialog"','aria-label="Like minded people can read this actual post"']){
 const w=fixture('<article><div role="button" '+attributes+'><span id="reading">Like minded people can read this actual post</span></div></article>');try{
  let reached=0;w.document.addEventListener('pointerdown',e=>{reached++;e.preventDefault();},true);
  const target=w.document.querySelector('#reading'),e=new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true});target.dispatchEvent(e);
  assert.equal(reached,0,'Reading wrapper must reach native selection protection: '+attributes);assert(!e.defaultPrevented);assert.equal(target.style.getPropertyValue('user-select'),'text');
  const c=new w.Event('contextmenu',{bubbles:true,cancelable:true});let menus=0;w.document.addEventListener('contextmenu',()=>menus++,true);target.dispatchEvent(c);assert.equal(menus,0);assert(!c.defaultPrevented);
  assert(!w.document.querySelector('#fpro-selection-style').textContent.includes('[data-fpro-selectable-text] [role="button"]'),'No new descendant CSS veto over prepared reading');
 }finally{w.close();}
}
{
 const w=fixture('<article><p id="reading">A post to drag down for the site refresh</p></article>',false);try{
  const seen=[];for(const type of ['pointerdown','touchstart','pointermove','touchmove','pointerup','touchend','contextmenu'])w.document.addEventListener(type,()=>seen.push(type),true);
  for(const type of ['pointerdown','touchstart','pointermove','touchmove','pointerup','touchend','contextmenu']){const e=new w.Event(type,{bubbles:true,cancelable:true});w.document.querySelector('#reading').dispatchEvent(e);assert(!e.defaultPrevented);}
  assert.equal(seen.length,7,'Selection OFF returns the entire gesture stream to the site; no native refresh substitution');
  assert(!w.document.querySelector('#fpro-selection-style'));
 }finally{w.close();}
}
console.log('Selection43 passed: build23 CSS/preparation golden, plain/pressed/popup/prose wrappers, native defaults, and full site event propagation with selection OFF; no native pull replacement.');
