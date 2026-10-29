package com.almekhlafi.FPRO

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Verifies real rendered pixels, not just successful compilation or DOM presence. */
@org.junit.FixMethodOrder(org.junit.runners.MethodSorters.NAME_ASCENDING)
@RunWith(AndroidJUnit4::class)
class WebViewRenderingTest {
    private fun findWeb(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) findWeb(view.getChildAt(i))?.let { return it }
        return null
    }

    @Test fun aPlainNativeBrowserBaseline() {
        org.junit.Assume.assumeTrue(android.os.Build.VERSION.SDK_INT >= 35)
        val nativeAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation(android.app.UiAutomation.FLAG_DONT_USE_ACCESSIBILITY)
        ActivityScenario.launch<android.app.Activity>(android.content.Intent().setClassName(InstrumentationRegistry.getInstrumentation().targetContext.packageName, "com.almekhlafi.FPRO.PlainWebActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            Thread.sleep(25_000)
            val complete = CountDownLatch(1)
            val evidence = java.util.concurrent.atomic.AtomicReference("no callback")
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.evaluateJavascript("""
                    JSON.stringify({ua:navigator.userAgent,text:document.body?document.body.innerText.slice(0,600):'',state:document.readyState,width:innerWidth,height:innerHeight,scrollX:scrollX,bodyOpacity:document.body?getComputedStyle(document.body).opacity:'none',controls:Array.from(document.querySelectorAll('input,button,a')).slice(0,12).map(function(e){var r=e.getBoundingClientRect();var s=getComputedStyle(e);return {tag:e.tagName,type:e.type||'',text:(e.innerText||'').slice(0,40),x:r.x,y:r.y,w:r.width,h:r.height,display:s.display,visibility:s.visibility,opacity:s.opacity};})})
                """.trimIndent()) { result ->
                    evidence.set(result ?: "null")
                    android.util.Log.i("FPRO_EVIDENCE", "PLAIN_BASELINE: " + result)
                    complete.countDown()
                }
            }
            assertTrue("Native baseline must answer JavaScript", complete.await(5, TimeUnit.SECONDS))
            android.os.ParcelFileDescriptor.AutoCloseInputStream(nativeAutomation.executeShellCommand("screencap -p /data/local/tmp/fpro-baseline.png")).use { it.readBytes() }
            println("PLAIN_BASELINE: " + evidence.get())
        }
    }

    @Test fun bSelectedToolsActivateMasterWithoutOverridingExplicitOff() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val store = context.getSharedPreferences("fpro", android.content.Context.MODE_PRIVATE)
        val keys = listOf("pageEnhancements", "downloads", "color")
        val old = store.all.filterKeys { it in keys }
        try {
            val prefs = Preferences(context)
            prefs.set("pageEnhancements", false)
            prefs.set("downloads", true)
            assertTrue(prefs.flag("pageEnhancements"))
            prefs.set("pageEnhancements", false)
            assertFalse(Preferences(context).flag("pageEnhancements"))
            prefs.set("color", "ذهبي")
            assertTrue(prefs.flag("pageEnhancements"))
            store.edit().remove("pageEnhancements").commit()
            assertTrue(Preferences(context).flag("pageEnhancements"))
        } finally {
            store.edit().apply {
                keys.forEach { remove(it) }
                old.forEach { (key,value) -> when(value) { is Boolean -> putBoolean(key,value); is String -> putString(key,value) } }
            }.commit()
        }
    }

    /** Local fixture, but real Android touch injection and native fullscreen callback. */
    @Test fun cTouchDoubleTapEntersNativeFullscreenWithoutVideoTools() {
        org.junit.Assume.assumeTrue(android.os.Build.VERSION.SDK_INT >= 35)
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.getUiAutomation(android.app.UiAutomation.FLAG_DONT_USE_ACCESSIBILITY)
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            Thread.sleep(2300)
            val ready = CountDownLatch(1)
            val point = FloatArray(2)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                val location = IntArray(2); web.getLocationOnScreen(location)
                point[0] = location[0] + web.width / 2f; point[1] = location[1] + web.height / 2f
                web.stopLoading()
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <body style="margin:0"><video style="position:fixed;inset:0;width:100%;height:100%"></video>
                    <div style="position:fixed;inset:0" role="button" aria-label="Play"></div></body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                web.postDelayed({
                    val script = activity.assets.open("facebook.js").bufferedReader().use { it.readText() }
                        .replace("__CONFIG__", "{\"enhance\":false,\"doubleTapFullscreen\":true,\"downloads\":false,\"rainbow\":false}")
                    web.evaluateJavascript(script) {
                        web.evaluateJavascript("!!window.__fpro && !document.querySelector('.fpro-video-tools')") { result ->
                            if (result == "true") ready.countDown()
                        }
                    }
                }, 700)
            }
            assertTrue("Gesture-only script must initialize without video overlays", ready.await(5, TimeUnit.SECONDS))
            repeat(2) {
                val down = android.os.SystemClock.uptimeMillis()
                val press = android.view.MotionEvent.obtain(down, down, android.view.MotionEvent.ACTION_DOWN, point[0], point[1], 0)
                press.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
                assertTrue(automation.injectInputEvent(press, true)); press.recycle()
                Thread.sleep(50)
                val release = android.view.MotionEvent.obtain(down, android.os.SystemClock.uptimeMillis(), android.view.MotionEvent.ACTION_UP, point[0], point[1], 0)
                release.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
                assertTrue(automation.injectInputEvent(release, true)); release.recycle()
                if (it == 0) Thread.sleep(70)
            }
            var nativeFullscreen = false
            repeat(25) {
                scenario.onActivity { activity ->
                    val field = MainActivity::class.java.getDeclaredField("fullView"); field.isAccessible = true
                    nativeFullscreen = field.get(activity) != null
                }
                if (!nativeFullscreen) Thread.sleep(100)
            }
            assertTrue("Two real touch taps through the player cover must trigger WebChromeClient native fullscreen", nativeFullscreen)
            android.os.ParcelFileDescriptor.AutoCloseInputStream(automation.executeShellCommand("input keyevent KEYCODE_BACK")).use { it.readBytes() }
        }
    }

    /** Local Facebook-shaped header: verifies the native state, not just the JS helper. */
    @Test fun dHomeGearFollowsRtlLogoAndHidesAfterSpaNavigation() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            Thread.sleep(2300)
            val ready = CountDownLatch(1)
            var positioned = false
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                // Serve a deterministic local header at a real HTTPS-shaped URL.
                // loadDataWithBaseURL can retain about:blank during a pending
                // Chromium navigation; this test needs a stable SPA history.
                val header = """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <body><header id="gear-fixture"><svg aria-label="Facebook" style="position:absolute;left:65vw;top:8px;width:100px;height:40px"></svg></header></body></html>
                """.trimIndent()
                web.webViewClient = object : android.webkit.WebViewClient() {
                    override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse =
                        android.webkit.WebResourceResponse("text/html", "UTF-8", header.byteInputStream())
                }
                web.loadUrl("https://m.facebook.com/")
                fun probe(attempt: Int) {
                    val flag = MainActivity::class.java.getDeclaredField("homeControls\$delegate").apply { isAccessible = true }
                    val x = MainActivity::class.java.getDeclaredField("gearX\$delegate").apply { isAccessible = true }
                    web.evaluateJavascript("!!document.querySelector('#gear-fixture') && document.readyState==='complete'") { committed ->
                        if (committed == "true" && (flag.get(activity) as androidx.compose.runtime.State<*>).value == true) {
                            val coordinate = (x.get(activity) as androidx.compose.runtime.State<*>).value as Float
                            positioned = coordinate > web.width * .65f && coordinate < web.width * .88f
                            ready.countDown()
                        } else if (attempt < 25) web.postDelayed({ probe(attempt + 1) }, 200)
                    }
                }
                web.postDelayed({ probe(0) }, 300)
            }
            assertTrue("Home gear must become available", ready.await(8, TimeUnit.SECONDS))
            assertTrue("RTL gear must follow the logo, not the left or extreme right edge", positioned)
            val hidden = CountDownLatch(1)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.evaluateJavascript("history.replaceState({},'', '/reel/20')", null)
                fun probe(attempt: Int) {
                    val flag = MainActivity::class.java.getDeclaredField("homeControls\$delegate").apply { isAccessible = true }
                    if ((flag.get(activity) as androidx.compose.runtime.State<*>).value == false) hidden.countDown()
                    else if (attempt < 25) web.postDelayed({ probe(attempt + 1) }, 200)
                }
                web.postDelayed({ probe(0) }, 750)
            }
            assertTrue("Native gear must hide on a SPA video route", hidden.await(8, TimeUnit.SECONDS))
        }
    }

    /** Local fixture: prove slot geometry and actual raster-icon pixels, not just attributes. */
    @Test fun eStorySlotAndRasterPaletteActuallyRender() {
        org.junit.Assume.assumeTrue(android.os.Build.VERSION.SDK_INT >= 35)
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.getUiAutomation(android.app.UiAutomation.FLAG_DONT_USE_ACCESSIBILITY)
        val icon = android.util.Base64.encodeToString("""<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#1877f2"/><path d="M9 16l5 5 10-11" fill="none" stroke="white" stroke-width="3"/></svg>""".toByteArray(), android.util.Base64.NO_WRAP)
        val portrait = android.util.Base64.encodeToString("""<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#ed1c24"/></svg>""".toByteArray(), android.util.Base64.NO_WRAP)
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            // The app schedules its first Facebook load from Compose after the
            // splash. Wait for that navigation, otherwise it can overwrite the
            // local fixture after a fixed sleep on a slow emulator.
            val startupReady = CountDownLatch(1)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                fun probeStartup(attempt: Int) {
                    if (Navigation.isFacebook(web.url.orEmpty())) startupReady.countDown()
                    else if (attempt < 50) web.postDelayed({ probeStartup(attempt + 1) }, 200)
                }
                probeStartup(0)
            }
            assertTrue("Initial app navigation must start before loading local fixture", startupReady.await(12, TimeUnit.SECONDS))
            val ready = CountDownLatch(1)
            val evidence = java.util.concurrent.atomic.AtomicReference("no fixture response")
            var collapsed = false
            val points = FloatArray(6)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                var injected = false
                fun probeFixture(attempt: Int) {
                    if (injected) return
                    val view = web
                    view.evaluateJavascript("!!document.querySelector('#palette-fixture') && document.readyState==='complete' && Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0)") { present ->
                            if (present == "true" && !injected) {
                                injected = true
                                val source = activity.assets.open("facebook.js").bufferedReader().use { it.readText() }
                                    .replace("__CONFIG__", """{"enhance":true,"homeStories":true,"color":"ذهبي"}""")
                                view.evaluateJavascript("window.__fproPageInfo=()=>({home:true});" + source) {
                                    view.evaluateJavascript("""
                                        (()=>{const b=document.querySelector('#badge').getBoundingClientRect(),a=document.querySelector('#avatar').getBoundingClientRect(),r=document.querySelector('#ring').getBoundingClientRect();return JSON.stringify({slot:document.querySelector('#slot').getBoundingClientRect().height,gap:document.querySelector('#post').getBoundingClientRect().top-document.querySelector('#composer').getBoundingClientRect().bottom,width:innerWidth,points:[b.left+4,b.top+16,a.left+a.width/2,a.top+a.height/2,r.left+1,r.top+r.height/2]});})()
                                    """.trimIndent()) { result ->
                                        evidence.set(result ?: "null")
                                        val data = org.json.JSONObject(org.json.JSONArray("[$result]").getString(0))
                                        collapsed = data.getDouble("slot") == 0.0 && kotlin.math.abs(data.getDouble("gap")) < 1
                                        val offset = IntArray(2); view.getLocationOnScreen(offset)
                                        val scale = view.width / data.getDouble("width")
                                        val coordinates = data.getJSONArray("points")
                                        for (n in 0..5) points[n] = (coordinates.getDouble(n) * scale + offset[n % 2]).toFloat()
                                        view.postVisualStateCallback(12, object : WebView.VisualStateCallback() {
                                            override fun onComplete(requestId: Long) { ready.countDown() }
                                        })
                                    }
                                }
                            }
                        }
                    if (!injected && attempt < 60) view.postDelayed({ probeFixture(attempt + 1) }, 200)
                }
                web.webViewClient = object : android.webkit.WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String?) { probeFixture(60) }
                }
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <body id="palette-fixture" style="margin:0;background:#242526;min-height:100vh">
                    <header style="height:100px"><span aria-label="هذا الحساب تم التحقق منه"><img id="badge" style="position:absolute;left:24px;top:24px;width:32px;height:32px" src="data:image/svg+xml;base64,$icon"></span>
                    <div id="ring" style="position:absolute;left:80px;top:24px;border:2px solid rgb(24,119,242);border-radius:50%;width:40px;height:40px"><img id="avatar" style="display:block;width:40px;height:40px;border-radius:50%" src="data:image/svg+xml;base64,$portrait"></div></header>
                    <main><div id="composer" style="height:40px">Composer</div><div id="slot" style="min-height:190px;padding:12px"><div style="height:190px"><div data-sigil="m-story-tray"><a href="/stories/1">One</a><a href="/stories/2">Two</a></div></div><hr></div><article id="post" style="height:60px">Normal post</article></main>
                    </body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                // Local loadData can commit without a timely onPageFinished
                // during slow emulator/network teardown; probe the real marker.
                web.postDelayed({ probeFixture(0) }, 100)
            }
            assertTrue("Local palette must produce a visual frame: ${evidence.get()}", ready.await(20, TimeUnit.SECONDS))
            assertTrue("Story slot including min-height/padding must collapse without a gap: ${evidence.get()}", collapsed)
            Thread.sleep(400)
            val bitmap = requireNotNull(automation.takeScreenshot())
            val badge = bitmap.getPixel(points[0].toInt(), points[1].toInt())
            val photo = bitmap.getPixel(points[2].toInt(), points[3].toInt())
            val ring = bitmap.getPixel(points[4].toInt(), points[5].toInt())
            assertTrue("Verification image pixels must turn gold, not stay blue: ${Integer.toHexString(badge)}", Color.red(badge) > 150 && Color.green(badge) > 100 && Color.blue(badge) < 110)
            assertTrue("Avatar pixels must remain their original red: ${Integer.toHexString(photo)}", Color.red(photo) > 180 && Color.green(photo) < 70 && Color.blue(photo) < 80)
            assertTrue("Profile story border must turn gold: ${Integer.toHexString(ring)}", Color.red(ring) > 100 && Color.green(ring) > 60 && Color.blue(ring) < 90)

            // The user's selected theme is RED. Exercise other Facebook-style
            // avatar renderers, not only IMG + ordinary border in the first phase.
            val green = android.util.Base64.encodeToString("""<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#20b060"/></svg>""".toByteArray(), android.util.Base64.NO_WRAP)
            val encodedRing = android.util.Base64.encodeToString("""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53 53"><circle cx="26.5" cy="26.5" r="25" fill="none" stroke="#0866ff" stroke-width="2"/></svg>""".toByteArray(), android.util.Base64.NO_WRAP)
            val redReady = CountDownLatch(1)
            val redPoints = FloatArray(28)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                val html = """
                    <style>:root{--primary-button-background:#0866ff;--accent:#0866ff}.token-chip{position:absolute;left:24px;top:110px;width:120px;height:32px;background:var(--primary-button-background);color:var(--primary-button-text)}.pseudo:after{content:"";position:absolute;inset:-3px;border:3px solid rgb(8,102,255);border-radius:50%;box-sizing:border-box;pointer-events:none}</style>
                    <div style="position:absolute;left:0;top:260px;width:398px;height:53px"><img src="data:image/svg+xml;base64,$green" style="position:absolute;left:6px;top:6px;width:41px;height:41px;border-radius:50%"><canvas id="wideCanvasRing" width="796" height="106" style="position:absolute;inset:0;width:398px;height:53px"></canvas></div>
                    <div style="position:absolute;left:24px;top:180px;width:53px;height:53px"><img src="data:image/svg+xml;base64,$green" style="position:absolute;left:6px;top:6px;width:41px;height:41px;border-radius:50%"><canvas id="canvasRing" width="106" height="106" style="position:absolute;inset:0;width:53px;height:53px"></canvas></div>
                    <div style="position:absolute;left:100px;top:180px;width:53px;height:53px"><img src="data:image/svg+xml;base64,$green" style="position:absolute;left:6px;top:6px;width:41px;height:41px;border-radius:50%"><canvas id="opaqueCanvas" width="106" height="106" style="position:absolute;inset:0;width:53px;height:53px"></canvas></div>
                    <div id="encodedFrame" style="position:absolute;left:240px;top:110px;width:53px;height:53px;background-image:url(data:image/svg+xml;base64,$encodedRing);background-size:100% 100%"><div style="position:absolute;left:6px;top:6px;width:41px;height:41px"><img src="data:image/svg+xml;base64,$green" style="width:41px;height:41px;border-radius:50%"></div></div>
                    <div id="looseRing" style="position:absolute;left:170px;top:110px;width:40px;height:40px;border:3px solid rgb(8,102,255);border-radius:50%;box-sizing:border-box"></div><span id="nativeHash" style="color:rgb(8,102,255)!important">#خبر</span>
                    <div id="tokenChip" class="token-chip">Token</div>
                    <a id="cssFrame" class="pseudo" href="/profile.php" style="position:absolute;left:24px;top:24px;width:40px;height:40px"><div role="img" style="width:40px;height:40px;border-radius:50%;background-image:url(data:image/svg+xml;base64,$green)"></div></a>
                    <svg id="svgFrame" style="position:absolute;left:100px;top:24px;width:46px;height:46px" viewBox="0 0 46 46"><defs><clipPath id="avatarClip"><circle cx="23" cy="23" r="18"/></clipPath></defs><image href="data:image/svg+xml;base64,$green" x="5" y="5" width="36" height="36" clip-path="url(#avatarClip)"/><circle cx="23" cy="23" r="21" fill="none" stroke="rgb(8,102,255)" stroke-width="3"/></svg>
                    <img id="shadowFrame" src="data:image/svg+xml;base64,$green" style="position:absolute;left:170px;top:24px;width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 3px rgb(8,102,255)">
                    <img id="outlineFrame" src="data:image/svg+xml;base64,$green" style="position:absolute;left:240px;top:24px;width:40px;height:40px;border-radius:50%;outline:3px solid rgb(8,102,255)">
                """.trimIndent()
                web.evaluateJavascript("document.body.innerHTML=" + org.json.JSONObject.quote(html) + ";const ringCtx=document.querySelector('#canvasRing').getContext('2d');ringCtx.strokeStyle='#1877f2';ringCtx.lineWidth=4;ringCtx.beginPath();ringCtx.arc(53,53,50,0,Math.PI*2);ringCtx.stroke();const wideCtx=document.querySelector('#wideCanvasRing').getContext('2d');wideCtx.strokeStyle='#1877f2';wideCtx.lineWidth=4;wideCtx.beginPath();wideCtx.arc(53,53,50,0,Math.PI*2);wideCtx.stroke();const opaqueCtx=document.querySelector('#opaqueCanvas').getContext('2d');opaqueCtx.fillStyle='#1877f2';opaqueCtx.fillRect(0,0,106,106);window.__fpro.update({enhance:true,color:'أحمر',experimentalColorVars:true});") {
                    fun measureCommittedRed(attempt: Int) {
                        web.evaluateJavascript("!!document.querySelector('#cssFrame') && Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0) && getComputedStyle(document.querySelector('#cssFrame'),'::after').borderLeftColor==='rgb(198, 40, 40)'") redProbe@{ committed ->
                            if(committed != "true") {
                                if(attempt<40)web.postDelayed({ measureCommittedRed(attempt+1) },150)
                                return@redProbe
                            }
                    web.evaluateJavascript("""
                        (()=>{const a=document.querySelector('#cssFrame').getBoundingClientRect(),b=document.querySelector('#svgFrame').getBoundingClientRect(),c=document.querySelector('#shadowFrame').getBoundingClientRect(),d=document.querySelector('#outlineFrame').getBoundingClientRect();return JSON.stringify({active:window.__fpro.colorReport().experimentalColorVarsActive,width:innerWidth,points:[a.left-2,a.top+20,b.left+2,b.top+23,c.left-2,c.top+20,d.left-2,d.top+20,a.left+20,a.top+20,134,115,171,130,242,136.5,266.5,136.5,25.5,206.5,50.5,206.5,126.5,206.5,1.5,286.5,26.5,286.5]});})()
                    """.trimIndent()) { result ->
                        val data = org.json.JSONObject(org.json.JSONArray("[$result]").getString(0))
                        val offset = IntArray(2); web.getLocationOnScreen(offset)
                        val scale = web.width / data.getDouble("width")
                        assertTrue("RC token experiment must be active", data.getBoolean("active"))
                        for (n in 0..27) redPoints[n] = (data.getJSONArray("points").getDouble(n) * scale + offset[n % 2]).toFloat()
                        web.postVisualStateCallback(13, object : WebView.VisualStateCallback() {
                            override fun onComplete(requestId: Long) { web.invalidate();web.postOnAnimation { redReady.countDown() } }
                        })
                    }
                        }
                    }
                    measureCommittedRed(0)
                }
            }
            assertTrue("Red layered avatar rings must produce a frame", redReady.await(12, TimeUnit.SECONDS))
            Thread.sleep(500)
            val redBitmap = requireNotNull(automation.takeScreenshot())
            for (n in 0..3) {
                val pixel = redBitmap.getPixel(redPoints[n*2].toInt(), redPoints[n*2+1].toInt())
                assertTrue("Pseudo/SVG/shadow/outline ring $n must be RED, not blue: ${Integer.toHexString(pixel)}", Color.red(pixel) > 150 && Color.green(pixel) < 90 && Color.blue(pixel) < 90)
            }
            val rowPixel = redBitmap.getPixel(redPoints[24].toInt(), redPoints[25].toInt())
            assertTrue("Wide row canvas with only an offset ring must paint red", Color.red(rowPixel) > 150 && Color.green(rowPixel) < 90 && Color.blue(rowPixel) < 90)
            val rowPhoto = redBitmap.getPixel(redPoints[26].toInt(), redPoints[27].toInt())
            assertTrue("Wide row canvas filtering must preserve its nested portrait", Color.green(rowPhoto) > 130 && Color.red(rowPhoto) < 80)
            val canvasPixel = redBitmap.getPixel(redPoints[18].toInt(), redPoints[19].toInt())
            assertTrue("Separate transparent-center canvas ring must paint red", Color.red(canvasPixel) > 150 && Color.green(canvasPixel) < 90 && Color.blue(canvasPixel) < 90)
            val canvasPhoto = redBitmap.getPixel(redPoints[20].toInt(), redPoints[21].toInt())
            assertTrue("Canvas ring filtering must not tint nested portrait", Color.green(canvasPhoto) > 130 && Color.red(canvasPhoto) < 80)
            val opaquePixel = redBitmap.getPixel(redPoints[22].toInt(), redPoints[23].toInt())
            assertTrue("Opaque photo/media canvas must retain original blue pixels", Color.blue(opaquePixel) > 180 && Color.red(opaquePixel) < 80)
            val encodedPixel = redBitmap.getPixel(redPoints[14].toInt(), redPoints[15].toInt())
            assertTrue("Embedded SVG background ring on square 53px wrapper must paint red", Color.red(encodedPixel) > 150 && Color.green(encodedPixel) < 90 && Color.blue(encodedPixel) < 90)
            val nestedPhoto = redBitmap.getPixel(redPoints[16].toInt(), redPoints[17].toInt())
            assertTrue("Nested 41px portrait must stay green", Color.green(nestedPhoto) > 130 && Color.red(nestedPhoto) < 80)
            val detachedPixel = redBitmap.getPixel(redPoints[12].toInt(), redPoints[13].toInt())
            assertTrue("RC must paint a detached CSS ring red without an avatar descendant", Color.red(detachedPixel) > 150 && Color.green(detachedPixel) < 90 && Color.blue(detachedPixel) < 90)
            val tokenPixel = redBitmap.getPixel(redPoints[10].toInt(), redPoints[11].toInt())
            assertTrue("RC variable-driven button must actually paint red", Color.red(tokenPixel) > 150 && Color.green(tokenPixel) < 90 && Color.blue(tokenPixel) < 90)
            val originalPhoto = redBitmap.getPixel(redPoints[8].toInt(), redPoints[9].toInt())
            assertTrue("CSS background profile photo must stay green: ${Integer.toHexString(originalPhoto)}", Color.green(originalPhoto) > 130 && Color.red(originalPhoto) < 80)
            val greyReady = CountDownLatch(1)
            val greyStillFiltered = java.util.concurrent.atomic.AtomicBoolean(false)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.evaluateJavascript("""
                    (()=>{const c=document.querySelector('#canvasRing'),ctx=c.getContext('2d');ctx.clearRect(0,0,106,106);ctx.strokeStyle='#808080';ctx.lineWidth=4;ctx.beginPath();ctx.arc(53,53,50,0,Math.PI*2);ctx.stroke();return c.hasAttribute('data-fpro-accent-canvas-ring');})()
                """.trimIndent()) { result ->
                    greyStillFiltered.set(result == "true")
                    web.postVisualStateCallback(18, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { greyReady.countDown() } })
                }
            }
            assertTrue("Grey canvas redraw must render", greyReady.await(8, TimeUnit.SECONDS))
            assertTrue("Test must redraw grey while canvas tint is still active", greyStillFiltered.get())
            Thread.sleep(200)
            val greyBitmap = requireNotNull(automation.takeScreenshot())
            val greyPixel = greyBitmap.getPixel(redPoints[18].toInt(), redPoints[19].toInt())
            assertTrue("Read/grey ring must remain neutral without forcing it red", kotlin.math.abs(Color.red(greyPixel)-Color.green(greyPixel)) < 12 && kotlin.math.abs(Color.green(greyPixel)-Color.blue(greyPixel)) < 12 && Color.red(greyPixel) in 100..155)
            val restored = CountDownLatch(1)
            val transitionResult = java.util.concurrent.atomic.AtomicReference<String>()
            scenario.onActivity { activity ->
                requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript("""
                    (()=>{const chip=document.querySelector('#tokenChip');window.__fpro.update({enhance:true,color:'ذهبي',experimentalColorVars:true});const gold=getComputedStyle(chip).backgroundColor;const hashtag=getComputedStyle(document.querySelector('#nativeHash')).color;window.__fpro.update({enhance:true,color:'ذهبي',experimentalColorVars:false});return JSON.stringify({gold,hashtag,original:getComputedStyle(chip).backgroundColor,active:window.__fpro.colorReport().experimentalColorVarsActive});})()
                """.trimIndent()) { result -> transitionResult.set(result); restored.countDown() }
            }
            assertTrue("Live palette change and RC off must finish", restored.await(8, TimeUnit.SECONDS))
            val transitions = org.json.JSONObject(org.json.JSONArray("[${transitionResult.get()}]").getString(0))
            assertEquals("rgb(212, 175, 55)", transitions.getString("gold"))
            assertEquals("rgb(138, 101, 0)", transitions.getString("hashtag"))
            assertEquals("rgb(8, 102, 255)", transitions.getString("original"))
            assertFalse(transitions.getBoolean("active"))
            val fastReady = CountDownLatch(1)
            val fastResult = java.util.concurrent.atomic.AtomicReference<String>()
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.evaluateJavascript("""
                    (()=>{const span=document.createElement('span');span.textContent='#سريع';span.style.setProperty('color','rgb(8,102,255)','important');document.body.appendChild(span);Promise.resolve().then(()=>{window.__fastHashResult={marked:span.hasAttribute('data-fpro-accent-fg'),color:getComputedStyle(span).color};});})()
                """.trimIndent()) {
                    web.evaluateJavascript("JSON.stringify(window.__fastHashResult)") { result -> fastResult.set(result); fastReady.countDown() }
                }
            }
            assertTrue("Capture hashtag state in microtask before debounce timers", fastReady.await(8, TimeUnit.SECONDS))
            val immediate = org.json.JSONObject(org.json.JSONArray("[${fastResult.get()}]").getString(0))
            assertTrue("New hashtags must be marked before the next timer", immediate.getBoolean("marked"))
            assertEquals("rgb(138, 101, 0)", immediate.getString("color"))
        }
    }

    /** A separate, real HTTPS smoke test. No credentials, mock response or DOM replacement. */
    @Test fun liveFacebookLoggedOutSmoke() {
        org.junit.Assume.assumeTrue("Live site requires a recent system WebView", android.os.Build.VERSION.SDK_INT >= 35)
        val browserAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation(android.app.UiAutomation.FLAG_DONT_USE_ACCESSIBILITY)
        ActivityScenario.launch<android.app.Activity>(android.content.Intent().setClassName(InstrumentationRegistry.getInstrumentation().targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            val ready = CountDownLatch(1)
            val state = java.util.concurrent.atomic.AtomicReference("no callback")
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                fun probe(attempt: Int) {
                    web.evaluateJavascript("JSON.stringify({url:location.origin,text:document.body?document.body.innerText.slice(0,1800):'',controls:document.querySelectorAll('input,button,a').length,ready:document.readyState})") { result ->
                        state.set(result ?: "null")
                        try {
                            val data = org.json.JSONObject(org.json.JSONArray("[" + result + "]").getString(0))
                            if (data.optString("url").contains("facebook.com") && data.optString("text").length > 80 && data.optInt("controls") > 2 && data.optString("ready") != "loading") ready.countDown()
                            else if (attempt < 40) web.postDelayed({ probe(attempt + 1) }, 1000)
                        } catch (_: Exception) { if (attempt < 40) web.postDelayed({ probe(attempt + 1) }, 1000) }
                    }
                }
                web.postDelayed({ probe(0) }, 15_000)
            }
            val loaded = ready.await(50, TimeUnit.SECONDS)
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            val bitmap = browserAutomation.takeScreenshot()
            val target = instrumentation.targetContext.getExternalFilesDir(null)!!
            if (bitmap != null) java.io.File(target, "facebook-live.png").outputStream().use { bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
            android.util.Log.i("FPRO_EVIDENCE", "COMPOSE_SITE: " + state.get())
            android.os.ParcelFileDescriptor.AutoCloseInputStream(browserAutomation.executeShellCommand("screencap -p /data/local/tmp/fpro-compose.png")).use { it.readBytes() }
            println("LIVE_WEB: " + state.get())
            assertTrue("Live Facebook must deliver actual content/controls: " + state.get(), loaded)
        }
    }

    @Test fun websiteActuallyPaintsInNativeHost() {
        ActivityScenario.launch<android.app.Activity>(android.content.Intent().setClassName(InstrumentationRegistry.getInstrumentation().targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            val ready = CountDownLatch(1)
            // The app intentionally starts navigation after its 1.8 s splash.
            // Do not let that scheduled navigation replace the local fixture.
            Thread.sleep(2300)
            val state = java.util.concurrent.atomic.AtomicReference("no JavaScript callback")
            val nativeState = java.util.concurrent.atomic.AtomicReference("")
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                assertTrue("WebView must be attached", web.isAttachedToWindow)
                assertTrue("WebView must occupy the viewport", web.width > 200 && web.height > 300)
                web.stopLoading()
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                    <body style="margin:0;background:rgb(20,180,80);height:100vh"><h1>Rendering check</h1>
                    <script>document.body.dataset.ready='yes';</script></body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                fun probe(attempt: Int) {
                    web.evaluateJavascript("!!document.body && document.body.dataset.ready === 'yes'") { value ->
                        state.set("JS=$value; visual frame pending")
                        if (value == "true") web.postVisualStateCallback(1, object : WebView.VisualStateCallback() {
                            override fun onComplete(requestId: Long) { state.set("frame received"); ready.countDown() }
                        }) else if (attempt < 30) web.postDelayed({ probe(attempt + 1) }, 300)
                    }
                }
                web.postDelayed({ probe(0) }, 300)
            }
            val painted = ready.await(15, TimeUnit.SECONDS)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                nativeState.set("url=${web.url}; progress=${web.progress}; JS=${web.settings.javaScriptEnabled}; size=${web.width}x${web.height}; shown=${web.isShown}; lifecycle=${if (activity.isFinishing) "finishing" else "active"}")
            }
            assertTrue("WebView failed: ${state.get()}; ${nativeState.get()}", painted)
            // Wait past the custom splash and a few rendered frames before screenshot.
            Thread.sleep(2200)
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            instrumentation.waitForIdleSync()
            val bitmap = requireNotNull(instrumentation.uiAutomation.takeScreenshot())
            val pixel = bitmap.getPixel(bitmap.width / 2, bitmap.height / 2)
            val target = instrumentation.targetContext.getExternalFilesDir(null)!!
            java.io.File(target, "webview-local.png").outputStream().use { bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
            assertTrue("Actual WebView pixels must be green, not a grey/blank layer: ${Integer.toHexString(pixel)}",
                Color.green(pixel) > 140 && Color.red(pixel) < 70 && Color.blue(pixel) < 120)
        }
    }
    @Test fun yDocumentStartHidesCtaBeforeFirstFrameAndEnablesAmoled() {
        org.junit.Assume.assumeTrue(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.DOCUMENT_START_SCRIPT))
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val store=instrumentation.targetContext.getSharedPreferences("fpro",android.content.Context.MODE_PRIVATE)
        val keys=listOf("amoled","dark","pageEnhancements","appBanner","textSelection","color")
        val previous=store.all.filterKeys { it in keys }
        store.edit().putBoolean("amoled",true).putBoolean("dark",false).putBoolean("pageEnhancements",true).putBoolean("appBanner",true).putBoolean("textSelection",true).putString("color","تلقائي").commit()
        try {
            ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
                Thread.sleep(2300)
                val done=CountDownLatch(1);val result=java.util.concurrent.atomic.AtomicReference("null")
                scenario.onActivity { activity ->
                    val web=requireNotNull(findWeb(activity.window.decorView));web.stopLoading()
                    web.loadDataWithBaseURL("https://m.facebook.com/", """
                        <html><head><meta name="viewport" content="width=device-width"><script>
                        window.addEventListener('pointerdown',e=>e.preventDefault(),true);
                        requestAnimationFrame(()=>{const b=document.getElementById('earlyCta');window.firstCtaFrame={early:window.__fproEarly===true,hidden:!!b&&getComputedStyle(b).display==='none'};});
                        </script></head><body><button id="earlyCta">فتح التطبيق</button><button id="earlySearch">بحث</button><article id="oledCard" style="background-color:white"><span id="earlyRead" style="user-select:none!important">Native reading text</span></article></body></html>
                    """.trimIndent(),"text/html","UTF-8","https://m.facebook.com/")
                    fun probe(attempt:Int){web.evaluateJavascript("""
                        (()=>{if(!window.firstCtaFrame)return null;return JSON.stringify({first:window.firstCtaFrame,black:getComputedStyle(document.getElementById('oledCard')).backgroundColor,search:getComputedStyle(document.getElementById('earlySearch')).display});})()
                    """.trimIndent()){ value ->if(value!="null"){result.set(value);done.countDown()}else if(attempt<30)web.postDelayed({probe(attempt+1)},200)}}
                    web.postDelayed({probe(0)},200)
                }
                assertTrue(done.await(10,TimeUnit.SECONDS))
                val data=org.json.JSONObject(org.json.JSONArray("["+result.get()+"]").getString(0))
                assertTrue("Actual document-start script must run before site code",data.getJSONObject("first").getBoolean("early"))
                assertTrue("Open App must already be hidden at first requested frame",data.getJSONObject("first").getBoolean("hidden"))
                assertEquals("AMOLED must work without separate dark toggle","rgb(0, 0, 0)",data.getString("black"))
                assertNotEquals("Search must remain visible","none",data.getString("search"))
            }
        } finally {
            val edit=store.edit();keys.forEach { key ->when(val value=previous[key]){is Boolean->edit.putBoolean(key,value);is String->edit.putString(key,value);else->edit.remove(key)} };edit.commit()
        }
    }

    @Test fun zNativeLongPressSelectsPostsCommentsAndHashtags() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.getUiAutomation(0)
        val info = automation.serviceInfo
        info.flags = info.flags or android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        automation.serviceInfo = info
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            Thread.sleep(2300)
            val ready = CountDownLatch(1)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <style>p,span,a{-webkit-user-select:none;user-select:none}body{margin:24px;font:24px sans-serif}p{margin:24px 0}</style>
                    <body><article role="button" style="user-select:none!important;-webkit-user-select:none!important"><p id="post" style="user-select:none!important;-webkit-user-select:none!important">FPROpost selection sample</p><p><span id="comment" dir="auto" style="user-select:none!important;-webkit-user-select:none!important">FPROcomment selection sample</span></p><p><a id="hashtag" href="/hashtag/sample" style="user-select:none!important;-webkit-user-select:none!important">#FPROhashtag</a></p><button>Like</button><div role="button" aria-haspopup="dialog"><span id="wrappedPlain" style="user-select:none!important;-webkit-user-select:none!important">FPROwrapped plain reading sample</span></div></article><div id="bare" style="user-select:none!important;-webkit-user-select:none!important">FPRObare direct div sample</div>
                    <script>document.addEventListener('contextmenu',e=>e.preventDefault(),true);document.addEventListener('selectstart',e=>e.preventDefault(),true);document.addEventListener('pointerdown',e=>e.preventDefault(),true);document.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});</script></body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                fun probe(attempt: Int) {
                    web.evaluateJavascript("!!document.querySelector('#hashtag') && document.readyState==='complete'") { result ->
                        if(result == "true") {
                            val source = activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", "{\"enhance\":false,\"textSelection\":true}")
                            web.evaluateJavascript(source) {
                                web.evaluateJavascript("!!window.__fpro && !!document.querySelector('#fpro-selection-style')") { installed ->
                                if(installed == "true")web.postVisualStateCallback(20, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { ready.countDown() } })
                                }
                            }
                        } else if(attempt < 30) web.postDelayed({ probe(attempt+1) }, 200)
                    }
                }
                web.postDelayed({ probe(0) }, 200)
            }
            assertTrue("Native selection fixture must render", ready.await(10, TimeUnit.SECONDS))
            fun copyAction(node: android.view.accessibility.AccessibilityNodeInfo?): android.view.accessibility.AccessibilityNodeInfo? {
                if(node == null)return null
                val label=node.text?.toString().orEmpty()
                if(label.equals(instrumentation.targetContext.getString(android.R.string.copy),ignoreCase=true))return node
                for(index in 0 until node.childCount)copyAction(node.getChild(index))?.let { return it }
                return null
            }
            fun nativeCopyAction(): android.view.accessibility.AccessibilityNodeInfo? {
                copyAction(automation.rootInActiveWindow)?.let { return it }
                for(window in automation.windows)copyAction(window.root)?.let { return it }
                return null
            }
            for(id in listOf("post", "comment", "hashtag", "bare", "wrappedPlain")) {
                val coordinates = FloatArray(2)
                val measured = CountDownLatch(1)
                scenario.onActivity { activity ->
                    val web = requireNotNull(findWeb(activity.window.decorView))
                    web.evaluateJavascript("""
                        (()=>{getSelection().removeAllRanges();const e=document.getElementById('$id'),r=document.createRange();r.setStart(e.firstChild,1);r.setEnd(e.firstChild,5);const b=r.getBoundingClientRect();return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2,w:innerWidth});})()
                    """.trimIndent()) { result ->
                        val data=org.json.JSONObject(org.json.JSONArray("[$result]").getString(0))
                        val offset=IntArray(2);web.getLocationOnScreen(offset)
                        val scale=web.width/data.getDouble("w")
                        coordinates[0]=(offset[0]+data.getDouble("x")*scale).toFloat()
                        coordinates[1]=(offset[1]+data.getDouble("y")*scale).toFloat()
                        web.postVisualStateCallback(21, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { measured.countDown() } })
                    }
                }
                assertTrue(measured.await(5, TimeUnit.SECONDS))
                val down=android.os.SystemClock.uptimeMillis()
                val press=android.view.MotionEvent.obtain(down,down,android.view.MotionEvent.ACTION_DOWN,coordinates[0],coordinates[1],0)
                press.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                assertTrue(automation.injectInputEvent(press,true));press.recycle()
                Thread.sleep(android.view.ViewConfiguration.getLongPressTimeout().toLong()+400)
                val release=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),android.view.MotionEvent.ACTION_UP,coordinates[0],coordinates[1],0)
                release.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                // Native floating selection toolbar can change input focus before
                // ACTION_UP is acknowledged. The actual selection and Copy UI,
                // not that dispatcher acknowledgement, are the assertions.
                automation.injectInputEvent(release,false);release.recycle()
                Thread.sleep(300)
                val selected=CountDownLatch(1)
                val text=java.util.concurrent.atomic.AtomicReference("")
                scenario.onActivity { activity ->
                    requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript("getSelection().toString()") { result ->text.set(result);selected.countDown()}
                }
                assertTrue(selected.await(5,TimeUnit.SECONDS))
                assertTrue("Real long press must select $id text, not a programmatic range: ${text.get()}", text.get().contains("FPRO"))
                var copyVisible=false
                repeat(15) {
                    if(android.os.Build.VERSION.SDK_INT>=33)automation.clearCache()
                    if(nativeCopyAction()!=null)copyVisible=true
                    if(!copyVisible)Thread.sleep(100)
                }
                assertTrue("Android's native Copy action must appear for $id",copyVisible)
                // Use the actual Android Copy action. Unlike a page tap,
                // this also dismisses selection when the site's root cancels taps.
                val copy= requireNotNull(nativeCopyAction())
                assertTrue("Native Copy action must be clickable",copy.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK)||copy.parent?.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK)==true)
                Thread.sleep(350)

            }
        }
    }

    @Test fun zzPictureInPictureUsesRealPlaybackAndHome() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val store = instrumentation.targetContext.getSharedPreferences("fpro", android.content.Context.MODE_PRIVATE)
        val hadSetting = store.contains("pip")
        val oldSetting = store.getBoolean("pip", false)
        val encoded = android.util.Base64.encodeToString(instrumentation.context.assets.open("pip-loop.mp4").use { it.readBytes() }, android.util.Base64.NO_WRAP)
        store.edit().putBoolean("pip", true).commit()
        try {
            ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
                Thread.sleep(2300)
                val ready = CountDownLatch(1)
                val startPoint=FloatArray(2)
                scenario.onActivity { activity ->
                    assertTrue("Device must support PiP", activity.packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE))
                    val web = requireNotNull(findWeb(activity.window.decorView))
                    web.stopLoading()
                    web.settings.mediaPlaybackRequiresUserGesture = true
                    web.loadDataWithBaseURL("https://m.facebook.com/", "<html><meta name='viewport' content='width=device-width'><body><button id='startVideo' onclick='document.getElementById(&quot;pipVideo&quot;).play()'>Play fixture</button><video id='pipVideo' preload='auto' muted loop playsinline style='width:100%' src='data:video/mp4;base64,$encoded'></video></body></html>", "text/html", "UTF-8", "https://m.facebook.com/")
                    fun probe(attempt: Int) {
                        web.evaluateJavascript("!!document.getElementById('pipVideo') && document.getElementById('pipVideo').readyState>=2") { playing ->
                            if(playing == "true") {
                                web.evaluateJavascript(activity.assets.open("page-info.js").bufferedReader().use { it.readText() }) {
                                    web.evaluateJavascript("JSON.stringify({x:document.getElementById('startVideo').getBoundingClientRect().left+20,y:document.getElementById('startVideo').getBoundingClientRect().top+10,w:innerWidth})") { coordinates ->
                                        val data=org.json.JSONObject(org.json.JSONArray("[$coordinates]").getString(0));val offset=IntArray(2);web.getLocationOnScreen(offset);val scale=web.width/data.getDouble("w")
                                        startPoint[0]=(offset[0]+data.getDouble("x")*scale).toFloat();startPoint[1]=(offset[1]+data.getDouble("y")*scale).toFloat()
                                        web.postVisualStateCallback(90, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { ready.countDown() } })
                                    }
                                }
                            } else if(attempt < 40)web.postDelayed({ probe(attempt+1) }, 200)
                        }
                    }
                    web.postDelayed({ probe(0) }, 200)
                }
                assertTrue("Bundled real H264 video must decode and play", ready.await(12, TimeUnit.SECONDS))
                val tapTime=android.os.SystemClock.uptimeMillis()
                for(action in listOf(android.view.MotionEvent.ACTION_DOWN,android.view.MotionEvent.ACTION_UP)) {
                    val event=android.view.MotionEvent.obtain(tapTime,android.os.SystemClock.uptimeMillis(),action,startPoint[0],startPoint[1],0)
                    event.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;instrumentation.uiAutomation.injectInputEvent(event,true);event.recycle()
                }
                val started=java.util.concurrent.atomic.AtomicBoolean(false)
                repeat(30){scenario.onActivity { activity -> val field=MainActivity::class.java.getDeclaredField("mediaPlaying").apply { isAccessible=true };started.set(field.getBoolean(activity)) };if(!started.get())Thread.sleep(150)}
                assertTrue("A real tap must start playback while ordinary gesture policy is enabled",started.get())
                scenario.onActivity { activity ->
                    val playingField = MainActivity::class.java.getDeclaredField("mediaPlaying").apply { isAccessible = true }
                    assertTrue("Native playback cache must reflect real decoded video before Home; URL="+requireNotNull(findWeb(activity.window.decorView)).url, playingField.getBoolean(activity))
                }
                instrumentation.uiAutomation.executeShellCommand("input keyevent KEYCODE_HOME").use { command ->
                    java.io.FileInputStream(command.fileDescriptor).use { it.readBytes() }
                }
                val inPip = java.util.concurrent.atomic.AtomicBoolean(false)
                repeat(25) {
                    scenario.onActivity { activity -> inPip.set(activity.isInPictureInPictureMode) }
                    if(!inPip.get())Thread.sleep(200)
                }
                assertTrue("Real Home must enter actual system PiP while video is playing", inPip.get())
                var mediaStage = "PiP"
                fun position(): Double {
                    val sampled = CountDownLatch(1)
                    val result = java.util.concurrent.atomic.AtomicReference("null")
                    scenario.onActivity { activity ->
                        requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript("JSON.stringify({muted:document.getElementById('pipVideo').muted,paused:document.getElementById('pipVideo').paused,time:document.getElementById('pipVideo').currentTime})") { value -> result.set(value);sampled.countDown() }
                    }
                    assertTrue(sampled.await(5, TimeUnit.SECONDS))
                    val data = org.json.JSONObject(org.json.JSONArray("["+result.get()+"]").getString(0))
                    assertFalse("Video must remain unpaused during $mediaStage", data.getBoolean("paused"))
                    if(mediaStage=="PiP")assertFalse("System PiP must actually unmute the real video",data.getBoolean("muted"))
                    return data.getDouble("time")
                }
                val first = position();Thread.sleep(550);val second = position()
                assertTrue("Actual decoded video clock must advance in PiP", kotlin.math.abs(second-first) > .1)
                assertTrue("Official PiP must produce an active decoded AAC audio stream", instrumentation.targetContext.getSystemService(android.media.AudioManager::class.java).isMusicActive)
                if(android.os.Build.VERSION.SDK_INT>=33)instrumentation.uiAutomation.executeShellCommand("pm grant com.almekhlafi.FPRO android.permission.POST_NOTIFICATIONS").use { command -> java.io.FileInputStream(command.fileDescriptor).use { it.readBytes() } }
                scenario.onActivity { activity ->
                    val actions = MainActivity::class.java.getDeclaredMethod("audioActions").apply { isAccessible = true }.invoke(activity) as List<*>
                    (actions.first() as android.app.RemoteAction).actionIntent.send()
                }
                val audioReady = java.util.concurrent.atomic.AtomicBoolean(false)
                repeat(30) {
                    scenario.onActivity { activity ->
                        @Suppress("DEPRECATION") val foreground = activity.getSystemService(android.app.ActivityManager::class.java).getRunningServices(100).any { it.service.className == AudioPlaybackService::class.java.name && it.foreground }
                        audioReady.set(foreground && !activity.isInPictureInPictureMode)
                    }
                    if(!audioReady.get())Thread.sleep(200)
                }
                assertTrue("Headphone PendingIntent must hide PiP and start actual foreground audio service", audioReady.get())
                try {
                    instrumentation.uiAutomation.executeShellCommand("input keyevent KEYCODE_SLEEP").use { command -> java.io.FileInputStream(command.fileDescriptor).use { it.readBytes() } }
                    Thread.sleep(1000)
                    assertFalse("Screen must actually be off", instrumentation.targetContext.getSystemService(android.os.PowerManager::class.java).isInteractive)
                    mediaStage = "foreground audio with screen off"
                    val lockedFirst=position();Thread.sleep(600);val lockedSecond=position()
                    assertTrue("Media clock must advance with screen off and no PiP", kotlin.math.abs(lockedSecond-lockedFirst)>.1)
                    assertTrue("Decoded AAC audio must remain active with screen off", instrumentation.targetContext.getSystemService(android.media.AudioManager::class.java).isMusicActive)
                    val notifications=instrumentation.targetContext.getSystemService(android.app.NotificationManager::class.java)
                    val audioNotice=notifications.activeNotifications.first { it.id==25 }.notification
                    audioNotice.actions.last().actionIntent.send()
                    Thread.sleep(500)
                    @Suppress("DEPRECATION") val stillRunning=instrumentation.targetContext.getSystemService(android.app.ActivityManager::class.java).getRunningServices(100).any { it.service.className==AudioPlaybackService::class.java.name }
                    assertFalse("Notification Stop must stop the actual audio service", stillRunning)
                } finally {
                    for(command in listOf("input keyevent KEYCODE_WAKEUP", "wm dismiss-keyguard")) {
                        instrumentation.uiAutomation.executeShellCommand(command).use { output -> java.io.FileInputStream(output.fileDescriptor).use { it.readBytes() } }
                    }
                    // ActivityScenario filters lifecycle by the original Intent action.
                    // Real PiP/audio PendingIntents intentionally changed that action.
                    val original=android.content.Intent().setClassName(instrumentation.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")
                    scenario.onActivity { it.intent=original }
                    instrumentation.context.startActivity(android.content.Intent(original).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT))
                    scenario.moveToState(androidx.lifecycle.Lifecycle.State.RESUMED)
                }

            }
        } finally {
            if(hadSetting)store.edit().putBoolean("pip",oldSetting).commit() else store.edit().remove("pip").commit()
        }
    }

}
