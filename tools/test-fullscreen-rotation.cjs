const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/fullscreen-rotation.js','utf8');
const w=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only',url:'https://m.facebook.com/'}).window;
try{
 w.eval(source);const helper=w.FproFullscreenRotation;w.eval(source);assert.equal(w.FproFullscreenRotation,helper,'Idempotent early/late injection');
 let siteEvents=0;for(const name of ['resize','orientationchange'])w.addEventListener(name,()=>siteEvents++);
 const change=()=>{for(const name of ['resize','orientationchange'])w.dispatchEvent(new w.Event(name));};
 change();assert.equal(siteEvents,2,'Normal browsing untouched');
 helper.begin();change();assert.equal(siteEvents,2,'Managed session protects pending as well as active fullscreen');
 helper.end();change();assert.equal(siteEvents,4,'Native Back/failure releases protection');
 helper.begin();Object.defineProperty(w.document,'fullscreenElement',{value:w.document.body,writable:true});
 w.document.dispatchEvent(new w.Event('fullscreenchange'));assert.equal(helper.isActive(),true);
 w.document.fullscreenElement=null;w.document.dispatchEvent(new w.Event('fullscreenchange'));change();assert.equal(siteEvents,6,'Site/browser exit releases protection');
 helper.begin();w.document.dispatchEvent(new w.Event('webkitfullscreenchange'));assert.equal(helper.isActive(),false);
 assert(!source.includes('dispatchEvent'),'Production never synthesizes site events');
 console.log('Fullscreen rotation guard PASS: early idempotent registration, pending/active lifetime, normal browsing, native Back/failure and browser exit. Blink registration ordering is separately measured, not inferred from jsdom.');
}finally{w.close();}
