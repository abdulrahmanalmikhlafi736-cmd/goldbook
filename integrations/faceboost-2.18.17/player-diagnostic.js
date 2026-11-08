/* GPL-3.0-or-later. Opt-in, per-click structural diagnostics only.
 * Never export IDs, URLs, text, cookies, tokens, raw attributes or React objects.
 * Numeric schema is independently allowlisted again by the Android receiver.
 */
(function(w){
 'use strict';if(w.FproPlayerDiagnostic)return;
 const branches=['children','props','coreVideoPlayerMetaData','videoPlayerConfig','videoData','video_data','video','data','node','media','videoDeliveryLegacyFields'];
 const fields=['videoFBID','videoId','videoID','video_id','fbid','id'];
 const tags=['video','div','article','section','main','span'];
 function sourceKind(v){const s=v.currentSrc||v.getAttribute('src')||'';if(!s)return 0;if(s.startsWith('blob:'))return 1;try{const u=new URL(s);if(u.protocol==='https:')return /(^|\.)fbcdn\.net$/.test(u.hostname)?2:3;}catch(_){}return 4;}
 function visible(n){const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<w.innerHeight&&r.right>0&&r.left<w.innerWidth;}
 function share(n){const s=(n.getAttribute('aria-label')||n.textContent||'').trim();return s.length<80&&/^(?:مشاركة|شارك|إرسال|share|share now|send)(?:\s|$)/i.test(s);}
 function capture(v){
  if(!v||!v.isConnected||v.ownerDocument!==w.document||!/(^|\.)facebook\.com$/.test(w.location.hostname))return null;
  const r={schema:1,route:/\/reels?\//.test(w.location.pathname)?1:/\/watch/.test(w.location.pathname)?2:3,source:sourceKind(v),videos:Math.min(200,w.document.querySelectorAll('video').length),topFrame:w===w.top?1:0,limited:0,hosts:[],hits:[],near:{buttons:0,actions:0,mcomponents:0,shares:0,svg:0,permalinks:0}};
  const seen=new WeakSet();let budget=200,bytes=0;
  function walk(p,depth,level,origin,path){
   if(!p||typeof p!=='object'||seen.has(p))return;
   if(depth>7||budget--<=0){r.limited=1;return;}seen.add(p);
   if(Array.isArray(p)){for(let i=0;i<Math.min(8,p.length);i++){const d=Object.getOwnPropertyDescriptor(p,String(i));if(d&&'value'in d)walk(d.value,depth+1,level,origin,path.concat(11));}return;}
   for(let f=0;f<fields.length;f++){
    const d=Object.getOwnPropertyDescriptor(p,fields[f]);if(!d)continue;
    if(r.hits.length>=32){r.limited=1;break;}
    const value='value'in d?d.value:undefined;
    const type=!('value'in d)?5:value===null?0:typeof value==='string'?1:typeof value==='number'?2:typeof value==='object'?3:4;
    const digits=type===1?/^[1-9]\d{4,29}$/.test(value):type===2?Number.isSafeInteger(value)&&value>9999:false;
    r.hits.push({level,origin,path:path.slice(0,8),field:f,type,digits:digits?1:0});
   }
   for(let i=0;i<branches.length;i++){const d=Object.getOwnPropertyDescriptor(p,branches[i]);if(d&&'value'in d)walk(d.value,depth+1,level,origin,path.concat(i));}
  }
  for(let n=v,level=0;n&&level<8;n=n.parentElement,level++){
   if(n!==v&&(n.matches('body,html,main,[role="feed"],[role="main"]')||n.querySelectorAll('video').length>1))break;
   const names=Object.getOwnPropertyNames(n),keys=names.slice(0,200);if(names.length>200)r.limited=1;
   const h={level,tag:Math.max(0,tags.indexOf(n.localName)+1),props:0,fiber:0,store:n.hasAttribute('data-store')?1:0,component:n.hasAttribute('data-mcomponent')?1:0,action:n.hasAttribute('data-action-id')?1:0};r.hosts.push(h);
   for(const key of keys){
    const isProps=key.startsWith('__reactProps'),isFiber=key.startsWith('__reactFiber$')||key.startsWith('__reactInternalInstance$');
    if(!isProps&&!isFiber)continue;if(isProps)h.props++;else h.fiber++;
    const d=Object.getOwnPropertyDescriptor(n,key);if(!d||!('value'in d))continue;
    if(isProps)walk(d.value,0,level,0,[]);
    else {let f=d.value;const fibers=new WeakSet();for(let j=0;f&&typeof f==='object'&&j<8&&!fibers.has(f);j++){
     fibers.add(f);const state=Object.getOwnPropertyDescriptor(f,'stateNode')?.value;if(state instanceof w.Element&&(state.matches('body,html,main,[role="feed"],[role="main"]')||state.querySelectorAll('video').length>1))break;
     for(const k of ['memoizedProps','pendingProps']){const pd=Object.getOwnPropertyDescriptor(f,k);if(pd&&'value'in pd)walk(pd.value,0,level,1,[]);}
     f=Object.getOwnPropertyDescriptor(f,'return')?.value;
    }}
   }
   for(const [origin,attr]of [[2,'data-store'],[3,'data-video-data'],[4,'data-mcomponent-data']]){
    const raw=n.getAttribute(attr);if(!raw)continue;if(raw.length>20000||bytes+raw.length>40000){r.limited=1;continue;}bytes+=raw.length;try{walk(JSON.parse(raw),0,level,origin,[]);}catch(_){}
   }
   if(n!==v&&n.matches('article,[role="article"]'))break;
  }
  const box=v.getBoundingClientRect(),candidates=w.document.querySelectorAll('button,[role="button"],a,[data-action-id],[data-mcomponent],svg');
  if(candidates.length>500)r.limited=1;
  for(let i=0;i<Math.min(500,candidates.length);i++){const n=candidates[i];if(!visible(n))continue;const b=n.getBoundingClientRect();if(b.bottom<box.top-120||b.top>box.bottom+300)continue;
   if(n.matches('button,[role="button"]'))r.near.buttons++;if(n.hasAttribute('data-action-id'))r.near.actions++;if(n.hasAttribute('data-mcomponent'))r.near.mcomponents++;if(n.localName==='svg')r.near.svg++;if(n.localName==='a'&&w.FproPublicVideoLink?.parse(n.getAttribute('href')||''))r.near.permalinks++;if(share(n))r.near.shares++;
  }
  return r;
 }
 function begin(v){const report=capture(v);if(!report)return false;w.location.href='fpro://player-diagnostic?data='+encodeURIComponent(JSON.stringify(report));return true;}
 w.FproPlayerDiagnostic={capture,begin};
})(window);
