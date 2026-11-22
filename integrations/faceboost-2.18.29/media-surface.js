/* FPRO 2.18.29: event-driven media surface. GPL-3.0-or-later.
 * No site-player style changes, synthetic site gestures, polling or perpetual rAF.
 * Coordinates are CSS px within the WebView, never physical Android pixels.
 */
(function (host) {
  'use strict';
  const TOP_FRACTION = 0.40;
  const FILL_BOTTOM = 4;
  function viewport(win) {
    const vv = win.visualViewport;
    const native = win.__fproViewport;
    const width = vv ? vv.width : win.innerWidth;
    const top = vv ? vv.offsetTop : 0;
    const left = vv ? vv.offsetLeft : 0;
    const nativeHeight = native && native.width > 0 && native.height > 0
      ? native.height * win.innerWidth / native.width : win.innerHeight;
    return { left, top, right: left + width,
      bottom: Math.min(top + (vv ? vv.height : win.innerHeight), nativeHeight) };
  }
  function visibleRect(r, vp) {
    const left = Math.max(r.left, vp.left), top = Math.max(r.top, vp.top);
    const right = Math.min(r.right, vp.right), bottom = Math.min(r.bottom, vp.bottom);
    return { left, top, right, bottom, width: Math.max(0, right-left), height: Math.max(0, bottom-top) };
  }
  function topZone(r, vp, x, y) {
    const v = visibleRect(r, vp);
    return v.width >= 80 && v.height >= 80 && x >= v.left && x <= v.right &&
      y >= v.top && y <= v.top + v.height * TOP_FRACTION;
  }
  function dock(vp) {
    // A dedicated viewport footer, not the site's seek line or a learned pixel offset.
    const width = Math.max(0, vp.right - vp.left - 32);
    return { left: vp.left + 16, top: Math.max(vp.top, vp.bottom - 34), width, height: 32 };
  }
  const api = { viewport, visibleRect, topZone, dock, TOP_FRACTION, FILL_BOTTOM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!host || !host.document || host.FproMediaSurface) return;
  let activeConfig = () => ({});
  api.ownsProgress = () => { const c = activeConfig(); return c.enhance !== false && !!c.rainbow; };
  api.ownsTop = (video, x, y) => {
    const c = activeConfig();
    return c.doubleTapFullscreen !== false && !host.document.fullscreenElement &&
      !host.__fproNativeFullscreen && topZone(video.getBoundingClientRect(), viewport(host), x, y);
  };
  api.create = function (options) {
    activeConfig = options.getConfig;
    const doc = host.document, entries = options.entries;
    let frame = 0, dirty = true, primary = null, suspended = false;
    const stats = { layouts: 0, discoveries: 0, repairs: 0, mutations: 0 };
    const root = doc.createElement('div');
    root.id = 'fpro-media-surface'; root.className = 'fpro-video-tools';
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:visible;z-index:10000;direction:ltr';
    const css = doc.createElement('style'); css.id = 'fpro-media-surface-style';
    css.textContent = '#fpro-media-surface .fpro-track{position:fixed!important;right:auto!important;bottom:auto!important;height:32px!important;pointer-events:auto;touch-action:pan-y}' +
      '#fpro-media-surface .fpro-download{touch-action:none}' +
      '#fpro-media-surface .fpro-ball{right:-9px!important;top:-7.5px!important;width:18px!important;height:18px!important;font-size:14px!important;line-height:18px!important}' +
      '#fpro-media-surface .fpro-fill{bottom:'+FILL_BOTTOM+'px!important;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet)!important}' +
      '#fpro-media-surface .fpro-video-tools[hidden]{display:none!important}';
    function enabled() { const c = activeConfig(); return c.enhance !== false && (c.downloads || c.rainbow); }
    function mount() {
      if (!root.isConnected) { doc.documentElement.appendChild(root); stats.repairs++; }
      if (!css.isConnected) doc.documentElement.appendChild(css);
    }
    function schedule(discover = false) {
      dirty = dirty || discover;
      if (doc.hidden || suspended || !enabled()) return;
      if (!frame) frame = host.requestAnimationFrame(() => { frame = 0; layout(); });
    }
    function rendered(el) {
      for (let n=el; n && n.nodeType===1; n=n.parentElement) {
        if (n.hidden || n.getAttribute('aria-hidden') === 'true') return false;
        const s=host.getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse' || s.opacity === '0') return false;
      }
      return true;
    }
    function blocked(video, r, vp) {
      const x=(r.left+r.right)/2, y=(r.top+r.bottom)/2;
      return Array.from(doc.querySelectorAll('[role="dialog"],[aria-modal="true"]')).some(el => {
        if (el.contains(video) || !rendered(el)) return false;
        const d=visibleRect(el.getBoundingClientRect(),vp);
        return d.width>0 && d.height>0 && x>=d.left && x<=d.right && y>=d.top && y<=d.bottom;
      });
    }
    const ro = typeof host.ResizeObserver === 'function' ? new host.ResizeObserver(() => schedule()) : null;
    const io = typeof host.IntersectionObserver === 'function' ? new host.IntersectionObserver(() => schedule()) : null;
    function attach(video) {
      if (entries.has(video)) return entries.get(video);
      if(options.onAttach)options.onAttach(video);
      const overlay=doc.createElement('div'); overlay.className='fpro-video-tools'; overlay.hidden=true;
      const button=doc.createElement('button'); button.className='fpro-download'; button.type='button';
      button.setAttribute('aria-label','تنزيل الفيديو الحالي');
      button.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const track=doc.createElement('div'); track.className='fpro-track fpro-video-tools'; track.hidden=true;
      const fill=doc.createElement('div'); fill.className='fpro-fill';
      const ball=doc.createElement('span'); ball.className='fpro-ball'; ball.textContent='⚽️'; ball.setAttribute('aria-hidden','true'); fill.appendChild(ball);
      const seek=doc.createElement('input'); seek.className='fpro-seek'; seek.type='range'; seek.min='0'; seek.max='1000'; seek.step='1'; seek.value='0'; seek.setAttribute('aria-label','تقدم الفيديو الحالي');
      seek.style.setProperty('touch-action','none','important');
      track.style.setProperty('touch-action','none','important');
      track.append(fill,seek); overlay.appendChild(button);
      let pos={x:12,y:12}, drag=null, suppressClick=false, draggingSeek=false;
      try { const saved=JSON.parse(host.localStorage.getItem('fpro-button')); if(saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))pos=saved; } catch (_) {}
      function placeButton() {
        button.style.left=Math.max(0,Math.min(Math.max(0,parseFloat(overlay.style.width)-44),pos.x))+'px';
        button.style.top=Math.max(0,Math.min(Math.max(0,parseFloat(overlay.style.height)-44),pos.y))+'px';
      }
      button.addEventListener('pointerdown',e=>{
        if (e.isPrimary===false || (e.pointerType==='mouse' && e.button!==0))return;
        drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:parseFloat(button.style.left)||0,py:parseFloat(button.style.top)||0,at:host.performance.now()};
        suppressClick=false; e.stopPropagation();
      });
      button.addEventListener('pointermove',e=>{
        if(!drag || drag.id!==e.pointerId || host.performance.now()-drag.at<400)return;
        if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4 && !suppressClick)return;
        suppressClick=true;pos={x:drag.px+e.clientX-drag.x,y:drag.py+e.clientY-drag.y};placeButton();
        try{button.setPointerCapture(e.pointerId);}catch(_){} e.stopPropagation();
      });
      function endDrag(e){if(!drag || drag.id!==e.pointerId)return;drag=null;if(suppressClick)try{host.localStorage.setItem('fpro-button',JSON.stringify(pos));}catch(_){} }
      button.addEventListener('pointerup',endDrag);button.addEventListener('pointercancel',e=>{endDrag(e);suppressClick=true;});
      button.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();if(suppressClick){suppressClick=false;return;}
        if(!video.isConnected || !rendered(video))return;
        // Resolve live identity AT the click; never cache a previous reel's source.
        options.download(video);
      });
      function progress() {
        if (doc.hidden || track.hidden) return;
        const valid=Number.isFinite(video.duration) && video.duration>0;
        const fraction=valid?Math.max(0,Math.min(1,video.currentTime/video.duration)):0;
        fill.style.transition=video.paused || video.seeking ? 'none' : 'width 240ms linear';
        fill.style.width=(fraction*100)+'%';
        if(!draggingSeek)seek.value=String(Math.round(fraction*1000));
        seek.disabled=!valid;
        ball.style.animationPlayState=valid && !video.paused && !video.ended?'running':'paused';
        seek.setAttribute('aria-valuetext',valid?Math.floor(video.currentTime)+' / '+Math.floor(video.duration)+' ثانية':'مدة غير متاحة');
      }
      seek.addEventListener('pointerdown',e=>{draggingSeek=true;e.stopPropagation();});
      const endSeek=()=>{draggingSeek=false;progress();};
      // Called directly by the document-start control router, NOT by synthetic events.
      let gestureSource=null;
      const seekSource=()=>[video.currentSrc||'',video.getAttribute('src')||'',...Array.from(video.querySelectorAll('source')).map(s=>s.getAttribute('src')||'')].join('|');
      seek.__fproSeekGesture=(phase,x)=>{
        if(phase==='end'||phase==='cancel'){endSeek();return;}
        if(!seek.isConnected||seek.disabled||!video.isConnected)return;
        if(phase==='start'){draggingSeek=true;gestureSource=seekSource();}
        if(gestureSource!==seekSource()){endSeek();return;}
        if(!draggingSeek)return;
        const r=seek.getBoundingClientRect();
        if(r.width>0&&Number.isFinite(video.duration)&&video.duration>0){
          const fraction=Math.max(0,Math.min(1,(x-r.left)/r.width));
          seek.value=String(Math.round(fraction*1000));
          try{video.currentTime=fraction*video.duration;}catch(_){}
          progress();
        }
      };
      seek.addEventListener('pointerup',endSeek);seek.addEventListener('pointercancel',endSeek);seek.addEventListener('change',endSeek);
      seek.addEventListener('input',e=>{e.stopPropagation();if(Number.isFinite(video.duration)&&video.duration>0){try{video.currentTime=Number(seek.value)/1000*video.duration;}catch(_){}progress();}});
      seek.addEventListener('click',e=>e.stopPropagation());
      const clock=['timeupdate','durationchange','seeking','seeked','ended','volumechange'];
      const geometry=['play','pause','loadedmetadata','emptied','resize'];
      const geometryChanged=()=>{progress();schedule();};
      clock.forEach(n=>video.addEventListener(n,progress));geometry.forEach(n=>video.addEventListener(n,geometryChanged));
      const entry={
        overlay,track,button,seek,
        paint(vp,rect,show,isPrimary) {
          // Repair detached hosts even if their hidden flag was false.
          if(overlay.parentElement!==root)root.appendChild(overlay);
          if(track.parentElement!==root)root.appendChild(track);
          const c=activeConfig(); overlay.hidden=!show || !c.downloads;
          track.hidden=!show || !isPrimary || !c.rainbow;
          button.hidden=!c.downloads;
          if(!show)return;
          overlay.style.left=rect.left+'px';overlay.style.top=rect.top+'px';overlay.style.width=rect.width+'px';overlay.style.height=rect.height+'px';placeButton();
          if(!track.hidden){const d=dock(vp);track.style.setProperty('position','fixed','important');track.style.left=d.left+'px';track.style.top=d.top+'px';track.style.width=d.width+'px';track.style.setProperty('height','32px','important');progress();}
        },
        dispose() {
          if(ro)ro.unobserve(video);if(io)io.unobserve(video);
          clock.forEach(n=>video.removeEventListener(n,progress));geometry.forEach(n=>video.removeEventListener(n,geometryChanged));
          overlay.remove();track.remove();entries.delete(video);if(primary===video)primary=null;
        }
      };
      entries.set(video,entry); if(ro)ro.observe(video);if(io)io.observe(video);
      return entry;
    }
    function layout() {
      if(doc.hidden || suspended)return;
      if(!enabled()){entries.forEach(e=>e.dispose());root.remove();return;}
      mount(); stats.layouts++;
      if(dirty){dirty=false;stats.discoveries++;doc.querySelectorAll('video').forEach(attach);}
      const vp=viewport(host), candidates=[];
      const edit=doc.activeElement && doc.activeElement.matches('input:not(.fpro-seek),textarea,[contenteditable="true"]');
      const nativeFullscreen=!!host.__fproNativeFullscreen || (doc.fullscreenElement && doc.fullscreenElement.tagName==='VIDEO');
      entries.forEach((entry,video)=>{
        if(!video.isConnected){entry.dispose();return;}
        const r=visibleRect(video.getBoundingClientRect(),vp);
        const show=r.width>=80 && r.height>=80 && rendered(video) && !blocked(video,r,vp) && !edit && !nativeFullscreen;
        candidates.push({video,entry,r,show,score:show?r.width*r.height*(video.paused || video.ended?1:1.15):0});
      });
      const visible=candidates.filter(c=>c.show).sort((a,b)=>b.score-a.score);
      // Preserve current owner on an exact tie; no dependence on hit-testing through gesture covers.
      const winner=visible.find(c=>c.video===primary && c.score===visible[0].score) || visible[0];
      primary=winner?winner.video:null;
      const chosen=[];
      for(const c of visible){
        const overlap=chosen.some(b=>Math.max(0,Math.min(c.r.right,b.r.right)-Math.max(c.r.left,b.r.left))*Math.max(0,Math.min(c.r.bottom,b.r.bottom)-Math.max(c.r.top,b.r.top))>Math.min(c.r.width*c.r.height,b.r.width*b.r.height)*0.55);
        if(!overlap)chosen.push(c);
      }
      candidates.forEach(c=>c.entry.paint(vp,c.r,c.show && chosen.includes(c),c.video===primary));
    }
    function relevantNode(n) {return n.nodeType===1 && (n.matches('video') || !!n.querySelector('video'));}
    const observer=new host.MutationObserver(records=>{
      if(!enabled())return;
      let changed=false;
      for(const r of records){
        if(r.type==='attributes'){
          const el=r.target;
          if(root.contains(el))continue;
          if(el.matches('video,[role="dialog"],[aria-modal="true"]') || Array.from(entries.keys()).some(v=>el.contains(v)) || el.contains(root)){changed=true;}
        }else{
          for(const n of [...r.addedNodes,...r.removedNodes]){
            if(relevantNode(n)){dirty=true;changed=true;}
            if(n===root || n===css || n.nodeType===1 && (n.contains(root) || n.matches('.fpro-video-tools') || n.querySelector('.fpro-video-tools'))){changed=true;}
          }
        }
      }
      if(changed){stats.mutations++;schedule(dirty);}
    });
    observer.observe(doc,{subtree:true,childList:true,attributes:true,attributeFilter:['src','poster','class','style','hidden','aria-hidden','aria-modal','role']});
    ['scroll','resize','popstate','hashchange','fproviewportchange','fullscreenchange','webkitfullscreenchange'].forEach(n=>host.addEventListener(n,()=>schedule(n==='popstate'||n==='hashchange'),true));
    if(host.visualViewport){host.visualViewport.addEventListener('resize',()=>schedule());host.visualViewport.addEventListener('scroll',()=>schedule());}
    doc.addEventListener('focusin',()=>schedule());doc.addEventListener('focusout',()=>schedule());
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden){if(frame)host.cancelAnimationFrame(frame);frame=0;}else schedule(true);});
    host.addEventListener('pagehide',()=>{suspended=true;if(frame)host.cancelAnimationFrame(frame);frame=0;});
    host.addEventListener('pageshow',()=>{suspended=false;schedule(true);});
    return { attach, layout, schedule, report:()=>({...stats,entries:entries.size,pending:!!frame,perpetualFrames:0,primary:!!primary}) };
  };
  host.FproMediaSurface=api;
})(typeof window==='undefined'?null:window);
