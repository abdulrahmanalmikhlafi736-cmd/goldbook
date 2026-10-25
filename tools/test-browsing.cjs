const {JSDOM}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const position=fs.readFileSync('app/src/main/assets/browsing-position.js','utf8');
assert(!position.includes('?.')&&!position.includes('??'),'Keep the session helper compatible with older WebView syntax');
const ready=fs.readFileSync('app/src/main/assets/page-ready.js','utf8');
function fixture(html){const d=new JSDOM('<!doctype html><body>'+html+'</body>',{url:'https://m.facebook.com/',runScripts:'outside-only',pretendToBeVisual:true});const w=d.window;let y=0;Object.defineProperty(w,'scrollY',{get:()=>y});w.scrollTo=(x,n)=>{y=n};w.eval(position);return {w,d};}
{
 const {w}=fixture('<article><p>PRIVATE_POST_TEXT</p><a href="/posts/42?fbclid=PRIVATE_TRACKING">post</a></article><input value="PRIVATE_FORM"><div id="scroll" style="overflow-y:auto"></div>');
 const a=w.document.querySelector('article');a.getBoundingClientRect=()=>({top:40,bottom:440,width:300,height:400});
 const el=w.document.querySelector('#scroll');Object.defineProperty(el,'clientHeight',{value:300});Object.defineProperty(el,'scrollHeight',{value:5000});el.scrollTop=720;
 w.scrollTo(0,1234);const snapshot=w.__fproPosition.capture(),data=JSON.parse(snapshot);
 assert.equal(data.y,1234);assert.equal(data.containers[0].y,720);assert.equal(data.anchor.key,'/posts/42');
 assert(!snapshot.includes('PRIVATE_POST_TEXT'));assert(!snapshot.includes('PRIVATE_FORM'));assert(!snapshot.includes('PRIVATE_TRACKING'));
 w.scrollTo(0,0);el.scrollTop=0;assert.equal(w.__fproPosition.restore(snapshot),true);assert.equal(el.scrollTop,720);
 // Real gestures win immediately; delayed layout restoration must stop.
 w.dispatchEvent(new w.Event('touchstart'));w.scrollTo(0,55);assert.equal(w.scrollY,55);
 assert.equal(w.__fproPosition.restore({...data,url:'https://evil.invalid/'}),false);
 w.document.body.innerHTML='<input type="password" value="PRIVATE_PASSWORD">';assert.equal(JSON.parse(w.__fproPosition.capture()).login,true);assert.equal(w.__fproPosition.restore(snapshot),false,'Never restore into a password form');
 w.close();
}
{
 const {w}=fixture('<p>visible content</p>');const p=w.document.querySelector('p');
 p.getBoundingClientRect=()=>({top:10,bottom:40,left:0,right:300,width:300,height:30});
 assert.equal(w.eval(ready),true);p.style.visibility='hidden';assert.equal(w.eval(ready),false);p.style.visibility='visible';w.document.body.style.opacity='0';assert.equal(w.eval(ready),false);w.close();
}
{
 const {w}=fixture('<img>');const img=w.document.querySelector('img');img.getBoundingClientRect=()=>({top:0,bottom:80,left:0,right:80,width:80,height:80});
 assert.equal(w.eval(ready),false,'An unloaded image is not a painted page');w.close();
}
const native=fs.readFileSync('app/src/main/java/com/almekhlafi/FPRO/MainActivity.kt','utf8');
const resume=native.slice(native.indexOf('override fun onResume()'),native.indexOf('override fun onStop()'));
assert(!/\.reload\(|\.loadUrl\(/.test(resume),'Warm resume must not reload the live document');
assert(!native.includes('delay(600)'),'Do not reveal a blank surface on a fixed splash deadline');
assert(native.includes('postVisualStateCallback'),'Require a compositor frame before first reveal');
console.log('Browsing regressions passed: private position/container/anchor capture, restore, gesture cancellation, URL isolation, password exclusion, meaningful first paint and no resume reload.');

assert(native.indexOf('web.restoreState(history)') < native.indexOf('controls.setContent {'),'Initial history restore must not belong to a Compose effect');
assert(!native.includes("new Event('resize')"),'Native size publication must not broadcast duplicate site resize events');
assert(native.includes("new Event('fproviewportchange')"));
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
for(const flag of ['orientation','screenSize','smallestScreenSize','density','uiMode'])assert(manifest.includes(flag),'Handle rotation-related '+flag+' without recreating Activity');

assert(manifest.includes('android:screenOrientation="portrait"'),'Ordinary browsing starts locked in portrait');
const showFull=native.slice(native.indexOf('override fun onShowCustomView'),native.indexOf('override fun onHideCustomView'));
assert(showFull.includes('startFullscreenRotation()'),'Fullscreen starts the portrait-first rotation gate');
assert(!showFull.includes('SCREEN_ORIENTATION_SENSOR'),'Do not unlock the sensor immediately on entry');
const closeFull=native.slice(native.indexOf('private fun closeFullscreen()'),native.indexOf('private fun systemBars('));
assert(closeFull.includes('SCREEN_ORIENTATION_PORTRAIT'),'Leaving fullscreen restores portrait browsing');
