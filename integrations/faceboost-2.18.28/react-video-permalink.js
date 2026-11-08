/* Current-element adaptation, GPL-3.0-or-later integration.
 * MIT upstream attribution: Copyright (c) 2026 Trịnh Xuân Thuỷ (Bluemaster);
 * Copyright (c) 2022 Hoang Tran (Useful Scripts); Copyright (c) 2026 tazihad (Bengal DM).
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * Immutable upstream links: RESEARCH.md. Only scoped ID reading is adapted;
 * no network interception, token access, global player selection or polling.
 */
(function(w){
 'use strict';if(w.FproReactVideoPermalink)return;
 const base=new WeakMap(),boundary='body,html,main,[role="feed"],[role="main"]';
 function id(value){
  if(typeof value==='number'&&!Number.isSafeInteger(value))return '';
  if(typeof value!=='string'&&typeof value!=='number')return '';
  const s=String(value);return /^[1-9]\d{4,29}$/.test(s)?s:'';
 }
 function fingerprint(v){return [v.currentSrc||'',v.getAttribute('src')||'',...Array.from(v.querySelectorAll('source')).map(s=>s.getAttribute('src')||'')].join('|');}
 function inspect(v){
  let budget=100;const seenProps=new WeakSet(),seenFiber=new WeakSet();
  function props(p,depth=0,out=new Set()){
   if(!p||typeof p!=='object'||depth>4||budget--<=0||seenProps.has(p))return out;
   seenProps.add(p);
   if(Array.isArray(p)){for(const c of p.slice(0,8))props(c,depth+1,out);return out;}
   const add=x=>{const value=id(x);if(value)out.add(value);};
   add(p.videoFBID);
   for(const meta of [p.coreVideoPlayerMetaData,p.videoPlayerConfig?.coreVideoPlayerMetaData,p.videoData?.coreVideoPlayerMetaData])if(meta&&typeof meta==='object')add(meta.videoFBID);
   // Only known React children/props paths, not arbitrary object-graph traversal.
   if(p.children)props(p.children,depth+1,out);
   if(p.props)props(p.props,depth+1,out);
   return out;
  }
  function hostBoundary(n){return n instanceof w.Element&&(n.matches(boundary)||n.querySelectorAll('video').length>1);}
  try{
   const hosts=[];
   for(let n=v,depth=0;n&&depth<5;n=n.parentElement,depth++){
    if(n!==v&&hostBoundary(n))break;
    hosts.push({n,keys:Object.getOwnPropertyNames(n).slice(0,200)});
    if(n!==v&&n.matches('article,[role="article"]'))break;
   }
   // DOM React props are updated directly; prefer them to a possibly old owning fiber tree.
   for(const {n,keys}of hosts){
    const ids=new Set();
    for(const key of keys)if(key.startsWith('__reactProps')){
     const descriptor=Object.getOwnPropertyDescriptor(n,key);
     if(descriptor&&'value'in descriptor)for(const value of props(descriptor.value))ids.add(value);
    }
    if(ids.size)return {ids,via:'react-props'};
   }
   for(const {n,keys}of hosts){
    for(const key of keys)if(key.startsWith('__reactFiber$')||key.startsWith('__reactInternalInstance$')){
     const descriptor=Object.getOwnPropertyDescriptor(n,key);let fiber=descriptor&&'value'in descriptor?descriptor.value:null;
     for(let level=0;fiber&&typeof fiber==='object'&&level<8;level++,fiber=fiber.return){
      if(seenFiber.has(fiber)||hostBoundary(fiber.stateNode))break;seenFiber.add(fiber);
      const found=props(fiber.memoizedProps);
      // React may keep the previous committed tree in alternate. Disagreement is not a current ID.
      if(fiber.alternate)props(fiber.alternate.memoizedProps,0,found);
      if(found.size)return {ids:found,via:'react-fiber'};
     }
    }
   }
  }catch(_){return {ids:new Set(),via:'unreadable'};}
  return {ids:new Set(),via:'missing'};
 }
 function remember(v){if(!v||base.has(v))return;const found=inspect(v);base.set(v,{source:fingerprint(v),ids:found.ids});}
 function resolve(v){
  if(!v||!v.isConnected||v.ownerDocument!==w.document||!/(^|\.)facebook\.com$/.test(w.location.hostname))return {url:'',reason:'invalid-context'};
  const current=v.currentSrc||'',attr=v.getAttribute('src')||'';
  if(current&&attr)try{if(new URL(current,w.location.href).href!==new URL(attr,w.location.href).href)return {url:'',reason:'source-transition'};}catch(_){return {url:'',reason:'source-transition'};}
  const found=inspect(v),previous=base.get(v),source=fingerprint(v);
  const changed=previous&&previous.source.replace(/\|/g,'')!==''&&previous.source!==source;
  if(found.ids.size!==1)return {url:'',reason:found.ids.size>1?'ambiguous-react-id':found.via};
  const value=Array.from(found.ids)[0];
  if(changed&&previous.ids.has(value))return {url:'',reason:'stale-react-id'};
  base.set(v,{source,ids:found.ids}); // Keep the last verified clip, not just the first attached clip.
  return {url:'https://www.facebook.com/watch/?v='+value,kind:'permalink',reason:found.via};
 }
 w.FproReactVideoPermalink={remember,resolve};
})(window);
