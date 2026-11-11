/* GPL-3.0-or-later. Current-element public permalink resolver; no polling/network. */
(function(w){
 'use strict';if(w.FproPublicVideoLink)return;
 const numeric=/^\d+$/, token=/^[A-Za-z0-9_-]{3,}$/;
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
   if((m=p.match(/^\/groups\/([^/]+)\/(?:posts|permalink)\/([A-Za-z0-9_-]+)$/))&&token.test(m[2]))return {url:'https://www.facebook.com/groups/'+m[1]+'/permalink/'+m[2]+'/',key:'post:'+m[2],kind:'post'};
   if((m=p.match(/^\/([^/]+)\/posts\/([A-Za-z0-9_-]+)$/))&&token.test(m[2]))return {url:'https://www.facebook.com/'+m[1]+'/posts/'+m[2]+'/',key:'post:'+m[2],kind:'post'};
   if(['/story.php','/permalink.php'].includes(p)&&token.test(u.searchParams.get('story_fbid')||'')){
    const id=u.searchParams.get('story_fbid'),owner=u.searchParams.get('id');
    return {url:'https://www.facebook.com'+p+'?story_fbid='+id+(numeric.test(owner||'')?'&id='+owner:''),key:'post:'+id,kind:'post'};
   }
   if((m=p.match(/^\/stories\/([^/]+)\/([^/]+)$/)))return {url:'https://www.facebook.com/stories/'+m[1]+'/'+m[2]+'/',key:'story:'+m[1]+':'+m[2],kind:'story'};
   if((m=p.match(/^\/share\/([rvp])\/([A-Za-z0-9_-]+)$/))&&token.test(m[2]))return {url:'https://www.facebook.com/share/'+m[1]+'/'+m[2]+'/',key:'share:'+m[2],kind:'share'};
   return null;
  }catch(_){return null;}
 }
 w.FproPublicVideoLink={parse};
})(window);
