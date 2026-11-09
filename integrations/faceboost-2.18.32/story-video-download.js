/* GPL-3.0-or-later. Explicit-click-only exact current Story MP4 handoff to Seal.
 * No network, source scanning, clipboard, cookies, guessed links or timers.
 */
(function(w){
 'use strict';if(w.FproStoryVideoDownload)return;
 function resolve(v){
  try{
   const page=new URL(w.location.href);
   if(w!==w.top||page.protocol!=='https:'||page.username||page.password||(page.port&&page.port!=='443')||!/(^|\.)facebook\.com$/i.test(page.hostname)||!/^\/stories(?:\/.*|\.php)?$/.test(page.pathname))return '';
   if(!v||v.localName!=='video'||!v.isConnected||v.ownerDocument!==w.document)return '';
   function visible(n){if(n.closest('[hidden],[aria-hidden="true"]'))return false;const r=n.getBoundingClientRect();if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=w.innerHeight||r.right<=0||r.left>=w.innerWidth)return false;for(let p=n,i=0;p&&i<20;p=p.parentElement,i++){const s=w.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}return true;}
   if(!visible(v))return '';
   const videos=w.document.querySelectorAll('video');if(videos.length>200)return '';
   // Never choose the document's first/playing video, or guess between two visible stories.
   if(Array.from(videos).filter(visible).length!==1)return '';
   const current=v.currentSrc||'',attr=v.getAttribute('src')||'';
   if(current&&attr&&new URL(current,page.href).href!==new URL(attr,page.href).href)return '';
   const source=current||attr;if(!source||source.length>8192)return '';
   const u=new URL(source);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hash||!/(^|\.)fbcdn\.net$/i.test(u.hostname)||!u.pathname.toLowerCase().endsWith('.mp4'))return '';
   return u.href;
  }catch(_){return '';}
 }
 function begin(v){const media=resolve(v);if(!media)return false;w.location.href='fpro://download?kind=story-video&copy=0&link=&media='+encodeURIComponent(media);return true;}
 w.FproStoryVideoDownload={resolve,begin};
})(window);
