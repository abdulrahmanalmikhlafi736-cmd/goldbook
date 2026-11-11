const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/feed-return.js','utf8');
function fixture(inner=false,rootType='article',saved=null,navigation='navigate'){
 const w=new JSDOM('<!doctype html><head></head><body><div id="scroller"><article data-tracking-duration-id="post42"><a id="open" href="/posts/42">Post</a><button id="comments">Comments</button></article></div></body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 let y=1000,offset=1100,height=350,clock=0,token=0;const timers=new Map();
 w.setTimeout=(fn,ms)=>{const id=++token;timers.set(id,{fn,at:clock+(ms||0)});return id;};w.clearTimeout=id=>timers.delete(id);w.requestAnimationFrame=fn=>w.setTimeout(fn,1);w.cancelAnimationFrame=w.clearTimeout;
 const step=ms=>{const end=clock+ms;for(let n=0;n<1000;n++){let next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;clock=next[1].at;timers.delete(next[0]);next[1].fn();}clock=end;};
 Object.defineProperty(w,'scrollY',{get:()=>y});w.scrollTo=(x,v)=>{y=v;};
 const scroller=w.document.getElementById('scroller');if(inner){scroller.style.overflowY='auto';Object.defineProperty(scroller,'clientHeight',{value:400});Object.defineProperty(scroller,'scrollHeight',{value:6000});scroller.scrollTop=1000;}
 let post=w.document.querySelector('article');if(rootType!=='article'){const div=w.document.createElement('div');div.innerHTML=post.innerHTML;if(rootType==='bloks'){div.setAttribute('data-mcomponent','MContainer');div.setAttribute('data-dcm-id','1');}else if(rootType==='ft'){div.setAttribute('data-ft',JSON.stringify({top_level_post_id:'42'}));}else div.setAttribute('data-pagelet','FeedUnit_42');post.replaceWith(div);post=div;}const geometry=node=>node.getBoundingClientRect=()=>({top:offset-(inner?scroller.scrollTop:y),bottom:offset-(inner?scroller.scrollTop:y)+height,height:height,width:400});geometry(post);
 if(saved)w.sessionStorage.setItem('fpro.feed-return.v1',saved);w.performance.getEntriesByType=()=>[{type:navigation}];const rawReplace=w.history.replaceState.bind(w.history);const cfg={rememberPosition:true};w.eval(source.replace('__CONFIG__',JSON.stringify(cfg)));
 function click(){w.document.getElementById('comments').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}
 function depart(){click();w.history.pushState({site:'keep-me'},'', '/posts/42');}
 function back(){rawReplace({},'', '/');w.dispatchEvent(new w.PopStateEvent('popstate'));step(1);}
 return {w,step,scroller,click,depart,back,get y(){return y;},set y(v){y=v;},set offset(v){offset=v;},set height(v){height=v;},replace(){const old=post;post=old.cloneNode(true);old.replaceWith(post);geometry(post);return post;},close(){w.close();}};
}
{
 const f=fixture();try{f.depart();assert.deepEqual(JSON.parse(JSON.stringify(f.w.history.state)),{site:'keep-me'});f.offset=1900;f.y=2400;f.back();assert.equal(f.y,1800,'Return to SAME post at100px despite changed document offset');f.offset=2100;f.step(151);assert.equal(f.y,2000,'Late layout shift corrected');f.w.dispatchEvent(new f.w.Event('touchstart'));f.y=2600;f.offset=2500;f.step(5000);assert.equal(f.y,2600,'User gesture cancels later corrections');assert.equal(f.w.FproFeedReturn.report().active,false);}finally{f.close();}
}
{
 const f=fixture(true);try{f.depart();f.offset=2000;f.scroller.scrollTop=2600;f.back();assert.equal(f.scroller.scrollTop,1900,'Nested scroller corrected');assert.equal(f.y,1000,'Window scroll untouched');f.step(3000);assert.equal(f.w.FproFeedReturn.report().retained,0);const attempts=f.w.FproFeedReturn.report().attempts;f.step(20000);assert.equal(f.w.FproFeedReturn.report().attempts,attempts,'No idle polling');}finally{f.close();}
}
{
 const f=fixture();try{f.depart();f.replace();f.offset=1700;f.y=2700;f.back();assert.equal(f.y,1600,'Re-rendered post matched by permalink');const data=f.w.sessionStorage.getItem('fpro.feed-return.v1');assert(!data.includes('Comments')&&!data.includes('Post'),'No post text persisted');}finally{f.close();}
}
{
 const f=fixture();try{f.depart();f.w.document.querySelector('article').remove();f.y=2700;f.back();f.step(3000);assert.equal(f.y,2700,'Missing anchor never guesses a pixel fallback');assert.equal(f.w.FproFeedReturn.report().active,false);}finally{f.close();}
}
{
 const f=fixture();try{f.depart();f.offset=2000;f.y=2700;f.w.history.pushState({},'', '/');f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));f.step(3000);assert.equal(f.y,2700,'Deliberate Home push is not a back restoration');}finally{f.close();}
}
{
 const f=fixture();try{f.click();f.offset=1700;f.y=2500;f.w.FproFeedReturn.afterDialogBack();f.step(1);assert.equal(f.y,1600,'Same-URL comments dialog returns to source post');f.w.FproFeedReturn.setEnabled(false);f.offset=2300;f.step(3000);assert.equal(f.y,1600,'OFF cancels pending work');}finally{f.close();}
}
{
 const f=fixture();try{f.depart();f.offset=1700;f.y=2700;f.back();f.w.dispatchEvent(new f.w.Event('wheel'));const y=f.y;f.step(3000);assert.equal(f.y,y);}finally{f.close();}
}
for(const type of ['bloks','ft','feedunit']){const f=fixture(false,type);try{f.depart();f.replace();f.offset=1800;f.y=2500;f.back();assert.equal(f.y,1700,'Stable return for '+type);}finally{f.close();}}
{
 const old=fixture();let snapshot;try{old.depart();snapshot=old.w.sessionStorage.getItem('fpro.feed-return.v1');}finally{old.close();}
 const restored=fixture(false,'article',snapshot,'back_forward');try{restored.offset=1800;restored.y=2700;restored.step(1);assert.equal(restored.y,1700,'New document history traversal restores persisted post anchor');}finally{restored.close();}
 const fresh=fixture(false,'article',snapshot,'navigate');try{fresh.offset=1800;fresh.y=2700;fresh.step(3000);assert.equal(fresh.y,2700,'Fresh document visit is not history traversal');}finally{fresh.close();}
 const expired=JSON.parse(snapshot);expired.at=Date.now()-600001;
 const stale=fixture(false,'article',JSON.stringify(expired),'back_forward');try{stale.y=2700;stale.step(3000);assert.equal(stale.y,2700,'Expired checkpoints ignored');}finally{stale.close();}
}
// Capture geometry before both collapse and expansion during activation.
for(const activatedOffset of [700,1500]){
 const f=fixture();try{
  const button=f.w.document.getElementById('comments');
  button.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,clientX:40,clientY:140}));
  f.offset=activatedOffset;
  f.depart();f.offset=1900;f.y=2400;f.back();
  assert.equal(f.y,1800,'Pre-activation offset wins over shifted click geometry: '+activatedOffset);
 }finally{f.close();}
}
{
 const f=fixture();try{
  const button=f.w.document.getElementById('comments');
  button.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,clientX:40,clientY:140}));
  button.dispatchEvent(new f.w.MouseEvent('pointermove',{bubbles:true,clientX:100,clientY:240}));
  f.offset=700;f.depart();f.offset=1900;f.y=2400;f.back();
  assert.equal(f.y,2200,'Do not reuse pre-drag press geometry for a later click');
 }finally{f.close();}
}
// A broad ancestor article can wrap multiple mobile feed cards.
{
 const f=fixture(false,'feedunit');try{
  const d=f.w.document,post=d.querySelector('[data-pagelet]'),wrapper=d.createElement('article');
  post.replaceWith(wrapper);wrapper.append(post);wrapper.getBoundingClientRect=()=>({top:800-f.y,bottom:4800-f.y,height:4000,width:400});
  f.depart();f.offset=1900;f.y=2400;f.back();
  assert.equal(f.y,1800,'Nearest identified card wins over the outer article');
 }finally{f.close();}
}
// Facebook may rebuild the same post with different wrapper metadata.
{
 const f=fixture(false,'ft');try{
  f.depart();const post=f.replace();post.removeAttribute('data-ft');post.setAttribute('data-pagelet','FeedUnit_42');
  f.offset=1900;f.y=2400;f.back();assert.equal(f.y,1800,'Stable URL/post-ID aliases survive ft -> FeedUnit changes');
 }finally{f.close();}
}
// Real site arrows can replace the route and change tracking parameters.
{
 const f=fixture();try{
  f.depart();f.offset=1900;f.y=2400;
  const b=f.w.document.createElement('button');b.setAttribute('aria-label','رجوع');f.w.document.body.appendChild(b);
  b.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,clientX:5,clientY:5}));
  f.w.history.replaceState({site:'retained'},'', '/?ref=return');f.step(1);
  assert.equal(f.y,1800,'Site Back replaceState restores the source despite tracking changes');
  assert.equal(f.w.history.state.site,'retained');
 }finally{f.close();}
}
{
 const f=fixture();try{
  f.depart();f.offset=1900;f.y=2400;
  f.w.history.replaceState({},'', '/?ref=history');f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));f.step(1);
  assert.equal(f.y,1800,'History traversal survives home tracking normalization before popstate');
 }finally{f.close();}
}
{
 const f=fixture();try{
  f.depart();f.offset=1900;f.y=2400;
  const b=f.w.document.createElement('button');b.setAttribute('aria-label','Back');f.w.document.body.appendChild(b);
  b.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true}));
  f.w.history.replaceState({},'', '/?sk=h_chr');f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));f.step(3000);
  assert.equal(f.y,2400,'A different feed filter must not reuse the source anchor');
 }finally{f.close();}
}
{
 const f=fixture();try{
  f.depart();f.offset=1900;f.y=2400;
  f.w.history.replaceState({},'', '/home.php?ref=return');f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));f.step(1);
  assert.equal(f.y,1800,'Root/home.php aliases retain the same feed identity');
 }finally{f.close();}
}
// Restoring a now-impossible negative offset after post collapse hides the
// entire source and puts later cards on screen, despite matching the right ID.
{
 const f=fixture();try{
  f.height=1900;f.y=2400;f.depart();
  f.height=350;f.offset=2100;f.y=2400;f.back();
  assert.equal(f.y,2100,'Collapsed source is aligned to its own start, never scrolled completely above the viewport');
 }finally{f.close();}
}
console.log('Feed return PASS: post identity/offset, late layout, nested scroller, re-render, missing post, explicit Home, same-URL dialog, user cancellation, OFF and bounded work; no history.state or event suppression.');
