package com.almekhlafi.materialbook.ui.screens

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
        fun eval(js: String): String {
            val done=CountDownLatch(1)
            var value="null"
            InstrumentationRegistry.getInstrumentation().runOnMainSync {
                web.evaluateJavascript(js) { value=it;done.countDown() }
            }
            assertTrue("JS callback timeout",done.await(10,TimeUnit.SECONDS))
            return value
        }
        fun load(earlyGuard: Boolean = false) {
            val done=CountDownLatch(1)
            InstrumentationRegistry.getInstrumentation().runOnMainSync {
                web=WebView(InstrumentationRegistry.getInstrumentation().targetContext).apply {
                    settings.javaScriptEnabled=true
                    settings.domStorageEnabled=true
                    layout(0,0,400,800)
                    val html="<html><head><meta name='viewport' content='width=device-width,initial-scale=1'><script>window.__siteMoves=0;window.addEventListener('touchmove',function(){__siteMoves++;},true);</script></head><body><video id='v'></video></body></html>"
                    webViewClient=object:WebViewClient(){
                        override fun onPageFinished(view:WebView,url:String){done.countDown()}
                        override fun shouldInterceptRequest(view:WebView,request:WebResourceRequest):WebResourceResponse? {
                            return if(earlyGuard) WebResourceResponse("text/html","UTF-8",html.byteInputStream()) else null
                        }
                    }
                    if(earlyGuard){HomeSwipeGuard.install(this);loadUrl("https://m.facebook.com/")}
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

}
