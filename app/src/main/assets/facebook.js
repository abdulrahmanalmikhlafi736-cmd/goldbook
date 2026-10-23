(() => {
 'use strict';
 const config = __CONFIG__;
 if (window.__fpro) { window.__fpro.update(config); return; }
 const style = document.createElement('style'); document.head.appendChild(style);
 const colors = {'طبيعي':'#1877f2','ذهبي':'#d4af37','أحمر':'#c62828','أخضر':'#17833e','بنفسجي':'#8643c5','برتقالي':'#ed701b','فيروزي':'#008c95','وردي':'#d34489','بني':'#805539','فضي':'#9ba6b0','أبيض':'#ffffff'};
 let cfg = config;
 const normalized = value => (value || '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F]/g, '').toLowerCase().trim();
 const words = {
 ads: ['sponsored','ممول','إعلان','اعلان','publicité','gesponsert','patrocinado','sponsorizzato','إعلان ممول'],
 suggested: ['suggested for you','مقترح لك','مقترحة لك','vorschläge für dich'],
 reels: ['reels','ريلز','الريلز'], stories: ['stories','القصص','قصص'],
 people: ['people you may know','أشخاص قد تعرفهم','اشخاص قد تعرفهم'],
 groups: ['suggested groups','مجموعات مقترحة','مجموعات مقترحة لك']
 };
 function update(c) {
  cfg = c;
  document.querySelectorAll('[data-fpro-hidden]').forEach(el => { el.style.display = el.dataset.fproPrevious || ''; delete el.dataset.fproHidden; });
  const accent = colors[c.color];
  style.textContent = `
   body { -webkit-user-select:text!important; }
   ${accent ? `:root {--primary-button-background:${accent};--accent:${accent};--primary-blue:${accent};}` : ''}
   ${c.dark ? `html,body,[role="main"] {background:${c.amoled?'#000':'#18191a'}!important;color:#eee!important;color-scheme:dark;}` : ''}
   ${c.sticky ? '[role="banner"]{position:sticky!important;top:0!important;z-index:1000!important;}' : ''}
   ${c.reverse ? 'body{direction:ltr!important;}' : ''}
   .fpro-download{position:absolute;z-index:9999;border:1px solid #fff9;border-radius:24px;background:#1117;color:white;padding:10px;touch-action:none;cursor:grab;font-size:20px}
   .fpro-track{position:absolute;bottom:0;left:0;right:0;height:5px;pointer-events:none;background:#7775;z-index:9998}
   .fpro-fill{height:100%;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet);position:relative}
   .fpro-ball{position:absolute;right:-8px;top:-12px;font-size:18px}
   video{user-select:none} 
  `;
  scan();
 }
 function scan() {
  const labels = document.querySelectorAll('[role="article"] a, [role="article"] span, [role="heading"], [aria-label]');
  // Bounded scan and debounced observer: never repeatedly traverse entire feed text.
  let count = 0;
  for (const label of labels) {
   if (++count > 1800) break;
   const text = normalized(label.getAttribute('aria-label') || (label.childElementCount === 0 ? label.textContent : ''));
   if (!text || text.length > 100) continue;
   for (const [key, list] of Object.entries(words)) {
    if (cfg[key] && list.some(word => text === normalized(word))) {
     const block = label.closest('[role="article"]') || label.closest('section');
     if (block && !block.dataset.fproHidden) { block.dataset.fproPrevious = block.style.display; block.dataset.fproHidden = '1'; block.style.display='none'; }
    }
   }
  }
  document.querySelectorAll('video').forEach(attachVideo);
  document.querySelectorAll('.fpro-download').forEach(el => el.hidden = !cfg.downloads);
  document.querySelectorAll('.fpro-track').forEach(el => el.hidden = !cfg.rainbow);
 }
 function attachVideo(video) {
  if (video.dataset.fpro) return;
  video.dataset.fpro = '1';
  const parent = video.parentElement; if (!parent) return;
  if (getComputedStyle(parent).position === 'static') parent.style.position='relative';
  const button = document.createElement('button'); button.className='fpro-download'; button.textContent='↓'; button.ariaLabel='تنزيل الفيديو';
  let pos; try {pos = JSON.parse(localStorage.getItem('fpro-button') || 'null');} catch (_) {}
  button.style.left=(pos?.x ?? 12)+'px'; button.style.top=(pos?.y ?? 12)+'px';
  let start, moving=false, held=false, timer;
  button.onpointerdown = e => {start={x:e.clientX,y:e.clientY,left:button.offsetLeft,top:button.offsetTop}; moving=false;held=false;timer=setTimeout(()=>{held=true;button.setPointerCapture(e.pointerId);},400);e.stopPropagation();};
  button.onpointermove = e => {if(!held || !start)return;moving=true;button.style.left=Math.max(0,Math.min(parent.clientWidth-44,start.left+e.clientX-start.x))+'px';button.style.top=Math.max(0,Math.min(parent.clientHeight-44,start.top+e.clientY-start.y))+'px';};
  button.onpointerup = () => {clearTimeout(timer);if(moving)try{localStorage.setItem('fpro-button',JSON.stringify({x:button.offsetLeft,y:button.offsetTop}));}catch(_){} start=null;};
  button.onpointercancel=()=>{clearTimeout(timer);start=null;};
  button.onclick = e => {
   e.preventDefault(); e.stopPropagation(); if(moving)return;
   const article=video.closest('[role="article"]') || parent;
   const permalink=Array.from(article.querySelectorAll('a[href]')).find(a=>/\/reel\/|\/videos\/|\/stories\/|story_fbid=/.test(a.href));
   location.href='fpro://download?media='+encodeURIComponent(video.currentSrc || '')+'&link='+encodeURIComponent(permalink?.href || location.href);
  };
  parent.appendChild(button);
  const track=document.createElement('div');track.className='fpro-track';const fill=document.createElement('div');fill.className='fpro-fill';fill.innerHTML='<span class="fpro-ball">⚽</span>';track.appendChild(fill);parent.appendChild(track);
  video.addEventListener('timeupdate',()=>{fill.style.width=(Number.isFinite(video.duration)&&video.duration>0?video.currentTime/video.duration*100:0)+'%';});
  video.addEventListener('dblclick',e=>{e.preventDefault();if(document.fullscreenElement)document.exitFullscreen();else video.requestFullscreen?.();});
 }
 let pending=false;
 const observer=new MutationObserver(records=>{
  if (!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.className?.toString().startsWith('fpro-')))) return;
  if(pending)return;pending=true;setTimeout(()=>{pending=false;scan();},500);
 });
 observer.observe(document.body,{childList:true,subtree:true});
 window.__fpro={update};update(config);
})();
