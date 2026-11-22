package com.almekhlafi.materialbook.ui.screens

import android.app.Application
import android.content.res.Configuration
import java.util.Locale
import androidx.test.core.app.ApplicationProvider
import com.almekhlafi.materialbook.data.local.SettingsDataStore
import com.almekhlafi.materialbook.ui.viewmodel.SettingsViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import com.almekhlafi.materialbook.utils.HomeSwipeGuard
import com.almekhlafi.materialbook.R
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Chromium fixture tests, not logged-in Facebook or trusted native-gesture acceptance.
 * Geometry and rAF are controlled to make detach/recycle and queue assertions deterministic.
 */
@RunWith(AndroidJUnit4::class)
class MediaSurfaceRegressionTest {
    private class Harness {
        lateinit var web: WebView
        val routed=java.util.Collections.synchronizedList(mutableListOf<String>())
        val routeReady=CountDownLatch(1)
        fun awaitRoute():String { assertTrue("official route timeout",routeReady.await(10,TimeUnit.SECONDS));return routed.last() }
        fun officialFixture(delayed:Boolean=false, existing:Boolean=false) {
            val context=InstrumentationRegistry.getInstrumentation().targetContext
            eval(context.assets.open("public-video-link.js").bufferedReader().use { it.readText() })
            eval(context.assets.open("official-download.js").bufferedReader().use { it.readText() })
            val raw=context.resources.openRawResource(R.raw.scripts).bufferedReader().use { it.readText() }
            eval(raw.substring(raw.indexOf("    // The last text the page put on the clipboard"),raw.indexOf("    const shareCopiedLink")))
            eval("""
              window.__officialCopies=0;window.__officialShares=0;
              var article=document.createElement('article');document.body.appendChild(article);article.appendChild(__v);
              function box(b,y){b.getBoundingClientRect=function(){return {left:20,right:100,top:y,bottom:y+40,width:80,height:40};};return b;}
              window.__sheet=function(){var root=document.createElement('div');root.setAttribute('role','presentation');
                var copy=box(document.createElement('button'),710);copy.setAttribute('aria-label','نسخ الرابط');
                copy.onclick=function(){__officialCopies++;window.__emitOfficialCopy=function(){var field=document.createElement('input');field.value='https://www.facebook.com/share/v/1HeYq17541/';document.body.appendChild(field);field.focus();field.select();document.execCommand('copy');};if(!$delayed)__emitOfficialCopy();};
                root.appendChild(copy);document.body.appendChild(root);
              };
              var share=box(document.createElement('button'),600);share.setAttribute('aria-label','مشاركة');
              share.onclick=function(){__officialShares++;__sheet();};article.appendChild(share);
              if($existing)__sheet();
            """.trimIndent())
        }
        var localFailure:String?=null
        var localSaver:com.almekhlafi.materialbook.utils.LocalImageSaver?=null
        var nextPage: CountDownLatch? = null
        fun eval(js: String): String {
            val done=CountDownLatch(1)
            var value="null"
            InstrumentationRegistry.getInstrumentation().runOnMainSync {
                web.evaluateJavascript(js) { value=it;done.countDown() }
            }
            assertTrue("JS callback timeout (${js.length} chars)",done.await(30,TimeUnit.SECONDS))
            return value
        }
        fun load(earlyGuard: Boolean = false, initialEnabled: Boolean = true, nativeCopyBridge: Boolean = false, localImageSaved: ((android.net.Uri)->Unit)? = null) {
            val done=CountDownLatch(1)
            InstrumentationRegistry.getInstrumentation().runOnMainSync {
                web=com.almekhlafi.materialbook.utils.BackgroundAudioWebView(InstrumentationRegistry.getInstrumentation().targetContext).apply {
                    if(nativeCopyBridge)com.almekhlafi.materialbook.utils.jsBridge.installPageBridges(this,
                        com.almekhlafi.materialbook.utils.jsBridge.PageBridges(clipboard=com.almekhlafi.materialbook.utils.jsBridge.ClipboardBridge(context)))
                    if(localImageSaved!=null)localSaver=com.almekhlafi.materialbook.utils.LocalImageSaver(this,localImageSaved,{report->localFailure=report})
                    settings.javaScriptEnabled=true
                    settings.domStorageEnabled=true
                    layout(0,0,400,800)
                    val html="<html><head><meta name='viewport' content='width=device-width,initial-scale=1'><script>window.__siteControls=0;['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend'].forEach(function(t){window.addEventListener(t,function(){__siteControls++;},true);});window.__siteMoves=0;window.addEventListener('touchmove',function(){__siteMoves++;},true);</script></head><body><video id='v'></video></body></html>"
                    webViewClient=object:WebViewClient(){
                        override fun onPageFinished(view:WebView,url:String){done.countDown();nextPage?.countDown()}
                        override fun shouldOverrideUrlLoading(view:WebView,request:WebResourceRequest):Boolean {
                            if(request.url.scheme=="fpro"){routed.add(request.url.toString());routeReady.countDown();return true};return false
                        }
                        override fun shouldInterceptRequest(view:WebView,request:WebResourceRequest):WebResourceResponse? {
                            return if(earlyGuard) WebResourceResponse("text/html","UTF-8",html.byteInputStream()) else null
                        }
                    }
                    if(earlyGuard){HomeSwipeGuard.install(this,initialEnabled);loadUrl("https://m.facebook.com/")}
                    else loadDataWithBaseURL("https://m.facebook.com/reel/123/",html,"text/html","UTF-8",null)
                }
            }
            assertTrue("page timeout",done.await(10,TimeUnit.SECONDS))
            eval("""
              Object.defineProperty(document,'hidden',{value:false,configurable:true});
              Object.defineProperty(window,'innerWidth',{value:400,configurable:true});
              Object.defineProperty(window,'innerHeight',{value:800,configurable:true});
              Object.defineProperty(window,'visualViewport',{value:{width:400,height:800,offsetTop:0,offsetLeft:0,addEventListener:function(){}},configurable:true});
              window.__q=new Map();window.__next=1;
              window.requestAnimationFrame=function(f){var id=__next++;__q.set(id,f);return id;};
              window.cancelAnimationFrame=function(id){__q.delete(id);};
              window.__flush=function(){var budget=12;while(__q.size&&budget-->0){var q=Array.from(__q.values());__q.clear();q.forEach(function(f){f();});}if(__q.size)throw Error('frame loop');};
              window.__v=document.getElementById('v');
              __v.getBoundingClientRect=function(){return {left:0,top:50,right:400,bottom:750,width:400,height:700};};
              Object.defineProperty(__v,'duration',{value:100,configurable:true});
              Object.defineProperty(__v,'paused',{value:false,configurable:true});
              window.__cfg={enhance:true,downloads:true,rainbow:true,doubleTapFullscreen:true};
            """.trimIndent())
            val context=InstrumentationRegistry.getInstrumentation().targetContext
            eval(context.assets.open("media-surface.js").bufferedReader().use{it.readText()})
            eval("window.__entries=new Map();window.__surface=FproMediaSurface.create({entries:__entries,getConfig:function(){return __cfg;},download:function(){}});__surface.layout();")
            eval("__flush();")
        }
        fun reload(){
            val done=CountDownLatch(1);nextPage=done
            InstrumentationRegistry.getInstrumentation().runOnMainSync{web.reload()}
            assertTrue("reload timeout",done.await(10,TimeUnit.SECONDS));nextPage=null
        }
        fun close(){if(!::web.isInitialized)return;InstrumentationRegistry.getInstrumentation().runOnMainSync{web.destroy()}}
    }
    // Clipboard reads are denied on Android13 until this UID owns the focused window.
    // ActivityScenario RESUMED / waitForIdleSync alone do not guarantee that, especially
    // just after dismissing an AlertDialog or the system clipboard overlay.
    private fun awaitActivityFocus(scenario:androidx.test.core.app.ActivityScenario<androidx.activity.ComponentActivity>){
        val focused=CountDownLatch(1)
        scenario.onActivity { activity ->
            activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            val decor=activity.window.decorView
            if(decor.hasWindowFocus())focused.countDown()
            else decor.viewTreeObserver.addOnWindowFocusChangeListener(object:android.view.ViewTreeObserver.OnWindowFocusChangeListener{
                override fun onWindowFocusChanged(hasFocus:Boolean){if(hasFocus){decor.viewTreeObserver.removeOnWindowFocusChangeListener(this);focused.countDown()}}
            })
        }
        assertTrue("test Activity did not gain window focus",focused.await(15,TimeUnit.SECONDS))
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
    }

    @Test fun footerAndTopRegionUseCssViewportBounds(){val h=Harness();try{
        h.load()
        assertEquals("true",h.eval("(function(){var p=FproMediaSurface.dock({left:0,top:0,right:400,bottom:800});return p.top+p.height<=798 && FproMediaSurface.FILL_BOTTOM===4 && getComputedStyle(__entries.get(__v).track.querySelector('.fpro-fill')).bottom==='4px' && getComputedStyle(__entries.get(__v).track.querySelector('.fpro-ball')).fontSize==='14px' && getComputedStyle(__entries.get(__v).track.querySelector('.fpro-ball')).width==='18px' && FproMediaSurface.ownsTop(__v,100,100) && !FproMediaSurface.ownsTop(__v,100,600);})()"))
    }finally{h.close()}}
    @Test fun detachedVisibleHostsAreRepairedWithoutPolling(){val h=Harness();try{
        h.load();h.eval("__entries.get(__v).overlay.remove();document.getElementById('fpro-media-surface').remove();")
        h.eval("__flush();")
        assertEquals("true",h.eval("__entries.get(__v).overlay.isConnected && __entries.get(__v).track.isConnected && !__entries.get(__v).overlay.hidden"))
    }finally{h.close()}}
    @Test fun videoRemovalAndReinsertionDoNotRetainDeadEntries(){val h=Harness();try{
        h.load();h.eval("window.__saved=__v;__v.remove();");h.eval("__flush();")
        assertEquals("0",h.eval("__entries.size"))
        h.eval("document.body.appendChild(__saved);");h.eval("__flush();")
        assertEquals("1",h.eval("__entries.size"))
    }finally{h.close()}}
    @Test fun idleHasNoPerpetualFrameAndMasterOffDisposes(){val h=Harness();try{
        h.load();assertEquals("0",h.eval("(function(){__flush();return __q.size;})()"))
        h.eval("__cfg.enhance=false;__surface.layout();")
        assertEquals("0",h.eval("__entries.size"))
    }finally{h.close()}}
    @Test fun fastLikeBypassesOnlyItsOwnGuardAndChangesOfficialButton(){val h=Harness();try{
        h.load()
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        h.eval(context.resources.openRawResource(R.raw.reel_gestures).bufferedReader().use{it.readText()})
        h.eval("""
          window.__clicks=0;window.__b=document.createElement('div');
          __b.setAttribute('role','button');__b.setAttribute('data-long-click-action-id','fixture');
          __b.setAttribute('aria-label','Like');__b.setAttribute('aria-pressed','false');
          __b.getBoundingClientRect=function(){return {left:0,top:380,right:40,bottom:420,width:40,height:40};};
          __b.addEventListener('click',function(){__clicks++;__b.setAttribute('aria-pressed','true');});document.body.appendChild(__b);
          Date.now=function(){return 1000;};
          function tapEvent(type){var e=new Event(type,{bubbles:true,cancelable:true});var p={clientX:200,clientY:600,identifier:1};Object.assign(e,{touches:type==='touchend'?[]:[p],changedTouches:[p]});__v.dispatchEvent(e);}
          tapEvent('touchstart');tapEvent('touchend');tapEvent('touchstart');tapEvent('touchend');
        """.trimIndent())
        assertEquals("true",h.eval("__clicks===1 && __b.getAttribute('aria-pressed')==='true' && !!document.getElementById('mb-reel-anim')"))
    }finally{h.close()}}
    @Test fun homeLeftSwipeIsStoppedWhileVerticalScrollPasses(){val h=Harness();try{
        h.load();h.eval("history.replaceState({},'', '/');")
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        h.eval(context.assets.open("home-swipe-guard.js").bufferedReader().use{it.readText()})
        h.eval("""
          window.__post=document.createElement('div');__post.textContent='Post';document.body.appendChild(__post);window.__ends=0;
          document.addEventListener('touchend',function(){__ends++;});
          window.__homeTouch=function(type,x,y){var e=new Event(type,{bubbles:true,cancelable:true});var p={clientX:x,clientY:y,identifier:1};Object.assign(e,{touches:type==='touchend'?[]:[p],changedTouches:[p]});__post.dispatchEvent(e);return e.defaultPrevented;};
        """.trimIndent())
        assertEquals("true",h.eval("__homeTouch('touchstart',300,300);__homeTouch('touchmove',200,302) && __homeTouch('touchend',200,302) && __ends===0"))
        assertEquals("true",h.eval("__homeTouch('touchstart',300,300);!__homeTouch('touchmove',298,400) && !__homeTouch('touchend',298,400) && __ends===1"))
    }finally{h.close()}}

    @Test fun documentStartWinsAgainstPageWindowCaptureInBothDirections(){val h=Harness();try{
        h.load(true)
        assertEquals("true",h.eval("!!window.__fproHomeSwipeAtStart && !!window.__fproHomeSwipeGuard"))
        h.eval("""
          window.__post=document.createElement('button');__post.textContent='Post';document.body.appendChild(__post);
          window.__touch=function(type,x,y){var e=new Event(type,{bubbles:true,cancelable:true});var p={clientX:x,clientY:y,identifier:1};Object.assign(e,{touches:type==='touchend'?[]:[p],changedTouches:[p]});__post.dispatchEvent(e);return e.defaultPrevented;};
        """.trimIndent())
        assertEquals("true",h.eval("__touch('touchstart',300,300);__touch('touchmove',200,302) && __touch('touchend',200,302) && __siteMoves===0"))
        assertEquals("true",h.eval("__touch('touchstart',100,300);__touch('touchmove',200,302) && __touch('touchend',200,302) && __siteMoves===0"))
        assertEquals("true",h.eval("__touch('touchstart',200,300);!__touch('touchmove',202,400) && !__touch('touchend',202,400) && __siteMoves===1"))
        assertEquals("true",h.eval("window.__taps=0;__post.onclick=function(){__taps++;};__post.click();__taps===1"))
    }finally{h.close()}}

    @Test fun ownedSeekBackwardGestureNeverReachesPageWindowCapture(){val h=Harness();try{
        h.load(true)
        h.eval("""
          window.__seek=__entries.get(__v).seek;
          __seek.getBoundingClientRect=function(){return {left:16,right:384,top:766,bottom:798,width:368,height:32};};
          window.__pointer=function(type,x){var e=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:780});__seek.dispatchEvent(e);return e.defaultPrevented;};
          window.__rangeTouch=function(type,x){var e=new Event(type,{bubbles:true,cancelable:true});var p={clientX:x,clientY:780,identifier:1};Object.assign(e,{touches:type==='touchend'?[]:[p],changedTouches:[p]});__seek.dispatchEvent(e);return e.defaultPrevented;};
        """.trimIndent())
        assertEquals("true",h.eval("__pointer('pointerdown',300);__rangeTouch('touchstart',300);__pointer('pointermove',100);__rangeTouch('touchmove',100);__pointer('pointerup',100);__rangeTouch('touchend',100);__siteControls===0 && __siteMoves===0 && Math.abs(__v.currentTime-(84/368*100))<0.1 && __fproHomeSwipeGuard.report().controlDrags===1"))
        assertEquals("true",h.eval("getComputedStyle(__seek).touchAction==='none'"))
        assertEquals("true",h.eval("__rangeTouch('touchstart',100);__rangeTouch('touchmove',200);__rangeTouch('touchend',200);__siteControls===0 && Math.abs(__v.currentTime-50)<0.1"))
    }finally{h.close()}}

    @Test fun homeOptionUpdatesLiveAndFutureDocumentsWithoutDisablingOwnedSeek(){val h=Harness();try{
        h.load(true,false)
        assertEquals("false",h.eval("__fproHomeSwipeGuard.report().enabled"))
        h.eval("""
          window.__seek=__entries.get(__v).seek;__seek.getBoundingClientRect=function(){return {left:16,right:384,top:766,bottom:798,width:368,height:32};};
          function owned(type,x){__seek.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:780}));}
          owned('pointerdown',300);owned('pointermove',100);owned('pointerup',100);
          window.__post=document.createElement('div');document.body.appendChild(__post);
          window.__swipe=function(){var blocked=false;[['touchstart',300],['touchmove',200],['touchend',200]].forEach(function(v){var e=new Event(v[0],{bubbles:true,cancelable:true});var p={clientX:v[1],clientY:300,identifier:1};Object.assign(e,{touches:v[0]==='touchend'?[]:[p],changedTouches:[p]});__post.dispatchEvent(e);blocked=blocked||e.defaultPrevented;});return blocked;};
        """.trimIndent())
        assertEquals("true",h.eval("__siteControls===0 && Math.abs(__v.currentTime-(84/368*100))<0.1"))
        assertEquals("false",h.eval("__swipe()"))
        InstrumentationRegistry.getInstrumentation().runOnMainSync { HomeSwipeGuard.update(h.web,true) }
        assertEquals("true",h.eval("__fproHomeSwipeGuard.report().enabled && __swipe()"))
        InstrumentationRegistry.getInstrumentation().runOnMainSync { HomeSwipeGuard.update(h.web,false) }
        assertEquals("false",h.eval("__swipe()"))
        h.reload()
        assertEquals("false",h.eval("__fproHomeSwipeGuard.report().enabled"))
    }finally{h.close()}}
    @Test fun homePreferencePersistsAndRecreatedViewModelStartsWithSavedChoice(){
        val app=ApplicationProvider.getApplicationContext<Application>();val prefs=SettingsDataStore(app)
        val original=runBlocking { prefs.fproHomeSwipeBlock.first() };val models=mutableListOf<SettingsViewModel>()
        try {
            runBlocking { prefs.setFproHomeSwipeBlock(false) }
            val off=SettingsViewModel(app);models.add(off);assertEquals(false,off.fproHomeSwipeBlock.value)
            assertEquals(false,runBlocking { SettingsDataStore(app).fproHomeSwipeBlock.first() })
            runBlocking { prefs.setFproHomeSwipeBlock(true) }
            val on=SettingsViewModel(app);models.add(on);assertEquals(true,on.fproHomeSwipeBlock.value)
        }finally{runBlocking { prefs.setFproHomeSwipeBlock(original) };models.forEach { it.viewModelScope.cancel() }}
    }
    @Test fun applicationBrandUsesRequestedLabelAcrossLocales(){
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("FPRO 🔥 Debug",context.packageManager.getApplicationLabel(context.applicationInfo).toString())
        for(tag in listOf("en","ar","in","de","fr","zh-TW")){
            val config=Configuration(context.resources.configuration);config.setLocale(Locale.forLanguageTag(tag))
            assertEquals("FPRO 🔥",context.createConfigurationContext(config).getString(R.string.app_name))
        }
        assertEquals("com.almekhlafi",context.packageName)
    }

    @Test fun publicResolverBindsToScopedClipAndRejectsRecycledFirstLink(){val h=Harness();try{
        h.load()
        h.eval(InstrumentationRegistry.getInstrumentation().targetContext.assets.open("public-video-link.js").bufferedReader().use { it.readText() })
        assertEquals("true",h.eval("""
          var v=document.getElementById('v'),a=document.createElement('article');v.parentNode.insertBefore(a,v);a.appendChild(v);
          a.setAttribute('data-video-id','123');v.setAttribute('src','blob:first');
          FproPublicVideoLink.remember(v);
          FproPublicVideoLink.resolve(v).url==='https://www.facebook.com/watch/?v=123';
        """.trimIndent()))
        assertEquals("true",h.eval("v.setAttribute('src','blob:second'); FproPublicVideoLink.resolve(v).url==='';"))
        assertEquals("true",h.eval("a.setAttribute('data-video-id','456'); FproPublicVideoLink.resolve(v).url==='https://www.facebook.com/watch/?v=456';"))
    }finally{h.close()}}

    @Test fun officialShareCopyProducesCurrentFacebookShareUrlExactlyOnce(){val h=Harness();try{
        h.load();h.officialFixture()
        h.eval("FproOfficialDownload.begin(__v)")
        val routed=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",routed.host)
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",routed.getQueryParameter("link"))
        assertEquals("0",routed.getQueryParameter("copy"))
        assertEquals("true",h.eval("__officialShares===1&&__officialCopies===1&&!FproOfficialDownload.report().active"))
        h.eval("__emitOfficialCopy()")
        assertEquals(1,h.routed.size)
    }finally{h.close()}}
    @Test fun officialDelayedCopyCannotSendRecycledPlayersOldLink(){val h=Harness();try{
        h.load();h.officialFixture(delayed=true)
        h.eval("FproOfficialDownload.begin(__v);__v.setAttribute('src','blob:next-clip');__emitOfficialCopy();")
        assertEquals("false",h.eval("FproOfficialDownload.report().active"))
        assertTrue("stale copied link was routed",!h.routeReady.await(400,TimeUnit.MILLISECONDS))
    }finally{h.close()}}
    @Test fun preexistingOfficialSheetIsNeverAssumedToBelongToSelectedVideo(){val h=Harness();try{
        h.load();h.officialFixture(existing=true)
        h.eval("FproOfficialDownload.begin(__v)")
        assertEquals("official-download-help",android.net.Uri.parse(h.awaitRoute()).host)
        assertEquals("true",h.eval("__officialShares===0&&__officialCopies===0&&!FproOfficialDownload.report().active"))
    }finally{h.close()}}

    @Test fun officialModalCanHideBackgroundWhileItsCurrentCopyStillRoutes(){val h=Harness();try{
        h.load();h.officialFixture()
        h.eval("var s=document.querySelector('article>button'),old=s.onclick;s.onclick=function(){__v.closest('article').setAttribute('aria-hidden','true');old();};FproOfficialDownload.begin(__v);")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host)
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        assertEquals("false",h.eval("FproOfficialDownload.report().active"))
    }finally{h.close()}}
    @Test fun originCheckedNativeCopyMessageCompletesOnlyAnArmedTransaction(){val h=Harness();try{
        h.load(true,nativeCopyBridge=true);h.officialFixture(delayed=true)
        h.eval("FproOfficialDownload.begin(__v);FaceboostPage.postMessage(JSON.stringify({call:'copyText',text:'https://www.facebook.com/share/v/1HeYq17541/'}));")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host)
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        h.eval("FaceboostPage.postMessage(JSON.stringify({call:'copyText',text:'https://www.facebook.com/share/v/OTHER123/'}));")
        assertEquals(1,h.routed.size)
    }finally{h.close()}}

    @Test fun hiddenLongFeedControlsCannotExcludeNewOfficialCopySheet(){val h=Harness();try{
        h.load();h.officialFixture()
        h.eval("var hidden=document.createElement('section');hidden.hidden=true;for(var i=0;i<650;i++)hidden.appendChild(document.createElement('button'));document.body.insertBefore(hidden,document.body.firstChild);FproOfficialDownload.begin(__v);")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host)
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        assertEquals("true",h.eval("__officialShares===1&&__officialCopies===1&&!FproOfficialDownload.report().active"))
    }finally{h.close()}}

    @Test fun frostInlineStoreSourceWorksWithoutAnyShareButton(){val h=Harness();try{
        h.load()
        val assets=InstrumentationRegistry.getInstrumentation().targetContext.assets
        h.eval(assets.open("public-video-link.js").bufferedReader().use { it.readText() })
        h.eval(assets.open("current-video-source.js").bufferedReader().use { it.readText() })
        assertEquals("true",h.eval("""
            var inline=document.createElement('div');inline.setAttribute('data-sigil','inlineVideo');
            inline.setAttribute('data-store',JSON.stringify({src:'https://video.xx.fbcdn.net/current.mp4'}));
            document.body.appendChild(inline);inline.appendChild(__v);__v.setAttribute('src','blob:current');
            FproCurrentVideoSource.remember(__v);
            var extracted=FproCurrentVideoSource.resolve(__v);
            extracted.url==='https://video.xx.fbcdn.net/current.mp4'&&extracted.kind==='media'&&!document.querySelector('[aria-label="مشاركة"]');
        """.trimIndent()))
    }finally{h.close()}}
    @Test fun typedFacebookVideoIdentityNeverReusesOldMetadataAfterSourceChange(){val h=Harness();try{
        h.load()
        val assets=InstrumentationRegistry.getInstrumentation().targetContext.assets
        h.eval(assets.open("public-video-link.js").bufferedReader().use { it.readText() })
        h.eval(assets.open("current-video-source.js").bufferedReader().use { it.readText() })
        h.eval("""
            var article=document.createElement('article');document.body.appendChild(article);article.appendChild(__v);
            Object.defineProperty(__v,'currentSrc',{configurable:true,get:function(){return this.getAttribute('src')||'';}});
            __v.setAttribute('src','blob:first');
            window.__json=document.createElement('script');__json.type='application/json';
            __json.textContent=JSON.stringify({__typename:'Video',id:'987654',playable_url:'https://video.xx.fbcdn.net/old.mp4',owner:{id:'333'}});article.appendChild(__json);
            FproCurrentVideoSource.remember(__v);
        """.trimIndent())
        assertEquals("true",h.eval("FproCurrentVideoSource.resolve(__v).url==='https://www.facebook.com/watch/?v=987654'"))
        assertEquals("true",h.eval("__v.setAttribute('src','blob:second');FproCurrentVideoSource.resolve(__v).url===''"))
        assertEquals("true",h.eval("__json.textContent=JSON.stringify({__typename:'Video',id:'987655',playable_url:'https://video.xx.fbcdn.net/new.mp4'});FproCurrentVideoSource.resolve(__v).url==='https://www.facebook.com/watch/?v=987655'"))
    }finally{h.close()}}

    @Test fun reactPlayerPropsResolveThePassedClipNotTheFirstVideoOrPageAddress(){val h=Harness();try{
        h.load()
        h.eval(InstrumentationRegistry.getInstrumentation().targetContext.assets.open("react-video-permalink.js").bufferedReader().use { it.readText() })
        assertEquals("true",h.eval("""
            var first=document.createElement('article'),other=document.createElement('video');first.appendChild(other);document.body.insertBefore(first,document.body.firstChild);
            first.REACT_PROPS={children:{props:{videoFBID:'111111'}}};
            var own=document.createElement('div');document.body.appendChild(own);own.appendChild(__v);
            own.REACT_PROPS={children:{props:{coreVideoPlayerMetaData:{videoFBID:'222222'}}}};
            __v.REACT_FIBER={memoizedProps:{videoFBID:'333333'}};
            FproReactVideoPermalink.remember(__v);
            FproReactVideoPermalink.resolve(__v).url==='https://www.facebook.com/watch/?v=222222';
        """.trimIndent().replace("REACT_PROPS","__reactProps"+"$"+"fixture").replace("REACT_FIBER","__reactFiber"+"$"+"fixture")))
    }finally{h.close()}}
    @Test fun reactSourceReuseAndAlternateTreeDisagreementCannotExportOldClip(){val h=Harness();try{
        h.load()
        h.eval(InstrumentationRegistry.getInstrumentation().targetContext.assets.open("react-video-permalink.js").bufferedReader().use { it.readText() })
        h.eval("""
            var own=document.createElement('div');document.body.appendChild(own);own.appendChild(__v);
            Object.defineProperty(__v,'currentSrc',{configurable:true,get:function(){return this.getAttribute('src')||'';}});
            __v.setAttribute('src','blob:first');
            own.REACT_PROPS={children:{props:{videoFBID:'111111'}}};
            FproReactVideoPermalink.remember(__v);
        """.trimIndent().replace("REACT_PROPS","__reactProps"+"$"+"fixture"))
        assertEquals("true",h.eval("__v.setAttribute('src','blob:second');FproReactVideoPermalink.resolve(__v).url===''"))
        assertEquals("true",h.eval("own.REACT_PROPS.children.props.videoFBID='222222';FproReactVideoPermalink.resolve(__v).url==='https://www.facebook.com/watch/?v=222222'".replace("REACT_PROPS","__reactProps"+"$"+"fixture")))
        assertEquals("true",h.eval("__v.setAttribute('src','blob:third');FproReactVideoPermalink.resolve(__v).url===''"))
        assertEquals("true",h.eval("delete own.REACT_PROPS;__v.REACT_FIBER={memoizedProps:{coreVideoPlayerMetaData:{videoFBID:'333333'}}};FproReactVideoPermalink.resolve(__v).url==='https://www.facebook.com/watch/?v=333333'".replace("REACT_PROPS","__reactProps"+"$"+"fixture").replace("REACT_FIBER","__reactFiber"+"$"+"fixture")))
        assertEquals("true",h.eval("__v.REACT_FIBER.alternate={memoizedProps:{videoFBID:'444444'}};FproReactVideoPermalink.resolve(__v).url===''".replace("REACT_FIBER","__reactFiber"+"$"+"fixture")))
    }finally{h.close()}}

    @Test fun postOnlyRouterNeverExportsCdnAndUsesUsefulScriptsOwnedPlayerId(){val h=Harness();try{
        h.load();val assets=InstrumentationRegistry.getInstrumentation().targetContext.assets
        for(name in listOf("public-video-link.js","react-video-permalink.js","player-post-download.js"))h.eval(assets.open(name).bufferedReader().use { it.readText() })
        h.eval("""
          window.__fallbackVideo=null;window.FproOfficialDownload={begin:function(v){__fallbackVideo=v;}};
          Object.defineProperty(__v,'currentSrc',{configurable:true,get:function(){return this.getAttribute('src')||'';}});
          __v.preload='none';__v.src='https://scontent-fra5-1.xx.fbcdn.net/o1/v/t2/f2/m412/sample.mp4?tag=sve_sd';
          window.__notSent=FproPlayerPostDownload.begin(__v);
        """.trimIndent())
        assertTrue(h.eval("__notSent.sent===false && __fallbackVideo===__v").contains("true"))
        assertTrue(h.routed.isEmpty())
        h.eval("""
          var owner=document.createElement('div');document.body.appendChild(owner);owner.appendChild(__v);
          owner["__reactProps"+String.fromCharCode(36)+"ufs"]={children:{props:{videoFBID:'987654321'}}};
          FproPlayerPostDownload.begin(__v);
        """.trimIndent())
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("",uri.getQueryParameter("media"))
        assertEquals("https://www.facebook.com/watch/?v=987654321",uri.getQueryParameter("link"))
        val nav=com.almekhlafi.materialbook.utils.FproNavigation
        for(cdn in listOf("https://scontent-fra5-1.xx.fbcdn.net/sample.mp4?tag=sve_sd","https://video.fbcdn.net/chunk.m4s")){
            org.junit.Assert.assertNull(nav.publicFirstSource(cdn,""))
            org.junit.Assert.assertNull(nav.publicFirstSource("",cdn))
            assertEquals("https://www.facebook.com/watch/?v=987654321",nav.publicFirstSource(cdn,"https://www.facebook.com/watch/?v=987654321"))
        }
    }finally{h.close()}}

    @Test fun diagnosticExportsOnlyStructureAndNativeFormatterDropsRawSecrets(){val h=Harness();try{
        h.load();val assets=InstrumentationRegistry.getInstrumentation().targetContext.assets
        h.eval(assets.open("player-diagnostic.js").bufferedReader().use { it.readText() })
        h.eval("""
          var owner=document.createElement('div');document.body.appendChild(owner);owner.appendChild(__v);
          owner["__reactProps"+String.fromCharCode(36)+"diagnostic"]={children:{props:{videoFBID:'987654321012345',secret:'PRIVATE_SENTINEL'}}};
          window.__diagnostic=FproPlayerDiagnostic.capture(__v);
          FproPlayerDiagnostic.begin(__v);
        """.trimIndent())
        val route=android.net.Uri.parse(h.awaitRoute())
        assertEquals("player-diagnostic",route.host)
        val raw=route.getQueryParameter("data")!!
        assertTrue(!raw.contains("987654321012345") && !raw.contains("PRIVATE_SENTINEL") && !raw.contains("https://"))
        val report=com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(raw)!!
        assertTrue(report.contains("PLAYER DIAGNOSTIC V1"))
        val polluted=org.json.JSONObject(raw).put("cookie","PRIVATE_SENTINEL").put("url","https://private.example/path").toString()
        val clean=com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(polluted)!!
        assertTrue(!clean.contains("PRIVATE_SENTINEL") && !clean.contains("private.example"))
        org.junit.Assert.assertNull(com.almekhlafi.materialbook.utils.PlayerDiagnostic.format("x".repeat(17000)))
        org.junit.Assert.assertNull(com.almekhlafi.materialbook.utils.PlayerDiagnostic.format("{\"schema\":99}"))
        // Exercise real Android dialog and its explicit copy button in a foreground Activity.
        androidx.test.core.app.ActivityScenario.launch(androidx.activity.ComponentActivity::class.java).use { scenario ->
            awaitActivityFocus(scenario)
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            scenario.onActivity { activity ->
                val field=com.almekhlafi.materialbook.utils.PlayerDiagnostic::class.java.getDeclaredField("dialog")
                field.isAccessible=true
                val downloader=com.almekhlafi.materialbook.utils.ExternalDownloader
                assertTrue(downloader.route(activity,route,"https://example.com/","com.junkfood.seal") { throw AssertionError("unexpected settings") })
                val rejected=field.get(com.almekhlafi.materialbook.utils.PlayerDiagnostic) as? java.lang.ref.WeakReference<*>
                assertTrue((rejected?.get() as? android.app.AlertDialog)?.isShowing != true)
                assertTrue(downloader.route(activity,route,"https://m.facebook.com/reel/123/","com.junkfood.seal") { throw AssertionError("unexpected settings") })
                val reference=field.get(com.almekhlafi.materialbook.utils.PlayerDiagnostic) as java.lang.ref.WeakReference<*>
                val popup=reference.get() as android.app.AlertDialog
                assertTrue(popup.isShowing)
                popup.getButton(android.app.AlertDialog.BUTTON_POSITIVE).performClick()
            }
            // Wait for both the button callback and focused Activity window after dismissal.
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            awaitActivityFocus(scenario)
            scenario.onActivity { activity ->
                val clipboard=activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                assertEquals(report,clipboard.primaryClip!!.getItemAt(0).text.toString())
            }
        }
    }finally{h.close()}}

    @Test fun mobileV2FindsOwnedActionAfterLongPrefixAndSanitizesTopology(){val h=Harness();try{
        h.load();val assets=InstrumentationRegistry.getInstrumentation().targetContext.assets
        for(name in listOf("player-diagnostic.js","mobile-share-diagnostic.js"))h.eval(assets.open(name).bufferedReader().use { it.readText() })
        h.eval("""
            for(var i=0;i<700;i++){var old=document.createElement('div');old.setAttribute('data-mcomponent','1');document.body.insertBefore(old,document.body.firstChild);}
            var owner=document.createElement('article');document.body.appendChild(owner);owner.appendChild(__v);
            __v.getBoundingClientRect=function(){return {left:0,right:400,top:100,bottom:400,width:400,height:300};};
            var action=document.createElement('div');action.setAttribute('data-action-id','PRIVATE_ACTION');action.setAttribute('data-mcomponent','PRIVATE_COMPONENT');
            var leaf=document.createElement('span');leaf.setAttribute('aria-label','مشاركة');leaf.textContent='PRIVATE_TEXT';action.appendChild(leaf);owner.appendChild(action);
            action.getBoundingClientRect=leaf.getBoundingClientRect=function(){return {left:10,right:50,top:600,bottom:640,width:40,height:40};};
            FproPlayerDiagnostic.begin(__v);
        """.trimIndent())
        val raw=android.net.Uri.parse(h.awaitRoute()).getQueryParameter("data")!!
        val data=org.json.JSONObject(raw)
        assertEquals(2,data.getInt("schema"))
        val candidates=data.getJSONObject("mobile").getJSONArray("candidates")
        var found=false
        for(i in 0 until candidates.length()){
            val c=candidates.getJSONObject(i)
            if(c.optInt("action")==1&&c.optInt("relation")==0){found=true;assertEquals(0,c.getInt("oldSelector"));assertEquals(0,c.getInt("oldBounds"))}
        }
        assertTrue(found)
        val mobile=data.getJSONObject("mobile")
        mobile.put("secret","PRIVATE_SENTINEL")
        candidates.getJSONObject(0).put("url","https://private.example/id")
        val clean=com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(data.toString())!!
        assertTrue(clean.contains("PLAYER DIAGNOSTIC V2"))
        for(secret in listOf("PRIVATE_","private.example","مشاركة"))assertTrue(!clean.contains(secret))
        while(candidates.length()<13)candidates.put(org.json.JSONObject())
        org.junit.Assert.assertNull(com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(data.toString()))
    }finally{h.close()}}

    @Test fun descriptiveMobileShareAndCopySendFreshPostLinkWithRealProductionGuard(){val h=Harness();try{
        h.load();val context=InstrumentationRegistry.getInstrumentation().targetContext
        h.officialFixture()
        h.eval("""
          var old=document.querySelector('button[aria-label="مشاركة"]');old.remove();
          var share=document.createElement('div');share.setAttribute('role','button');share.setAttribute('data-action-id','mobile-share');share.setAttribute('data-mcomponent','1');share.setAttribute('aria-label','مشاركة هذا الريل مع أصدقائك');
          share.getBoundingClientRect=function(){return {left:20,right:100,top:600,bottom:640,width:80,height:40};};
          share.onclick=function(){__officialShares++;__sheet();var b=document.querySelector('button[aria-label="نسخ الرابط"]');b.setAttribute('data-action-id','mobile-copy');b.setAttribute('data-mcomponent','1');b.setAttribute('aria-label','نسخ الرابط إلى الحافظة');};
          __v.parentElement.appendChild(share);
          window.__mbReel={rate:2,skip:10};
        """.trimIndent())
        h.eval(context.resources.openRawResource(R.raw.reel_gestures).bufferedReader().use { it.readText() })
        h.eval(assetsText(context,"react-video-permalink.js"))
        h.eval(assetsText(context,"player-post-download.js"))
        h.eval("FproPlayerPostDownload.begin(__v)")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host)
        assertEquals("",uri.getQueryParameter("media"))
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        assertEquals("1",h.eval("__officialShares"))
        assertEquals("1",h.eval("__officialCopies"))
        assertEquals("5",h.eval("FproOfficialDownload.report().last.stage"))
        val diagnostic=org.json.JSONObject("{\"schema\":1}").put("attempt",org.json.JSONObject().put("stage",2).put("reason",3).put("secret","PRIVATE_SENTINEL"))
        val clean=com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(diagnostic.toString())!!
        assertTrue(clean.contains("attempt")&&!clean.contains("PRIVATE_SENTINEL"))
    }finally{h.close()}}
    private fun assetsText(context:android.content.Context,name:String):String = context.assets.open(name).bufferedReader().use { it.readText() }

    private fun homeShareGlyph(h:Harness){h.eval("""
        var share=document.querySelector('article>button');share.setAttribute('role','button');share.setAttribute('data-action-id','opaque');share.setAttribute('data-mcomponent','opaque');share.setAttribute('aria-label','unclassified');
        share.innerHTML='<span style="font-family:fb-icons">&#xF037A;</span><span>4</span>';
    """.trimIndent())}

    private fun wrapOfficialCopyMenu(h:Harness){h.eval("""
        var share=document.querySelector('article>button'),open=share.onclick;window.__wrongCopyClicks=0;
        share.onclick=function(){
            open();var row=document.querySelector('[role="presentation"]>button'),menu=row.parentElement;
            menu.setAttribute('data-action-id','sheet-action');menu.setAttribute('data-mcomponent','sheet');menu.setAttribute('aria-label','مشاركة');
            row.setAttribute('data-action-id','copy-action');row.setAttribute('data-mcomponent','copy');row.innerHTML='<span data-action-id="icon-metadata" data-mcomponent="icon">&#xF310F;</span><span>نسخ الرابط</span>';
            var outer=document.createElement('div');outer.setAttribute('role','button');outer.setAttribute('data-action-id','backdrop');outer.setAttribute('data-mcomponent','backdrop');outer.setAttribute('aria-label','إغلاق');
            menu.replaceWith(outer);outer.append(menu);
            [menu,outer].forEach(function(n){n.getBoundingClientRect=function(){return {left:0,right:400,top:450,bottom:800,width:400,height:350};};n.onclick=function(e){if(e.target===n)__wrongCopyClicks++;};});
            ['مشاركة على فيسبوك','إرسال كرسالة','إرسال في واتساب'].forEach(function(text){var b=document.createElement('button');b.textContent=text;b.getBoundingClientRect=function(){return {left:0,right:400,top:500,bottom:540,width:400,height:40};};b.onclick=function(){__wrongCopyClicks++;};menu.prepend(b);});
            var via=document.createElement('button');via.id='mb-share-via';via.setAttribute('aria-label','نسخ الرابط');via.textContent='Share via';via.getBoundingClientRect=function(){return {left:0,right:400,top:750,bottom:790,width:400,height:40};};via.onclick=function(){__wrongCopyClicks++;};menu.append(via);
        };
    """.trimIndent())}

    @Test fun internalDownloadLeavesClipboardUnchangedButManualCopyStillWorks(){
        androidx.test.core.app.ActivityScenario.launch(androidx.activity.ComponentActivity::class.java).use { scenario ->
            awaitActivityFocus(scenario)
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            val changed=java.util.concurrent.atomic.AtomicInteger(0)
            val manualReady=java.util.concurrent.CountDownLatch(1)
            lateinit var clipboard:android.content.ClipboardManager
            val listener=android.content.ClipboardManager.OnPrimaryClipChangedListener { changed.incrementAndGet();manualReady.countDown() }
            scenario.onActivity { activity ->
                clipboard=activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                clipboard.setPrimaryClip(android.content.ClipData.newPlainText("test","FPRO_SENTINEL"))
            }
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            val h=Harness()
            try {
                h.load(true,nativeCopyBridge=true);h.officialFixture(delayed=true);homeShareGlyph(h);wrapOfficialCopyMenu(h)
                // Android asynchronously classifies the seeded clip and can notify listeners
                // without another write. Wait for that setup work BEFORE measuring downloads.
                awaitActivityFocus(scenario)
                val deadline=android.os.SystemClock.uptimeMillis()+10000
                var classifying=true
                while(classifying&&android.os.SystemClock.uptimeMillis()<deadline){
                    scenario.onActivity { classifying=requireNotNull(clipboard.primaryClipDescription){"focused seed clipboard description missing"}.classificationStatus==android.content.ClipDescription.CLASSIFICATION_NOT_COMPLETE }
                    if(classifying)Thread.sleep(50)
                }
                assertTrue("seed classification did not settle",!classifying)
                awaitActivityFocus(scenario)
                InstrumentationRegistry.getInstrumentation().waitForIdleSync()
                scenario.onActivity { clipboard.addPrimaryClipChangedListener(listener) }
                h.eval("FproOfficialDownload.begin(__v);FaceboostPage.postMessage(JSON.stringify({call:'copyText',text:'https://www.facebook.com/share/v/1HeYq17541/'}));")
                val uri=android.net.Uri.parse(h.awaitRoute())
                assertEquals("0",uri.getQueryParameter("copy"))
                InstrumentationRegistry.getInstrumentation().waitForIdleSync()
                awaitActivityFocus(scenario)
                scenario.onActivity { activity ->
                    assertEquals("FPRO_SENTINEL",clipboard.primaryClip!!.getItemAt(0).text.toString())
                    assertEquals(0,changed.get())
                    // No installed downloader needed: even explicit copyLink=true cannot write.
                    com.almekhlafi.materialbook.utils.ExternalDownloader.sendToDownloader(activity,"",uri.getQueryParameter("link")!!,"https://m.facebook.com/","com.example.notinstalled",{},true)
                    assertEquals("FPRO_SENTINEL",clipboard.primaryClip!!.getItemAt(0).text.toString())
                }
                InstrumentationRegistry.getInstrumentation().waitForIdleSync()
                assertEquals(0,changed.get())
                h.eval("FaceboostPage.postMessage(JSON.stringify({call:'copyText',text:'FPRO_MANUAL_COPY'}));")
                assertTrue(manualReady.await(10,TimeUnit.SECONDS))
                awaitActivityFocus(scenario)
                scenario.onActivity { assertEquals("FPRO_MANUAL_COPY",clipboard.primaryClip!!.getItemAt(0).text.toString()) }
            }finally{
                scenario.onActivity { clipboard.removePrimaryClipChangedListener(listener) }
                h.close()
            }
        }
    }

    @Test fun homepageArabicDirectionIsolatesKeepOfficialCopyInternal(){val h=Harness();try{
        h.load(true);h.officialFixture()
        h.eval("document.querySelector('article>button').setAttribute('aria-label','\\u2068\\u061Cمشاركة\\u2069');FproOfficialDownload.begin(__v);")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host)
        assertEquals("0",uri.getQueryParameter("copy"))
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        assertEquals("true",h.eval("__officialShares===1&&__officialCopies===1&&!FproOfficialDownload.report().active"))
    }finally{h.close()}}

    @Test fun iconOnlyFeedDiagnosticsExportPublicGlyphsButNativeDropsTextAndInvalidCodes(){val h=Harness();try{
        h.load(true)
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        h.eval(assetsText(context,"player-diagnostic.js"));h.eval(assetsText(context,"mobile-share-diagnostic.js"))
        h.eval("""
          var owner=document.createElement('article');document.body.append(owner);owner.append(__v);
          var action=document.createElement('div');action.setAttribute('role','button');action.setAttribute('data-action-id','PRIVATE_ACTION');action.setAttribute('data-mcomponent','PRIVATE_COMPONENT');action.setAttribute('aria-label','4');
          action.innerHTML='<span style="font-family:fb-icons">&#xF310F;</span><span>PRIVATE_SENTINEL</span>';
          action.getBoundingClientRect=function(){return {left:10,right:90,top:710,bottom:750,width:80,height:40};};owner.append(action);
          window.__iconReport=FproPlayerDiagnostic.capture(__v);FproPlayerDiagnostic.begin(__v);
        """.trimIndent())
        val route=android.net.Uri.parse(h.awaitRoute());val raw=route.getQueryParameter("data")!!
        assertTrue(!raw.contains("PRIVATE_SENTINEL")&&!raw.contains("PRIVATE_ACTION")&&!raw.contains("fb-icons"))
        val report=org.json.JSONObject(raw)
        val candidates=report.getJSONObject("mobile").getJSONArray("candidates")
        var row:org.json.JSONObject?=null
        for(i in 0 until candidates.length())if(candidates.getJSONObject(i).getJSONObject("icons").getJSONArray("glyphs").length()>0)row=candidates.getJSONObject(i)
        assertTrue("expected controlled icon evidence",row!=null)
        val glyphs=row!!.getJSONObject("icons").getJSONArray("glyphs")
        assertEquals(0xF310F,glyphs.getJSONObject(0).getInt("code"))
        glyphs.put(org.json.JSONObject().put("code",65).put("font",1).put("via",1).put("secret","PRIVATE_SENTINEL"))
        row!!.getJSONObject("icons").put("secret","PRIVATE_SENTINEL")
        val clean=com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(report.toString())!!
        assertTrue(clean.contains("995599")) // U+F310F, not an account/video ID.
        assertTrue(!clean.contains("PRIVATE_SENTINEL")&&!clean.contains("\"code\": 65"))
    }finally{h.close()}}

    @Test fun reportedHomeShareGlyphSelectsCurrentVideoNotLikeOrComment(){val h=Harness();try{
        h.load(true);h.officialFixture();homeShareGlyph(h)
        h.eval("""
            window.__wrongActions=0;var share=document.querySelector('article>button');
            [983928,983929].forEach(function(code){var b=share.cloneNode(true);b.firstChild.textContent=String.fromCodePoint(code);b.onclick=function(){__wrongActions++;};b.getBoundingClientRect=function(){return {left:10,right:90,top:600,bottom:640,width:80,height:40};};share.parentElement.prepend(b);});
            FproOfficialDownload.begin(__v);
        """.trimIndent())
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host);assertEquals("0",uri.getQueryParameter("copy"))
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        assertEquals("true",h.eval("__wrongActions===0&&__officialShares===1&&__officialCopies===1&&!FproOfficialDownload.report().active"))
    }finally{h.close()}}

    @Test fun homeShareSheetWrappersDoNotBecomeIndependentCopyActions(){val h=Harness();try{
        h.load(true);h.officialFixture();homeShareGlyph(h);wrapOfficialCopyMenu(h)
        h.eval("FproOfficialDownload.begin(__v)")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host);assertEquals("0",uri.getQueryParameter("copy"))
        assertEquals("https://www.facebook.com/share/v/1HeYq17541/",uri.getQueryParameter("link"))
        assertEquals("true",h.eval("__officialShares===1&&__officialCopies===1&&__wrongCopyClicks===0&&FproOfficialDownload.report().last.copyMatches===1"))
        val raw=org.json.JSONObject("{\"schema\":1}").put("attempt",org.json.JSONObject().put("copyMatches",999).put("copyNamed",999).put("copyGlyphs",999).put("copyNested",999).put("secret","PRIVATE_SENTINEL"))
        val clean=com.almekhlafi.materialbook.utils.PlayerDiagnostic.format(raw.toString())!!
        val attempt=org.json.JSONObject(clean.substring(clean.indexOf('{'))).getJSONObject("attempt")
        assertEquals(64,attempt.getInt("copyMatches"));assertEquals(32,attempt.getInt("copyNamed"));assertEquals(32,attempt.getInt("copyGlyphs"));assertEquals(32,attempt.getInt("copyNested"));assertTrue(!clean.contains("PRIVATE_SENTINEL"))
    }finally{h.close()}}

    @Test fun automaticDownloadVeilsFreshMenuAndLateToastButRestoresManualUi(){val h=Harness();try{
        h.load(true);h.officialFixture(delayed=true);homeShareGlyph(h);wrapOfficialCopyMenu(h)
        h.eval("FproOfficialDownload.begin(__v)")
        assertEquals("true",h.eval("document.querySelector('[role=presentation]').style.filter==='opacity(0)'&&getComputedStyle(document.querySelector('[role=presentation]')).opacity!=='0'&&FproOfficialDownload.report().active"))
        h.eval("__emitOfficialCopy()")
        val uri=android.net.Uri.parse(h.awaitRoute())
        assertEquals("download",uri.host);assertEquals("0",uri.getQueryParameter("copy"))
        h.eval("window.__lateToast=document.createElement('div');__lateToast.setAttribute('role','status');__lateToast.textContent='تم النسخ';document.body.appendChild(__lateToast);window.__errorToast=__lateToast.cloneNode();__errorToast.textContent='تعذر نسخ الرابط';document.body.appendChild(__errorToast)")
        assertEquals("true",h.eval("__lateToast.style.filter==='opacity(0)'&&__errorToast.style.filter===''&&!FproOfficialDownload.report().active&&__wrongCopyClicks===0&&__officialCopies===1"))
        val deadline=android.os.SystemClock.uptimeMillis()+4000
        while(h.eval("FproOfficialDownload.report().veiled")!="false"&&android.os.SystemClock.uptimeMillis()<deadline)Thread.sleep(25)
        assertEquals("true",h.eval("!FproOfficialDownload.report().veiled&&__lateToast.style.filter===''&&document.querySelector('[role=presentation]').style.filter===''") )
        h.eval("window.__manualToast=__lateToast.cloneNode(true);document.body.appendChild(__manualToast)")
        assertEquals("true",h.eval("__manualToast.style.filter===''&&!FproOfficialDownload.interceptCopy('ordinary manual text')"))
    }finally{h.close()}}

    @Test fun nativeReleaseReturnsHeldVideoToItsPreviousRate() { val h=Harness();try {
        h.load()
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        h.eval("window.__mbReel={rate:2,skip:10};__v.playbackRate=1.25;")
        h.eval(context.resources.openRawResource(R.raw.reel_gestures).bufferedReader().use{it.readText()})
        h.eval("var event=new Event('touchstart',{bubbles:true});Object.defineProperty(event,'touches',{value:[{clientX:100,clientY:600,identifier:1}]});__v.dispatchEvent(event);")
        val started=android.os.SystemClock.uptimeMillis()+3000
        while(h.eval("__v.playbackRate")!="2"&&android.os.SystemClock.uptimeMillis()<started)Thread.sleep(20)
        assertEquals("2",h.eval("__v.playbackRate"))
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            val now=android.os.SystemClock.uptimeMillis()
            val event=android.view.MotionEvent.obtain(now,now,android.view.MotionEvent.ACTION_CANCEL,100f,600f,0)
            h.web.dispatchTouchEvent(event);event.recycle()
        }
        val ended=android.os.SystemClock.uptimeMillis()+3000
        while(h.eval("__v.playbackRate")!="1.25"&&android.os.SystemClock.uptimeMillis()<ended)Thread.sleep(20)
        assertEquals("1.25",h.eval("__v.playbackRate"))
    }finally{h.close()} }

    @Test fun imageDownloadPlanRejectsVideoForeignPagesAndUnsafeSchemes() {
        val saver=com.almekhlafi.materialbook.utils.ImageDownloads
        val page="https://m.facebook.com/photo.php?fbid=123"
        val url="https://scontent.example.fbcdn.net/picture.jpg"
        val plan=saver.plan(page,url,"image/jpeg")!!
        assertEquals(url,plan.url);assertEquals("image/jpeg",plan.mime);assertTrue(plan.filename.endsWith(".jpg"))
        org.junit.Assert.assertNull(saver.plan(page,url,"video/mp4"))
        org.junit.Assert.assertNull(saver.plan("https://example.org",url,"image/jpeg"))
        org.junit.Assert.assertNull(saver.plan(page,"https://fbcdn.net.evil.example/p.jpg","image/jpeg"))
        org.junit.Assert.assertNull(saver.plan(page,"data:image/png;base64,eA==","image/png"))
        org.junit.Assert.assertNull(saver.plan(page,"http://scontent.fbcdn.net/p.jpg","image/jpeg"))
        org.junit.Assert.assertNull(saver.plan(page,url,"text/html"))
    }

    @Test fun systemImageDownloadActuallyWritesReadablePngWithoutStoragePermission() {
        val app=InstrumentationRegistry.getInstrumentation().targetContext
        val bytes=android.util.Base64.decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",0)
        val server=java.net.ServerSocket(0,1,java.net.InetAddress.getByName("127.0.0.1"))
        val served=Thread {
            runCatching { server.accept().use { socket ->
                socket.soTimeout=10000
                val reader=socket.getInputStream().bufferedReader()
                while(true){val line=reader.readLine()?:break;if(line.isEmpty())break}
                socket.getOutputStream().apply { write("HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n".toByteArray());write(bytes);flush() }
            } }
        }.apply { isDaemon=true;start() }
        val manager=app.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
        var id=-1L
        try {
            // Test-only loopback plan bypasses production HTTPS/Facebook validation;
            // production rejection of HTTP is asserted separately above.
            val plan=com.almekhlafi.materialbook.utils.ImageDownloads.Plan("http://127.0.0.1:${server.localPort}/fixture.png","image/png","FPRO-test-${java.util.UUID.randomUUID()}.png")
            id=manager.enqueue(com.almekhlafi.materialbook.utils.ImageDownloads.request(plan,"FPRO fixture",null))
            val deadline=android.os.SystemClock.uptimeMillis()+20000
            var status=0;var reason=0
            while(android.os.SystemClock.uptimeMillis()<deadline){
                manager.query(android.app.DownloadManager.Query().setFilterById(id)).use { c -> if(c.moveToFirst()){status=c.getInt(c.getColumnIndexOrThrow(android.app.DownloadManager.COLUMN_STATUS));reason=c.getInt(c.getColumnIndexOrThrow(android.app.DownloadManager.COLUMN_REASON))} }
                if(status==android.app.DownloadManager.STATUS_SUCCESSFUL||status==android.app.DownloadManager.STATUS_FAILED)break
                Thread.sleep(100)
            }
            assertEquals("image download reason=$reason",android.app.DownloadManager.STATUS_SUCCESSFUL,status)
            manager.openDownloadedFile(id).use { file -> java.io.FileInputStream(file.fileDescriptor).use { input -> org.junit.Assert.assertArrayEquals(bytes,input.readBytes()) } }
        } finally { if(id>=0)manager.remove(id);server.close();served.join(1000) }
    }

    @Test fun imageRejectionDiagnosticUsesOnlyConstantCategoriesAndKeepsValidationStrict() {
        val saver=com.almekhlafi.materialbook.utils.ImageDownloads
        val page="https://m.facebook.com/photo.php?fbid=PRIVATE_SENTINEL"
        val url="https://private-name.fbcdn.net/PRIVATE_SENTINEL.jpg?token=SECRET_TOKEN"
        val report=saver.diagnostic(page,url,"application/octet-stream","attachment; filename=PRIVATE_SENTINEL.jpg")
        assertTrue(report.contains("سبب الرفض: 5"));assertTrue(report.contains("application/octet-stream"))
        assertTrue(report.contains("امتداد المرفق: jpg"));assertTrue(report.contains("امتداد المسار: jpg"))
        assertTrue(!report.contains("PRIVATE_SENTINEL"));assertTrue(!report.contains("SECRET_TOKEN"));assertTrue(!report.contains("private-name"));assertTrue(!report.contains("https://"))
        org.junit.Assert.assertNull(saver.plan(page,url,"application/octet-stream"))
        assertTrue(saver.diagnostic(page,url,"image/PRIVATE_SENTINEL","PRIVATE_SENTINEL").contains("other-image"))
        assertTrue(!saver.diagnostic(page,url,"image/PRIVATE_SENTINEL","PRIVATE_SENTINEL").contains("PRIVATE_SENTINEL"))
        assertTrue(saver.diagnostic("https://scontent.fbcdn.net/a.jpg",url,"image/jpeg","").contains("سبب الرفض: 2"))
        assertTrue(saver.diagnostic(page,"https://lookaside.fbsbx.com/file","image/jpeg","").contains("سبب الرفض: 4"))
        assertTrue(saver.diagnostic(page,url,""," ").contains("missing"))
    }

    private fun sampleImage(format:android.graphics.Bitmap.CompressFormat):ByteArray {
        val bitmap=android.graphics.Bitmap.createBitmap(2,2,android.graphics.Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(android.graphics.Color.GREEN)
        return java.io.ByteArrayOutputStream().use { output -> bitmap.compress(format,95,output);bitmap.recycle();output.toByteArray() }
    }
    @Test fun localDataJpegIsValidatedAndWrittenToGalleryWithoutStoragePermission(){
        val h=Harness();val done=CountDownLatch(1);var saved:android.net.Uri?=null
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        try {
            h.load(true,localImageSaved={uri->saved=uri;done.countDown()})
            val bytes=sampleImage(android.graphics.Bitmap.CompressFormat.JPEG)
            val url="data:image/jpeg;base64,"+android.util.Base64.encodeToString(bytes,android.util.Base64.NO_WRAP)
            InstrumentationRegistry.getInstrumentation().runOnMainSync{assertTrue(h.localSaver!!.start(url,"image/jpeg"))}
            assertTrue("JPEG save timeout",done.await(10,TimeUnit.SECONDS))
            context.contentResolver.openInputStream(saved!!)!!.use { org.junit.Assert.assertArrayEquals(bytes,it.readBytes()) }
        }finally{saved?.let{context.contentResolver.delete(it,null,null)};h.close()}
    }
    @Test fun actualWebViewBlobStreamsExactPngToValidatedNativeGalleryFile(){
        val h=Harness();val done=CountDownLatch(1);var saved:android.net.Uri?=null
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        try {
            h.load(true,localImageSaved={uri->saved=uri;done.countDown()})
            val bytes=sampleImage(android.graphics.Bitmap.CompressFormat.PNG)
            val encoded=android.util.Base64.encodeToString(bytes,android.util.Base64.NO_WRAP)
            h.eval("window.__localPhoto=URL.createObjectURL(new Blob([Uint8Array.from(atob('$encoded'),function(c){return c.charCodeAt(0);})],{type:'image/png'}));")
            val url=org.json.JSONTokener(h.eval("__localPhoto")).nextValue().toString()
            h.eval("window.__fproLocalImageSource?.take(__localPhoto)")
            InstrumentationRegistry.getInstrumentation().runOnMainSync{assertTrue(h.localSaver!!.start(url,"image/png"))}
            assertTrue("blob save timeout",done.await(12,TimeUnit.SECONDS))
            context.contentResolver.openInputStream(saved!!)!!.use { org.junit.Assert.assertArrayEquals(bytes,it.readBytes()) }
            h.eval("URL.revokeObjectURL(__localPhoto)")
        }finally{saved?.let{context.contentResolver.delete(it,null,null)};h.close()}
    }
    @Test fun localImageValidationRejectsForeignOriginsVideoHtmlAndSpoofedJpeg(){
        val saver=com.almekhlafi.materialbook.utils.LocalImageSaver
        val page="https://m.facebook.com/photo.php?fbid=123"
        assertTrue(saver.permitted(page,"blob:https://m.facebook.com/exact-token","image/jpeg"))
        assertTrue(!saver.permitted(page,"blob:https://www.facebook.com/foreign-token","image/jpeg"))
        assertTrue(!saver.permitted("https://evil.example", "data:image/jpeg;base64,eA==","image/jpeg"))
        assertTrue(!saver.permitted(page,"data:text/html;base64,eA==","image/jpeg"))
        assertTrue(!saver.permitted(page,"blob:https://m.facebook.com/exact-token","video/mp4"))
        assertTrue(!saver.validate("<html>not an image</html>".toByteArray(),"image/jpeg"))
        assertTrue(!saver.validate(sampleImage(android.graphics.Bitmap.CompressFormat.PNG),"image/jpeg"))
        assertTrue(saver.validate(sampleImage(android.graphics.Bitmap.CompressFormat.JPEG),"image/jpeg"))
    }

    @Test fun revokedBlobStillSavesWithoutFetchOrChangingWebsiteRevocation(){
        val h=Harness();val done=CountDownLatch(1);var saved:android.net.Uri?=null
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        try {
            h.load(true,localImageSaved={uri->saved=uri;done.countDown()})
            val bytes=sampleImage(android.graphics.Bitmap.CompressFormat.PNG)
            val encoded=android.util.Base64.encodeToString(bytes,android.util.Base64.NO_WRAP)
            h.eval("window.__revokedPhoto=URL.createObjectURL(new Blob([Uint8Array.from(atob('$encoded'),function(c){return c.charCodeAt(0);})],{type:'image/png'}));URL.revokeObjectURL(__revokedPhoto);window.fetch=function(){throw Error('fetch blocked');};")
            val url=org.json.JSONTokener(h.eval("__revokedPhoto")).nextValue().toString()
            InstrumentationRegistry.getInstrumentation().runOnMainSync{assertTrue(h.localSaver!!.start(url,"image/png"))}
            assertTrue("revoked blob failure: ${h.localFailure}",done.await(12,TimeUnit.SECONDS))
            context.contentResolver.openInputStream(saved!!)!!.use{org.junit.Assert.assertArrayEquals(bytes,it.readBytes())}
            context.contentResolver.query(saved!!,arrayOf(android.provider.MediaStore.Images.Media.IS_PENDING),null,null,null)!!.use{assertTrue(it.moveToFirst());assertEquals(0,it.getInt(0))}
        }finally{saved?.let{context.contentResolver.delete(it,null,null)};h.close()}
    }
    @Test fun percentEncodedJpegDataPreservesPlusAndWritesExactPublishedBytes(){
        val h=Harness();val done=CountDownLatch(1);var saved:android.net.Uri?=null
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        try {
            h.load(true,localImageSaved={uri->saved=uri;done.countDown()})
            val bytes=sampleImage(android.graphics.Bitmap.CompressFormat.JPEG)
            val base64=android.util.Base64.encodeToString(bytes,android.util.Base64.NO_WRAP)
            val url="data:image/jpeg;base64,"+android.net.Uri.encode(base64)
            InstrumentationRegistry.getInstrumentation().runOnMainSync{assertTrue(h.localSaver!!.start(url,"image/jpeg"))}
            assertTrue("encoded JPEG failure: ${h.localFailure}",done.await(10,TimeUnit.SECONDS))
            context.contentResolver.openInputStream(saved!!)!!.use{org.junit.Assert.assertArrayEquals(bytes,it.readBytes())}
        }finally{saved?.let{context.contentResolver.delete(it,null,null)};h.close()}
    }

}
