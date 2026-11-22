const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const policy=require('./media-surface.js');
const {JSDOM}=require(process.env.JSDOM_PATH || 'jsdom');
const vp={left:0,top:0,right:400,bottom:800};
const rect={left:0,top:50,right:400,bottom:750,width:400,height:700};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const dom=new JSDOM('<!doctype html><html><head></head><body><video id="v"></video></body></html>',{url:'https://m.facebook.com/reel/123/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let next=1;const frames=new Map();
 Object.defineProperty(w,'innerWidth',{value:400,configurable:true});Object.defineProperty(w,'innerHeight',{value:800,configurable:true});
 Object.defineProperty(w,'visualViewport',{value:{width:400,height:800,offsetTop:0,offsetLeft:0,addEventListener(){}},configurable:true});
 w.requestAnimationFrame=fn=>{const id=next++;frames.set(id,fn);return id;};w.cancelAnimationFrame=id=>frames.delete(id);
 w.eval(fs.readFileSync(path.join(__dirname,'media-surface.js'),'utf8'));
 const cfg={enhance:true,downloads:true,rainbow:true,doubleTapFullscreen:true};const entries=new Map();const clicks=[];
 const v=w.document.getElementById('v');v.getBoundingClientRect=()=>({...rect});
 Object.defineProperty(v,'duration',{value:100,configurable:true});Object.defineProperty(v,'paused',{value:false,configurable:true});
 const surface=w.FproMediaSurface.create({entries,getConfig:()=>cfg,download:video=>clicks.push(video.currentSrc||video.getAttribute('src')),onAttach(){}});
 async function settle(){for(let i=0;i<12;i++){await tick();if(!frames.size){await tick();if(!frames.size)return;}const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn());}throw Error('Unbounded frame loop');}
 return {dom,w,v,cfg,entries,surface,clicks,frames,settle,close:()=>dom.window.close()};
}
test('footer stays entirely above viewport/system boundary across viewport sizes',()=>{
 for(const bottom of [320,600,800,1200]){const d=policy.dock({...vp,bottom});assert.ok(d.top+d.height<=bottom-2);assert.equal(d.left,16);assert.equal(d.width,368);}
});
test('native and visual viewport bounds use the smaller CSS area',()=>{
 assert.equal(policy.viewport({innerWidth:400,innerHeight:900,__fproViewport:{width:800,height:1500},visualViewport:{width:400,height:800,offsetTop:0,offsetLeft:0}}).bottom,750);
});
test('fullscreen region is upper 40 percent, lower region and offscreen points excluded',()=>{
 assert.equal(policy.topZone(rect,vp,100,51),true);assert.equal(policy.topZone(rect,vp,100,330),true);
 assert.equal(policy.topZone(rect,vp,100,331),false);assert.equal(policy.topZone(rect,vp,100,700),false);assert.equal(policy.topZone(rect,vp,401,80),false);
});
test('one visible rail, no persistent animation loop at rest',async()=>{const f=fixture();try{f.surface.layout();await f.settle();assert.equal(f.entries.size,1);assert.equal(f.entries.get(f.v).track.hidden,false);assert.equal(f.frames.size,0);const layouts=f.surface.report().layouts;await f.settle();assert.equal(f.surface.report().layouts,layouts);}finally{f.close();}});
test('remount detached root and detached button host even when hidden=false',async()=>{const f=fixture();try{
 f.surface.layout();await f.settle();const e=f.entries.get(f.v);assert.equal(e.overlay.hidden,false);
 e.overlay.remove();await f.settle();assert.ok(e.overlay.isConnected);assert.equal(e.overlay.hidden,false);
 f.w.document.getElementById('fpro-media-surface').remove();await f.settle();assert.ok(e.overlay.isConnected);assert.ok(e.track.isConnected);
}finally{f.close();}});
test('moving a video retains identity; removal disposes; replacement/recycling attaches immediately',async()=>{const f=fixture();try{
 f.surface.layout();await f.settle();const original=f.entries.get(f.v);const wrapper=f.w.document.createElement('div');f.w.document.body.appendChild(wrapper);wrapper.appendChild(f.v);await f.settle();assert.equal(f.entries.get(f.v),original);
 f.v.remove();await f.settle();assert.equal(f.entries.size,0);assert.equal(original.overlay.isConnected,false);
 f.w.document.body.appendChild(f.v);await f.settle();assert.equal(f.entries.size,1);assert.notEqual(f.entries.get(f.v),original);
}finally{f.close();}});
test('transparent/offscreen/aria-hidden dialogs do not suppress tools; covering modal does',async()=>{const f=fixture();try{
 f.surface.layout();const d=f.w.document.createElement('div');d.setAttribute('role','dialog');d.getBoundingClientRect=()=>({...rect});d.setAttribute('aria-hidden','true');f.w.document.body.appendChild(d);await f.settle();assert.equal(f.entries.get(f.v).overlay.hidden,false);
 d.removeAttribute('aria-hidden');await f.settle();assert.equal(f.entries.get(f.v).overlay.hidden,true);
 d.setAttribute('aria-hidden','true');await f.settle();assert.equal(f.entries.get(f.v).overlay.hidden,false);
}finally{f.close();}});
test('download resolves current recycled source on click, not initial source',async()=>{const f=fixture();try{
 f.surface.layout();await f.settle();f.v.setAttribute('src','https://video.fbcdn.net/current.mp4');f.entries.get(f.v).button.click();assert.deepEqual(f.clicks,['https://video.fbcdn.net/current.mp4']);
}finally{f.close();}});
test('master off disposes, on rebuilds once; progress off releases legacy ownership',async()=>{const f=fixture();try{
 f.surface.layout();f.cfg.enhance=false;f.surface.layout();assert.equal(f.entries.size,0);assert.equal(f.w.FproMediaSurface.ownsProgress(),false);
 f.cfg.enhance=true;f.surface.schedule(true);await f.settle();assert.equal(f.entries.size,1);
 f.cfg.rainbow=false;f.surface.layout();assert.equal(f.entries.get(f.v).track.hidden,true);assert.equal(f.entries.get(f.v).overlay.hidden,false);assert.equal(f.w.FproMediaSurface.ownsProgress(),false);
}finally{f.close();}});
test('one progress owner for overlapping players',async()=>{const f=fixture();try{
 const other=f.w.document.createElement('video');other.getBoundingClientRect=()=>({...rect});f.w.document.body.appendChild(other);f.surface.layout();await f.settle();assert.equal([...f.entries.values()].filter(e=>!e.track.hidden).length,1);assert.equal([...f.entries.values()].filter(e=>!e.overlay.hidden).length,1);
}finally{f.close();}});
test('duration/live changes and seek affect only the bound video',async()=>{const f=fixture();try{
 f.surface.layout();const e=f.entries.get(f.v);e.seek.value='500';e.seek.dispatchEvent(new f.w.Event('input'));assert.equal(f.v.currentTime,50);
 Object.defineProperty(f.v,'duration',{value:Infinity,configurable:true});f.v.dispatchEvent(new f.w.Event('durationchange'));assert.equal(e.seek.disabled,true);
}finally{f.close();}});
test('top ownership can be disabled and never toggles existing fullscreen',async()=>{const f=fixture();try{
 assert.equal(f.w.FproMediaSurface.ownsTop(f.v,100,100),true);f.cfg.doubleTapFullscreen=false;assert.equal(f.w.FproMediaSurface.ownsTop(f.v,100,100),false);f.cfg.doubleTapFullscreen=true;f.w.__fproNativeFullscreen=true;assert.equal(f.w.FproMediaSurface.ownsTop(f.v,100,100),false);
}finally{f.close();}});

test('requested lower position: line drops 12 CSS px and ball remains above boundary',()=>{for(const bottom of [320,600,800,1200]){const d=policy.dock({...vp,bottom});const center=d.top+d.height-policy.FILL_BOTTOM-1.5;const previousCenter=bottom-38+32-12-1.5;assert.equal(center-previousCenter,12);assert.ok(center+7<=bottom-0.5);}});
test('painted fill receives the lower offset rather than inherited old CSS',async()=>{const f=fixture();try{f.surface.layout();await f.settle();assert.equal(f.w.getComputedStyle(f.entries.get(f.v).track.querySelector('.fpro-fill')).bottom,'4px');}finally{f.close();}});
function routeControls(f){f.w.history.replaceState({},'','/');f.w.eval(fs.readFileSync(path.join(__dirname,'home-swipe-guard.js'),'utf8'));f.surface.layout();const seek=f.entries.get(f.v).seek;seek.getBoundingClientRect=()=>({left:16,right:384,top:766,bottom:798,width:368,height:32});let leaked=0;for(const t of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchend','touchcancel','click'])f.w.addEventListener(t,()=>leaked++,true);function pointer(t,x,target=seek){const e=new f.w.Event(t,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:780});target.dispatchEvent(e);return e;}function touch(t,x){const e=new f.w.Event(t,{bubbles:true,cancelable:true});const p={identifier:2,clientX:x,clientY:780};Object.assign(e,{touches:/end|cancel/.test(t)?[]:[p],changedTouches:[p]});seek.dispatchEvent(e);return e;}return {seek,pointer,touch,leaked:()=>leaked};}
test('owned backward drag never leaks even its start to page capture and seeks the bound clip',()=>{const f=fixture();try{const c=routeControls(f);assert.equal(c.pointer('pointerdown',300).defaultPrevented,true);c.pointer('pointermove',100);c.pointer('pointerup',100);assert.ok(Math.abs(f.v.currentTime-(84/368*100))<.001);assert.equal(c.leaked(),0);}finally{f.close();}});
test('owned pointer stays isolated outside range bounds and clamps forward seek',()=>{const f=fixture();try{const c=routeControls(f);c.pointer('pointerdown',100);c.pointer('pointermove',900,f.w.document.body);c.pointer('pointerup',900,f.w.document.body);assert.equal(f.v.currentTime,100);assert.equal(c.leaked(),0);}finally{f.close();}});
test('touch-only range fallback is isolated and cancels cleanly',()=>{const f=fixture();try{const c=routeControls(f);c.touch('touchstart',300);c.touch('touchmove',200);c.touch('touchcancel',200);assert.equal(c.leaked(),0);assert.ok(Math.abs(f.v.currentTime-50)<.001);const time=f.v.currentTime;c.pointer('pointermove',100);assert.equal(f.v.currentTime,time);}finally{f.close();}});
test('realistic dual pointer plus touch stream is one control intent',()=>{const f=fixture();try{const c=routeControls(f);c.pointer('pointerdown',300);c.touch('touchstart',300);c.pointer('pointermove',200);c.touch('touchmove',200);c.pointer('pointerup',200);c.touch('touchend',200);assert.equal(c.leaked(),0);assert.equal(f.w.__fproHomeSwipeGuard.report().controlDrags,1);assert.equal(f.v.currentTime,50);}finally{f.close();}});
test('ordinary website ranges are not treated as app-owned controls',()=>{const f=fixture();try{const c=routeControls(f);const other=f.w.document.createElement('input');other.type='range';other.className='fpro-seek';f.w.document.body.appendChild(other);c.pointer('pointerdown',300,other);c.pointer('pointermove',200,other);assert.equal(c.leaked(),2);assert.equal(f.v.currentTime,0);}finally{f.close();}});
test('keyboard and accessibility input changes retain existing binding',()=>{const f=fixture();try{const c=routeControls(f);c.seek.value='750';c.seek.dispatchEvent(new f.w.Event('input',{bubbles:true}));c.seek.dispatchEvent(new f.w.Event('change',{bubbles:true}));assert.equal(f.v.currentTime,75);assert.equal(c.leaked(),0);}finally{f.close();}});

test('emoji thumb and track target also route to the owning seek input',()=>{const f=fixture();try{const c=routeControls(f);const ball=f.entries.get(f.v).track.querySelector('.fpro-ball');c.pointer('pointerdown',300,ball);c.pointer('pointermove',200,ball);c.pointer('pointerup',200,ball);assert.equal(f.v.currentTime,50);assert.equal(c.leaked(),0);}finally{f.close();}});
test('home option off does not disable owned seek isolation',()=>{const f=fixture();try{const c=routeControls(f);f.w.__fproHomeSwipeGuard.setEnabled(false);c.pointer('pointerdown',300);c.pointer('pointermove',200);c.pointer('pointerup',200);assert.equal(f.v.currentTime,50);assert.equal(c.leaked(),0);assert.equal(f.w.__fproHomeSwipeGuard.report().enabled,false);}finally{f.close();}});

test('slightly smaller ball keeps football emoji and rolling animation while changing only dimensions',async()=>{const f=fixture();try{f.surface.layout();await f.settle();const ball=f.entries.get(f.v).track.querySelector('.fpro-ball'),css=f.w.getComputedStyle(ball);assert.equal(ball.textContent,'⚽️');assert.equal(css.fontSize,'14px');assert.equal(css.width,'18px');assert.equal(css.height,'18px');assert.equal(css.lineHeight,'18px');assert.equal(css.top,'-7.5px');assert.equal(css.right,'-9px');}finally{f.close();}});

test('painted progress is 1.5px centered without changing fill geometry, ball or hit area',async()=>{const f=fixture();try{f.surface.layout();await f.settle();const track=f.entries.get(f.v).track,fill=track.querySelector('.fpro-fill'),ball=track.querySelector('.fpro-ball');const css=f.w.getComputedStyle(fill);assert.equal(css.backgroundSize,'100% 1.5px');assert.equal(css.backgroundRepeat,'no-repeat');assert.equal(css.bottom,'4px');assert.equal(f.w.getComputedStyle(track).height,'32px');assert.equal(f.w.getComputedStyle(ball).fontSize,'14px');assert.equal(f.w.getComputedStyle(ball).top,'-7.5px');assert.equal(f.w.getComputedStyle(ball).width,'18px');}finally{f.close();}});
