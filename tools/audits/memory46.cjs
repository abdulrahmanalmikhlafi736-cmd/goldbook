/* Test-only retention instrumentation. Does not change packaged application code. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const source=process.argv[2];if(!source)throw Error('Pass reconstructed Android project root');
let script=fs.readFileSync(path.join(source,'app/src/main/assets/site-engine.js'),'utf8');
const anchor='elements:attrs.size,childChanges:children.length';assert.equal(script.split(anchor).length,2);
script=script.replace(anchor,anchor+',detachedElements:Array.from(attrs.keys()).filter(el=>!el.isConnected).length,detachedChildReferences:children.reduce((n,c)=>n+c.removed.filter(el=>!el.isConnected).length,0)');
const settle=()=>new Promise(resolve=>setTimeout(resolve,15));
async function run({color,amoled=false}){
 const dom=new JSDOM('<!doctype html><html><head></head><body><main id="feed"></main></body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let callbacks=0;const live=new Set(),MO=w.MutationObserver;
 w.MutationObserver=class extends MO {constructor(fn){super((...args)=>{callbacks++;fn(...args);});}observe(...args){live.add(this);return super.observe(...args);}disconnect(){live.delete(this);return super.disconnect();}};
 w.eval(script);const config={siteEngine:'upstream',enhance:true,referenceEngine:color,color:'أحمر',amoled};
 w.FproSiteEngine.update(config);await settle();const baseline=w.FproSiteEngine.report(),samples=[];
 for(let cycle=1;cycle<=30;cycle++){
  for(const route of ['/','/story.php?story_fbid=123&id=456','/','/stories/123/456/','/']){
   w.history.pushState({},'',route);w.dispatchEvent(new w.PopStateEvent('popstate'));
   const panel=w.document.createElement('section');
   panel.innerHTML=Array.from({length:8},(_,i)=>`<div style="color: rgb(24, 119, 242); background-color: rgb(36, 37, 38);">item ${i}</div>`).join('');
   w.document.getElementById('feed').replaceChildren(panel);await settle();
  }
  if(cycle===1||cycle%5===0){if(global.gc)global.gc();samples.push({cycle,heapUsed:process.memoryUsage().heapUsed,liveObservers:live.size,report:w.FproSiteEngine.report()});}
 }
 const final=w.FproSiteEngine.report();assert.equal(final.observers,baseline.observers,'No factory observer accumulation on SPA navigation');assert.equal(final.errors.length,0);
 // Re-evaluation must not install more document observers.
 const before=live.size;w.eval(script);await settle();assert.equal(live.size,before);
 w.FproSiteEngine.update({...config,enhance:false});await settle();const disabled={report:w.FproSiteEngine.report(),liveObservers:live.size};
 assert.equal(disabled.report.active,false);assert.equal(live.size,1,'Only singleton body-replacement host remains after OFF');
 dom.window.close();return {color,amoled,cycles:30,routesPerCycle:5,baseline,samples,final,disabled};
}
(async()=>{const results=[];for(const scenario of [{color:false},{color:true},{color:true,amoled:true}])results.push(await run(scenario));console.log(JSON.stringify({scope:'jsdom fixture, site-engine only; NOT Android/WebView or authenticated Facebook; heap is Node+jsdom, not app RSS',gcExposed:!!global.gc,results},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
