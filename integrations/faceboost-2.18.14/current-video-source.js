/* GPL-3.0-or-later. Current-element adaptation of Frost's data-store.src
 * (Allan Wang, GPL-3.0-or-later) and yt-dlp's Facebook video field extraction
 * (Unlicense). Provenance and immutable references: RESEARCH.md.
 * No network requests, React internals, clipboard reads, polling or idle observer.
 */
(function(w){
 'use strict';if(w.FproCurrentVideoSource)return;
 const baseline=new WeakMap(),digits=/^\d+$/;
 const fields=['browser_native_hd_url','playable_url_quality_hd','browser_native_sd_url','playable_url','playable_url_dash'];
 function https(value){
  try{if(typeof value!=='string'||value.length>8192)return '';const u=new URL(value,w.location.href);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch(_){return '';}
 }
 function fingerprint(v){return [v.currentSrc||'',v.getAttribute('src')||'',...Array.from(v.querySelectorAll('source')).map(s=>s.getAttribute('src')||'')].join('|');}
 function scopes(v){const out=[v];for(let n=v.parentElement,i=0;n&&i<10;n=n.parentElement,i++){
  if(n.matches('body,html,main,[role="feed"],[role="main"]')||n.querySelectorAll('video').length!==1)break;
  out.push(n);if(n.matches('article,[role="article"]'))break;
 }return out;}
 function evidence(v){
  const nodes=scopes(v),ids=new Set(),sources=new Set();let budget=500,bytes=0;
  const add=x=>{const url=https(x);if(url)sources.add(url);};
  function visit(obj,depth,videoContext=false){
   if(!obj||typeof obj!=='object'||depth>9||budget--<=0)return;
   if(Array.isArray(obj)){for(const value of obj.slice(0,50))visit(value,depth+1,videoContext);return;}
   const typed=obj.__typename==='Video';
   const video=typed||videoContext||fields.some(k=>typeof obj[k]==='string')||obj.videoDeliveryLegacyFields;
   if(video){
    for(const key of ['videoId','videoID','video_id',...(typed||videoContext?['id']:[])])if(digits.test(String(obj[key]||'')))ids.add(String(obj[key]));
    for(const key of fields){if(https(obj[key])){add(obj[key]);break;}}
    if(videoContext)add(obj.src);
   }
   // Bounded public JSON data only; typed Video IDs, never an arbitrary owner/post `id`.
   for(const [key,value]of Object.entries(obj))if(value&&typeof value==='object')visit(value,depth+1,key==='videoData'||key==='video_data'||key==='videoDeliveryLegacyFields');
  }
  for(const [depth,n] of nodes.entries()){
   for(const key of ['data-video-id','data-videoid','data-video_id']){const id=n.getAttribute(key);if(digits.test(id||''))ids.add(id);}
   add(n.getAttribute('data-video-url'));
   for(const attr of ['data-store','data-video-data']){
    const raw=n.getAttribute(attr);if(!raw||raw.length>100000||bytes+raw.length>200000)continue;bytes+=raw.length;
    try{
     const obj=JSON.parse(raw);visit(obj,0,attr==='data-video-data');
     // Frost's source, constrained to the player's own near wrapper or an explicit inline-video node.
     const inline=nodes.slice(0,depth+1).some(x=>/inlinevideo/i.test(x.getAttribute('data-sigil')||''));
     if(n===v||inline)add(obj.src);
    }catch(_){}
   }
  }
  const scope=nodes[nodes.length-1];
  if(scope)for(const script of Array.from(scope.querySelectorAll('script[data-sjs],script[type="application/json"]')).slice(0,8)){
   const raw=script.textContent||'';if(raw.length>100000||bytes+raw.length>200000)continue;bytes+=raw.length;try{visit(JSON.parse(raw),0);}catch(_){}
  }
  return {ids,sources};
 }
 function remember(v){if(baseline.has(v))return;const e=evidence(v);baseline.set(v,{source:fingerprint(v),ids:e.ids,sources:e.sources});}
 function resolve(v){
  if(!v||!v.isConnected||!/(^|\.)facebook\.com$/.test(w.location.hostname))return {url:'',kind:'',reason:'invalid-context'};
  const current=v.currentSrc||'',attr=v.getAttribute('src')||'',old=baseline.get(v),changed=old&&old.source.replace(/\|/g,'')!==''&&old.source!==fingerprint(v);
  // Never hand an old still-loaded currentSrc to Seal while a new src is being selected.
  if(current&&attr){try{if(new URL(current,w.location.href).href!==new URL(attr,w.location.href).href)return {url:'',kind:'',reason:'source-transition'};}catch(_){return {url:'',kind:'',reason:'source-transition'};}}
  const e=evidence(v);
  if(old&&!old.source.replace(/\|/g,'')&&fingerprint(v).replace(/\|/g,''))baseline.set(v,{source:fingerprint(v),ids:e.ids,sources:e.sources});
  if(e.ids.size===1){const id=Array.from(e.ids)[0];if(!(changed&&old.ids.has(id)))return {url:'https://www.facebook.com/watch/?v='+id,kind:'permalink',reason:'scoped-video-id'};}
  const permalink=w.FproPublicVideoLink?.resolve(v);
  if(permalink?.url&&!['ambiguous-ids','ambiguous-links'].includes(permalink.reason))return {url:permalink.url,kind:'permalink',reason:permalink.reason};
  const direct=https(current||attr);
  if(direct)return {url:direct,kind:'media',reason:'current-html-source'};
  // Multiple IDs or multiple different sources are not a licence to choose the first video.
  if(e.ids.size>1)return {url:'',kind:'',reason:'ambiguous-video-ids'};
  const fresh=Array.from(e.sources).filter(url=>!(changed&&old.sources.has(url)));
  if(fresh.length===1)return {url:fresh[0],kind:'media',reason:'scoped-media-data'};
  return {url:'',kind:'',reason:fresh.length>1?'ambiguous-media-data':'missing-current-source'};
 }
 w.FproCurrentVideoSource={remember,resolve};
})(window);
