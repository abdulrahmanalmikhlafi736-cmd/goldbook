// DOM regression fixtures only: not a substitute for live authenticated Facebook.
const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app/src/main/assets/facebook.js','utf8');
const nativeMain=fs.readFileSync('app/src/main/java/com/almekhlafi/FPRO/MainActivity.kt','utf8');
const settings=fs.readFileSync('app/src/main/java/com/almekhlafi/FPRO/SettingsPanel.kt','utf8');
assert(!nativeMain.includes('Intent.createChooser'),'No Android share chooser fallback');
assert(!nativeMain.includes('downloads.enqueue'),'No internal download route');
assert(!nativeMain.includes('DownloadDialog()'),'No internal downloads panel');
assert(!settings.includes('إدارة التنزيلات الداخلية'),'No internal downloads button');
assert(nativeMain.includes('intent.component = receiver'),'Use an explicitly resolved receiver');
const windows=[];
function fixture(html,config={},captureDownload=false) {
 const dom=new JSDOM('<!doctype html><html><head></head><body>'+html+'</body></html>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});
 windows.push(dom.window);
 const run=c=>dom.window.eval((captureDownload?source.replaceAll("location.href=", "window.__download="):source).replace('__CONFIG__',JSON.stringify(c)));
 run(config);return {window:dom.window,doc:dom.window.document,run};
}
(async()=>{
 try {
  for(const text of ['مُـمَوَّل','Sponsored','<span>Spon</span><span>sored</span>']) {
   const f=fixture(`<div role="main"><article id="post"><span>${text}</span><p>advert</p></article><article id="normal">Normal</article></div>`,{ads:true});
   assert.equal(f.doc.querySelector('#post').style.display,'none','Sponsored marker hides only its article');
   assert.equal(f.doc.querySelector('#normal').style.display,'');
   assert.equal(f.doc.querySelector('[role=main]').style.display,'');
   f.run({ads:false});assert.equal(f.doc.querySelector('#post').style.display,'','Disable restores post');
   assert.equal(f.doc.querySelectorAll('#fpro-style').length,1,'No duplicate injection');
  }
  const nested=fixture('<article id="post"><a data-ft="tracking"><span>Sponsored</span></a></article>',{ads:true});
  assert.equal(nested.doc.querySelector('#post').style.display,'none','Nested tracking attributes must not restrict hiding to the label');
  const direct=fixture(`<article><a href="https://unrelated.invalid/watch/?v=1">External link</a><a href="/watch/?v=42">Video permalink</a><div data-store='{"videoData":[{"hd_src":"https://example.invalid/available.mp4"}]}'><video></video></div></article>`,{downloads:true},true);
  Object.defineProperty(direct.doc.querySelector('video'),'currentSrc',{value:'blob:https://m.facebook.com/example'});
  direct.doc.querySelector('.fpro-download').click();
  assert.equal(new URL(direct.window.__download).searchParams.get('media'),'https://example.invalid/available.mp4','Use explicit available media metadata, not a blob URL, when the page supplies it');
  assert.equal(new URL(direct.window.__download).searchParams.get('link'),'https://m.facebook.com/watch/?v=42','Share the actual Facebook watch permalink, never an unrelated external link');
  const feed=fixture('<section id="stories" aria-label="Stories"><a href="/stories/123">Someone</a></section><article id="post"><b>أشخاص قد تعرفهم</b></article><article id="normal">A normal post about stories and sponsored work</article>',{stories:true,people:true});
  assert.equal(feed.doc.querySelector('#stories').style.display,'none');
  assert.equal(feed.doc.querySelector('#post').style.display,'none');
  assert.equal(feed.doc.querySelector('#normal').style.display,'');
  feed.run({});assert.equal(feed.doc.querySelector('#stories').style.display,'');
  const safeFeed=fixture('<section role="feed" id="all"><h2 role="heading">Stories</h2><article>Ordinary post</article></section>',{stories:true});
  assert.equal(safeFeed.doc.querySelector('#all').style.display,'','Never hide an entire feed when filtering a heading');
  const openButton=fixture('<header id="app"><button>فتح التطبيق</button></header><form><input></form>',{appBanner:true});
  assert.equal(openButton.doc.querySelector('#app').style.display,'none','Also hide JavaScript-driven open-app buttons');
  const reelHeader=fixture('<article id="reel"><header><button id="open"><span>فتح التطبيق</span><svg><title>Facebook</title></svg></button><button id="search">Search</button><video></video></header></article>',{appBanner:true});
  assert.equal(reelHeader.doc.querySelector('#open').style.display,'none','Hide Reels app CTA even within article');
  assert.equal(reelHeader.doc.querySelector('#reel').style.display,'','Never hide the reel');
  assert.equal(reelHeader.doc.querySelector('#search').style.display,'','Keep search/profile controls');
  const banner=fixture('<header id="install"><a href="intent://facebook/#Intent;package=com.facebook.katana;end">Open app</a></header><form id="login"><input><button>Log in</button></form><a id="postlink" href="/some.post">Facebook post</a>',{appBanner:true});
  assert.equal(banner.doc.querySelector('#install').style.display,'none');
  assert.equal(banner.doc.querySelector('#login').style.display,'');
  assert.equal(banner.doc.querySelector('#postlink').style.display,'');
  banner.run({appBanner:false});assert.equal(banner.doc.querySelector('#install').style.display,'');
  const tint=fixture('<button id="blue" style="background-color:rgb(8,102,255);color:white">Like</button><img id="photo" src="photo.jpg">',{color:'ذهبي'});
  assert(tint.doc.querySelector('#blue').hasAttribute('data-fpro-accent-bg'),'Real blue inline styles get accent override');
  assert(tint.doc.querySelector('#fpro-style').textContent.includes('#d4af37'));
  tint.run({color:'أحمر'});assert(tint.doc.querySelector('#blue').hasAttribute('data-fpro-accent-bg'));
  tint.run({color:'تلقائي'});assert(!tint.doc.querySelector('#blue').hasAttribute('data-fpro-accent-bg'));
  assert.equal(tint.doc.querySelector('#blue').style.backgroundColor,'rgb(8, 102, 255)','Original inline color preserved');
  assert(!tint.doc.querySelector('#photo').hasAttribute('data-fpro-accent-bg'));
  const f=fixture('<div role="dialog" hidden>Preloaded dialog</div><article><video src="https://example.invalid/test.mp4"></video></article>');
  const video=f.doc.querySelector('video');
  video.getBoundingClientRect=()=>({left:10,top:30,right:330,bottom:230,width:320,height:200});
  Object.defineProperty(video,'duration',{configurable:true,value:120});video.currentTime=30;
  f.run({downloads:true,rainbow:true});
  assert.equal(f.doc.querySelectorAll('.fpro-download').length,1);
  assert.equal(f.doc.querySelector('.fpro-video-tools').hidden,false);
  assert.equal(f.window.getComputedStyle(f.doc.querySelector('.fpro-track')).backgroundColor,'rgba(0, 0, 0, 0)','No dark panel under timeline');
  assert.equal(f.window.getComputedStyle(f.doc.querySelector('.fpro-fill')).bottom,'0px','Timeline sits at the video bottom');
  assert.equal(f.window.getComputedStyle(f.doc.querySelector('.fpro-download')).borderRadius,'50%','Circular download button');
  assert(f.doc.querySelector('.fpro-download svg'),'Centered vector download icon');

  assert.equal(f.window.getComputedStyle(f.doc.querySelector('.fpro-video-tools')).direction,'ltr','Seek input and progress fill share the same direction on Arabic pages');
  assert.equal(f.doc.querySelector('.fpro-fill').style.width,'25%');
  assert.equal(f.doc.querySelector('.fpro-seek').value,'250');
  const seek=f.doc.querySelector('.fpro-seek');seek.value='750';seek.dispatchEvent(new f.window.Event('input',{bubbles:true}));
  assert.equal(video.currentTime,90,'Rainbow slider seeks actual media');
  video.currentTime=60;video.dispatchEvent(new f.window.Event('timeupdate'));assert.equal(seek.value,'500');
  f.run({downloads:true,rainbow:true});assert.equal(f.doc.querySelectorAll('.fpro-download').length,1,'No duplicated video listeners/controls');
  f.window.history.replaceState({},'', '/reel/42');
  video.getBoundingClientRect=()=>({left:0,top:0,right:320,bottom:900,width:320,height:900});
  f.run({downloads:true,rainbow:true});
  assert.equal(f.doc.querySelector('.fpro-video-tools').style.height,f.window.innerHeight+'px','Reels timeline follows the visible player bottom');

  f.run({downloads:false,rainbow:false});assert.equal(f.doc.querySelectorAll('.fpro-video-tools').length,0);
  Object.defineProperty(video,'duration',{configurable:true,value:Infinity});f.run({rainbow:true});assert.equal(f.doc.querySelector('.fpro-seek').disabled,true,'Live stream is not falsely seekable');
  const gesture=fixture('<article><video id="player"></video><div id="cover"></div><button id="like" aria-label="Like">Like</button></article>',{enhance:false,doubleTapFullscreen:true,ads:true,downloads:false,rainbow:false});
  const player=gesture.doc.querySelector('video'),cover=gesture.doc.querySelector('#cover');
  player.getBoundingClientRect=()=>({left:0,top:0,right:320,bottom:500,width:320,height:500});
  let clock=0,entered=0,exited=0;
  Object.defineProperty(gesture.window.performance,'now',{value:()=>clock});
  Object.defineProperty(gesture.doc,'fullscreenElement',{value:null,writable:true});
  player.requestFullscreen=()=>{entered++;gesture.doc.fullscreenElement=player;return Promise.resolve();};
  gesture.doc.exitFullscreen=()=>{exited++;gesture.doc.fullscreenElement=null;return Promise.resolve();};
  function pointer(type,time,x=150,y=150,target=cover){
   clock=time;
   const event=new gesture.window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y});
   Object.defineProperties(event,{pointerId:{value:1},pointerType:{value:'touch'},isPrimary:{value:true}});
   target.dispatchEvent(event);
  }
  function tap(time,target=cover){pointer('pointerdown',time,150,150,target);pointer('pointerup',time+20,150,150,target);}
  assert.equal(gesture.doc.querySelector('#fpro-style'),null,'Gesture-only mode must not install website CSS');
  tap(10);tap(210);assert.equal(entered,1,'Two actual touch sequences on a Facebook cover enter fullscreen without video tools');
  cover.dispatchEvent(new gesture.window.MouseEvent('dblclick',{bubbles:true,cancelable:true,clientX:150,clientY:150}));
  assert.equal(exited,0,'Synthesized dblclick must not immediately undo touch fullscreen');
  tap(810);tap(1010);assert.equal(exited,1,'Second double tap exits fullscreen');
  pointer('pointerdown',1800);pointer('pointermove',1850,190,150);pointer('pointerup',1870,190,150);tap(2000);
  assert.equal(entered,1,'Feed scrolling is not a double tap');
  gesture.run({enhance:false,doubleTapFullscreen:false});tap(2700);tap(2900);assert.equal(entered,1,'Independent fullscreen switch disables gesture');
  gesture.run({enhance:false,doubleTapFullscreen:true});
  const late=gesture.doc.createElement('video');late.getBoundingClientRect=player.getBoundingClientRect;late.requestFullscreen=()=>{entered++;return Promise.resolve();};
  gesture.doc.body.appendChild(late);player.remove();tap(3700);tap(3900);assert.equal(entered,2,'Dynamically replaced players work without attaching overlays or new listeners');
  assert.equal(gesture.doc.querySelector('.fpro-video-tools'),null);
  assert(nativeMain.includes('com.junkfood.seal.QuickDownloadActivity'),'Seal uses its exported quick-download dialog, not its launcher');
  const denied=fixture('<video></video>',{enhance:false,doubleTapFullscreen:true},true);
  const deniedVideo=denied.doc.querySelector('video');deniedVideo.getBoundingClientRect=player.getBoundingClientRect;
  deniedVideo.requestFullscreen=()=>Promise.reject(new Error('NotAllowedError'));
  deniedVideo.dispatchEvent(new denied.window.MouseEvent('dblclick',{bubbles:true,cancelable:true,clientX:150,clientY:150}));
  await Promise.resolve();
  assert.equal(denied.window.__download,'fpro://fullscreen-error','Report rejected fullscreen, never fake fullscreen with CSS');
  const dynamic=fixture('<main id="feed"></main>',{ads:true});
  dynamic.doc.querySelector('#feed').innerHTML='<article id="late"><span>Sponsored</span></article>';
  await new Promise(resolve=>setTimeout(resolve,650));assert.equal(dynamic.doc.querySelector('#late').style.display,'none','Observe dynamically added cards');
  dynamic.doc.querySelector('#late span').textContent='Ordinary post';
  await new Promise(resolve=>setTimeout(resolve,650));assert.equal(dynamic.doc.querySelector('#late').style.display,'','Recycled feed cards are restored');
  console.log('DOM tests passed: ads, stories, install banner, accents, dynamic feed, video controls, progress, seeking, restoration, independent touch fullscreen and Seal routing.');
 } finally {windows.forEach(w=>w.close());}
})().catch(error=>{console.error(error);process.exitCode=1;});
