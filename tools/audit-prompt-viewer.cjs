// Historical baseline audit. The pinned source reproduces the defect; current safety has a separate test.
const fs=require('node:fs'),{JSDOM}=require('jsdom'),assert=require('node:assert/strict');
(async()=>{
 const w=new JSDOM('<!doctype html><head></head><body><div id="viewer" role="button" aria-label="Open app" style="width:400px;height:700px"><div id="host"></div></div><button id="cta">Open app</button></body>',{url:'https://m.facebook.com/reel/audit/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 try{
  const viewer=w.document.getElementById('viewer');viewer.getBoundingClientRect=()=>({width:400,height:700,top:0,bottom:700});
  const shadow=w.document.getElementById('host').attachShadow({mode:'open'});shadow.innerHTML='<video id="actualPlayer"></video>';
  w.eval(require('node:child_process').execFileSync('git',['show','6e5c8ef:app/src/main/assets/app-prompt-engine.js'],{encoding:'utf8'}));
  const cfg={siteEngine:'upstream',enhance:true,appBanner:true};
  const before=w.getComputedStyle(viewer).display;
  w.FproPrompt.update(cfg);for(let i=0;i<10;i++)await Promise.resolve();
  const on=w.getComputedStyle(viewer).display,ctaHidden=w.getComputedStyle(w.document.getElementById('cta')).display==='none';
  const retained=w.FproPrompt.report().retained;
  w.FproPrompt.update({...cfg,appBanner:false});
  const off=w.getComputedStyle(viewer).display;
  assert.notEqual(before,'none');assert.equal(on,'none','Known defect: large media owner is hidden');assert.notEqual(off,'none');assert(ctaHidden);
  console.log(JSON.stringify({audit:'historical-6e5c8ef-known-defect-not-current',case:'large labelled owner with shadow media',before,on,off,ctaHidden,retained,samePlayer:!!shadow.getElementById('actualPlayer')},null,2));
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
