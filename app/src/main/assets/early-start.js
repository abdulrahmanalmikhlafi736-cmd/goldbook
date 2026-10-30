/* Runs before site JavaScript when DOCUMENT_START_SCRIPT is supported. */
(function(){
 'use strict';if(window.top!==window)return;window.__fproEarly=true;
 // Native selection is configured by boot; production scopes it to post content.
 ['visibilitychange','webkitvisibilitychange'].forEach(function(type){window.addEventListener(type,function(e){if(window.__fproAudio&&window.__fproAudio.enabled)e.stopImmediatePropagation();},true);});
 function boot(){if(!document.body||!document.head)return false;if(!window.__fpro){__FPRO_SOURCE__}return true;}
 if(!boot()){var observer=new MutationObserver(function(){if(boot())observer.disconnect();});observer.observe(document,{childList:true,subtree:true});}
})();
