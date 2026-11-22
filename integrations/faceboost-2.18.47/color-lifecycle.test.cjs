const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const source=()=>fs.readFileSync(process.env.FACEBOOST_SOURCE+'/app/src/main/assets/site-engine.js','utf8');
const wait=()=>new Promise(r=>setTimeout(r,40));
test('incremental accent handles additions, external same-node stylesheet updates and OFF restore',async()=>{
 const dom=new JSDOM('<html><head><style id="site">.a{background-color:#1877f2;}</style></head><body><div id="target" style="color:rgb(24,119,242);">test</div></body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only'}),w=dom.window;
 try{
  w.eval(source());const config={siteEngine:'upstream',enhance:true,referenceEngine:true,color:'أحمر'};
  w.FproSiteEngine.update(config);await wait();
  assert.match(w.document.getElementById('target').style.color,/198, 40, 40/);
  const style=w.document.getElementById('site');style.textContent='.b{background-color:#1877f2;}';await wait();
  assert.doesNotMatch(style.textContent,/#1877f2/);assert.match(style.textContent,/\.b/);
  const el=w.document.createElement('div');el.style.color='rgb(24,119,242)';w.document.body.append(el);await wait();assert.match(el.style.color,/198, 40, 40/);
  el.style.color='rgb(10, 20, 30)';await wait();assert.equal(el.style.color,'rgb(10, 20, 30)');
  const callbacks=w.FproSiteEngine.report();await wait();assert.equal(w.FproSiteEngine.report().timers,0);assert.equal(callbacks.observers,1);
  w.FproSiteEngine.update({...config,enhance:false});await wait();assert.equal(w.document.getElementById('target').style.color,'rgb(24, 119, 242)');assert.equal(el.style.color,'rgb(10, 20, 30)');
 }finally{w.FproSiteEngine.update({enhance:false});await wait();dom.window.close();}
});
test('one native AMOLED owner and no raw page Material You duplication',()=>{
 const main=fs.readFileSync(process.env.FACEBOOST_SOURCE+'/app/src/main/java/com/almekhlafi/materialbook/ui/viewmodel/MainViewModel.kt','utf8');
 assert.doesNotMatch(main,/Script\(settings.materialYou.value, R.raw.material_you/);assert.match(main,/Script\(settings.amoledBlack.value, R.raw.amoled_black/);
 assert.doesNotMatch(source(),/\['amoled','amoled_black'\]/);
});
