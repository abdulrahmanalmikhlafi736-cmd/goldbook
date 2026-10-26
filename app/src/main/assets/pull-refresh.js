// A one-shot native pull eligibility query. Not a listener or polling loop.
(function(nativeX,nativeY,nativeWidth){
 'use strict';
 if(!document.body||document.hidden||document.fullscreenElement)return false;
 var selection=window.getSelection();if(selection&&!selection.isCollapsed)return false;
 var active=document.activeElement;
 if(active&&(active.matches('input,textarea,select')||active.isContentEditable))return false;
 var root=document.scrollingElement||document.documentElement;
 if(window.scrollY>1||root.scrollTop>1)return false;
 var scale=window.innerWidth/nativeWidth;
 var node=document.elementFromPoint(nativeX*scale,nativeY*scale);
 if(!node||node.closest('input,textarea,select,video,audio,iframe,canvas,[contenteditable]:not([contenteditable="false"]),.fpro-video-tools,[role="menu"],[role="dialog"]'))return false;
 for(var i=0;node&&i<32;i++,node=node.parentElement){
  // A semantic article may itself be role=button, but its real actions must
  // remain untouched. Reading wrappers keep their native text-selection path.
  if(!node.matches('article,[role="article"],[role="comment"]')&&node.matches('a,button,[role="button"],[role="slider"]')&&!node.querySelector('p,[dir="auto"],[data-ad-preview="message"]'))return false;
  if(node.scrollHeight>node.clientHeight+1&&node.scrollTop>1&&/auto|scroll|overlay/.test(getComputedStyle(node).overflowY))return false;
 }
 return !node; // Reject unusually deep/unknown trees rather than guess.
})(__X__,__Y__,__WIDTH__);
