/* GPL-3.0-or-later. Current-element public permalink resolver; no polling/network. */
(function(w){
 'use strict';if(w.FproPublicVideoLink)return;
 const baseline=new WeakMap(), numeric=/^\d+$/, token=/^[A-Za-z0-9_-]{3,}$/;
 function parse(value){
  try{
   let u=new URL(value,w.location.href);
   if(u.protocol!=='https:'||u.username||u.password)return null;
   if(/(^|\.)facebook\.com$/.test(u.hostname)&&u.pathname==='/l.php')u=new URL(u.searchParams.get('u')||'');
   if(u.protocol!=='https:'||u.username||u.password)return null;
   if(u.hostname==='fb.watch'&&token.test(u.pathname.split('/').filter(Boolean)[0]||''))return {url:'https://fb.watch/'+u.pathname.split('/').filter(Boolean)[0]+'/',key:'short:'+u.pathname.split('/')[1],kind:'short'};
   if(!/(^|\.)facebook\.com$/.test(u.hostname))return null;
   const p=u.pathname.replace(/\/+$/,'');let m;
   if((m=p.match(/^\/(?:reels?|(?:[^/]+\/)?videos)\/(\d+)$/)))return {url:'https://www.facebook.com/watch/?v='+m[1],key:'video:'+m[1],kind:'video'};
   if(['/watch','/video.php',''].includes(p)&&numeric.test(u.searchParams.get('v')||'')){const id=u.searchParams.get('v');return {url:'https://www.facebook.com/watch/?v='+id,key:'video:'+id,kind:'video'};}
   if((m=p.match(/^\/([^/]+)\/posts\/([A-Za-z0-9_-]+)$/))&&token.test(m[2]))return {url:'https://www.facebook.com/'+m[1]+'/posts/'+m[2]+'/',key:'post:'+m[2],kind:'post'};
   if(['/story.php','/permalink.php'].includes(p)&&token.test(u.searchParams.get('story_fbid')||'')){
    const id=u.searchParams.get('story_fbid'),owner=u.searchParams.get('id');
    return {url:'https://www.facebook.com'+p+'?story_fbid='+id+(numeric.test(owner||'')?'&id='+owner:''),key:'post:'+id,kind:'post'};
   }
   if((m=p.match(/^\/stories\/([^/]+)\/([^/]+)$/)))return {url:'https://www.facebook.com/stories/'+m[1]+'/'+m[2]+'/',key:'story:'+m[1]+':'+m[2],kind:'story'};
   if((m=p.match(/^\/share\/([rv])\/([A-Za-z0-9_-]+)$/))&&token.test(m[2]))return {url:'https://www.facebook.com/share/'+m[1]+'/'+m[2]+'/',key:'share:'+m[2],kind:'share'};
   return null;
  }catch(_){return null;}
 }
 function source(v){return [v.currentSrc||'',v.getAttribute('src')||'',...Array.from(v.querySelectorAll('source')).map(n=>n.getAttribute('src')||'')].join('|');}
 function scopes(v){const nodes=[];for(let n=v,d=0;n&&d<10;n=n.parentElement,d++){
  if(n!==v&&(n.matches('body,html,main,[role="feed"],[role="main"]')||n.querySelectorAll('video').length!==1))break;
  nodes.push(n);if(n.matches('article,[role="article"]'))break;
 }return nodes;}
 function evidence(v){
  const ids=new Set(),links=new Map(),nodes=scopes(v);let budget=120;
  const add=value=>{if(typeof value!=='string')return;const p=parse(value);if(p)links.set(p.key,p);};
  function data(obj,depth,videoContext){
   if(!obj||typeof obj!=='object'||depth>5||budget--<=0)return;
   if(Array.isArray(obj)){if(obj.length>1&&!videoContext)return;for(const x of obj.slice(0,12))data(x,depth+1,videoContext);return;}
   for(const key of ['videoID','video_id','videoId'])if(numeric.test(String(obj[key]||'')))ids.add(String(obj[key]));
   if(videoContext&&numeric.test(String(obj.id||'')))ids.add(String(obj.id));
   for(const key of ['permalink','permalink_url','share_url','video_url','url'])add(obj[key]);
   if(token.test(String(obj.top_level_post_id||''))&&numeric.test(String(obj.content_owner_id_new||'')))add('https://www.facebook.com/permalink.php?story_fbid='+obj.top_level_post_id+'&id='+obj.content_owner_id_new);
   for(const key of ['videoData','video_data','video','media','attachment','attachments','node','edges'])if(obj[key])data(obj[key],depth+1,videoContext||/video/i.test(key));
  }
  for(const n of nodes){
   for(const attr of ['data-video-id','data-videoid','data-video_id'])if(numeric.test(n.getAttribute(attr)||''))ids.add(n.getAttribute(attr));
   for(const attr of ['data-store','data-ft','data-video-data']){const raw=n.getAttribute(attr);if(raw&&raw.length<=80000)try{data(JSON.parse(raw),0,attr==='data-video-data');}catch(_){}}
  }
  const scope=nodes[nodes.length-1];if(scope)for(const a of Array.from(scope.querySelectorAll('a[href]')).slice(0,160))if(!a.closest('[role="dialog"],[aria-hidden="true"],[role="comment"]'))add(a.href);
  const route=parse(w.location.href);
  return {ids,links,route};
 }
 function remember(v){const e=evidence(v);baseline.set(v,{source:source(v),keys:new Set([...e.links.keys(),...Array.from(e.ids,id=>'video:'+id),...(e.route?[e.route.key]:[])])});}
 function resolve(v){
  if(!v||!v.isConnected)return {url:'',reason:'detached'};
  const e=evidence(v),old=baseline.get(v),s=source(v);
  const changed=old&&old.source!==s;
  const fresh=p=>p&&!(changed&&old.keys.has(p.key));
  if(e.ids.size>1)return {url:'',reason:'ambiguous-ids'};
  if(e.ids.size===1){const id=Array.from(e.ids)[0],p=parse('https://www.facebook.com/watch/?v='+id);if(fresh(p))return {...p,reason:'scoped-id'};return {url:'',reason:'stale-id'};}
  const candidates=Array.from(e.links.values()).filter(fresh);
  if(candidates.length===1)return {...candidates[0],reason:'scoped-link'};
  if(candidates.length>1)return {url:'',reason:'ambiguous-links'};
  // A route by itself can still name the first Reel after swiping: never export it.
  return {url:'',reason:changed?'stale-source':'missing-current-link'};
 }
 function safeMedia(v,value){
  const current=v.currentSrc,attr=v.getAttribute('src');
  if(current&&attr)try{if(new URL(current,w.location.href).href!==new URL(attr,w.location.href).href)return '';}catch(_){return '';}
  return value;
 }
 w.FproPublicVideoLink={parse,remember,resolve,safeMedia};
})(window);
