const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/feed-return.js','utf8');
function fixture(inner=false){
 const w=new JSDOM('<!doctype html><head></head><body><div id="scroller"><article data-tracking-duration-id="post42"><a id="open" href="/posts/42">Post</a><button id="comments">Comments</button></article></div></body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true}).window;
 let y=1000,offset=1100,clock=0,token=0;const timers=new Map();
 w.setTimeout=(fn,ms)=>{const id=++token;timers.set(id,{fn,at:clock+(ms||0)});return id;};w.clearTimeout=id=>timers.delete(id);w.requestAnimationFrame=fn=>w.setTimeout(fn,1);w.cancelAnimationFrame=w.clearTimeout;
 const step=ms=>{const end=clock+ms;for(let n=0;n<1000;n++){let next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;clock=next[1].at;timers.delete(next[0]);next[1].fn();}clock=end;};
 Object.defineProperty(w,'scrollY',{get:()=>y});w.scrollTo=(x,v)=>{y=v;};
 const scroller=w.document.getElementById('scroller');if(inner){scroller.style.overflowY='auto';Object.defineProperty(scroller,'clientHeight',{value:400});Object.defineProperty(scroller,'scrollHeight',{value:6000});scroller.scrollTop=1000;}
 let post=w.document.querySelector('article');const geometry=node=>node.getBoundingClientRect=()=>({top:offset-(inner?scroller.scrollTop:y),bottom:offset-(inner?scroller.scrollTop:y)+350,height:350,width:400});geometry(post);
 const rawReplace=w.history.replaceState.bind(w.history);const cfg={rememberPosition:true};w.eval(source.replace('__CONFIG__',JSON.stringify(cfg)));
 function click(){w.document.getElementById('comments').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}
 function depart(){click();w.history.pushState({site:'keep-me'},'', '/posts/42');}
 function back(){rawReplace({},'', '/');w.dispatchEvent(new w.PopStateEvent('popstate'));step(1);}
 return {w,step,scroller,click,depart,back,get y(){return y;},set y(v){y=v;},set offset(v){offset=v;},replace(){const old=post;post=old.cloneNode(true);old.replaceWith(post);geometry(post);return post;},close(){w.close();}};
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
console.log('Feed return PASS: post identity/offset, late layout, nested scroller, re-render, missing post, explicit Home, same-URL dialog, user cancellation, OFF and bounded work; no history.state or event suppression.');
