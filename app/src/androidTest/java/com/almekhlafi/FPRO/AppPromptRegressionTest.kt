package com.almekhlafi.FPRO

import android.content.Intent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

/** Real Chromium layout for the black-backdrop regression, not account proof. */
@RunWith(AndroidJUnit4::class)
class AppPromptRegressionTest {
    private fun browser(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) browser(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun openAppFilterKeepsBlockingSheetsAndPageControlsUsable() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        for (reference in listOf(false, true)) {
            ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
                awaitBrowserReady(scenario)
                val done = CountDownLatch(1)
                val result = AtomicReference("null")
                val detail = AtomicReference("null")
                scenario.onActivity { activity ->
                    val web = requireNotNull(browser(activity.window.decorView))
                    web.stopLoading()
                    val config = """{"enhance":true,"appBanner":true,"referenceEngine":$reference,"color":"طبيعي","textSelection":false}"""
                    val source = activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" +
                        activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", config)
                    val fixtureUrl = "https://m.facebook.com/fpro-app-prompt52-test"
                    // Stock API29 Chromium predates CSS inset; use real fullscreen longhands.
                    val fixtureHtml = """
                        <!doctype html><html><body id="prompt45" style="overflow:hidden">
                        <main><header id="header"><div id="slot"><button id="inlineCTA">فتح التطبيق</button></div>
                        <button id="search">Search</button><a id="account" href="/me">Account</a></header>
                        <article id="post"><video id="video" style="width:240px;height:180px"></video></article></main>
                        <div role="dialog" aria-modal="true" style="position:fixed;top:0;bottom:0;left:0;right:0;background:black">
                        <button id="modalCTA">Open app</button><button id="close">Close</button></div>
                        <div style="position:fixed;top:0;bottom:0;left:0;right:0;background:black"><button id="sheetCTA">Open app</button></div>
                        <header id="reelNav" style="position:fixed;top:0;left:0;width:100%;height:72px;background:black">
                        <button id="reelCTA"><svg width="16" height="16"><title>Facebook logo</title></svg><span>فتح</span><span>التطبيق</span></button><button id="reelSearch" aria-label="Search"></button><a id="reelAccount" href="/me" aria-label="Your profile">Account</a><span>ريلز</span></header>
                        <div id="compactBar" style="position:fixed;bottom:0;left:0;width:100%;min-height:64px;background:black;display:flex!important">
                        <button id="compactCTA">فتح التطبيق</button><button aria-label="Close">×</button></div>
                        <div id="host51" style="position:absolute;top:0;left:0;width:100vw;height:100vh">
                        <video id="movie51" style="width:240px;height:180px"></video>
                        <div id="nav51" style="position:fixed;top:0;left:12px;width:calc(100% - 12px);height:60px">
                        <div style="position:relative"><div role="button" id="cta51" aria-label="f فتح التطبيق" style="width:124px;height:40px">f فتح التطبيق</div>
                        <div role="button" aria-label="Your profile" id="profile51">Account</div><div role="button" aria-label="Search" id="search51">Search</div><div role="button" aria-label="Back" id="back51">Back</div></div></div></div>
                        <div id="host52" style="position:absolute;top:0;left:0;width:100vw;height:100vh">
                        <video id="movie52" style="width:240px;height:180px"></video><input id="seek52" type="range">
                        <div id="nav52" style="position:fixed;top:0;left:12px;width:calc(100% - 12px);height:60px">
                        <div style="position:relative"><div role="button" id="cta52" aria-label="فتح التطبيق" style="position:relative;width:124px;height:40px"><svg width="16" height="16"><text>Logo decoration</text></svg><span>فتح</span><span>التطبيق</span></div>
                        <div role="button" aria-label="Your profile" id="profile52">Account</div><div role="button" aria-label="Search" id="search52">Search</div><div role="button" aria-label="Back" id="back52">Back</div></div></div></div>
                        </body></html>
                    """.trimIndent()
                    web.webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? {
                            if (request.url.toString() != fixtureUrl) return null
                            return android.webkit.WebResourceResponse("text/html", "UTF-8", fixtureHtml.byteInputStream())
                        }
                        override fun onPageFinished(view: WebView, url: String?) {
                            if (url != fixtureUrl) return
                            view.evaluateJavascript("!!document.getElementById('prompt45') && !window.prompt45TestStarted") { ready ->
                                if (ready != "true") return@evaluateJavascript
                                view.evaluateJavascript("window.prompt45TestStarted=true;" + source + """
                                    ;(()=>{
                                      const shown=id=>{const el=document.getElementById(id);return getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0;};
                                      const cta=document.getElementById('inlineCTA');
                                      const checks=[
                                        getComputedStyle(cta).display==='none',
                                        getComputedStyle(document.getElementById('cta52')).display==='none',
                                        ['host52','movie52','seek52','nav52','profile52','search52','back52'].every(shown),
                                        getComputedStyle(document.getElementById('cta51')).display==='none',
                                        ['host51','movie51','nav51','profile51','search51','back51'].every(shown),
                                        shown('header')&&getComputedStyle(document.getElementById('slot')).display!=='none'&&shown('search')&&shown('account'),
                                        shown('post')&&shown('video'),shown('modalCTA')&&shown('close'),
                                        shown('sheetCTA'),document.body.style.overflow==='hidden',
                                        !cta.hasAttribute('${if(reference) "data-fpro-hidden" else "data-fpro-reference-noapp"}'),
                                        document.querySelectorAll('body[data-fpro-hidden],main[data-fpro-hidden],header[data-fpro-hidden]').length===0
                                      ];
                                      checks.push(getComputedStyle(document.getElementById('reelCTA')).display==='none');
                                      checks.push(shown('reelNav')&&shown('reelSearch')&&shown('reelAccount'));
                                      const reel=document.getElementById('reelCTA');
                                      reel.style.setProperty('display','inline-flex','');
                                      checks.push(getComputedStyle(reel).display==='none'); // before observer/RAF: owned CSS wins
                                      const noise=document.createElement('section');noise.innerHTML=Array.from({length:2500},()=>'<button>Normal</button>').join('');document.body.prepend(noise);
                                      reel.style.setProperty('display','inline-flex','important');
                                      document.dispatchEvent(new Event('visibilitychange'));
                                      checks.push(getComputedStyle(reel).display==='none'); // known target beyond discovery caps

                                      const bar=document.getElementById('compactBar');
                                      checks.push(getComputedStyle(bar).display==='none');
                                      checks.push(getComputedStyle(document.getElementById('compactCTA')).display!=='none');
                                      const beforeUrgent=window.FproNoapp.timing();
                                      const fresh=document.createElement('div');
                                      fresh.style.cssText='position:fixed;bottom:0;left:0;width:100%;height:56px;background:black';
                                      fresh.innerHTML='<div style="position:relative"><div style="position:relative"><div role="button" style="position:relative">فتح التطبيق</div></div></div>';
                                      document.body.append(fresh);
                                      let painted=false;requestAnimationFrame(()=>{painted=true;});
                                      queueMicrotask(()=>{
                                        checks.push(!painted&&getComputedStyle(fresh).display==='none'&&getComputedStyle(fresh.querySelector('[role="button"]')).display!=='none');
                                        window.prompt49Debug=JSON.stringify({painted,display:getComputedStyle(fresh).display,inline:fresh.style.display,owned:fresh.hasAttribute('data-fpro-reference-noapp'),beforeUrgent,afterUrgent:window.FproNoapp.timing(),mainUrgent:window.__fpro.promptTiming(),classified:window.FproNoapp.target(fresh.querySelector('[role=button]'))===fresh});
                                        window.__fpro.update(Object.assign($config,{appBanner:false}));
                                        checks.push(getComputedStyle(bar).display==='flex'&&bar.style.getPropertyPriority('display')==='important'&&shown('compactCTA'));
                                        checks.push(shown('reelCTA')&&!reel.hasAttribute('data-fpro-app-prompt')&&!reel.hasAttribute('data-fpro-reference-noapp'));
                                        window.__fpro.update($config);
                                        const nextBody=document.createElement('body');
                                        nextBody.innerHTML='<main><button>Search</button><button>Account</button></main><div id="nextBar" style="position:fixed;bottom:0;left:0;width:100%;height:65px"><div style="position:relative;height:59px"><div role="button" style="height:39px">فتح التطبيق</div></div></div>';
                                        document.body.replaceWith(nextBody);
                                        queueMicrotask(()=>{
                                          const nextBar=document.getElementById('nextBar');
                                          checks.push(!painted&&getComputedStyle(nextBar).display==='none'&&getComputedStyle(nextBody.querySelector('main')).display!=='none'&&getComputedStyle(nextBar.querySelector('[role="button"]')).display!=='none');
                                          window.prompt49Debug=JSON.stringify({prior:window.prompt49Debug,state:window.__fpro.promptState(),nextDisplay:getComputedStyle(nextBar).display,timing:window.FproNoapp.timing()});
                                          window.prompt49Result=JSON.stringify(checks);
                                        });
                                      });
                                      return null;
                                    })()
                                """.trimIndent()) {
                                    view.evaluateJavascript("window.prompt49Result||null") { value ->
                                        result.set(value)
                                        view.evaluateJavascript("window.prompt49Debug||null") { info -> detail.set(info); done.countDown() }
                                    }
                                }
                            }
                        }
                    }
                    web.loadUrl(fixtureUrl)
                }
                assertTrue("Real Chromium prompt fixture completed", done.await(15, TimeUnit.SECONDS))
                val checks = JSONArray(JSONArray("[${result.get()}]").getString(0))
                assertEquals(22, checks.length())
                for (i in 0 until checks.length()) assertTrue("reference=$reference assertion=$i result=$checks detail=${detail.get()}", checks.getBoolean(i))
            }
        }
    }
}
