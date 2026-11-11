/* GPL-3.0-or-later. Current-player post links, plus explicit Story-only current MP4 handoff.
 * videoFBID extraction and MIT upstream attribution: react-video-permalink.js.
 */
(function(w){
 'use strict';if(w.FproPlayerPostDownload)return;
 function begin(video){
  if(w.FproStoryVideoDownload?.begin(video))return {sent:true,reason:'current-story-mp4'};
  const result=w.FproReactVideoPermalink.resolve(video);
  const parsed=result.kind==='permalink'&&w.FproPublicVideoLink.parse(result.url||'');
  if(parsed){
   // Empty media is intentional: even a failed native validation must not fall back to CDN.
   w.location.href='fpro://download?copy=0&media=&link='+encodeURIComponent(parsed.url);
   return {sent:true,reason:result.reason};
  }
  // Only a fresh official Copy action bound to this same player can supply a fallback.
  // No currentSrc, data-store.src, efg/xpv_asset_id, page-route guess or first-playing video.
  w.FproOfficialDownload.begin(video);
  return {sent:false,reason:result.reason||'missing-player-post-link'};
 }
 w.FproPlayerPostDownload={begin};
})(window);
