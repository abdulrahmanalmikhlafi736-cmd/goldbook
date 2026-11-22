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
# Replace only the inherited like target/intent, and whitelist its exact Event.
p=base/'res/raw/reel_gestures.js';s=p.read_text()
a=s.index('    // The like button is the only action-rail button')
b=s.index('    // Our own animations',a)
s=s[:a]+(here/'like-button.js.txt').read_text()+s[b:]
a=s.index('    // Double tap in the middle:')
b=s.index('    // Which third of the screen:',a)
s=s[:a]+(here/'like-intent.js.txt').read_text()+s[b:]
needle="        if (!replaying && Date.now() < swallowUntil)"
assert needle in s
s=s.replace(needle,"        if (e === approvedLikeClick) return;\n"+needle)
p.write_text(s)
shutil.copyfile(here/'home-swipe-guard.js',base/'assets/home-swipe-guard.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text()
s=s.replace('            readAsset(resources, "media-surface.js"),','            readAsset(resources, "media-surface.js"),\n            readAsset(resources, "home-swipe-guard.js"),')
p.write_text(s)
# Register before website scripts; the regular engine remains a feature fallback.
shutil.copyfile(here/'HomeSwipeGuard.kt',base/'java/com/almekhlafi/materialbook/utils/HomeSwipeGuard.kt')
p=base/'java/com/almekhlafi/materialbook/ui/screens/MaterialbookWV.kt';s=p.read_text()
s=s.replace('import com.almekhlafi.materialbook.utils.FproAssets','import com.almekhlafi.materialbook.utils.FproAssets\nimport com.almekhlafi.materialbook.utils.HomeSwipeGuard')
needle='        onCreated = { webView ->'
assert needle in s
s=s.replace(needle,needle+'\n            HomeSwipeGuard.install(webView)')
p.write_text(s)
p=base/'res/raw/reel_controls.js';s=p.read_text();needle="        // seek bar for reels that don't have Facebook's own"
assert needle in s;s=s.replace(needle,"        // A single seek owner: retain fit/hide-icons/editor behavior above.\n        if (window.FproMediaSurface && window.FproMediaSurface.ownsProgress()) { showBar(false); lift(0); return; }\n"+needle);p.write_text(s)
p=root/'app/build.gradle.kts';s=p.read_text();assert 'versionCode = 2180004' in s
s=s.replace('versionName = "2.18.4"','versionName = "2.18.17"').replace('versionCode = 2180004','versionCode = 2180017');p.write_text(s)
test_path=root/'app/src/androidTest/java/com/almekhlafi/materialbook/ui/screens/MediaSurfaceRegressionTest.kt'
test_path.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(here/'MediaSurfaceRegressionTest.kt',test_path)
print('Applied scoped media surface update: 2.18.17 / 2180017; identity/signing preserved.')

# Native persisted option and visible branding; no package/signing changes.
import runpy
args=sys.argv
sys.argv=[str(here/"settings.py"),str(root)]
try: runpy.run_path(str(here/"settings.py"),run_name="__main__")
finally: sys.argv=args
# Prefer a current public permalink; keep legacy source fallback if none is proven.
shutil.copyfile(here/'public-video-link.js',base/'assets/public-video-link.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();needle='            readAsset(resources, "media-surface.js"),';assert needle in s;s=s.replace(needle,'            readAsset(resources, "public-video-link.js"),\n'+needle);p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();needle='onAttach(video){const store=';assert needle in s;s=s.replace(needle,'onAttach(video){window.FproPublicVideoLink.remember(video);const store=',1)
old="download(video){location.href='fpro://download?media='+encodeURIComponent(mediaSource(video))+'&link='+encodeURIComponent(videoPermalink(video));}"
new="download(video){const resolved=window.FproPublicVideoLink.resolve(video);location.href='fpro://download?media='+encodeURIComponent(window.FproPublicVideoLink.safeMedia(video,mediaSource(video)))+'&link='+encodeURIComponent(resolved.url)+'&copy=1';}"
assert old in s;s=s.replace(old,new);p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();a=s.index('    // Prefer the live media source,');b=s.index('    fun browserAgent',a)
s=s[:a]+'''    /** Public page URL first; no browser cookies or credentials are exported. */
    fun publicVideoLink(value: String): String? = try {
        val u = java.net.URI(value)
        val host = u.host?.lowercase().orEmpty()
        val path = u.path.orEmpty()
        val params = u.rawQuery.orEmpty().split("&").mapNotNull {
            val pair=it.split("=",limit=2)
            if(pair.size==2) pair[0] to java.net.URLDecoder.decode(pair[1],"UTF-8") else null
        }.toMap()
        val facebook = host=="facebook.com" || host.endsWith(".facebook.com")
        val digits = Regex("[0-9]+")
        val token = Regex("[A-Za-z0-9_-]{3,}")
        val validPath = facebook && (
            Regex("/(?:reels?|(?:[^/]+/)?videos)/[0-9]+/?").matches(path) ||
            ((path=="/watch/" || path=="/watch" || path=="/video.php" || path=="/") && digits.matches(params["v"].orEmpty())) ||
            Regex("/[^/]+/posts/[A-Za-z0-9_-]{3,}/?").matches(path) ||
            Regex("/groups/[^/]+/(?:posts|permalink)/[A-Za-z0-9_-]{3,}/?").matches(path) ||
            ((path=="/story.php" || path=="/permalink.php") && token.matches(params["story_fbid"].orEmpty())) ||
            Regex("/share/[rvp]/[A-Za-z0-9_-]{3,}/?").matches(path) ||
            Regex("/stories/[^/]+/[^/]+/?").matches(path)
        )
        if(u.scheme=="https" && u.userInfo==null && (validPath || (host=="fb.watch" && Regex("/[A-Za-z0-9_-]{3,}/?").matches(path)))) value else null
    } catch (_: Exception) { null }

    fun downloadSource(media: String, permalink: String): String? {
        publicVideoLink(permalink)?.let { return it }
        val direct = try { java.net.URI(media).let { it.scheme == "https" && !it.host.isNullOrBlank() && it.userInfo==null } } catch (_: Exception) { false }
        return if(direct) media else null
    }

'''+s[b:]
needle='        val intent = Intent(Intent.ACTION_SEND).setType("text/plain")';assert needle in s
s=s.replace(needle,'''        // Explicit user click: copy the SAME selected URL sent to the downloader.
        // Clipboard failure must not block a valid external handoff.
        runCatching {
            val clipboard=activity.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip=android.content.ClipData.newPlainText("رابط الفيديو",source)
            if(android.os.Build.VERSION.SDK_INT>=33) {
                clip.description.extras=android.os.PersistableBundle().apply { putBoolean(android.content.ClipDescription.EXTRA_IS_SENSITIVE,true) }
            }
            clipboard.setPrimaryClip(clip)
        }
'''+needle)
p.write_text(s)

p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text()
s=s.replace('    fun downloadSource(media: String, permalink: String): String? {', '    fun publicFirstSource(media: String, permalink: String): String? {',1)
legacy='    fun downloadSource(media: String, permalink: String): String? {\n        val direct = try { java.net.URI(media).let { it.scheme == "https" && !it.host.isNullOrBlank() } } catch (_: Exception) { false }\n        if (direct) return media\n        return if (isFacebook(permalink) && Regex("/stories/[^/]+/[^/?]+|/story\\\\.php\\\\?|/reels?/|/videos/|/watch(?:/|\\\\?)|/video\\\\.php|[?&](?:story_fbid|fbid|v)=").containsMatchIn(permalink)) permalink else null\n    }\n\n'
s=s.replace('    fun browserAgent',legacy+'    fun browserAgent',1)
s=s.replace('                openSettings\n            )', '                openSettings,\n                uri.getQueryParameter("copy")=="1"\n            )',1)
s=s.replace('        openSettings: () -> Unit\n    ) {','        openSettings: () -> Unit,\n        copyLink: Boolean = false\n    ) {',1)
s=s.replace('val source = FproNavigation.downloadSource(mediaUrl, linkUrl)','val source = if(copyLink) FproNavigation.publicFirstSource(mediaUrl, linkUrl) else FproNavigation.downloadSource(mediaUrl, linkUrl)')
a=s.index('        // Explicit user click:');b=s.index('        // Seal exports',a)
s=s[:a]+'        if(copyLink)copySource(activity,source)\n        val intent = shareIntent(source,pkg)\n'+s[b:]
helpers='\n    fun shareIntent(source: String, packageName: String): Intent =\n        Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT,source)\n            .setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NO_USER_ACTION)\n\n    fun copySource(context: Context, source: String): Boolean = runCatching {\n        val manager=context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager\n        val clip=android.content.ClipData.newPlainText("رابط الفيديو",source)\n        if(android.os.Build.VERSION.SDK_INT>=33)clip.description.extras=android.os.PersistableBundle().apply {\n            putBoolean(android.content.ClipDescription.EXTRA_IS_SENSITIVE,true)\n        }\n        manager.setPrimaryClip(clip)\n    }.isSuccess\n'
s=s.replace('object ExternalDownloader {','object ExternalDownloader {'+helpers,1)
p.write_text(s)
# Explicit per-click official Share -> Copy link, hooked into the existing copy observer.
shutil.copyfile(here/'official-download.js',base/'assets/official-download.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();needle='            readAsset(resources, "public-video-link.js"),';assert needle in s;s=s.replace(needle,needle+'\n            readAsset(resources, "official-download.js"),');p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();old="download(video){const resolved=window.FproPublicVideoLink.resolve(video);location.href='fpro://download?media='+encodeURIComponent(window.FproPublicVideoLink.safeMedia(video,mediaSource(video)))+'&link='+encodeURIComponent(resolved.url)+'&copy=1';}"
new="download(video){window.FproOfficialDownload.begin(video);}"
assert old in s;s=s.replace(old,new);p.write_text(s)
p=base/'res/raw/scripts.js';s=p.read_text();old='const remember = (text) => { if (text) lastCopied = String(text); };';new='const remember = (text) => { if (text) { lastCopied = String(text); try { if(window.FproOfficialDownload)window.FproOfficialDownload.copied(lastCopied); } catch (_) {} } };';assert old in s;s=s.replace(old,new);p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();needle='        if (uri.host == "download") {';assert needle in s;s=s.replace(needle,'''        if (FproNavigation.isFacebook(currentPageUrl) && uri.host == "official-download-help") {
            toast(activity,"تعذّر إتمام المشاركة تلقائيًا؛ اضغط مشاركة الفيديو ثم نسخ الرابط")
        }
'''+needle);p.write_text(s)

# Copy through the origin-checked native page bridge is a separate Facebook copy channel.
p=base/'java/com/almekhlafi/materialbook/utils/jsBridge/PageBridge.kt';s=p.read_text();needle='message.data?.let { dispatchPageMessage(it, bridges) }';assert needle in s
s=s.replace(needle,'''message.data?.let { data ->
            val handled=dispatchPageMessage(data, bridges)
            val msg=runCatching { JSONObject(data) }.getOrNull()
            if(handled && msg?.optString("call")=="copyText") {
                val text=msg.optString("text").take(2048)
                webView.evaluateJavascript("window.FproOfficialDownload?.copied("+JSONObject.quote(text)+");",null)
            }
        }''',1);p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();old='toast(activity,"تعذّر إتمام المشاركة تلقائيًا؛ اضغط مشاركة الفيديو ثم نسخ الرابط")';assert old in s
s=s.replace(old,'''val reason=uri.getQueryParameter("reason")
            toast(activity,when(reason){
                "share-not-found" -> "لم نتعرّف على زر المشاركة الرسمي لهذا المقطع؛ لم يُرسل أي رابط"
                "existing-sheet" -> "أغلق قائمة المشاركة المفتوحة ثم جرّب زر التنزيل"
                else -> "لم يصل رابط من نسخ الرابط الرسمي خلال المهلة؛ لم يُرسل أي رابط"
            })''');p.write_text(s)

# Research-backed current-player data extraction; do not depend solely on UI labels.
shutil.copyfile(here/'current-video-source.js',base/'assets/current-video-source.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();needle='            readAsset(resources, "official-download.js"),';assert needle in s;s=s.replace(needle,needle+'\n            readAsset(resources, "current-video-source.js"),');p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();needle='window.FproPublicVideoLink.remember(video);';assert needle in s;s=s.replace(needle,needle+'window.FproCurrentVideoSource.remember(video);',1)
old='download(video){window.FproOfficialDownload.begin(video);}'
new='''download(video){const result=window.FproCurrentVideoSource.resolve(video);if(result.url){location.href='fpro://download?copy=1&media='+encodeURIComponent(result.kind==='media'?result.url:'')+'&link='+encodeURIComponent(result.kind==='permalink'?result.url:'');}else{window.FproOfficialDownload.begin(video);}}'''
assert old in s;s=s.replace(old,new,1);p.write_text(s)
# Current-player React identity, adapted from MIT browser extensions; not a URL downloader.
shutil.copyfile(here/'react-video-permalink.js',base/'assets/react-video-permalink.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();needle='            readAsset(resources, "current-video-source.js"),';assert needle in s;s=s.replace(needle,needle+'\n            readAsset(resources, "react-video-permalink.js"),');p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();needle='window.FproCurrentVideoSource.remember(video);';assert needle in s;s=s.replace(needle,needle+'window.FproReactVideoPermalink.remember(video);',1)
needle='const result=window.FproCurrentVideoSource.resolve(video);';assert needle in s;s=s.replace(needle,'const react=window.FproReactVideoPermalink.resolve(video);const result=react.url?react:window.FproCurrentVideoSource.resolve(video);',1);p.write_text(s)

# 2.18.17: the button exports post links ONLY, not playback source fallbacks.
shutil.copyfile(here/'player-post-download.js',base/'assets/player-post-download.js')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();needle='            readAsset(resources, "react-video-permalink.js"),';assert needle in s;s=s.replace(needle,needle+'\n            readAsset(resources, "player-post-download.js"),');p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();old="download(video){const react=window.FproReactVideoPermalink.resolve(video);const result=react.url?react:window.FproCurrentVideoSource.resolve(video);if(result.url){location.href='fpro://download?copy=1&media='+encodeURIComponent(result.kind==='media'?result.url:'')+'&link='+encodeURIComponent(result.kind==='permalink'?result.url:'');}else{window.FproOfficialDownload.begin(video);}}";assert old in s;s=s.replace(old,'download(video){window.FproPlayerPostDownload.begin(video);}',1);p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();a=s.index('    fun publicFirstSource(');b=s.index('    fun downloadSource(',a);s=s[:a]+'''    @Suppress("UNUSED_PARAMETER")
    fun publicFirstSource(media: String, permalink: String): String? = publicVideoLink(permalink)

'''+s[b:];p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();needle='val source = if(copyLink) FproNavigation.publicFirstSource(mediaUrl, linkUrl) else FproNavigation.downloadSource(mediaUrl, linkUrl)';assert needle in s;s=s.replace(needle,'val source = FproNavigation.publicFirstSource(mediaUrl, linkUrl)',1);p.write_text(s)
# The obsolete media-source reader is no longer injected or sampled at attach time.
# Keep its file for controlled legacy regression fixtures, not as an active fallback.
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();s=s.replace('            readAsset(resources, "current-video-source.js"),\n','');p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();s=s.replace('window.FproCurrentVideoSource.remember(video);','');p.write_text(s)
# Preserve the separate story-image action; its direct image transfer is not a video fallback.
p=base/'assets/facebook.js';s=p.read_text();needle="const media=storyImageSource(current);location.href='fpro://download?media='";assert needle in s;s=s.replace(needle,"const media=storyImageSource(current);location.href='fpro://download?kind=image&media='",1);p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();needle='uri.getQueryParameter("copy")=="1"';assert needle in s;s=s.replace(needle,needle+',\n                uri.getQueryParameter("kind")=="image"',1);needle='copyLink: Boolean = false\n';assert needle in s;s=s.replace(needle,'copyLink: Boolean = false,\n        imageRequest: Boolean = false\n',1);needle='val source = FproNavigation.publicFirstSource(mediaUrl, linkUrl)';assert needle in s;s=s.replace(needle,'val source = if(imageRequest) FproNavigation.downloadSource(mediaUrl, linkUrl) else FproNavigation.publicFirstSource(mediaUrl, linkUrl)',1);p.write_text(s)

# Explicitly approved diagnostic build: video button reports structure, never downloads.
shutil.copyfile(here/'player-diagnostic.js',base/'assets/player-diagnostic.js')
shutil.copyfile(here/'PlayerDiagnostic.kt',base/'java/com/almekhlafi/materialbook/utils/PlayerDiagnostic.kt')
p=base/'java/com/almekhlafi/materialbook/utils/FproAssets.kt';s=p.read_text();needle='            readAsset(resources, "player-post-download.js"),';assert needle in s;s=s.replace(needle,'            readAsset(resources, "player-diagnostic.js"),',1);p.write_text(s)
p=base/'assets/facebook.js';s=p.read_text();needle='download(video){window.FproPlayerPostDownload.begin(video);}';assert needle in s;s=s.replace(needle,'download(video){window.FproPlayerDiagnostic.begin(video);}',1);p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/ExternalDownloader.kt';s=p.read_text();needle='        if (uri.scheme != "fpro") return false';assert needle in s;s=s.replace(needle,needle+'''
        if (uri.host == "player-diagnostic") {
            if (FproNavigation.isFacebook(currentPageUrl)) PlayerDiagnostic.show(activity, uri.getQueryParameter("data").orEmpty())
            return true
        }
''',1);p.write_text(s)
