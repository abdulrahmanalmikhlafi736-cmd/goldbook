/* GPL-3.0-or-later. Video downloads use only the explicit official Share -> Copy transaction. */
(function(w){
 'use strict';if(w.FproPlayerPostDownload)return;
 function begin(video){if(/^\/stories(?:\/|\.php|$)/.test(w.location.pathname))return w.FproStoryVideoDownload.begin(video);return w.FproOfficialDownload.begin(video);}
 w.FproPlayerPostDownload={begin};
})(window);
