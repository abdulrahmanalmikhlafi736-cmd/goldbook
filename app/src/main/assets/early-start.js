/* Runs before site JavaScript when DOCUMENT_START_SCRIPT is supported. */
(function(){
 'use strict';if(window.top!==window)return;window.__fproEarly=true;
 // Capture guards precede Meta's window handlers, without cancelling native selection.
 window.addEventListener('pointerdown',function(e){if(window.__fpro&&window.__fpro.readPress(e))e.stopImmediatePropagation();},true);
 window.addEventListener('touchstart',function(e){if(window.__fpro&&window.__fpro.readTouch(e))e.stopImmediatePropagation();},{capture:true,passive:true});
 ['selectstart','contextmenu'].forEach(function(type){window.addEventListener(type,function(e){if(window.__fpro&&window.__fpro.readingEvent(e))e.stopImmediatePropagation();},true);});
 ['visibilitychange','webkitvisibilitychange'].forEach(function(type){window.addEventListener(type,function(e){if(window.__fproAudio&&window.__fproAudio.enabled)e.stopImmediatePropagation();},true);});
 function boot(){if(!document.body||!document.head)return false;if(!window.__fpro){__FPRO_SOURCE__}return true;}
 if(!boot()){var observer=new MutationObserver(function(){if(boot())observer.disconnect();});observer.observe(document,{childList:true,subtree:true});}
})();
