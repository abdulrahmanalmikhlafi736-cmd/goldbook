(() => {
 'use strict';
 const initial = __CONFIG__;
 if (!document.body) return;
 if (window.__fpro) { window.__fpro.update(initial); return; }
 let cfg = initial, pending = null;
 const style = document.createElement('style'); style.id = 'fpro-style'; document.head.appendChild(style);
 const colors = {'طبيعي':'#1877f2','ذهبي':'#d4af37','أحمر':'#c62828','أخضر':'#17833e','بنفسجي':'#8643c5','برتقالي':'#ed701b','فيروزي':'#008c95','وردي':'#d34489','بني':'#805539','فضي':'#9ba6b0','أبيض':'#ffffff'};
 const norm = s => (s || '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u2066-\u2069]/g,'').replace(/\s+/g,' ').toLowerCase().trim();
 const words = {
  ads:['sponsored','ممول','إعلان','اعلان','إعلان ممول','publicité','gesponsert','patrocinado','sponsorizzato'],
  suggested:['suggested for you','مقترح لك','مقترحة لك','مقترحات لك'],
  reels:['reels','ريلز','الريلز'], stories:['stories','القصص','قصص'],
  people:['people you may know','أشخاص قد تعرفهم','اشخاص قد تعرفهم'],
  groups:['suggested groups','مجموعات مقترحة','مجموعات مقترحة لك']
 };
 const postSelector = '[role="article"],article,[data-pagelet^="FeedUnit"],[data-ft]';
 function postFor(el){return el.closest('[role="article"],article,[data-pagelet^="FeedUnit"]') || el.closest('div[data-ft]');}
 const hidden = new Map(), painted = new Set(), videos = new Map();
 function hide(el) {
  if (!el || /^(BODY|HTML|MAIN)$/.test(el.tagName) || el.getAttribute('role') === 'main') return;
  if (!hidden.has(el)) hidden.set(el, {value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
  el.setAttribute('data-fpro-hidden','1'); el.style.setProperty('display','none','important');
 }
 function restoreHidden() {
  hidden.forEach((old,el) => { if(old.value) el.style.setProperty('display',old.value,old.priority); else el.style.removeProperty('display'); el.removeAttribute('data-fpro-hidden'); }); hidden.clear();
 }
 function section(label, key) {
  const post = postFor(label); if (post) return post;
  const region = label.closest('section,[role="list"],[role="region"],[data-pagelet*="Stories"],[data-pagelet*="Reels"],[data-sigil~="m-story-tray"]');
  if (region) return region;
  // Never hide a whole feed because a navigation link contains "Stories".
  if (key === 'stories' || key === 'reels') {
   const link = label.closest('a[href]');
   if (link && /\/(stories|reel|reels)\//.test(link.getAttribute('href') || '')) return link;
  }
  return null;
 }
 function appBanner(link, explicitLabel = false) {
  if(link.closest(postSelector)) return;
  const href = link.getAttribute('href') || '';
  if (!explicitLabel && !/^(intent:|fb:|fb-messenger:|android-app:)/i.test(href) && !/(play\.google\.com\/store\/apps|apps\.apple\.com\/|\/marketplace\/app_redirect|\/r\.php\?.*app_id|\/openinapp|\/native_app|\/intent\/)/i.test(href)) return;
  let block = link;
  // Only a compact install prompt, never an article, login form or entire page.
  for (let i=0; i<3 && block.parentElement; i++) {
   const p = block.parentElement;
   if (/^(BODY|HTML|MAIN|FORM)$/.test(p.tagName) || p.matches(postSelector) || p.getAttribute('role') === 'main' || p.querySelector('input,video') || (p.textContent || '').length > 400) break;
   if (p.querySelectorAll('a').length > 3) break;
   block = p;
  }
  hide(block);
 }
 function tint() {
  if (!colors[cfg.color]) return;
  const blue = value => { const m = (value || '').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/); return m && +m[3] > +m[1]+35 && +m[3] > +m[2]+25 && +m[2] > 35; };
  const nodes = document.querySelectorAll('button,[role="button"],input[type="submit"],a,svg,button *,[role="button"] *,a > span,a > div');
  for (let i=0;i<Math.min(nodes.length,700);i++) {
   const el=nodes[i]; if(el.closest('.fpro-video-tools')) continue;
   const s=getComputedStyle(el);
   for(const [property,attribute] of [['backgroundColor','bg'],['color','fg'],['borderTopColor','border']]) {
    if(blue(s[property])) { el.setAttribute('data-fpro-accent-'+attribute,''); painted.add(el); }
   }
  }
 }
 function scan() {
  restoreHidden();
  const labels = document.querySelectorAll('a,span,abbr,strong,b,[role="heading"],[aria-label]');
  for (let i=0;i<Math.min(labels.length,2400);i++) {
   const label=labels[i]; if(label.closest('.fpro-video-tools')) continue;
   const text=norm(label.getAttribute('aria-label') || label.innerText || label.textContent);
   if(cfg.appBanner && ['open app','open in app','get the app','فتح التطبيق','افتح التطبيق','فتح في التطبيق','استخدام التطبيق','تثبيت التطبيق','الحصول على التطبيق'].includes(text)) appBanner(label,true);
   if(!text || text.length>100) continue;
   for(const key of Object.keys(words)) if(cfg[key] && words[key].some(w=>text===norm(w))) hide(section(label,key));
  }
  if(cfg.ads) document.querySelectorAll('a[href*="/ads/about/"],[data-ad-rendering-role="sponsored_label"],[data-sponsored="true"]').forEach(el=>hide(postFor(el)));
  if(cfg.stories) document.querySelectorAll('[data-pagelet*="Stories"],[data-sigil~="m-story-tray"],[aria-label="Stories"],[aria-label="القصص"]').forEach(el=>hide(section(el,'stories') || el));
  if(cfg.appBanner) document.querySelectorAll('a[href]').forEach(link=>appBanner(link));
  if(cfg.stories) document.querySelectorAll('a[href*="/stories/"]').forEach(link=>hide(section(link,'stories') || link));
  tint();
  videos.forEach((entry,video)=>{if(!video.isConnected || (!cfg.downloads && !cfg.rainbow)) {entry.dispose(); videos.delete(video);}});
  if(cfg.downloads || cfg.rainbow) document.querySelectorAll('video').forEach(attachVideo);
  layoutVideos();
 }
 function mediaSource(video) {
  const candidates=[video.currentSrc,video.src,...Array.from(video.querySelectorAll('source[src]'),el=>el.src)];
  const store=video.closest('[data-store]');
  if(store) try {
   const raw=store.getAttribute('data-store');
   if(raw && raw.length<100000) {
    const data=JSON.parse(raw), items=data.videoData || [data];
    for(const item of Array.isArray(items)?items.slice(0,4):[items]) if(item) for(const key of ['hd_src','sd_src','playable_url_quality_hd','playable_url','video_url']) candidates.push(item[key]);
   }
  }catch(_){}
  return candidates.find(url=>typeof url==='string' && /^https:\/\//i.test(url)) || video.currentSrc || video.src || '';
 }
 function attachVideo(video) {
  if(videos.has(video)) return;
  const overlay=document.createElement('div'); overlay.className='fpro-video-tools';
  const button=document.createElement('button'); button.className='fpro-download';button.type='button';button.textContent='↓';button.setAttribute('aria-label','تنزيل الفيديو');
  const track=document.createElement('div');track.className='fpro-track';
  const fill=document.createElement('div');fill.className='fpro-fill';
  const ball=document.createElement('span');ball.className='fpro-ball';ball.textContent='⚽';fill.appendChild(ball);track.appendChild(fill);
  const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.className='fpro-seek';seek.setAttribute('aria-label','تقدم الفيديو');track.appendChild(seek);
  overlay.appendChild(button);overlay.appendChild(track);document.body.appendChild(overlay);
  let pos={x:12,y:12};try{pos=JSON.parse(localStorage.getItem('fpro-button')) || pos;}catch(_){}
  let start=null,moving=false,held=false,timer=null;
  function placeButton(){button.style.left=Math.max(0,Math.min(Math.max(0,overlay.clientWidth-44),pos.x))+'px';button.style.top=Math.max(0,Math.min(Math.max(0,overlay.clientHeight-44),pos.y))+'px';}
  button.onpointerdown=e=>{start={x:e.clientX,y:e.clientY,left:pos.x,top:pos.y};moving=false;held=false;timer=setTimeout(()=>{held=true;try{button.setPointerCapture(e.pointerId);}catch(_){}},400);e.stopPropagation();};
  button.onpointermove=e=>{if(!held || !start)return;moving=true;pos={x:start.left+e.clientX-start.x,y:start.top+e.clientY-start.y};placeButton();};
  button.onpointerup=()=>{clearTimeout(timer);if(moving)try{localStorage.setItem('fpro-button',JSON.stringify(pos));}catch(_){}start=null;};
  button.onpointercancel=()=>{clearTimeout(timer);start=null;};
  button.onclick=e=>{e.preventDefault();e.stopPropagation();if(moving)return;
   const article=postFor(video) || video.parentElement;
   const permalink=article && Array.from(article.querySelectorAll('a[href]')).find(a=>/\/reel\/|\/videos\/|\/stories\/|story_fbid=/.test(a.href));
   location.href='fpro://download?media='+encodeURIComponent(mediaSource(video))+'&link='+encodeURIComponent(permalink ? permalink.href : location.href);
  };
  function progress(){const valid=Number.isFinite(video.duration)&&video.duration>0;const fraction=valid?Math.max(0,Math.min(1,video.currentTime/video.duration)):0;fill.style.width=(fraction*100)+'%';seek.value=String(Math.round(fraction*1000));seek.disabled=!valid;seek.setAttribute('aria-valuetext',valid?Math.floor(video.currentTime)+' / '+Math.floor(video.duration)+' ثانية':'بث مباشر أو مدة غير متاحة');}
  seek.oninput=e=>{e.stopPropagation();if(Number.isFinite(video.duration)&&video.duration>0){try{video.currentTime=Number(seek.value)/1000*video.duration;}catch(_){}progress();}};
  seek.onclick=e=>e.stopPropagation();
  const doubleClick=e=>{e.preventDefault();if(document.fullscreenElement){document.exitFullscreen?.();}else{const result=video.requestFullscreen?.();if(result&&result.catch)result.catch(()=>{});}};
  video.addEventListener('dblclick',doubleClick);
  const events=['timeupdate','durationchange','loadedmetadata','seeking','ended','emptied'];events.forEach(name=>video.addEventListener(name,progress));
  if(resize)resize.observe(video);
  videos.set(video,{layout(){const r=video.getBoundingClientRect();const dialog=document.querySelector('[role="dialog"]');overlay.hidden=!(r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth) || !!(dialog&&!dialog.contains(video));overlay.style.left=r.left+'px';overlay.style.top=r.top+'px';overlay.style.width=r.width+'px';overlay.style.height=r.height+'px';button.hidden=!cfg.downloads;track.hidden=!cfg.rainbow;placeButton();progress();},dispose(){if(resize)resize.unobserve(video);clearTimeout(timer);video.removeEventListener('dblclick',doubleClick);events.forEach(name=>video.removeEventListener(name,progress));overlay.remove();}});
 }
 function layoutVideos(){videos.forEach(entry=>entry.layout());}
 let frame=null;
 function scheduleLayout(){if(frame===null)frame=requestAnimationFrame(()=>{frame=null;layoutVideos();});}
 window.addEventListener('scroll',scheduleLayout,true);window.addEventListener('resize',scheduleLayout);
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(scheduleLayout):null;
 if(resize)resize.observe(document.body);
 function update(c){
  cfg=c;style.textContent='';restoreHidden();painted.forEach(el=>['bg','fg','border'].forEach(k=>el.removeAttribute('data-fpro-accent-'+k)));painted.clear();
  const accent=colors[c.color];
  const foreground=c.dark?accent:({'ذهبي':'#8a6500','فضي':'#56616b','أبيض':'#333','برتقالي':'#a64600'}[c.color] || accent);
  const contrast=['ذهبي','فضي','أبيض','برتقالي'].includes(c.color)?'#111':'#fff';
  // Compute blue accents before applying our overrides. Never recolor photographs.
  tint();
  style.textContent=`
   body{-webkit-user-select:text!important}
   ${accent?`:root{--primary-button-background:${accent};--accent:${accent};--primary-blue:${accent};--blue-link:${foreground};--web-wash:${c.dark?'#18191a':'#f0f2f5'};}[data-fpro-accent-bg]{background-color:${accent}!important;color:${contrast}!important}[data-fpro-accent-bg] *{color:${contrast}!important}[data-fpro-accent-fg]{color:${foreground}!important;fill:currentColor}[data-fpro-accent-border]{border-color:${accent}!important}`:''}
   ${c.dark?`html,body,[role="main"]{background:${c.amoled?'#000':'#18191a'}!important;color:#eee!important;color-scheme:dark}`:''}
   ${c.sticky?'[role="banner"]{position:sticky!important;top:0!important;z-index:1000!important}':''}
   ${c.reverse?'body{direction:ltr!important}':''}
   .fpro-video-tools{position:fixed;z-index:10000;pointer-events:none;overflow:hidden}
   .fpro-video-tools[hidden],.fpro-video-tools [hidden]{display:none!important}
   .fpro-download{position:absolute;pointer-events:auto;min-width:44px;min-height:44px;border:1px solid #fff9;border-radius:24px;background:#111b;color:white;touch-action:none;-webkit-user-select:none;font-size:24px}
   .fpro-track{position:absolute;bottom:0;left:8px;right:8px;height:28px;pointer-events:auto;background:#2229;border-radius:14px}
   .fpro-fill{position:absolute;bottom:8px;left:0;height:6px;border-radius:4px;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet);width:0}
   .fpro-ball{position:absolute;right:-9px;top:-7px;font-size:18px;line-height:20px}
   .fpro-seek{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:auto;touch-action:pan-y}
  `;
  scan();
 }
 const observer=new MutationObserver(records=>{
  if(!records.some(r=>!((r.target.nodeType===1?r.target:r.target.parentElement)?.closest('#fpro-style,.fpro-video-tools'))))return;
  if(pending!==null)return;pending=setTimeout(()=>{pending=null;scan();},500);
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','href','src']});
 window.__fpro={update};update(initial);
})();
