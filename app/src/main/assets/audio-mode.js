(function(){
 'use strict';if(window.__fproAudio)return;
 var video=null,enabled=false,oldMuted=false,oldVolume=1;
 function current(){var candidates=Array.from(document.querySelectorAll('video')).filter(function(v){return !v.paused&&!v.ended;});candidates.sort(function(a,b){function area(v){var r=v.getBoundingClientRect();return Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))*Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left));}return area(b)-area(a);});return candidates[0]||null;}
 var api={get enabled(){return enabled;},enable:function(){var next=current();if(!next)return false;if(enabled&&video===next)return true;if(enabled)api.disable();video=next;oldMuted=video.muted;oldVolume=video.volume;enabled=true;video.muted=false;if(!video.volume)video.volume=1;return true;},disable:function(){enabled=false;if(video){if(video.muted===false)video.muted=oldMuted;if(oldVolume===0&&video.volume===1)video.volume=oldVolume;}video=null;},pause:function(){if(video)video.pause();},play:function(){if(video&&video.isConnected){var result=video.play();if(result&&result.catch)result.catch(function(){if(window.__fproReportPlayback)window.__fproReportPlayback();});}},stop:function(){if(video)video.pause();api.disable();}};
 window.__fproAudio=api;
 // Also works on engines without document-start support; no polling/replay loop.
 ['visibilitychange','webkitvisibilitychange'].forEach(function(type){window.addEventListener(type,function(e){if(enabled)e.stopImmediatePropagation();},true);});
})();
