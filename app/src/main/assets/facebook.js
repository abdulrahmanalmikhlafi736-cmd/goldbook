(() => {
 'use strict';
 const initial = __CONFIG__;
 if (!document.body) return;
 if (window.__fpro) { window.__fpro.update(initial); return; }
 let cfg = initial, pending = null, hidingPass = null;
 const style = document.createElement('style'); style.id = 'fpro-style'; const nonce=document.querySelector('style[nonce],script[nonce]'); if(nonce)style.nonce=nonce.nonce;
 const colors = {'طبيعي':'#1877f2','ذهبي':'#d4af37','أحمر':'#c62828','أخضر':'#17833e','بنفسجي':'#8643c5','برتقالي':'#ed701b','فيروزي':'#008c95','وردي':'#d34489','بني':'#805539','فضي':'#9ba6b0','أبيض':'#ffffff'};
 const norm = s => (s || '').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u2066-\u2069]/g,'').replace(/\s+/g,' ').toLowerCase().trim().replace(/[·•\s:.!؟]+$/g,'');
 const words = {
  ads:['sponsored','ممول','إعلان','اعلان','إعلان ممول','publicité','gesponsert','patrocinado','sponsorizzato'],
  suggested:['suggested for you','مقترح لك','مقترحة لك','مقترحات لك'],
  reels:['reels','ريلز','الريلز'], stories:['stories','القصص','قصص'],
  people:['people you may know','أشخاص قد تعرفهم','اشخاص قد تعرفهم'],
  groups:['suggested groups','مجموعات مقترحة','مجموعات مقترحة لك']
 };
 const postSelector = '[role="article"],article,[data-pagelet^="FeedUnit"],[data-ft]';
 function postFor(el){return el.closest('[role="article"],article,[data-pagelet^="FeedUnit"]') || el.closest('div[data-ft]');}
 const hidden = new Map(), painted = new Set(), videos = new Map(), identityBaseline = new WeakMap();
 function hide(el) {
  if (!el || /^(BODY|HTML|MAIN)$/.test(el.tagName) || ['main','feed','navigation'].includes(el.getAttribute('role'))) return;
  if(hidingPass)hidingPass.add(el);
  if (!hidden.has(el)) hidden.set(el, {value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
  if(el.getAttribute('data-fpro-hidden')!=='1')el.setAttribute('data-fpro-hidden','1');
  if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')el.style.setProperty('display','none','important');
 }
 function restoreHidden() {
  hidden.forEach((old,el) => { if(old.value) el.style.setProperty('display',old.value,old.priority); else el.style.removeProperty('display'); el.removeAttribute('data-fpro-hidden'); }); hidden.clear();
 }
 function section(label, key) {
  const post = postFor(label); if (post) return post;
  const region = label.closest('section,[role="list"],[role="region"],[data-pagelet*="Stories"],[data-pagelet*="Reels"],[data-sigil~="m-story-tray"]');
  if (region && !region.querySelector('[role="article"],article,[data-pagelet^="FeedUnit"]')) return region;
  // Never hide a whole feed because a navigation link contains "Stories".
  if (key === 'stories' || key === 'reels') {
   const link = label.closest('a[href]');
   if (link && /\/(stories|reel|reels)\//.test(link.getAttribute('href') || '')) return link;
  }
  return null;
 }
 function appBanner(link, explicitLabel = false) {
  const control=link.closest('a,button,[role="button"]');
  const inPost=link.closest('[role="article"],article,[data-pagelet^="FeedUnit"]');
  // Reels place the Open App control inside the player/article. Hide that
  // control only, never the reel or its search/profile/navigation siblings.
  if(inPost) { if(explicitLabel && control) hide(control); return; }
  const header=control && control.closest('header,nav,[role="banner"],[role="navigation"]');
  if(explicitLabel && header && header.querySelectorAll('a,button,[role="button"]').length>1) { hide(control); return; }
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
 function homeView(){return window.__fproPageInfo ? window.__fproPageInfo().home : /^\/(?:home\.php|index\.php)?$/.test(location.pathname)&&!document.fullscreenElement;}
 function tint() {
  if (!colors[cfg.color]) return;
  const next=new Set();
  const blue=value=>{const m=(value||'').match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);return m&&+m[3]>+m[1]+35&&+m[3]>+m[2]+25;};
  function mark(el,attr){if(!el.hasAttribute('data-fpro-accent-'+attr))el.setAttribute('data-fpro-accent-'+attr,'');next.add(el);}
  const actions=new Set(['follow','follow back','following','add friend','confirm','request sent','متابعة','متابعه','رد المتابعة','إضافة صديق','اضافة صديق','إضافة إلى الأصدقاء','تأكيد','تاكيد','تم إرسال الطلب']);
  for(const el of document.querySelectorAll('a[href],button,[role="button"]')){
   if(el.closest('.fpro-video-tools'))continue;
   const text=norm(el.getAttribute('aria-label')||el.textContent),href=el.getAttribute('href')||'';
   if(/(?:\/hashtag\/|[?&]hashtag=)/i.test(href)||/^#[^\s#]+$/.test(text)){mark(el,'fg');continue;}
   if(!actions.has(text)||el.querySelector('video,img'))continue;
   const c=getComputedStyle(el);if(blue(c.backgroundColor)||el.hasAttribute('data-fpro-accent-bg'))mark(el,'bg');else mark(el,'fg');
  }
  // Only explicitly labelled verification icons; never all blue SVGs or branding.
  for(const el of document.querySelectorAll('svg[aria-label],span[aria-label],i[aria-label],svg title')){
   const label=norm(el.getAttribute('aria-label')||el.textContent);
   if(!/^(verified|verified account|حساب موثق|موثق|تم التحقق|تم التحقق من الحساب)$/.test(label))continue;
   const icon=el.closest('svg')||el.querySelector('svg')||el;
   if(icon.closest('.fpro-video-tools'))continue;
   mark(icon,'fg');for(const path of icon.querySelectorAll('path,circle'))if(blue(getComputedStyle(path).fill)||path.hasAttribute('data-fpro-accent-fill'))mark(path,'fill');
  }
  // Story rings only: preserve photos, tile backgrounds and unrelated borders.
  for(const ring of document.querySelectorAll('a[href*="/stories/"],a[href*="/stories/"] *,[data-sigil~="m-story-tray"] *,[data-pagelet*="Stories"] *')){
   if(ring.matches('img,video,canvas')||ring.closest('.fpro-video-tools'))continue;
   const c=getComputedStyle(ring);if(parseFloat(c.borderTopWidth)>0&&(blue(c.borderTopColor)||ring.hasAttribute('data-fpro-accent-border')))mark(ring,'border');
  }
  painted.forEach(el=>{if(!next.has(el))for(const attr of ['bg','fg','border','fill','stroke'])el.removeAttribute('data-fpro-accent-'+attr);});
  painted.clear();next.forEach(el=>painted.add(el));
 }
 function hideHomeStories(){
  const safe=el=>el&&!/^(BODY|HTML|MAIN|FORM|NAV|HEADER|FOOTER)$/.test(el.tagName)&&!['main','feed','navigation','banner'].includes(el.getAttribute('role'))&&!el.querySelector('article,[role="article"],[data-pagelet^="FeedUnit"],input,textarea');
  const explicit=document.querySelectorAll('[data-pagelet*="Stories"],[data-sigil~="m-story-tray"],[data-type*="story-tray" i],[aria-label="Stories"],[aria-label="القصص"]');
  explicit.forEach(el=>{if(safe(el)&&!el.closest('article,[role="article"]'))hide(el);});
  const seeds=Array.from(document.querySelectorAll('a[href*="/stories/"],a[href*="story.php?"],button,[role="button"],span,div[dir="auto"]')).filter(el=>/\/stories\/|story\.php\?/.test(el.getAttribute('href')||'')||['create story','create a story','add to story','إنشاء قصة','انشاء قصة','إنشاء قصه','إضافة إلى قصتك','اضافة الى قصتك'].includes(norm(el.getAttribute('aria-label')||el.textContent)));
  for(const seed of seeds){
   if(seed.closest('article,[role="article"],[data-pagelet^="FeedUnit"]'))continue;
   let best=seed,row=seed.parentElement;
   for(let depth=0;row&&depth<7;depth++,row=row.parentElement){
    if(!safe(row)||row.querySelector('video'))break;
    const r=row.getBoundingClientRect();if(r.height>440)break;
    const anchors=Array.from(row.querySelectorAll('a[href]'));
    const allStories=anchors.length>=2&&anchors.every(a=>/\/stories\/|story\.php\?|create.*story/.test(a.getAttribute('href')||''));
    const media=row.querySelectorAll('img,[style*="background-image"]').length;
    const c=getComputedStyle(row),horizontal=/auto|scroll/.test(c.overflowX)||row.scrollWidth>row.clientWidth+12||c.flexDirection==='row';
    if(allStories||(horizontal&&(media>=2||row.querySelectorAll('[role="button"]').length>=2)))best=row;
   }
   hide(best);
  }
 }
 function scan() {
  if(cfg.enhance===false)return;
  hidingPass=new Set();
  const labels = document.querySelectorAll('a,span,abbr,strong,b,button,[role="button"],div[dir="auto"],[role="heading"],[aria-label]');
  for (let i=0;i<Math.min(labels.length,2400);i++) {
   const label=labels[i]; if(label.closest('.fpro-video-tools')) continue;
   const text=norm(label.getAttribute('aria-label') || label.innerText || label.textContent);
   const appText=text.replace(/^(facebook|فيسبوك|f)\s*/,'').replace(/\s*(facebook|فيسبوك|f)$/,'');
   if(cfg.appBanner && ['open app','open in app','get the app','get facebook for android and browse faster','حمل تطبيق فيسبوك','فتح التطبيق','افتح التطبيق','فتح في التطبيق','استخدام التطبيق','تثبيت التطبيق','الحصول على التطبيق'].includes(appText)) appBanner(label,true);
   if(!text || text.length>100) continue;
   for(const key of Object.keys(words)) if((cfg[key]) && words[key].some(w=>text===norm(w))) hide(section(label,key));
  }
  if(cfg.ads) document.querySelectorAll('a[href*="/ads/about/"],[data-ad-rendering-role="sponsored_label"],[data-sponsored="true"]').forEach(el=>hide(postFor(el)));
  if(cfg.stories) document.querySelectorAll('[data-pagelet*="Stories"],[data-sigil~="m-story-tray"],[aria-label="Stories"],[aria-label="القصص"]').forEach(el=>hide(section(el,'stories') || el));
  if(cfg.appBanner) document.querySelectorAll('a[href]').forEach(link=>appBanner(link));
  if(cfg.stories) document.querySelectorAll('a[href*="/stories/"]').forEach(link=>hide(section(link,'stories') || link));
  if((cfg.homeStories||cfg.stories)&&homeView())hideHomeStories();
  hidden.forEach((old,el)=>{if(!hidingPass.has(el)){if(old.value)el.style.setProperty('display',old.value,old.priority);else el.style.removeProperty('display');el.removeAttribute('data-fpro-hidden');hidden.delete(el);}});
  hidingPass=null;
  tint();
  videos.forEach((entry,video)=>{if(!video.isConnected || (!cfg.downloads && !cfg.rainbow)) {entry.dispose(); videos.delete(video);}});
  if(cfg.downloads || cfg.rainbow) document.querySelectorAll('video').forEach(attachVideo);
  layoutVideos();
  syncStoryImages();
 }
 function signature(video){return [video.src,video.currentSrc].join('|');}
 function videoIdentity(video){
  let owner=video;
  for(let d=0;owner&&d<4;d++,owner=owner.parentElement){for(const attr of ['data-video-id','data-videoid']){const value=owner.getAttribute(attr);if(value&&/^\d+$/.test(value))return value;}}
  return '';
 }
 function metadata(video){
  const store=video.closest('[data-store]');if(!store)return [];
  try{const raw=store.getAttribute('data-store');if(!raw||raw.length>100000)return [];const data=JSON.parse(raw),items=data.videoData||[data];const list=Array.isArray(items)?items:[items];const id=videoIdentity(video);
   // A multi-video store is not evidence that its first item is the current clip.
   return list.filter(item=>item&&(id?String(item.videoID||item.video_id||item.id||'')===id:list.length===1&&store.querySelectorAll('video').length===1));
  }catch(_){return [];}
 }
 function staleIdentity(video){const old=identityBaseline.get(video);return old&&old.source.replace(/\|/g,'')&&old.source!==signature(video);}
 function mediaSource(video) {
  const candidates=[video.readyState>=2?video.currentSrc:video.src,video.src,video.currentSrc,...Array.from(video.querySelectorAll('source[src]'),el=>el.src)];
  const store=video.closest('[data-store]');const old=identityBaseline.get(video);
  if(!staleIdentity(video)||!old||old.store!==(store?store.getAttribute('data-store'):null)){
   for(const item of metadata(video))for(const key of ['hd_src','sd_src','playable_url_quality_hd','playable_url','video_url'])candidates.push(item[key]);
  }
  return candidates.find(url=>typeof url==='string' && /^https:\/\//i.test(url)) || '';
 }
 function storyRoute(){return /^\/stories(?:\/|$)/.test(location.pathname)||/^\/story\.php$/.test(location.pathname);}
 function storyPermalink(el){
  if(!storyRoute())return '';
  const owner=el.closest('[data-story-id]');
  if(owner&&/^\d+$/.test(owner.getAttribute('data-story-id')||''))return 'https://www.facebook.com/stories/'+(location.pathname.split('/')[2]||'0')+'/'+owner.getAttribute('data-story-id')+'/';
  const u=new URL(location.href);
  if(/^\/stories\/[^/]+\/[^/]+/.test(u.pathname)||u.pathname==='/story.php'&&u.searchParams.has('story_fbid'))return u.href;
  return '';
 }
 function rawPermalink(video){
  if(storyRoute()){const link=storyPermalink(video);if(link)return link;}
  let id=videoIdentity(video);if(!id){const item=metadata(video)[0];if(item)id=String(item.videoID||item.video_id||item.id||'');}
  if(/^\d+$/.test(id))return 'https://www.facebook.com/watch/?v='+id;
  let scope=video.parentElement;
  for(let d=0;scope&&d<4;d++,scope=scope.parentElement){
   if(/^(BODY|HTML|MAIN)$/.test(scope.tagName)||['feed','main'].includes(scope.getAttribute('role')))break;
   if(scope.querySelectorAll('video').length!==1)break;
   const link=Array.from(scope.querySelectorAll('a[href]')).find(a=>{try{const u=new URL(a.href);return (u.hostname==='facebook.com'||u.hostname.endsWith('.facebook.com'))&&/\/reel\/|\/videos\/|\/watch\/?\?|\/video\.php\?|story_fbid=/.test(u.pathname+u.search);}catch(_){return false;}});
   if(link)return link.href;
  }
  return '';
 }
 function videoPermalink(video){
  const link=rawPermalink(video),old=identityBaseline.get(video);
  return staleIdentity(video)&&old&&link===old.link?'':link; // Never reuse the entry clip of a recycled player.
 }
 function attachVideo(video) {
  if(videos.has(video)) return;
  const store=video.closest('[data-store]');identityBaseline.set(video,{source:signature(video),link:rawPermalink(video),store:store?store.getAttribute('data-store'):null});
  const overlay=document.createElement('div'); overlay.className='fpro-video-tools';
  const button=document.createElement('button'); button.className='fpro-download';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" focusable="false"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';button.setAttribute('aria-label','تنزيل الفيديو');
  const track=document.createElement('div');track.className='fpro-track';
  const fill=document.createElement('div');fill.className='fpro-fill';
  const ball=document.createElement('span');ball.className='fpro-ball';ball.textContent='⚽';fill.appendChild(ball);track.appendChild(fill);
  const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.className='fpro-seek';seek.setAttribute('aria-label','تقدم الفيديو');track.appendChild(seek);
  overlay.appendChild(button);overlay.appendChild(track);document.body.appendChild(overlay);
  let pos={x:12,y:12};try{pos=JSON.parse(localStorage.getItem('fpro-button')) || pos;}catch(_){}
  let start=null,moving=false,held=false,timer=null;
  function placeButton(){const top=parseFloat(overlay.style.top)||0;const minY=Math.max(0,-top+4);const maxY=Math.min(overlay.clientHeight-44,innerHeight-top-44);button.style.left=Math.max(0,Math.min(Math.max(0,overlay.clientWidth-44),pos.x))+'px';button.style.top=Math.max(0,Math.min(Math.max(0,maxY),Math.max(minY,pos.y)))+'px';}
  button.onpointerdown=e=>{start={x:e.clientX,y:e.clientY,left:button.offsetLeft,top:button.offsetTop};moving=false;held=false;timer=setTimeout(()=>{held=true;try{button.setPointerCapture(e.pointerId);}catch(_){}},400);e.stopPropagation();};
  button.onpointermove=e=>{if(!held || !start)return;moving=true;pos={x:start.left+e.clientX-start.x,y:start.top+e.clientY-start.y};placeButton();};
  button.onpointerup=()=>{clearTimeout(timer);if(moving)try{localStorage.setItem('fpro-button',JSON.stringify(pos));}catch(_){}start=null;};
  button.onpointercancel=()=>{clearTimeout(timer);start=null;};
  button.onclick=e=>{e.preventDefault();e.stopPropagation();if(moving)return;
   if(video.readyState===0&&video.networkState===2){location.href='fpro://download?media=&link=';return;}
   location.href='fpro://download?media='+encodeURIComponent(mediaSource(video))+'&link='+encodeURIComponent(videoPermalink(video));
  };
  function progress(){const valid=Number.isFinite(video.duration)&&video.duration>0;const fraction=valid?Math.max(0,Math.min(1,video.currentTime/video.duration)):0;fill.style.width=(fraction*100)+'%';seek.value=String(Math.round(fraction*1000));seek.disabled=!valid;seek.setAttribute('aria-valuetext',valid?Math.floor(video.currentTime)+' / '+Math.floor(video.duration)+' ثانية':'بث مباشر أو مدة غير متاحة');}
  seek.oninput=e=>{e.stopPropagation();if(Number.isFinite(video.duration)&&video.duration>0){try{video.currentTime=Number(seek.value)/1000*video.duration;}catch(_){}progress();}};
  seek.onclick=e=>e.stopPropagation();
  const events=['timeupdate','durationchange','loadedmetadata','seeking','ended','emptied'];events.forEach(name=>video.addEventListener(name,progress));
  video.addEventListener('play',scheduleLayout);video.addEventListener('pause',scheduleLayout);
  if(resize)resize.observe(video);
  videos.set(video,{layout(allowed=true){const r=video.getBoundingClientRect();const dialog=Array.from(document.querySelectorAll('[role="dialog"]')).find(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';});overlay.hidden=!allowed||!(r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth) || !!(dialog&&!dialog.contains(video));overlay.style.left=r.left+'px';overlay.style.top=r.top+'px';overlay.style.width=r.width+'px';const reel=/^\/reels?(?:\/|$)/.test(location.pathname) && r.height>innerHeight*0.6;const viewportBottom=window.visualViewport?Math.min(innerHeight,window.visualViewport.offsetTop+window.visualViewport.height):innerHeight;overlay.style.height=(reel?Math.max(0,viewportBottom-r.top):r.height)+'px';button.hidden=!cfg.downloads;track.hidden=!cfg.rainbow;placeButton();progress();},dispose(){video.removeEventListener('play',scheduleLayout);video.removeEventListener('pause',scheduleLayout);if(resize)resize.unobserve(video);clearTimeout(timer);events.forEach(name=>video.removeEventListener(name,progress));overlay.remove();}});
 }
 // A document-level capture listener also sees touches on Facebook's player
 // cover layers. It is independent of download/progress overlay attachment.
 let touch=null,lastTap=null,lastFullscreen= -Infinity;
 function gestureVideo(e) {
  if(cfg.doubleTapFullscreen===false || e.isPrimary===false)return null;
  const target=e.target.nodeType===1?e.target:e.target.parentElement;
  if(!target || target.closest('.fpro-video-tools,input,textarea,select,[contenteditable="true"]'))return null;
  const candidates=Array.from(document.querySelectorAll('video')).filter(v=>{
   const r=v.getBoundingClientRect(), c=getComputedStyle(v);
   return r.width>0&&r.height>0&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom&&c.display!=='none'&&c.visibility!=='hidden';
  });
  const video=candidates.find(v=>v===target || v.contains(target)) || candidates.find(v=>target.closest('[role="article"],article')?.contains(v)) || candidates[0];
  if(!video)return null;
  const dialog=target.closest('[role="dialog"]');if(dialog&&!dialog.contains(video))return null;
  const control=target.closest('a,button,[role="button"]');
  if(control){const r=control.getBoundingClientRect(),v=video.getBoundingClientRect();const label=norm(control.getAttribute('aria-label') || control.textContent);
   if(r.width*r.height<v.width*v.height*.2 && label && !/play|pause|تشغيل|إيقاف/.test(label))return null;
  }
  return video;
 }
 function toggleFullscreen(video) {
  const now=performance.now();if(now-lastFullscreen<450)return;lastFullscreen=now;
  function failed(){location.href='fpro://fullscreen-error';}
  try {
   let result;
   if(document.fullscreenElement || document.webkitFullscreenElement){
    const exit=document.exitFullscreen || document.webkitExitFullscreen;
    if(!exit){failed();return;}result=exit.call(document);
   }else{
    const enter=video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
    if(!enter){failed();return;}result=enter.call(video);
   }
   if(result&&typeof result.catch==='function')result.catch(failed);
  }catch(_){failed();}
 }
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse' && e.button!==0)return;
  const video=gestureVideo(e);touch=video?{video,id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),moved:false}:null;
 },true);
 document.addEventListener('pointermove',e=>{if(touch&&touch.id===e.pointerId && Math.hypot(e.clientX-touch.x,e.clientY-touch.y)>14){touch.moved=true;lastTap=null;}},true);
 document.addEventListener('pointercancel',()=>{touch=null;lastTap=null;},true);
 document.addEventListener('pointerup',e=>{
  const current=touch;touch=null;
  if(!current || current.id!==e.pointerId || current.moved || performance.now()-current.time>450 || Math.hypot(e.clientX-current.x,e.clientY-current.y)>14){lastTap=null;return;}
  const video=gestureVideo(e),now=performance.now();
  if(video!==current.video){lastTap=null;return;}
  if(lastTap && lastTap.video===video && now-lastTap.time<=320 && Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<=36){
   lastTap=null;e.preventDefault();e.stopPropagation();toggleFullscreen(video);
  }else lastTap={video,time:now,x:e.clientX,y:e.clientY};
 },true);
 document.addEventListener('dblclick',e=>{const video=gestureVideo(e);if(video){e.preventDefault();e.stopPropagation();toggleFullscreen(video);}},true);
 function rendered(video){for(let el=video;el;el=el.parentElement){const c=getComputedStyle(el);if(c.display==='none'||c.visibility==='hidden'||c.visibility==='collapse'||c.opacity==='0')return false;}return true;}
 function layoutVideos(){
  const candidates=Array.from(videos.keys()).map((video,index)=>{const r=video.getBoundingClientRect(),c=getComputedStyle(video);const w=Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left)),h=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top));
   const stack=document.elementsFromPoint?document.elementsFromPoint(Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.top+r.height/2))):[];
   const hit=stack.indexOf(video);return {video,r,index,visible:w*h>0&&rendered(video),score:(hit>=0?100000-hit*100:0)+(!video.paused?1000:0)+w*h/10000+index/1000};
  }).filter(c=>c.visible).sort((a,b)=>b.score-a.score);
  const chosen=[];
  for(const c of candidates){const overlaps=chosen.some(b=>{const area=Math.max(0,Math.min(c.r.right,b.r.right)-Math.max(c.r.left,b.r.left))*Math.max(0,Math.min(c.r.bottom,b.r.bottom)-Math.max(c.r.top,b.r.top));return area>Math.min(c.r.width*c.r.height,b.r.width*b.r.height)*.55;});if(!overlaps)chosen.push(c);}
  videos.forEach((entry,video)=>entry.layout(chosen.some(c=>c.video===video)));
 }
 function storyImageSource(el){if(el.tagName==='IMG')return el.currentSrc||el.src||'';const m=getComputedStyle(el).backgroundImage.match(/url\(["']?(https:[^"')]+)["']?\)/);return m?m[1]:'';}
 const storyImages=new Map();
 function syncStoryImages(){
  const eligible=[];
  if(cfg.downloads&&storyRoute()){
   const videoPlaying=Array.from(document.querySelectorAll('video')).some(v=>{const r=v.getBoundingClientRect();return rendered(v)&&r.width>=120&&r.height>=180&&r.top<innerHeight&&r.bottom>0;});
   if(!videoPlaying)for(const img of document.querySelectorAll('img,[style*="background-image"]')){const r=img.getBoundingClientRect();if(storyImageSource(img)&&!img.closest('header,[role="banner"]')&&rendered(img)&&r.width>=120&&r.height>=180&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0)eligible.push({img,r});}
  }
  eligible.sort((a,b)=>b.r.width*b.r.height-a.r.width*a.r.height);
  const current=eligible[0]?.img;
  storyImages.forEach((tools,img)=>{if(img!==current){tools.remove();storyImages.delete(img);}});
  if(!current)return;
  let tools=storyImages.get(current);
  if(!tools){tools=document.createElement('div');tools.className='fpro-video-tools fpro-story-tools';const button=document.createElement('button');button.className='fpro-download';button.type='button';button.textContent='↓';button.setAttribute('aria-label','تنزيل صورة القصة');button.style.left='12px';button.style.top='12px';button.onclick=e=>{e.preventDefault();e.stopPropagation();const media=storyImageSource(current);location.href='fpro://download?media='+encodeURIComponent(/^https:\/\//i.test(media)?media:'')+'&link='+encodeURIComponent(storyPermalink(current));};tools.appendChild(button);document.body.appendChild(tools);storyImages.set(current,tools);}
  const r=current.getBoundingClientRect();tools.style.left=Math.max(0,r.left)+'px';tools.style.top=Math.max(0,r.top)+'px';tools.style.width=r.width+'px';tools.style.height=Math.min(r.height,innerHeight)+'px';
 }
 let frame=null;
 function scheduleLayout(){if(frame===null)frame=requestAnimationFrame(()=>{frame=null;layoutVideos();syncStoryImages();if(cfg.enhance!==false && pending===null)pending=setTimeout(()=>{pending=null;scan();},350);});}
 window.addEventListener('scroll',scheduleLayout,true);window.addEventListener('resize',scheduleLayout);window.addEventListener('popstate',scheduleLayout);window.addEventListener('hashchange',scheduleLayout);
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(scheduleLayout):null;
 function update(c){
  if(JSON.stringify(cfg)===JSON.stringify(c)&&window.__fpro?.ready){scan();return;}
  window.__fpro.ready=true;
  cfg=c;style.textContent='';restoreHidden();painted.forEach(el=>['bg','fg','border','fill','stroke'].forEach(k=>el.removeAttribute('data-fpro-accent-'+k)));painted.forEach(el=>el.removeAttribute('data-fpro-surface'));painted.clear();
  if(c.enhance===false){observer.disconnect();if(resize)resize.disconnect();videos.forEach(entry=>entry.dispose());videos.clear();storyImages.forEach(tools=>tools.remove());storyImages.clear();style.remove();lastTap=null;touch=null;return;}
  if(resize)resize.observe(document.body);
  if(!style.isConnected)document.head.appendChild(style);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','href','src','data-story-id','data-store','data-video-id']});
  const accent=colors[c.color];
  const foreground=c.dark?accent:({'ذهبي':'#8a6500','فضي':'#56616b','أبيض':'#333','برتقالي':'#a64600'}[c.color] || accent);
  const contrast=['ذهبي','فضي','أبيض','برتقالي'].includes(c.color)?'#111':'#fff';
  // Compute blue accents before applying our overrides. Never recolor photographs.
  tint();
  style.textContent=`
   body{-webkit-user-select:text!important}
   ${accent?`[data-fpro-accent-bg]{background-color:${accent}!important;color:${contrast}!important}[data-fpro-accent-bg] *{color:${contrast}!important}[data-fpro-accent-fg]{color:${foreground}!important}[data-fpro-accent-border]{border-color:${foreground}!important}[data-fpro-accent-fill]{fill:${foreground}!important}[data-fpro-accent-stroke]{stroke:${foreground}!important}`:''}
   ${c.dark?`html,body,[role="main"]{background:${c.amoled?'#000':'#18191a'}!important;color:#eee!important;color-scheme:dark}`:''}
   ${c.sticky?'[role="banner"]{position:sticky!important;top:0!important;z-index:1000!important}':''}
   ${c.reverse?'body{direction:ltr!important}':''}
   .fpro-video-tools{direction:ltr;position:fixed;z-index:10000;pointer-events:none;overflow:hidden}
   .fpro-video-tools[hidden],.fpro-video-tools [hidden]{display:none!important}
   .fpro-download{position:absolute;pointer-events:auto;box-sizing:border-box;display:grid;place-items:center;width:44px!important;height:44px!important;min-width:44px;min-height:44px;padding:0!important;border:1px solid #ffffff80!important;border-radius:50%!important;background:rgba(255,255,255,.12)!important;box-shadow:none!important;color:#fff!important;backdrop-filter:blur(2px);touch-action:none;-webkit-user-select:none;line-height:1}.fpro-download svg{pointer-events:none;color:inherit!important;background:none!important}
   .fpro-track{position:absolute;bottom:0;left:8px;right:8px;height:24px;pointer-events:auto;background:transparent!important;box-shadow:none!important;border:0!important}
   .fpro-fill{position:absolute;bottom:0;left:0;height:3px;border-radius:4px;background:linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet);width:0}
   .fpro-ball{position:absolute;right:-7px;top:-5px;font-size:13px;line-height:14px}
   .fpro-seek{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:auto;touch-action:pan-y}
  `;
  scan();
 }
 const observer=new MutationObserver(records=>{
  if(cfg.enhance===false)return;
  if(!records.some(r=>!((r.target.nodeType===1?r.target:r.target.parentElement)?.closest('#fpro-style,.fpro-video-tools'))))return;
  if(pending!==null)return;pending=setTimeout(()=>{pending=null;scan();},500);
 });
 window.__fpro={update};update(initial);
})();
