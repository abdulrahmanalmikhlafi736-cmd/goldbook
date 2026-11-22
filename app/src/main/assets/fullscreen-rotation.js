/* Register before site listeners: Blink dispatches window-target resize listeners
 * in registration order, including capture listeners. No site API is patched. */
(function(){
 'use strict';
 if(window.top!==window||window.FproFullscreenRotation)return;
 let active=false;
 function protect(event){if(active)event.stopImmediatePropagation();}
 window.addEventListener('resize',protect,true);
 window.addEventListener('orientationchange',protect,true);
 function exited(){if(!document.fullscreenElement&&!document.webkitFullscreenElement)active=false;}
 document.addEventListener('fullscreenchange',exited);
 document.addEventListener('webkitfullscreenchange',exited);
 window.FproFullscreenRotation={begin(){active=true;},end(){active=false;},isActive(){return active;}};
})();
