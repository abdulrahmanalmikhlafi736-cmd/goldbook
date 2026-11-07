#!/usr/bin/env python3
"""Apply the scoped media update to pinned Faceboost Almekhlafi 2.18.4.
No changes to CTA, themes, copy, audio, applicationId or signing.
"""
import pathlib, shutil, sys
root = pathlib.Path(sys.argv[1]).resolve()
here = pathlib.Path(__file__).resolve().parent
base = root / 'app/src/main'
p = base / 'assets/facebook.js'
s = p.read_text()
assert "videoBar:'native-weld+shared-line+watchdog'" in s, 'Unexpected source version'
start = s.index(' function playerViewportBottom()')
end = s.index(' // A document-level capture listener', start)
s = s[:start] + ''' // Media lifecycle is independent of color/selection scan throttling.
 const mediaSurface=window.FproMediaSurface.create({
  entries:videos,getConfig:()=>cfg,
  onAttach(video){const store=video.closest('[data-store]');identityBaseline.set(video,{source:signature(video),link:rawPermalink(video),store:store?store.getAttribute('data-store'):null});},
  download(video){location.href='fpro://download?media='+encodeURIComponent(mediaSource(video))+'&link='+encodeURIComponent(videoPermalink(video));}
 });
 function attachVideo(video){mediaSurface.attach(video);}
''' + s[end:]
needle='  if(!video)return null;\n  const dialog=target.closest'
assert needle in s
s=s.replace(needle,"  if(!video || !window.FproMediaSurface.ownsTop(video,e.clientX,e.clientY))return null;\n  const dialog=target.closest",1)
start=s.index(' function layoutVideos(){')
end=s.index(' function storyImageSource(', start)
s=s[:start]+' function layoutVideos(){mediaSurface.layout();}\n'+s[end:]
start=s.index(' // ═══════════ 2.18.2 الحارس الدائم')
end=s.index(' function colorReport(){',start)
s=s[:start]+''' // Backward-compatible diagnostic name; no periodic rescue task remains.
 window.__fproWatchdog=()=>({...mediaSurface.report(),eventDriven:true,beats:0});
'''+s[end:]
s=s.replace("version:67,videoBar:'native-weld+shared-line+watchdog'", "version:68,videoBar:'event-driven-viewport-footer'")
p.write_text(s)
shutil.copyfile(here/'media-surface.js', base/'assets/media-surface.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt'
s=p.read_text();needle='            readAsset(resources, "audio-mode.js"),\n            facebookJs'
assert needle in s;s=s.replace(needle,'            readAsset(resources, "audio-mode.js"),\n            readAsset(resources, "media-surface.js"),\n            facebookJs');p.write_text(s)
p=base/'res/raw/reel_gestures.js';s=p.read_text();needle='        const t = e.touches[0];\n        // Starting at a screen edge'
assert needle in s;s=s.replace(needle,"        const t = e.touches[0];\n        // Upper 40% belongs to entry-only fullscreen; lower gestures are unchanged.\n        if (window.FproMediaSurface && window.FproMediaSurface.ownsTop(v,t.clientX,t.clientY)) { st = null; return; }\n        // Starting at a screen edge");p.write_text(s)
p=base/'res/raw/reel_controls.js';s=p.read_text();needle="        // seek bar for reels that don't have Facebook's own"
assert needle in s;s=s.replace(needle,"        // A single seek owner: retain fit/hide-icons/editor behavior above.\n        if (window.FproMediaSurface && window.FproMediaSurface.ownsProgress()) { showBar(false); lift(0); return; }\n"+needle);p.write_text(s)
p=root/'app/build.gradle.kts';s=p.read_text();assert 'versionCode = 2180004' in s
s=s.replace('versionName = "2.18.4"','versionName = "2.18.6"').replace('versionCode = 2180004','versionCode = 2180006');p.write_text(s)
test_path=root/'app/src/androidTest/java/com/almekhlafi/materialbook/ui/screens/MediaSurfaceRegressionTest.kt'
test_path.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(here/'MediaSurfaceRegressionTest.kt',test_path)
print('Applied scoped media surface update: 2.18.6 / 2180006; identity/signing preserved.')
