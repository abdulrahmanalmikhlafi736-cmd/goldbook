const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const assets=process.env.FPRO_TEST_ASSET_DIR||'app/src/main/assets';
const main=fs.readFileSync(assets+'/facebook.js','utf8'),reference=fs.readFileSync(assets+'/reference-engines.js','utf8');
const windows=[],micro=async()=>{await Promise.resolve();await Promise.resolve();},frame=w=>new Promise(r=>w.requestAnimationFrame(r));
function fixture(mode,tag,role){
 const w=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://m.facebook.com/watch/',runScripts:'outside-only',pretendToBeVisual:true}).window;windows.push(w);
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=(el,pseudo)=>pseudo?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:computed(el);
 Object.defineProperty(w,'innerWidth',{value:411});Object.defineProperty(w,'innerHeight',{value:808});
 const root=w.document.createElement(tag);if(role)root.setAttribute('role',role);root.style.cssText='position:relative;width:411px;height:808px';
 root.innerHTML='<div role="toolbar"><button>Search</button><button>Profile</button><button>Like</button><button>Comments</button></div><video></video><div id="bar56" style="position:fixed;bottom:0;left:0;width:411px;height:65px"><button>فتح التطبيق</button></div>';
 root.getBoundingClientRect=()=>({width:411,height:808,top:0,left:0});const bar=root.querySelector('#bar56');bar.getBoundingClientRect=()=>bar.style.display==='none'?{width:0,height:0}:{width:411,height:65,top:743,left:0};bar.firstChild.getBoundingClientRect=()=>({width:124,height:40});w.document.body.append(root);
 if(mode!=='standalone')w.eval(reference);
 const cfg={enhance:true,appBanner:true,referenceEngine:mode==='reference',color:'طبيعي',textSelection:false};const run=c=>w.eval(main.replace('__CONFIG__',JSON.stringify(c||cfg)));run();return {w,root,bar,cfg,run};
}
(async()=>{try{
 for(const mode of ['standalone','fallback','reference'])for(const [tag,role] of [['main',null],['article',null],['div','main'],['div','article'],['div','feed']]){
  const {w,root,bar,cfg,run}=fixture(mode,tag,role);assert.equal(bar.style.display,'none','Initially verified footer');
  for(let n=0;n<3;n++){
   root.style.position='fixed';await micro();await frame(w);await micro();
   assert.equal(bar.style.display,'none',mode+': scroll-locked landmark itself must count as page content, not restore verified footer');
   for(const el of [root,...root.querySelectorAll('video,[role="toolbar"], [role="toolbar"] button')])assert.notEqual(el.style.display,'none');
   assert.notEqual(bar.firstChild.style.display,'none','Only bar owns hiding');root.style.position='relative';await frame(w);
  }
  run({...cfg,appBanner:false});assert.notEqual(bar.style.display,'none');run();assert.equal(bar.style.display,'none');
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');await micro();await frame(w);assert.notEqual(bar.style.display,'none','Actual modal must still be usable');
 }
 // An unlabelled generic fullscreen sheet is NOT a recognized page landmark.
 for(const mode of ['standalone','fallback','reference']){
  const {w,root,bar,run}=fixture(mode,'div',null);root.style.position='fixed';await micro();await frame(w);run();assert.notEqual(bar.style.display,'none','Unknown overlay remains protected');
 }
 console.log('Prompts56 PASS: verified footer stays hidden across fixed main/article/feed transitions; page/search/profile/video and child/OFF retained; modal/unknown overlay guards remain.');
}finally{windows.forEach(w=>w.close());}})().catch(e=>{console.error(e);process.exitCode=1;});
