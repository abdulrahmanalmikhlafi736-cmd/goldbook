const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_PATH || 'jsdom');
const source=process.env.FACEBOOST_SOURCE;
if(!source)throw Error('FACEBOOST_SOURCE must point to the patched pinned source');
function fixture(){
 const dom=new JSDOM('<!doctype html><html><head></head><body><video id="v"></video></body></html>',{url:'https://m.facebook.com/reel/123/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;Object.defineProperty(w,'innerWidth',{value:400});Object.defineProperty(w,'innerHeight',{value:800});
 const v=w.document.getElementById('v');v.getBoundingClientRect=()=>({left:0,top:50,right:400,bottom:750,width:400,height:700});
 Object.defineProperty(v,'duration',{value:100,configurable:true});Object.defineProperty(v,'paused',{value:false,configurable:true});v.currentTime=20;
 let fullscreen=0;v.requestFullscreen=()=>{fullscreen++;return Promise.resolve();};
 w.Element.prototype.animate=()=>({onfinish:null});
 w.__CONFIG__={enhance:false,siteEngine:'upstream',doubleTapFullscreen:true,textSelection:false,downloads:false,rainbow:false,color:'طبيعي'};
 w.eval(fs.readFileSync(path.join(source,'app/src/main/assets/media-surface.js'),'utf8'));
 // Production order: Faceboost gesture listener first, then FPRO engine.
 w.__mbReel={rate:2,skip:10};
 w.eval(fs.readFileSync(path.join(source,'app/src/main/res/raw/reel_gestures.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(source,'app/src/main/assets/facebook.js'),'utf8'));
 function pointer(type,x,y,id=1){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerType:'touch',pointerId:id,isPrimary:true,clientX:x,clientY:y});v.dispatchEvent(e);return e;}
 function touch(type,x,y){const e=new w.Event(type,{bubbles:true,cancelable:true});const p={clientX:x,clientY:y,identifier:1};Object.assign(e,{touches:type==='touchend'?[]:[p],changedTouches:[p]});v.dispatchEvent(e);return e;}
 function tap(x,y){pointer('pointerdown',x,y);touch('touchstart',x,y);pointer('pointerup',x,y);return touch('touchend',x,y);}
 return {w,v,tap,pointer,fullscreen:()=>fullscreen,close:()=>dom.window.close()};
}
test('production gesture pair: top double tap enters once and does not seek',()=>{const f=fixture();try{f.tap(350,100);f.tap(350,100);assert.equal(f.fullscreen(),1);assert.equal(f.v.currentTime,20);}finally{f.close();}});
test('production gesture pair: lower right double tap seeks and never enters fullscreen',()=>{const f=fixture();try{f.tap(350,600);f.tap(350,600);assert.equal(f.fullscreen(),0);assert.equal(f.v.currentTime,30);}finally{f.close();}});
test('production gesture: swipe and cancelled touch never enter fullscreen',()=>{const f=fixture();try{f.pointer('pointerdown',100,100);f.pointer('pointermove',100,200);f.pointer('pointerup',100,200);f.tap(100,100);assert.equal(f.fullscreen(),0);f.pointer('pointercancel',100,100);f.tap(100,100);assert.equal(f.fullscreen(),0);}finally{f.close();}});
test('existing-like diagnostic: animation appears even when no official button is found',()=>{const f=fixture();try{f.tap(200,600);f.tap(200,600);assert.equal(f.w.document.querySelectorAll('[role="button"][data-long-click-action-id]').length,0);assert.ok(f.w.document.getElementById('mb-reel-anim'));assert.equal(f.fullscreen(),0);}finally{f.close();}});
test('existing-like diagnostic: fast double tap self-swallows the official click but still animates',()=>{const f=fixture();try{let clicked=0;const b=f.w.document.createElement('div');b.setAttribute('role','button');b.setAttribute('data-long-click-action-id','fixture');b.setAttribute('aria-pressed','false');b.getBoundingClientRect=()=>({left:0,top:380,right:40,bottom:420,width:40,height:40});b.addEventListener('click',()=>clicked++);f.w.document.body.appendChild(b);f.tap(200,600);f.tap(200,600);assert.equal(clicked,0);assert.equal(b.getAttribute('aria-pressed'),'false');assert.ok(f.w.document.getElementById('mb-reel-anim'));}finally{f.close();}});

test('existing-like diagnostic: slower double tap sends click but never verifies official state',()=>{const f=fixture();try{let now=1000;f.w.Date.now=()=>now;let clicked=0;const b=f.w.document.createElement('div');b.setAttribute('role','button');b.setAttribute('data-long-click-action-id','fixture');b.setAttribute('aria-pressed','false');b.getBoundingClientRect=()=>({left:0,top:380,right:40,bottom:420,width:40,height:40});b.addEventListener('click',()=>clicked++);f.w.document.body.appendChild(b);f.tap(200,600);now=1200;f.tap(200,600);assert.equal(clicked,1);assert.equal(b.getAttribute('aria-pressed'),'false');assert.ok(f.w.document.getElementById('mb-reel-anim'));}finally{f.close();}});
