const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
(async()=>{
 for(const path of ['/', '/reel/42/', '/reels/42/', '/watch/?v=42']){
  const w=new JSDOM('<!doctype html><head></head><body><div id="clip" data-tracking-duration-id="42"><div class="fl ac"><span class="native-text">󲀠</span></div><video></video></div></body>',{url:'https://m.facebook.com'+path,runScripts:'outside-only',pretendToBeVisual:true}).window;
  const cfg={siteEngine:'upstream',enhance:true,reels:true,color:'طبيعي',referenceEngine:true,appBanner:true};
  try{
   w.eval(fs.readFileSync('app/src/main/assets/app-prompt-engine.js','utf8'));
   w.eval(fs.readFileSync('app/src/main/assets/site-engine.js','utf8'));w.FproSiteEngine.update(cfg);await settle();
   assert.equal(w.document.getElementById('clip').style.display,path==='/'?'none':'','Hide feed reel cards, never the explicitly opened media viewer: '+path);
  }finally{w.FproSiteEngine?.update({...cfg,enhance:false});w.close();}
 }
 console.log('Reels viewer PASS: feed hiding retained; explicit reel/reels/watch media surfaces are not hidden by feed reel classification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
