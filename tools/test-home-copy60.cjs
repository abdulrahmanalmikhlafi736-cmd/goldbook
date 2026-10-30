const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const files=['app-prompt-engine.js','site-engine.js','facebook.js'].map(f=>fs.readFileSync('app/src/main/assets/'+f,'utf8'));
const cfg={siteEngine:'upstream',enhance:true,appBanner:true,textSelection:true,selectionScope:'posts',color:'طبيعي'};
const dom=new JSDOM('<html><head></head><body><main id="page" role="main"><button id="cta">فتح التطبيق</button><button id="like">Like</button><input placeholder="Search"><article>Ordinary feed</article></main><div id="flat" class="native-text">Real Bloks post text</div><div role="article"><div role="article"><p id="nested">Nested post body</p></div></div><div role="comment" data-commentid="7"><p id="comment">Comment body</p></div><div role="dialog" aria-modal="true"><button id="sheet">Open app</button><input></div></body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,get=w.getComputedStyle.bind(w);w.getComputedStyle=(el,p)=>p?{content:'none',display:'none',backgroundImage:'none',boxShadow:'none',borderRadius:'0px'}:get(el);
const micro=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{try{
 for(const file of files)w.eval(file.replace('__CONFIG__',JSON.stringify(cfg)));
 const cta=w.document.getElementById('cta');assert.equal(cta.style.display,'none');
 const page=w.document.getElementById('page');page.setAttribute('aria-modal','true');page.setAttribute('role','dialog');await micro();assert.equal(cta.style.display,'none','Page scroll-lock/dialog transition must not revoke the verified CTA');
 page.removeAttribute('aria-modal');page.setAttribute('role','main');page.setAttribute('aria-hidden','true');await micro();assert.equal(cta.style.display,'none','Accessibility-hidden page must not erase the CTA caption');
 assert.notEqual(w.document.getElementById('sheet').style.display,'none','True blocking sheet protected');
 for(const id of ['flat','nested']){const el=w.document.getElementById(id);el.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));assert.equal(el.style.userSelect,'text','Native reading preparation for '+id);w.dispatchEvent(new w.Event('blur'));}
 const comment=w.document.getElementById('comment');let delegated=0;w.document.addEventListener('pointerdown',()=>delegated++,true);comment.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));assert.equal(delegated,1);assert(!comment.hasAttribute('data-fpro-selectable-text'));assert.equal(w.getComputedStyle(comment).userSelect,'none');
 w.__fpro.update({...cfg,enhance:false});assert.notEqual(cta.style.display,'none');console.log('Home/copy60 PASS: transient page modal vs real sheet, plain Bloks/nested post selection, comments delegated and nonselectable, OFF restore.');
}finally{w.__fpro?.update({...cfg,enhance:false});w.FproPrompt?.update({...cfg,enhance:false});w.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
