/* GPL-3.0-or-later. Diagnostic V2: local-first mobile share topology, never click.
 * Only numeric categories/geometry are exported; no labels, action IDs, URLs or text.
 */
(function(w){
 'use strict';const base=w.FproPlayerDiagnostic;if(!base||base.mobileV2)return;
 const d=w.document,owned='.fpro-video-tools,[data-fpro-owned],#mb-share-via';
 const selector='button,[role="button"],a,[data-action-id]';
 const norm=s=>String(s||'').replace(/[\u064B-\u065F\u061C\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g,'').replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}]/gu,' ').replace(/\s+/g,' ').trim().toLowerCase();
 function label(n){
  for(const [key,source]of [['aria-label',1],['title',2]]){const s=n.getAttribute(key);if(s)return {s:norm(s),source};}
  const ids=n.getAttribute('aria-labelledby');if(ids){const s=norm(ids.split(/\s+/).slice(0,8).map(id=>d.getElementById(id)?.textContent||'').join(' '));if(s)return {s,source:3};}
  return {s:norm(n.textContent||''),source:4};
 }
 function classify(s){if(s.length>100)return 0;
  if(/^(?:copy link|نسخ الرابط|نسخ رابط الفيديو|نسخ رابط المنشور)$/.test(s))return 3;
  if(/^(?:share(?: (?:video|reel|post))?|مشاركة(?: (?:هذا )?(?:الفيديو|الريلز|المنشور))?|خيارات المشاركة|مشاركه|شارك(?: (?:الفيديو|الريلز|المنشور))?)(?:\s*[\d٠-٩.,٬]+)?$/.test(s))return 1;
  return /^(?:share|send|مشاركة|شارك|إرسال)(?:\s|$)/.test(s)?2:0;
 }
 function mobile(v){
  let reasons=0,localVisited=0,pointChecks=0;const rects=new WeakMap(),styles=new WeakMap();
  const box=n=>{if(!rects.has(n))rects.set(n,n.getBoundingClientRect());return rects.get(n);};
  function visible(n){if(!n?.isConnected||n.closest('[hidden],[aria-hidden="true"]'))return false;const r=box(n);if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=w.innerHeight||r.right<=0||r.left>=w.innerWidth)return false;
   for(let p=n,i=0;p&&i<16;p=p.parentElement,i++){if(!styles.has(p))styles.set(p,w.getComputedStyle(p));const s=styles.get(p);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}return true;
  }
  const vb=box(v),width=Math.max(1,w.innerWidth),height=Math.max(1,w.innerHeight);
  const q=(n,scale)=>Math.max(-2000,Math.min(3000,Math.round(n/scale*1000)));
  const geometry=n=>{const r=box(n);return {x:q(r.left,width),y:q(r.top,height),w:q(r.width,width),h:q(r.height,height)};};
  const ancestors=[];let root=v,stop=0;
  for(let p=v.parentElement,i=1;p&&i<=12;p=p.parentElement,i++){
   if(p.matches('body,html,main,[role="feed"],[role="main"]')){stop=1;break;}
   if(p.querySelectorAll('video').length!==1){stop=2;break;}
   ancestors.push(p);root=p;if(p.matches('article,[role="article"]')){stop=3;break;}
   if(i===12){stop=4;reasons|=8;}
  }
  function relation(n){for(let p=n,i=0;p&&i<14;p=p.parentElement,i++){
   if(p.matches('body,html,main,[role="feed"],[role="main"]'))return 3;
   const videos=p.querySelectorAll('video');if(videos.length){if(videos.length===1)return videos[0]===v?0:1;return 2;}
  }return 3;}
  const rows=new Map(),seen=new WeakSet(),canonical=new WeakMap();
  function consider(n,via){if(!n)return;if(seen.has(n)){const old=rows.get(canonical.get(n));if(old)old.via|=via;return;}seen.add(n);if(n.closest(owned)||!visible(n))return;
   const l=label(n),kind=classify(l.s);if(!kind){const r=box(n);if(!n.matches('button,[role="button"],[data-action-id]')||r.width*r.height>width*height*.25||r.height>height*.25||r.bottom<vb.top-120||r.top>vb.bottom+300)return;}
   let target=null,depth=0;for(let p=n,j=0;p&&j<6;p=p.parentElement,j++)if(p.matches(selector)){target=p;depth=j+1;break;}
   target=target||n;if(!visible(target)||target.closest(owned))return;
   if(rows.size>=96&&!rows.has(target)){reasons|=4;return;}
   const r=box(target),old=rows.get(target),rel=relation(target);
   let ownerLevel=13;for(let i=0;i<ancestors.length;i++)if(ancestors[i].contains(target)){ownerLevel=i+1;break;}
   canonical.set(n,target);
   const row={label:kind,oldLabel:classify(label(target).s)===1?1:0,labelSource:l.source,tag:({button:1,a:2,div:3,span:4,svg:5})[target.localName]||0,role:target.getAttribute('role')==='button'?1:target.getAttribute('role')==='link'?2:0,action:target.hasAttribute('data-action-id')?1:0,component:target.hasAttribute('data-mcomponent')?1:0,actionDepth:depth,relation:rel,ownerLevel,via:via|(old?.via||0),members:(old?.members||0)+1,
    oldSelector:target.matches('button,[role="button"],a[data-sigil~="share"]')?1:0,
    oldBounds:r.left>=vb.left-40&&r.right<=vb.right+40&&r.top>=vb.top-40&&r.bottom<=vb.bottom+110?1:0,
    portalBounds:r.top>=Math.max(0,vb.top)&&r.bottom<=Math.min(height,vb.bottom)?1:0,...geometry(target)};
   if(!old||[3,0,2,1][kind]<[3,0,2,1][old.label]){rows.set(target,row);}else {old.members++;old.via|=via;}
  }
  // Start from the selected player's single-video owner, never document's first N nodes.
  const walker=d.createTreeWalker(root,w.NodeFilter.SHOW_ELEMENT);let node=root;
  while(node){if(localVisited++>=1800){reasons|=2;break;}consider(node,1);node=walker.nextNode();}
  // Visible portal rails are sampled by bounded hit testing, independent of feed length.
  if(typeof d.elementsFromPoint==='function'){
   const xs=[.04,.085,.15,.3,.5,.7,.85,.915,.96];
   for(let yi=0;yi<31;yi++)for(const x of xs){pointChecks++;const stack=d.elementsFromPoint(width*x,height*(.02+yi*.96/30));
    for(const hit of stack.slice(0,8)){let p=hit;for(let i=0;p&&i<6;p=p.parentElement,i++)consider(p,2);}
   }
  }else reasons|=16;
  const videos=Array.from(d.querySelectorAll('video'));let visibleVideos=0,oldVisibleVideos=0;for(const p of videos.slice(0,200)){
   if(visible(p))visibleVideos++;
   const r=box(p),s=w.getComputedStyle(p);if(p.isConnected&&!p.closest('[hidden],[aria-hidden="true"]')&&r.width>0&&r.height>0&&r.bottom>0&&r.top<height&&r.right>0&&r.left<width&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0')oldVisibleVideos++;
  }if(videos.length>200)reasons|=32;
  const candidates=Array.from(rows.values()).sort((a,b)=>[3,0,2,1][a.label]-[3,0,2,1][b.label]||a.relation-b.relation||Math.abs(a.y-vb.bottom/height*1000)-Math.abs(b.y-vb.bottom/height*1000));
  if(candidates.length>12)reasons|=4;
  return {stop,ownerDepth:ancestors.length,visibleVideos,oldVisibleVideos,selectedVisible:visible(v)?1:0,localVisited,pointChecks,limitReasons:reasons,video:geometry(v),candidates:candidates.slice(0,12)};
 }
 function capture(v){const r=base.capture(v);if(!r)return null;r.schema=2;r.legacyLimited=r.limited;r.mobile=mobile(v);r.limited=r.limited||r.mobile.limitReasons?1:0;return r;}
 function begin(v){const r=capture(v);if(!r)return false;w.location.href='fpro://player-diagnostic?data='+encodeURIComponent(JSON.stringify(r));return true;}
 w.FproPlayerDiagnostic={capture,begin,mobileV2:true};
})(window);
