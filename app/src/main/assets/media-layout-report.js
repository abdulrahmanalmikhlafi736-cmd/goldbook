/* Explicit user-triggered geometry report. Never export page text, attributes,
 * selectors, IDs/classes, media URLs, pixels, cookies, storage or form values. */
(()=>{
 'use strict';
 const n=v=>Number.isFinite(Number(v))?Math.round(Number(v)*10)/10:0;
 const box=el=>{const r=el.getBoundingClientRect();return {x:n(r.left),y:n(r.top),w:n(r.width),h:n(r.height)};};
 const roles=new Set(['slider','progressbar','button','link','dialog','main','article','feed','navigation']);
 const positions=new Set(['static','relative','absolute','fixed','sticky']);
 const nodes=[],index=new Map();
 function add(el){if(!el||el.nodeType!==1)return null;if(index.has(el))return index.get(el);if(nodes.length>=80)return null;const id=nodes.length;index.set(el,id);nodes.push(null);
  const c=getComputedStyle(el),role=el.getAttribute('role');
  const label=[el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('aria-valuetext')].filter(Boolean).join(' ');
  const transform=/^(none|matrix(?:3d)?\([\d\s.,eE+\-]+\))$/.test(c.transform)?c.transform:'other';
  nodes[id]={tag:['DIV','SPAN','VIDEO','INPUT','BUTTON','MAIN','ARTICLE','SECTION','BODY','HTML','P','A','SVG'].includes(el.tagName.toUpperCase())?el.tagName.toUpperCase():'OTHER',role:roles.has(role)?role:null,rect:box(el),position:positions.has(c.position)?c.position:'other',visible:c.display!=='none'&&c.visibility!=='hidden',opacity:n(c.opacity),transform,z:n(parseInt(c.zIndex,10)),range:el.matches('input[type="range"]'),seekLabel:/seek|progress|timeline|playback|تقدم|تقديم|وقت|موضع|مدة/i.test(label),volumeLabel:/volume|sound|brightness|صوت|سطوع/i.test(label),own:!!el.closest('.fpro-video-tools'),hiddenSeek:el.hasAttribute('data-fpro-native-seek')};return id;
 }
 const visible=Array.from(document.querySelectorAll('video')).filter(v=>{const r=v.getBoundingClientRect(),c=getComputedStyle(v);return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&c.display!=='none'&&c.visibility!=='hidden';}).sort((a,b)=>Number(a.paused)-Number(b.paused));
 const video=visible[0];
 const ancestors=[];for(let el=video,depth=0;el&&depth<12;el=el.parentElement,depth++)ancestors.push(add(el));
 const semantic=[];for(const el of Array.from(document.querySelectorAll('input[type="range"],[role="slider"],[role="progressbar"],[aria-valuemin][aria-valuemax]')).slice(0,120)){const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight+160)semantic.push(add(el));}
 const hits=[];if(document.elementsFromPoint){for(const offset of [8,16,24,32,48,64,96,128])for(const fraction of [.15,.5,.85]){const x=innerWidth*fraction,y=innerHeight-offset;const found=document.elementsFromPoint(x,y);const chain=[];for(const start of found.slice(0,2)){let el=start;for(let depth=0;el&&depth<3;el=el.parentElement,depth++){const id=add(el);if(id!==null&&!chain.includes(id))chain.push(id);}}hits.push({x:n(x),y:n(y),nodes:chain});}}
 const own=Array.from(document.querySelectorAll('.fpro-video-tools')).slice(0,8).map(el=>({hidden:el.hidden,box:box(el),track:el.querySelector('.fpro-track')?box(el.querySelector('.fpro-track')):null,transport:el.querySelector('.fpro-transport')?{hidden:el.querySelector('.fpro-transport').hidden,box:box(el.querySelector('.fpro-transport'))}:null}));
 const vv=window.visualViewport;
 return JSON.stringify({schema:1,installedEngine:window.__fpro?true:false,route:{reels:/^\/reels?(?:\/|$)/.test(location.pathname),watch:/^\/watch(?:\/|$)/.test(location.pathname),fullscreen:!!document.fullscreenElement},viewport:{width:n(innerWidth),height:n(innerHeight),root:box(document.documentElement),body:box(document.body),native:window.__fproViewport?{width:n(window.__fproViewport.width),height:n(window.__fproViewport.height)}:null,visual:vv?{width:n(vv.width),height:n(vv.height),top:n(vv.offsetTop),scale:n(vv.scale)}:null},video:video?{node:add(video),controls:video.controls,paused:video.paused,ready:video.readyState,rainbow:video.hasAttribute('data-fpro-rainbow'),ancestors}:null,semantic,nodes,hits,own});
})()
