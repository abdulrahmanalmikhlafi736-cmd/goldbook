(() => {
 // This bridge is deliberately top-frame only, independent of recoloring.
 if(window.top!==window)return JSON.stringify({});
 function playbackSnapshot(){
  const active=Array.from(document.querySelectorAll('video')).filter(v=>!v.paused&&!v.ended&&v.readyState>=2);
  const video=active.includes(window.__fproLastPlayingVideo)?window.__fproLastPlayingVideo:active[0];
  let box=null;
  if(video){
   const r=video.getBoundingClientRect(),vv=window.visualViewport;
   box={x:r.left-(vv?vv.offsetLeft:0),y:r.top-(vv?vv.offsetTop:0),w:r.width,h:r.height,
    viewportWidth:vv?vv.width:innerWidth,viewportHeight:vv?vv.height:innerHeight,
    mediaWidth:video.videoWidth||r.width,mediaHeight:video.videoHeight||r.height};
  }
  return {playing:!!video,video:box};
 }
 if(!window.__fproPlaybackHooks){
  window.__fproPlaybackHooks=true;
  let last='',timer=null,playing=false;
  const report=e=>{try{
   if(e&&e.target&&e.target.tagName==='VIDEO'&&!e.target.paused)window.__fproLastPlayingVideo=e.target;
   const state=playbackSnapshot();playing=state.playing;const text=JSON.stringify(state);
   if(window.FproPlayback&&typeof window.FproPlayback.postMessage==='function'&&text!==last){window.FproPlayback.postMessage(text);last=text;}
  }catch(_){}};
  const geometry=()=>{if(!playing)return;if(timer===null)timer=setTimeout(()=>{timer=null;report();},150);};
  ['playing','pause','ended','emptied','loadedmetadata'].forEach(type=>document.addEventListener(type,report,true));
  addEventListener('resize',geometry);addEventListener('scroll',geometry,{passive:true,capture:true});
  addEventListener('fullscreenchange',geometry);addEventListener('fproviewportchange',geometry);
  if(window.visualViewport){visualViewport.addEventListener('resize',geometry);visualViewport.addEventListener('scroll',geometry);}
  window.__fproReportPlayback=report;
 }
 function info() {
  window.__fproReportPlayback();
  const path=location.pathname.replace(/\/+$/,'') || '/';
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
  const player=Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"]')).some(el=>visible(el)&&Array.from(el.querySelectorAll('video')).some(visible));
  const facebook=location.hostname==='facebook.com'||location.hostname.endsWith('.facebook.com');
  const entry=/^\/(?:login(?:\.php)?|login\/.*)$/.test(path);
  const home=facebook&&(path==='/'||path==='/home'||path==='/home.php'||path==='/index.php'||entry)&&!player&&!document.fullscreenElement&&!document.webkitFullscreenElement;
  let x=innerWidth*.71,y=28,anchored=false,logoPresent=false;
  if(home) {
   const logos=document.querySelectorAll('svg[aria-label="Facebook"],img[alt="Facebook"],a[aria-label="Facebook"],[role="banner"] svg title,header svg title');
   for(const item of logos) {
    if(item.tagName.toLowerCase()==='title'&&!/facebook/i.test(item.textContent))continue;
    const el=item.tagName.toLowerCase()==='title'?item.closest('svg'):item;
    if(!el)continue;const r=el.getBoundingClientRect();
    if(el.closest('header,[role="banner"]')||(r.top<120&&r.left>=innerWidth*.4))logoPresent=true;
    if(!visible(el))continue;
    if(r.top<0||r.top>120||r.left<innerWidth*.4)continue;
    // On the RTL home header the circled F is at the left edge of the wordmark.
    x=r.left+Math.min(r.height/2,r.width/2);y=r.top+r.height/2;anchored=true;break;
   }
  }
  // Header control is not a floating action button. Keep route/home semantics
  // separate, so scrolling does not disable the home story filter.
  const scrolled=(window.scrollY||document.documentElement.scrollTop||0)>=4||Array.from(document.querySelectorAll('[role="main"],[role="feed"]')).some(el=>el.scrollTop>=4);
  const gearVisible=home && !scrolled && (entry||!logoPresent||anchored);
  return {home,gearVisible,x,y,width:innerWidth,anchored,...playbackSnapshot()};
 }
 window.__fproPageInfo=info;
 return JSON.stringify(info());
})();
