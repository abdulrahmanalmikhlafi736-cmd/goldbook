const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
function fixture({body='<article><video src="blob:current"></video><button aria-label="مشاركة">مشاركة</button></article>',url='https://m.facebook.com/reel/123/'}={}){
 const dom=new JSDOM(body,{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 const sent=[],timers=new Map();let timerid=0,observers=0;
 const page=new URL(url),loc={get href(){return page.href;},set href(value){sent.push(value);},get pathname(){return page.pathname;},get hostname(){return page.hostname;}};
 const env={document:d,location:loc,Element:w.Element,navigator:{language:'ar',clipboard:{writeText:()=>Promise.resolve()}},innerHeight:800,innerWidth:400,getComputedStyle:w.getComputedStyle.bind(w),
  setTimeout(fn){const id=++timerid;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},requestAnimationFrame(fn){return this.setTimeout(fn);},cancelAnimationFrame(id){this.clearTimeout(id);},addEventListener:w.addEventListener.bind(w),removeEventListener:w.removeEventListener.bind(w)};
 class Observer extends w.MutationObserver{constructor(fn){super(fn);this.live=false;}observe(...args){super.observe(...args);if(!this.live){observers++;this.live=true;}}disconnect(){super.disconnect();if(this.live){observers--;this.live=false;}}}
 const ctx=vm.createContext({window:env,MutationObserver:Observer,URL,Promise});
 const rect={left:0,right:400,top:50,bottom:700,width:400,height:650};
 const v=d.querySelector('#target')||d.querySelector('video');v.getBoundingClientRect=()=>rect;
 function geometry(n,top=600){n.getBoundingClientRect=()=>({left:20,right:100,top,bottom:top+40,width:80,height:40});return n;}
 d.querySelectorAll('button,[role="button"]').forEach(b=>geometry(b));
 vm.runInContext(fs.readFileSync(__dirname+'/public-video-link.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(__dirname+'/official-download.js','utf8'),ctx);
 const api=env.FproOfficialDownload;let shareClicks=0,copyClicks=0;
 function sheet({count=1,value='https://www.facebook.com/share/v/1HeYq17541/',delayed=false}={}){
  const root=d.createElement('div');root.setAttribute('role','presentation');
  for(let i=0;i<count;i++){const b=geometry(d.createElement('button'),710);b.setAttribute('aria-label','نسخ الرابط');b.onclick=()=>{copyClicks++;if(!delayed)api.copied(value);};root.append(b);}d.body.append(root);return root;
 }
 const share=d.querySelector('[aria-label="مشاركة"]');if(share)share.onclick=()=>{shareClicks++;sheet();};
 return {dom,w,d,env,api,v,sent,timers,ctx,sheet,geometry,share,shareClicks:()=>shareClicks,copyClicks:()=>copyClicks,observers:()=>observers,close(){api.cancel();dom.window.close();}};
}
function run(fn,options){const f=fixture(options);try{fn(f);}finally{f.close();}}
test('no observer/timer or clipboard reads while idle',()=>run(f=>{assert.equal(f.observers(),0);assert.equal(f.timers.size,0);assert.equal(f.api.copied('https://www.facebook.com/share/v/OLD123/'),false);assert.equal(f.sent.length,0);}));
test('one click opens official share, clicks official copy and sends the supplied current share URL once',()=>run(f=>{assert.equal(f.api.begin(f.v),true);assert.equal(f.shareClicks(),1);assert.equal(f.copyClicks(),1);assert.equal(f.sent.length,1);const u=new URL(f.sent[0]);assert.equal(u.hostname,'download');assert.equal(u.searchParams.get('link'),'https://www.facebook.com/share/v/1HeYq17541/');assert.equal(u.searchParams.get('copy'),'1');assert.equal(f.observers(),0);assert.equal(f.timers.size,0);f.api.copied('https://www.facebook.com/share/v/OTHER123/');assert.equal(f.sent.length,1);}));
test('already-open share sheet is not consumed as if belonging to selected clip',()=>run(f=>{f.sheet();assert.equal(f.api.begin(f.v),false);assert.equal(f.copyClicks(),0);assert.equal(f.shareClicks(),0);assert.equal(f.sent[0],'fpro://official-download-help');assert.equal(f.observers(),0);}));
test('two official Copy link candidates are ambiguous',()=>run(f=>{f.share.onclick=()=>f.sheet({count:2});f.api.begin(f.v);assert.equal(f.copyClicks(),0);assert.equal(f.sent[0],'fpro://official-download-help');assert.equal(f.observers(),0);}));
test('old copied value before copy phase cannot trigger download',()=>run(f=>{f.share.onclick=()=>{};f.api.begin(f.v);assert.equal(f.api.copied('https://www.facebook.com/share/v/OLD123/'),false);assert.equal(f.sent.length,0);}));
test('recycled source and detached target invalidate delayed copy result',()=>run(f=>{f.share.onclick=()=>f.sheet({delayed:true});f.api.begin(f.v);f.v.src='blob:new';assert.equal(f.api.copied('https://www.facebook.com/share/v/OLD123/'),false);assert.equal(f.sent.length,0);assert.equal(f.observers(),0);f.d.querySelector('[role="presentation"]').remove();f.api.begin(f.v);f.v.remove();assert.equal(f.api.copied('https://www.facebook.com/share/v/OLD123/'),false);}));
test('duplicate taps while waiting do not open a second share action',()=>run(f=>{let clicks=0;f.share.onclick=()=>{clicks++;};f.api.begin(f.v);f.api.begin(f.v);assert.equal(clicks,1);}));
test('timeout removes observer, listeners and queued work',()=>run(f=>{f.share.onclick=()=>{};f.api.begin(f.v);assert.equal(f.observers(),1);const timer=Array.from(f.timers.values())[0];timer();assert.equal(f.api.report().active,false);assert.equal(f.observers(),0);assert.equal(f.timers.size,0);assert.equal(f.sent[0],'fpro://official-download-help');}));
test('ordinary scroll/drag cancels pending work without navigation or fallback',()=>run(f=>{f.share.onclick=()=>{};f.api.begin(f.v);f.d.dispatchEvent(new f.w.Event('touchmove',{bubbles:true}));assert.equal(f.api.report().active,false);assert.equal(f.observers(),0);assert.equal(f.sent.length,0);}));
test('no current article button means no first-post share selection on feed',()=>run(f=>{f.api.begin(f.v,()=>false);assert.equal(f.shareClicks(),0);assert.equal(f.copyClicks(),0);assert.equal(f.sent[0],'fpro://official-download-help');},{url:'https://m.facebook.com/',body:'<article><video></video><button aria-label="مشاركة">مشاركة</button></article><article><video id="target"></video></article>'}));
test('verified direct/permalink fallback can serve an unidentifiable share layout without leaving observers',()=>run(f=>{f.share.remove();let calls=0;f.api.begin(f.v,()=>{calls++;return true;});assert.equal(calls,1);assert.equal(f.observers(),0);assert.equal(f.api.report().active,false);assert.equal(f.sent.length,0);}));
test('ordinary manual clipboard copying outside a download request is unchanged in production hook',()=>run(f=>{
 const source=process.env.FACEBOOST_SOURCE;if(!source)throw Error('FACEBOOST_SOURCE required');
 const raw=fs.readFileSync(source+'/app/src/main/res/raw/scripts.js','utf8');
 const hooks=raw.slice(raw.indexOf('    // The last text the page put on the clipboard'),raw.indexOf('    const shareCopiedLink'));
 class Transfer{setData(){return true;}}
 let ordinary=0;f.env.navigator.clipboard.writeText=()=>{ordinary++;return Promise.resolve();};f.d.execCommand=()=>true;
 Object.assign(f.ctx,{document:f.d,navigator:f.env.navigator,DataTransfer:Transfer});vm.runInContext(hooks,f.ctx);
 f.env.navigator.clipboard.writeText('ordinary post text');assert.equal(ordinary,1);assert.equal(f.sent.length,0);
 f.share.onclick=()=>f.sheet({delayed:true});f.api.begin(f.v);f.env.navigator.clipboard.writeText('https://www.facebook.com/share/v/1HeYq17541/');assert.equal(ordinary,2);assert.equal(f.sent.length,1);
}));
