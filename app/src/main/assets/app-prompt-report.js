/* Explicit user-triggered report. No raw text, URLs, IDs/classes, attributes,
 * names, cookies, storage, media bytes or form values are returned. */
(()=>{
 'use strict';
 const norm=s=>(s||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F]/g,'').replace(/\s+/g,'').toLowerCase();
 const prompt=s=>/فتحالتطبيق|افتحالتطبيق|فتحفيالتطبيق|opentheapp|openapp|openinapp|usetheapp|gettheapp/.test(norm(s));
 const tags=new Set(['A','BUTTON','DIV','SPAN','HEADER','NAV','MAIN','ARTICLE','BODY','HTML','IFRAME','SVG']);
 const roles=new Set(['button','link','banner','navigation','toolbar','main','feed','article','dialog','alertdialog']);
 const positions=new Set(['static','relative','fixed','absolute','sticky']);
 const rect=el=>{const r=el.getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};};
 const semantic='a,button,[role="button"],[role="link"]',seen=new Set(),candidates=[];
 const decorated=el=>{const walk=document.createTreeWalker(el,4),parts=[];let node,n=0;while((node=walk.nextNode())&&n++<64){if(!node.parentElement.closest('svg title,svg desc,[aria-hidden="true"],script,style'))parts.push(node.nodeValue||'');}return parts.join(' ');};
 const priority=Array.from(document.querySelectorAll('[data-fpro-app-prompt],[data-fpro-reference-noapp],[data-fpro-prompt59-target]')).slice(0,64);
 // Manual viewport hit testing finds a visible header/footer control even when
 // a long feed has pushed its DOM position beyond the general report budget.
 if(document.elementsFromPoint)for(const y of [32,64,96,128,innerHeight-32,innerHeight-64])for(const fraction of [.1,.5,.9]){
  for(const hit of document.elementsFromPoint(innerWidth*fraction,Math.max(0,Math.min(innerHeight-1,y))).slice(0,2)){
   for(let el=hit,depth=0;el&&depth<4;el=el.parentElement,depth++)if(priority.length<208)priority.push(el);
  }
 }
 const sources=new Set([...priority,...Array.from(document.querySelectorAll('a,button,span,[role="button"],[role="link"],[aria-label]')).slice(0,2400)]);
 for(const source of sources){
  const text=source.textContent||'',aria=source.getAttribute('aria-label')||'';
  if(text.length>400||!prompt(text)&&!prompt(aria))continue;
  const control=source.closest(semantic),el=control||source;if(seen.has(el))continue;seen.add(el);
  const chain=[];for(let parent=el,depth=0;parent&&depth<8;parent=parent.parentElement,depth++){
   const css=getComputedStyle(parent),role=parent.getAttribute('role');
   chain.push({tag:tags.has(parent.tagName)?parent.tagName:'OTHER',role:roles.has(role)?role:null,position:positions.has(css.position)?css.position:'other',rect:rect(parent),displayNone:css.display==='none',navigation:window.FproNoapp&&window.FproNoapp.navigation?window.FproNoapp.navigation(parent):null,modal:parent.getAttribute('aria-modal')==='true',media:!!parent.querySelector('video,audio,iframe,canvas'),form:!!parent.querySelector('form,input,textarea,select'),controls:Math.min(25,parent.querySelectorAll(semantic).length)});
  }
  let eligible=null,targetKind=null;
  if(window.FproNoapp&&control){try{eligible=!!window.FproNoapp.target(control,true);const target=window.FproNoapp.target(control);targetKind=!target?'rejected':target===control?'control':'surface';}catch(_){targetKind='error';}}
  candidates.push({evidence:window.FproNoapp&&window.FproNoapp.evidence&&control?window.FproNoapp.evidence(control):null,semantic:!!control,rawTextPrompt:prompt(text),decoratedTextPrompt:prompt(decorated(el)),ariaPrompt:prompt(aria),decorativeTitle:!!el.querySelector('svg title,svg desc'),hiddenCaption:!!el.querySelector('[aria-hidden="true"]'),ownedIndependent:el.hasAttribute('data-fpro-prompt59-target'),ownedMain:el.hasAttribute('data-fpro-app-prompt'),ownedReference:el.hasAttribute('data-fpro-reference-noapp'),structuralEligible:eligible,targetKind,ancestors:chain});
  if(candidates.length>=16)break;
 }
 let frames=0,accessibleFrames=0;for(const frame of Array.from(document.querySelectorAll('iframe')).slice(0,32)){frames++;try{if(frame.contentDocument&&frame.contentDocument.documentElement)accessibleFrames++;}catch(_){}}
 return JSON.stringify({schema:4,independent:window.FproPrompt?window.FproPrompt.report():null,state:window.__fpro&&window.__fpro.promptState?window.__fpro.promptState():null,timing:{main:window.__fpro&&window.__fpro.promptTiming?window.__fpro.promptTiming():null,reference:window.FproNoapp&&window.FproNoapp.timing?window.FproNoapp.timing():null},engineInstalled:!!window.__fpro,referenceAvailable:!!window.FproNoapp,early:window.__fproEarly===true,reels:/^\/reels?(?:\/|$)/.test(location.pathname),viewport:{w:innerWidth,h:innerHeight},frames,accessibleFrames,candidates});
})()
