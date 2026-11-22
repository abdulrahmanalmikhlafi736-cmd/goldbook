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
        var nextPage: CountDownLatch? = null
        fun eval(js: String): String {
            val done=CountDownLatch(1)
            var value="null"
            InstrumentationRegistry.getInstrumentation().runOnMainSync {
                web.evaluateJavascript(js) { value=it;done.countDown() }
            }
            assertTrue("JS callback timeout",done.await(10,TimeUnit.SECONDS))
            return value
        }
        fun load(earlyGuard: Boolean = false, initialEnabled: Boolean = true, nativeCopyBridge: Boolean = false) {
            val done=CountDownLatch(1)
            InstrumentationRegistry.getInstrumentation().runOnMainSync {
                web=WebView(InstrumentationRegistry.getInstrumentation().targetContext).apply {
                    if(nativeCopyBridge)com.almekhlafi.materialbook.utils.jsBridge.installPageBridges(this,
                        com.almekhlafi.materialbook.utils.jsBridge.PageBridges(clipboard=com.almekhlafi.materialbook.utils.jsBridge.ClipboardBridge(context)))
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
    @Test fun footerAndTopRegionUseCssViewportBounds(){val h=Harness();try{
        h.load()
        assertEquals("true",h.eval("(function(){var p=FproMediaSurface.dock({left:0,top:0,right:400,bottom:800});return p.top+p.height<=798 && FproMediaSurface.ownsTop(__v,100,100) && !FproMediaSurface.ownsTop(__v,100,600);})()"))
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
        h.load();h.eval("__flush();");assertEquals("0",h.eval("__q.size"))
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
        assertEquals("1",routed.getQueryParameter("copy"))
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

}
