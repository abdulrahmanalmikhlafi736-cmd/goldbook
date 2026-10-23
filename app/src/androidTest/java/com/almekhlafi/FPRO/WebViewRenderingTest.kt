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
        ActivityScenario.launch<MainActivity>().use { scenario ->
            Thread.sleep(2300)
            val ready = CountDownLatch(1)
            var positioned = false
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                web.loadDataWithBaseURL("https://m.facebook.com/", """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <body><header><svg aria-label="Facebook" style="position:absolute;left:65vw;top:8px;width:100px;height:40px"></svg></header></body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                fun probe(attempt: Int) {
                    val flag = MainActivity::class.java.getDeclaredField("homeControls\$delegate").apply { isAccessible = true }
                    val x = MainActivity::class.java.getDeclaredField("gearX\$delegate").apply { isAccessible = true }
                    if ((flag.get(activity) as androidx.compose.runtime.State<*>).value == true) {
                        val coordinate = (x.get(activity) as androidx.compose.runtime.State<*>).value as Float
                        positioned = coordinate > web.width * .65f && coordinate < web.width * .88f
                        ready.countDown()
                    } else if (attempt < 25) web.postDelayed({ probe(attempt + 1) }, 200)
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

    /** A separate, real HTTPS smoke test. No credentials, mock response or DOM replacement. */
    @Test fun liveFacebookLoggedOutSmoke() {
        org.junit.Assume.assumeTrue("Live site requires a recent system WebView", android.os.Build.VERSION.SDK_INT >= 35)
        val browserAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation(android.app.UiAutomation.FLAG_DONT_USE_ACCESSIBILITY)
        ActivityScenario.launch<android.app.Activity>(android.content.Intent().setClassName(InstrumentationRegistry.getInstrumentation().targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
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
}
