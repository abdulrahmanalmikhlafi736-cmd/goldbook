(function(){
 'use strict';if(window.__fproAudio)return;
 var video=null,enabled=false,oldMuted=false,oldVolume=1,pipState=null,lastFailure=null;
 function area(v){var r=v.getBoundingClientRect();return Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))*Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left));}
 function current(allowPaused){var candidates=Array.from(document.querySelectorAll('video')).filter(function(v){return !v.ended&&(allowPaused||!v.paused);});candidates.sort(function(a,b){return area(b)-area(a);});return candidates[0]||null;}
 function sound(v){v.muted=false;if(v.volume===0)v.volume=1;}
 function play(v){if(!v||!v.isConnected)return;lastFailure=null;var promise=v.play();if(promise&&promise.catch)promise.catch(function(e){lastFailure=['NotAllowedError','NotSupportedError','AbortError'].indexOf(e.name)>=0?e.name:'Other';if(window.__fproReportPlayback)window.__fproReportPlayback();});}
 var api={get enabled(){return enabled;},
  preparePip:function(){var next=current(false)||(window.__fproLastPlayingVideo&&window.__fproLastPlayingVideo.isConnected?window.__fproLastPlayingVideo:null);if(!next)return false;if(!pipState||pipState.video!==next)pipState={video:next,muted:next.muted,volume:next.volume,wasPlaying:true};sound(next);return true;},
  enterPip:function(){if(!pipState)api.preparePip();if(!pipState)return false;var v=pipState.video;if(!v.isConnected)return false;sound(v);if(pipState.wasPlaying&&v.paused)play(v);return true;},
  leavePip:function(){if(pipState&&!enabled){var v=pipState.video;if(v.muted===false)v.muted=pipState.muted;if(pipState.volume===0&&v.volume===1)v.volume=0;}pipState=null;},
  enable:function(){var next=current(false)||(pipState&&pipState.wasPlaying&&pipState.video.isConnected?pipState.video:null);if(!next)return false;if(enabled&&video===next)return true;if(enabled)api.disable();video=next;oldMuted=pipState&&pipState.video===next?pipState.muted:video.muted;oldVolume=pipState&&pipState.video===next?pipState.volume:video.volume;enabled=true;sound(video);if(video.paused&&pipState&&pipState.wasPlaying)play(video);return true;},
  disable:function(){enabled=false;if(video){if(video.muted===false)video.muted=oldMuted;if(oldVolume===0&&video.volume===1)video.volume=0;}video=null;},
  pause:function(){if(video)video.pause();},play:function(){play(video);},stop:function(){if(video)video.pause();api.disable();},
  report:function(){var v=video||(pipState&&pipState.video)||current(false);return {audioOnly:enabled,pipPrepared:!!pipState,playFailure:lastFailure,video:!!v,paused:v? v.paused:null,muted:v?v.muted:null,volume:v?v.volume:null,readyState:v?v.readyState:null,error:v&&v.error?v.error.code:null};}
 };
 window.__fproAudio=api;
 ['visibilitychange','webkitvisibilitychange'].forEach(function(type){window.addEventListener(type,function(e){if(enabled)e.stopImmediatePropagation();},true);});
})();
